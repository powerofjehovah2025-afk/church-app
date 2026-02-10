-- Create followup_reminders table for reminder system
CREATE TABLE IF NOT EXISTS public.followup_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  newcomer_id UUID NOT NULL REFERENCES public.newcomers(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('assignment', 'overdue', 'scheduled')),
  reminder_date DATE NOT NULL,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for followup_reminders
CREATE INDEX IF NOT EXISTS idx_followup_reminders_newcomer_id ON public.followup_reminders(newcomer_id);
CREATE INDEX IF NOT EXISTS idx_followup_reminders_staff_id ON public.followup_reminders(staff_id);
CREATE INDEX IF NOT EXISTS idx_followup_reminders_reminder_date ON public.followup_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_followup_reminders_is_sent ON public.followup_reminders(is_sent);
CREATE INDEX IF NOT EXISTS idx_followup_reminders_type ON public.followup_reminders(reminder_type);

-- Enable RLS
ALTER TABLE public.followup_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for followup_reminders
-- Staff can view their own reminders
CREATE POLICY "Staff can view their own reminders"
  ON public.followup_reminders
  FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid());

-- Admins can view all reminders
CREATE POLICY "Admins can view all reminders"
  ON public.followup_reminders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System (via service role) can create reminders
-- Admins can create reminders
CREATE POLICY "Admins can create reminders"
  ON public.followup_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update reminders
CREATE POLICY "Admins can update reminders"
  ON public.followup_reminders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically create reminder when newcomer is assigned
CREATE OR REPLACE FUNCTION create_assignment_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create reminder if assigned_to is set and changed
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    INSERT INTO public.followup_reminders (
      newcomer_id,
      staff_id,
      reminder_type,
      reminder_date,
      is_sent
    ) VALUES (
      NEW.id,
      NEW.assigned_to,
      'assignment',
      CURRENT_DATE + INTERVAL '2 days', -- Remind after 2 days if not contacted
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic reminder creation
DROP TRIGGER IF EXISTS trigger_create_assignment_reminder ON public.newcomers;
CREATE TRIGGER trigger_create_assignment_reminder
  AFTER UPDATE OF assigned_to ON public.newcomers
  FOR EACH ROW
  WHEN (NEW.assigned_to IS NOT NULL)
  EXECUTE FUNCTION create_assignment_reminder();
