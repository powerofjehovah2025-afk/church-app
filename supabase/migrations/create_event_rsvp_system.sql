-- Create events table (if not exists, enhance if exists)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  max_attendees INTEGER,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  requires_rsvp BOOLEAN DEFAULT FALSE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create event_rsvps table
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'maybe')),
  notes TEXT,
  rsvp_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_requires_rsvp ON public.events(requires_rsvp);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_member_id ON public.event_rsvps(member_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON public.event_rsvps(status);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Anyone can view active events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admins can view all events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage events"
  ON public.events
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

-- RLS Policies for event_rsvps
CREATE POLICY "Members can view their own RSVPs"
  ON public.event_rsvps
  FOR SELECT
  TO authenticated
  USING (auth.uid() = member_id);

CREATE POLICY "Members can create their own RSVPs"
  ON public.event_rsvps
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Members can update their own RSVPs"
  ON public.event_rsvps
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = member_id)
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Admins can view all RSVPs"
  ON public.event_rsvps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger for events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for event_rsvps
CREATE TRIGGER update_event_rsvps_updated_at
  BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

