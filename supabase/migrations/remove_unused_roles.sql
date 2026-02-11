-- Hard delete all roles except 'admin' and 'member'
-- This will cascade delete related role_permissions due to ON DELETE CASCADE

-- First, update any profiles that reference deleted roles to 'member'
UPDATE public.profiles
SET role = 'member'
WHERE role IS NOT NULL 
  AND role NOT IN ('admin', 'member')
  AND role IN (
    SELECT name FROM public.roles 
    WHERE name NOT IN ('admin', 'member')
  );

-- Delete role_permissions for roles that will be deleted
-- (This happens automatically via CASCADE, but being explicit)
DELETE FROM public.role_permissions
WHERE role_id IN (
  SELECT id FROM public.roles 
  WHERE name NOT IN ('admin', 'member')
);

-- Hard delete all roles except 'admin' and 'member'
DELETE FROM public.roles
WHERE name NOT IN ('admin', 'member');

-- Update announcements table to remove references to deleted roles
-- Drop and recreate the CHECK constraint
ALTER TABLE public.announcements
DROP CONSTRAINT IF EXISTS announcements_target_audience_check;

ALTER TABLE public.announcements
ADD CONSTRAINT announcements_target_audience_check 
CHECK (target_audience IN ('all', 'admin', 'member'));

-- Update any existing announcements that reference deleted roles
UPDATE public.announcements
SET target_audience = 'member'
WHERE target_audience IN ('pastor', 'elder', 'deacon', 'leader', 'volunteer');

-- Drop and recreate the INSERT policy to only allow admins
DROP POLICY IF EXISTS "Admins and leaders can create announcements" ON public.announcements;

CREATE POLICY "Only admins can create announcements"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND created_by = auth.uid()
  );

