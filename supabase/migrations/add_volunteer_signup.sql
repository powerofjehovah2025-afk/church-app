-- Migration: Add Volunteer Sign-up System
-- This migration adds volunteer sign-up functionality to service assignments

-- Add columns to service_assignments for volunteer sign-up
ALTER TABLE public.service_assignments
ADD COLUMN IF NOT EXISTS is_volunteer_signup BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS signup_deadline TIMESTAMPTZ, -- Deadline for volunteers to sign up
ADD COLUMN IF NOT EXISTS max_volunteers INTEGER, -- Maximum number of volunteers allowed
ADD COLUMN IF NOT EXISTS signed_up_at TIMESTAMPTZ; -- When the member signed up (for volunteer signups)

-- Create index for volunteer signups
CREATE INDEX IF NOT EXISTS idx_service_assignments_volunteer_signup ON public.service_assignments(is_volunteer_signup, signup_deadline);

-- Note: No RLS policy changes needed - existing policies cover this

