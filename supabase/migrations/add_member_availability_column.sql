-- Add availability column to profiles table
-- Availability will be stored as JSONB object with day/time preferences
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::jsonb;

-- Create index for availability queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON public.profiles USING GIN (availability);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.availability IS 'Member availability schedule stored as JSONB (e.g., {"monday": ["morning", "evening"], "tuesday": ["afternoon"]})';

