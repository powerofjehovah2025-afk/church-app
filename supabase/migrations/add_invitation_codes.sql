-- Invitation codes for sign-up (required for new users)
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON public.invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_used_at ON public.invitation_codes(used_at) WHERE used_at IS NULL;

ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- Service role (API using service key) can do everything
CREATE POLICY "Service role full access invitation_codes"
  ON public.invitation_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed one default code so sign-up works out of the box (e.g. WELCOME2025)
INSERT INTO public.invitation_codes (code)
VALUES ('WELCOME2025')
ON CONFLICT (code) DO NOTHING;
