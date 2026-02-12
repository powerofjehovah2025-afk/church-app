-- Repair: add used_at / used_by if table was created without them (e.g. partial run)
ALTER TABLE public.invitation_codes ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;
ALTER TABLE public.invitation_codes ADD COLUMN IF NOT EXISTS used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invitation_codes_used_at
  ON public.invitation_codes(used_at) WHERE used_at IS NULL;
