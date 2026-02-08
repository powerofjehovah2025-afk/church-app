-- Migration: Seed initial form configurations
-- This creates basic form configs that can be customized via the admin UI

-- Insert form configs if they don't exist
INSERT INTO public.form_configs (form_type, title, description, is_active)
VALUES
  ('welcome', 'Welcome Form', 'Welcome form for new visitors', true),
  ('membership', 'Membership Form', 'Membership registration form', true),
  ('newcomer', 'Newcomer Form', 'Newcomer information form', true)
ON CONFLICT (form_type) DO NOTHING;

-- Note: Form fields and static content should be added via the admin UI
-- This ensures proper configuration and allows admins to customize everything

