-- Migration: Add Service Templates System
-- This migration creates tables for managing reusable service templates and their default duty types

-- Create service_templates table
CREATE TABLE IF NOT EXISTS public.service_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  default_time TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name) -- Prevent duplicate template names
);

-- Create indexes for service_templates
CREATE INDEX IF NOT EXISTS idx_service_templates_is_active ON public.service_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_service_templates_name ON public.service_templates(name);

-- Create service_template_duty_types junction table
CREATE TABLE IF NOT EXISTS public.service_template_duty_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.service_templates(id) ON DELETE CASCADE,
  duty_type_id UUID NOT NULL REFERENCES public.duty_types(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, duty_type_id) -- Prevent duplicate duty types per template
);

-- Create indexes for service_template_duty_types
CREATE INDEX IF NOT EXISTS idx_template_duty_types_template_id ON public.service_template_duty_types(template_id);
CREATE INDEX IF NOT EXISTS idx_template_duty_types_duty_type_id ON public.service_template_duty_types(duty_type_id);

-- Enable Row Level Security
ALTER TABLE public.service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_template_duty_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Admins can view all service templates" ON public.service_templates;
DROP POLICY IF EXISTS "Admins can manage service templates" ON public.service_templates;
DROP POLICY IF EXISTS "Members can view active service templates" ON public.service_templates;
DROP POLICY IF EXISTS "Admins can view template duty types" ON public.service_template_duty_types;
DROP POLICY IF EXISTS "Admins can manage template duty types" ON public.service_template_duty_types;

-- RLS Policies for service_templates
-- Admins can view all templates
CREATE POLICY "Admins can view all service templates"
ON public.service_templates
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can manage templates
CREATE POLICY "Admins can manage service templates"
ON public.service_templates
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Members can view active templates (for reference)
CREATE POLICY "Members can view active service templates"
ON public.service_templates
FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS Policies for service_template_duty_types
-- Admins can view template duty types
CREATE POLICY "Admins can view template duty types"
ON public.service_template_duty_types
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can manage template duty types
CREATE POLICY "Admins can manage template duty types"
ON public.service_template_duty_types
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Function to update updated_at timestamp for service_templates
CREATE OR REPLACE FUNCTION update_service_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for service_templates
DROP TRIGGER IF EXISTS update_service_templates_updated_at ON public.service_templates;
CREATE TRIGGER update_service_templates_updated_at
  BEFORE UPDATE ON public.service_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_service_templates_updated_at();

