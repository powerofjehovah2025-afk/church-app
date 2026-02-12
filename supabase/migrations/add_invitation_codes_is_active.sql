-- Allow admins to deactivate invitation codes (soft revoke)
ALTER TABLE public.invitation_codes
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.invitation_codes.is_active IS 'When false, code fails validation and cannot be used for sign-up.';
