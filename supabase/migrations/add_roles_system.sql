-- Create roles table for enhanced role management
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  hierarchy_level INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create role_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_key)
);

-- Create index on role_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for roles table
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
-- Allow authenticated users to read active roles
CREATE POLICY "Allow authenticated users to read active roles"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow admins to manage all roles
CREATE POLICY "Allow admins to manage roles"
  ON public.roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for role_permissions table
-- Allow authenticated users to read role permissions
CREATE POLICY "Allow authenticated users to read role permissions"
  ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage role permissions
CREATE POLICY "Allow admins to manage role permissions"
  ON public.role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seed default roles
INSERT INTO public.roles (name, description, hierarchy_level, permissions) VALUES
  ('admin', 'Administrator with full system access', 1, '{"manage_users": true, "manage_rota": true, "manage_forms": true, "view_reports": true, "assign_duties": true, "send_messages": true}'::jsonb),
  ('pastor', 'Pastor with leadership responsibilities', 2, '{"manage_rota": true, "view_reports": true, "assign_duties": true, "send_messages": true}'::jsonb),
  ('elder', 'Church elder with administrative duties', 3, '{"view_reports": true, "assign_duties": true, "send_messages": true}'::jsonb),
  ('deacon', 'Deacon with service responsibilities', 4, '{"assign_duties": true, "send_messages": true}'::jsonb),
  ('leader', 'Ministry leader', 5, '{"assign_duties": true, "send_messages": true}'::jsonb),
  ('member', 'Regular church member', 10, '{"view_own_duties": true}'::jsonb),
  ('volunteer', 'Volunteer member', 10, '{"view_own_duties": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Update existing profiles to use role names that match seeded roles
-- This ensures backward compatibility while transitioning to the new system
UPDATE public.profiles
SET role = 'member'
WHERE role IS NULL OR role NOT IN ('admin', 'pastor', 'elder', 'deacon', 'leader', 'member', 'volunteer');

