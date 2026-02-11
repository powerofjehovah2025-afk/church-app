-- Migration: Add Recurring Patterns System
-- This migration creates tables for managing recurring service generation patterns

-- Create service_recurring_patterns table
CREATE TABLE IF NOT EXISTS public.service_recurring_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.service_templates(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('weekly', 'bi_weekly', 'monthly', 'custom')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  week_of_month INTEGER CHECK (week_of_month >= 1 AND week_of_month <= 5), -- 1-5 for monthly patterns (e.g., 1st Sunday)
  interval_weeks INTEGER CHECK (interval_weeks > 0), -- For custom patterns (e.g., every 3 weeks)
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means pattern continues indefinitely
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_date DATE, -- Tracks the last date a service was generated for this pattern
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for service_recurring_patterns
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_template_id ON public.service_recurring_patterns(template_id);
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_is_active ON public.service_recurring_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_start_date ON public.service_recurring_patterns(start_date);
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_end_date ON public.service_recurring_patterns(end_date);
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_last_generated ON public.service_recurring_patterns(last_generated_date);

-- Enable Row Level Security
ALTER TABLE public.service_recurring_patterns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Admins can view all recurring patterns" ON public.service_recurring_patterns;
DROP POLICY IF EXISTS "Admins can manage recurring patterns" ON public.service_recurring_patterns;

-- RLS Policies for service_recurring_patterns
-- Admins can view all patterns
CREATE POLICY "Admins can view all recurring patterns"
ON public.service_recurring_patterns
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can manage patterns
CREATE POLICY "Admins can manage recurring patterns"
ON public.service_recurring_patterns
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Function to update updated_at timestamp for service_recurring_patterns
CREATE OR REPLACE FUNCTION update_service_recurring_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for service_recurring_patterns
DROP TRIGGER IF EXISTS update_service_recurring_patterns_updated_at ON public.service_recurring_patterns;
CREATE TRIGGER update_service_recurring_patterns_updated_at
  BEFORE UPDATE ON public.service_recurring_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_service_recurring_patterns_updated_at();

