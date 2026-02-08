-- Migration: Add field mapping and transformation support to form_fields
-- This allows configuring how form fields map to database columns and handle transformations

-- Add mapping and transformation columns to form_fields
ALTER TABLE public.form_fields
ADD COLUMN IF NOT EXISTS db_column TEXT,
ADD COLUMN IF NOT EXISTS transformation_type TEXT CHECK (transformation_type IN ('direct', 'combine', 'notes', 'array', 'custom')),
ADD COLUMN IF NOT EXISTS transformation_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_notes_field BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS notes_format TEXT;

-- Create index for database column lookups
CREATE INDEX IF NOT EXISTS idx_form_fields_db_column ON public.form_fields(form_config_id, db_column)
WHERE db_column IS NOT NULL;

-- Add comments to explain the new columns
COMMENT ON COLUMN public.form_fields.db_column IS 'Target database column name (e.g., full_name, email, notes)';
COMMENT ON COLUMN public.form_fields.transformation_type IS 'Type of transformation: direct (1:1 mapping), combine (multiple fields), notes (aggregate to notes), array (array field), custom (custom logic)';
COMMENT ON COLUMN public.form_fields.transformation_config IS 'Configuration for transformations (e.g., combine fields list, notes format, array handling)';
COMMENT ON COLUMN public.form_fields.is_notes_field IS 'Whether this field should be aggregated into the notes column';
COMMENT ON COLUMN public.form_fields.notes_format IS 'Format string for notes (e.g., "Joining us: {value}")';

