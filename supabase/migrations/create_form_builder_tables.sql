-- Migration: Create form builder tables
-- This migration creates tables for managing dynamic form configurations
-- Updated to handle existing policies gracefully

-- Create form_configs table
CREATE TABLE IF NOT EXISTS public.form_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type TEXT NOT NULL UNIQUE CHECK (form_type IN ('welcome', 'membership', 'newcomer')),
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for form_configs
CREATE INDEX IF NOT EXISTS idx_form_configs_form_type ON public.form_configs(form_type);
CREATE INDEX IF NOT EXISTS idx_form_configs_is_active ON public.form_configs(is_active);

-- Create form_fields table
CREATE TABLE IF NOT EXISTS public.form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_config_id UUID NOT NULL REFERENCES public.form_configs(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'tel', 'select', 'checkbox', 'textarea', 'date', 'number', 'radio')),
  label TEXT NOT NULL,
  placeholder TEXT,
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  default_value TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  section TEXT,
  options JSONB DEFAULT '[]'::jsonb, -- Array of {label, value} objects for select/checkbox/radio
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(form_config_id, field_key) -- Prevent duplicate field keys in same form
);

-- Create indexes for form_fields
CREATE INDEX IF NOT EXISTS idx_form_fields_form_config_id ON public.form_fields(form_config_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_display_order ON public.form_fields(form_config_id, display_order);
CREATE INDEX IF NOT EXISTS idx_form_fields_section ON public.form_fields(form_config_id, section);

-- Create form_static_content table
CREATE TABLE IF NOT EXISTS public.form_static_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_config_id UUID NOT NULL REFERENCES public.form_configs(id) ON DELETE CASCADE,
  content_key TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'html', 'markdown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(form_config_id, content_key) -- Prevent duplicate content keys in same form
);

-- Create indexes for form_static_content
CREATE INDEX IF NOT EXISTS idx_form_static_content_form_config_id ON public.form_static_content(form_config_id);
CREATE INDEX IF NOT EXISTS idx_form_static_content_content_key ON public.form_static_content(form_config_id, content_key);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_form_configs_updated_at
  BEFORE UPDATE ON public.form_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at
  BEFORE UPDATE ON public.form_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_static_content_updated_at
  BEFORE UPDATE ON public.form_static_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.form_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_static_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
-- Must be done AFTER tables are created
DROP POLICY IF EXISTS "Admins can view all form configs" ON public.form_configs;
DROP POLICY IF EXISTS "Admins can manage form configs" ON public.form_configs;
DROP POLICY IF EXISTS "Admins can view all form fields" ON public.form_fields;
DROP POLICY IF EXISTS "Admins can manage form fields" ON public.form_fields;
DROP POLICY IF EXISTS "Admins can view all form static content" ON public.form_static_content;
DROP POLICY IF EXISTS "Admins can manage form static content" ON public.form_static_content;
DROP POLICY IF EXISTS "Public can view active form configs" ON public.form_configs;
DROP POLICY IF EXISTS "Public can view fields of active forms" ON public.form_fields;
DROP POLICY IF EXISTS "Public can view static content of active forms" ON public.form_static_content;

-- RLS Policies for form_configs
CREATE POLICY "Admins can view all form configs"
  ON public.form_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage form configs"
  ON public.form_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for form_fields
CREATE POLICY "Admins can view all form fields"
  ON public.form_fields
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage form fields"
  ON public.form_fields
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for form_static_content
CREATE POLICY "Admins can view all form static content"
  ON public.form_static_content
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage form static content"
  ON public.form_static_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public read access for active forms (for rendering forms on public pages)
CREATE POLICY "Public can view active form configs"
  ON public.form_configs
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view fields of active forms"
  ON public.form_fields
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.form_configs
      WHERE form_configs.id = form_fields.form_config_id
      AND form_configs.is_active = true
    )
  );

CREATE POLICY "Public can view static content of active forms"
  ON public.form_static_content
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.form_configs
      WHERE form_configs.id = form_static_content.form_config_id
      AND form_configs.is_active = true
    )
  );

