-- Migration: Add Ministry Teams System
-- This migration creates tables for grouping members into ministry teams

-- Create ministry_teams table
CREATE TABLE IF NOT EXISTS public.ministry_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name) -- Prevent duplicate team names
);

-- Create team_members junction table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.ministry_teams(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'leader', 'co-leader')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, member_id) -- Prevent duplicate memberships
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ministry_teams_leader_id ON public.ministry_teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_ministry_teams_is_active ON public.ministry_teams(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member_id ON public.team_members(member_id);

-- Enable Row Level Security
ALTER TABLE public.ministry_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Admins can manage ministry teams" ON public.ministry_teams;
DROP POLICY IF EXISTS "Members can view active ministry teams" ON public.ministry_teams;
DROP POLICY IF EXISTS "Team leaders can manage their teams" ON public.ministry_teams;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team leaders can manage team members" ON public.team_members;

-- RLS Policies for ministry_teams
-- Admins can manage all teams
CREATE POLICY "Admins can manage ministry teams"
ON public.ministry_teams
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Members can view active teams
CREATE POLICY "Members can view active ministry teams"
ON public.ministry_teams
FOR SELECT
TO authenticated
USING (is_active = true);

-- Team leaders can manage their teams
CREATE POLICY "Team leaders can manage their teams"
ON public.ministry_teams
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ministry_teams
    WHERE ministry_teams.id = ministry_teams.id
    AND ministry_teams.leader_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ministry_teams
    WHERE ministry_teams.id = ministry_teams.id
    AND ministry_teams.leader_id = auth.uid()
  )
);

-- RLS Policies for team_members
-- Admins can manage all team members
CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Members can view team members
CREATE POLICY "Members can view team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (true);

-- Team leaders can manage members of their teams
CREATE POLICY "Team leaders can manage team members"
ON public.team_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ministry_teams
    WHERE ministry_teams.id = team_members.team_id
    AND ministry_teams.leader_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ministry_teams
    WHERE ministry_teams.id = team_members.team_id
    AND ministry_teams.leader_id = auth.uid()
  )
);

-- Function to update updated_at timestamp for ministry_teams
CREATE OR REPLACE FUNCTION update_ministry_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for ministry_teams
DROP TRIGGER IF EXISTS update_ministry_teams_updated_at ON public.ministry_teams;
CREATE TRIGGER update_ministry_teams_updated_at
  BEFORE UPDATE ON public.ministry_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_ministry_teams_updated_at();

