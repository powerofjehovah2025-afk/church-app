-- Add skills column to profiles table
-- Skills will be stored as JSONB array of strings
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;

-- Create index for skills queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON public.profiles USING GIN (skills);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.skills IS 'Array of member skills/interests stored as JSONB';

