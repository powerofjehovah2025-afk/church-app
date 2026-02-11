-- Migration: Add Contribution Tracking System
-- This migration creates tables for tracking tithes and offerings

-- Create contributions table
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('tithe', 'offering', 'donation', 'special')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'GBP',
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online', 'other')),
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL, -- If contributed during a service
  description TEXT, -- Optional description
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Who recorded this contribution
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for contributions
CREATE INDEX IF NOT EXISTS idx_contributions_member_id ON public.contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_contribution_type ON public.contributions(contribution_type);
CREATE INDEX IF NOT EXISTS idx_contributions_service_id ON public.contributions(service_id);
CREATE INDEX IF NOT EXISTS idx_contributions_contribution_date ON public.contributions(contribution_date DESC);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON public.contributions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Admins can manage all contributions" ON public.contributions;
DROP POLICY IF EXISTS "Members can view their own contributions" ON public.contributions;
DROP POLICY IF EXISTS "Members can record their own contributions" ON public.contributions;

-- RLS Policies for contributions
-- Admins can manage all contributions
CREATE POLICY "Admins can manage all contributions"
ON public.contributions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Members can view their own contributions
CREATE POLICY "Members can view their own contributions"
ON public.contributions
FOR SELECT
TO authenticated
USING (auth.uid() = member_id OR is_anonymous = false);

-- Members can record their own contributions
CREATE POLICY "Members can record their own contributions"
ON public.contributions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = member_id);

-- Function to update updated_at timestamp for contributions
CREATE OR REPLACE FUNCTION update_contributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for contributions
DROP TRIGGER IF EXISTS update_contributions_updated_at ON public.contributions;
CREATE TRIGGER update_contributions_updated_at
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_contributions_updated_at();

