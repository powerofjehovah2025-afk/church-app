-- Add follow-up tracking columns to newcomers table
ALTER TABLE public.newcomers
ADD COLUMN IF NOT EXISTS followup_status TEXT DEFAULT 'not_started' CHECK (followup_status IN ('not_started', 'in_progress', 'contacted', 'completed', 'no_response')),
ADD COLUMN IF NOT EXISTS followup_notes TEXT,
ADD COLUMN IF NOT EXISTS last_followup_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS followup_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_followup_date DATE;

-- Create index on followup_status for faster queries
CREATE INDEX IF NOT EXISTS idx_newcomers_followup_status ON public.newcomers(followup_status);
CREATE INDEX IF NOT EXISTS idx_newcomers_assigned_to_followup ON public.newcomers(assigned_to, followup_status);
CREATE INDEX IF NOT EXISTS idx_newcomers_next_followup_date ON public.newcomers(next_followup_date);

-- Create followup_history table to track all follow-up attempts
CREATE TABLE IF NOT EXISTS public.followup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  newcomer_id UUID NOT NULL REFERENCES public.newcomers(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'contacted', 'completed', 'no_response')),
  notes TEXT,
  contact_method TEXT CHECK (contact_method IN ('phone', 'whatsapp', 'email', 'visit', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for followup_history
CREATE INDEX IF NOT EXISTS idx_followup_history_newcomer_id ON public.followup_history(newcomer_id);
CREATE INDEX IF NOT EXISTS idx_followup_history_staff_id ON public.followup_history(staff_id);
CREATE INDEX IF NOT EXISTS idx_followup_history_created_at ON public.followup_history(created_at);

-- Enable RLS
ALTER TABLE public.followup_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for followup_history
-- Staff can view their own follow-up history
CREATE POLICY "Staff can view their own follow-up history"
  ON public.followup_history
  FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid());

-- Staff can view follow-up history for newcomers assigned to them
CREATE POLICY "Staff can view follow-up history for assigned newcomers"
  ON public.followup_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.newcomers
      WHERE newcomers.id = followup_history.newcomer_id
      AND newcomers.assigned_to = auth.uid()
    )
  );

-- Staff can create follow-up history entries for newcomers assigned to them
CREATE POLICY "Staff can create follow-up history for assigned newcomers"
  ON public.followup_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.newcomers
      WHERE newcomers.id = followup_history.newcomer_id
      AND newcomers.assigned_to = auth.uid()
    )
    AND staff_id = auth.uid()
  );

-- Admins can view all follow-up history
CREATE POLICY "Admins can view all follow-up history"
  ON public.followup_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can manage all follow-up history
CREATE POLICY "Admins can manage all follow-up history"
  ON public.followup_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
