-- Migration: Add versioning support to form builder
-- This allows multiple versions of the same form type (draft, published, archived)

-- First, we need to remove the UNIQUE constraint on form_type
-- Since we can't directly modify constraints, we'll:
-- 1. Create a new table with the updated schema
-- 2. Migrate data
-- 3. Drop old table and rename new one

-- Add versioning columns to form_configs
ALTER TABLE public.form_configs
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS version_name TEXT,
ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES public.form_configs(id) ON DELETE SET NULL;

-- Remove the UNIQUE constraint on form_type if it exists
-- We'll enforce uniqueness per form_type + status='published' via unique index instead
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'form_configs_form_type_key'
  ) THEN
    ALTER TABLE public.form_configs DROP CONSTRAINT form_configs_form_type_key;
  END IF;
END $$;

-- Create a unique constraint that allows only one published version per form_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_form_configs_unique_published 
ON public.form_configs(form_type) 
WHERE status = 'published';

-- Create index for versioning queries
CREATE INDEX IF NOT EXISTS idx_form_configs_status ON public.form_configs(form_type, status);
CREATE INDEX IF NOT EXISTS idx_form_configs_version ON public.form_configs(form_type, version);

-- Update existing records to be published (since they're the current active forms)
UPDATE public.form_configs
SET status = 'published', version = 1, version_name = 'Initial Version'
WHERE status = 'draft' OR status IS NULL;

-- Add comment to explain versioning
COMMENT ON COLUMN public.form_configs.version IS 'Version number for this form configuration';
COMMENT ON COLUMN public.form_configs.status IS 'Status: draft (editing), published (active), archived (old versions)';
COMMENT ON COLUMN public.form_configs.version_name IS 'Optional name/description for this version';
COMMENT ON COLUMN public.form_configs.parent_version_id IS 'Reference to the version this was copied from';

