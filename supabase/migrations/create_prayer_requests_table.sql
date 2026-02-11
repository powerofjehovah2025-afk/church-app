-- Create prayer_requests table
CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  request TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'answered', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create prayer_team_assignments table
CREATE TABLE IF NOT EXISTS public.prayer_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(prayer_request_id, team_member_id)
);

-- Create prayer_updates table for tracking updates/responses
CREATE TABLE IF NOT EXISTS public.prayer_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  update_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prayer_requests_member_id ON public.prayer_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON public.prayer_requests(status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_assigned_to ON public.prayer_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created_at ON public.prayer_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_prayer_team_assignments_request_id ON public.prayer_team_assignments(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_team_assignments_member_id ON public.prayer_team_assignments(team_member_id);
CREATE INDEX IF NOT EXISTS idx_prayer_updates_request_id ON public.prayer_updates(prayer_request_id);

-- Enable RLS
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prayer_requests
CREATE POLICY "Members can view their own prayer requests"
  ON public.prayer_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = member_id);

CREATE POLICY "Members can create prayer requests"
  ON public.prayer_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Members can update their own prayer requests"
  ON public.prayer_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = member_id)
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Admins can view all prayer requests"
  ON public.prayer_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all prayer requests"
  ON public.prayer_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for prayer_team_assignments
CREATE POLICY "Team members can view their assignments"
  ON public.prayer_team_assignments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = team_member_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage team assignments"
  ON public.prayer_team_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for prayer_updates
CREATE POLICY "Members can view updates for their requests"
  ON public.prayer_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prayer_requests
      WHERE prayer_requests.id = prayer_updates.prayer_request_id
      AND prayer_requests.member_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Team members and admins can create updates"
  ON public.prayer_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = updated_by
    AND (
      EXISTS (
        SELECT 1 FROM public.prayer_team_assignments
        WHERE prayer_team_assignments.prayer_request_id = prayer_updates.prayer_request_id
        AND prayer_team_assignments.team_member_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_prayer_requests_updated_at
  BEFORE UPDATE ON public.prayer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

