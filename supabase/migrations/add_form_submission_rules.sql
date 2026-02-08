-- Migration: Create form_submission_rules table for business logic configuration
-- This allows configuring status progression, validation, and conditional save logic

-- Create form_submission_rules table
CREATE TABLE IF NOT EXISTS public.form_submission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_config_id UUID NOT NULL REFERENCES public.form_configs(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('status_progression', 'validation', 'conditional_save')),
  rule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for form_submission_rules
CREATE INDEX IF NOT EXISTS idx_form_submission_rules_form_config_id ON public.form_submission_rules(form_config_id);
CREATE INDEX IF NOT EXISTS idx_form_submission_rules_priority ON public.form_submission_rules(form_config_id, priority);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_form_submission_rules_updated_at
  BEFORE UPDATE ON public.form_submission_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.form_submission_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_submission_rules
-- Admins can view all rules
CREATE POLICY "Admins can view all submission rules"
  ON public.form_submission_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can manage rules
CREATE POLICY "Admins can manage submission rules"
  ON public.form_submission_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments
COMMENT ON COLUMN public.form_submission_rules.rule_type IS 'Type of rule: status_progression, validation, conditional_save';
COMMENT ON COLUMN public.form_submission_rules.rule_config IS 'Rule configuration JSON (trigger fields, conditions, actions)';
COMMENT ON COLUMN public.form_submission_rules.priority IS 'Execution order (lower numbers execute first)';

