-- Migration: Create invitation_codes table
-- This table stores invitation codes that control who can sign up

CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER, -- NULL means unlimited uses
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON public.invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_active ON public.invitation_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_created_by ON public.invitation_codes(created_by);

-- Create a table to track code usage (who used which code)
CREATE TABLE IF NOT EXISTS public.invitation_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES public.invitation_codes(id) ON DELETE CASCADE,
  used_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(code_id, used_by) -- Prevent duplicate usage tracking
);

-- Create index for usage tracking
CREATE INDEX IF NOT EXISTS idx_invitation_code_usage_code_id ON public.invitation_code_usage(code_id);
CREATE INDEX IF NOT EXISTS idx_invitation_code_usage_used_by ON public.invitation_code_usage(used_by);

-- Enable Row Level Security
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_code_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitation_codes
-- Admins can view all codes
CREATE POLICY "Admins can view all invitation codes"
ON public.invitation_codes
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can insert codes
CREATE POLICY "Admins can create invitation codes"
ON public.invitation_codes
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Admins can update codes
CREATE POLICY "Admins can update invitation codes"
ON public.invitation_codes
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Anyone can check if a code is valid (for signup validation)
-- This is needed for the signup process
CREATE POLICY "Anyone can check code validity"
ON public.invitation_codes
FOR SELECT
TO anon, authenticated
USING (
  is_active = true AND
  (expires_at IS NULL OR expires_at > NOW()) AND
  (max_uses IS NULL OR used_count < max_uses)
);

-- RLS Policies for invitation_code_usage
-- Admins can view all usage
CREATE POLICY "Admins can view all code usage"
ON public.invitation_code_usage
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Users can view their own usage
CREATE POLICY "Users can view own code usage"
ON public.invitation_code_usage
FOR SELECT
TO authenticated
USING (auth.uid() = used_by);

-- Allow inserting usage records (for tracking when codes are used)
-- This will be done via service role in the API
-- For now, we'll allow authenticated users to insert their own usage
CREATE POLICY "Users can track own code usage"
ON public.invitation_code_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = used_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invitation_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_invitation_codes_updated_at
  BEFORE UPDATE ON public.invitation_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_invitation_codes_updated_at();

-- Function to generate a random code
CREATE OR REPLACE FUNCTION generate_invitation_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excludes confusing chars like 0, O, I, 1
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;


