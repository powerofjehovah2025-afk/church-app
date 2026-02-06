-- Migration: Create rota management tables
-- This migration creates tables for managing church service duties and assignments
-- Updated to handle existing policies gracefully

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, name) -- Prevent duplicate services on same date
);

-- Create indexes for services
CREATE INDEX IF NOT EXISTS idx_services_date ON public.services(date);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON public.services(created_at);

-- Create duty_types table
CREATE TABLE IF NOT EXISTS public.duty_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for duty_types
CREATE INDEX IF NOT EXISTS idx_duty_types_active ON public.duty_types(is_active);
CREATE INDEX IF NOT EXISTS idx_duty_types_name ON public.duty_types(name);

-- Create service_assignments table
CREATE TABLE IF NOT EXISTS public.service_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  duty_type_id UUID NOT NULL REFERENCES public.duty_types(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'completed')),
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, duty_type_id, member_id) -- Prevent duplicate assignments
);

-- Create indexes for service_assignments
CREATE INDEX IF NOT EXISTS idx_service_assignments_service_id ON public.service_assignments(service_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_duty_type_id ON public.service_assignments(duty_type_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_member_id ON public.service_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_status ON public.service_assignments(status);
CREATE INDEX IF NOT EXISTS idx_service_assignments_assigned_at ON public.service_assignments(assigned_at);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
-- Note: These must come after table creation
DROP POLICY IF EXISTS "Admins can view all services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Members can view services" ON public.services;
DROP POLICY IF EXISTS "Admins can view all duty types" ON public.duty_types;
DROP POLICY IF EXISTS "Admins can manage duty types" ON public.duty_types;
DROP POLICY IF EXISTS "Members can view active duty types" ON public.duty_types;
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.service_assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.service_assignments;
DROP POLICY IF EXISTS "Members can view own assignments" ON public.service_assignments;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
DROP TRIGGER IF EXISTS update_duty_types_updated_at ON public.duty_types;
DROP TRIGGER IF EXISTS update_service_assignments_updated_at ON public.service_assignments;

-- RLS Policies for services
-- Admins can view all services
CREATE POLICY "Admins can view all services"
ON public.services
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can manage services
CREATE POLICY "Admins can manage services"
ON public.services
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Members can view services (to see upcoming services)
CREATE POLICY "Members can view services"
ON public.services
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for duty_types
-- Admins can view all duty types
CREATE POLICY "Admins can view all duty types"
ON public.duty_types
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can manage duty types
CREATE POLICY "Admins can manage duty types"
ON public.duty_types
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Members can view active duty types
CREATE POLICY "Members can view active duty types"
ON public.duty_types
FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS Policies for service_assignments
-- Admins can view all assignments
CREATE POLICY "Admins can view all assignments"
ON public.service_assignments
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can manage assignments
CREATE POLICY "Admins can manage assignments"
ON public.service_assignments
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Members can view their own assignments
CREATE POLICY "Members can view own assignments"
ON public.service_assignments
FOR SELECT
TO authenticated
USING (auth.uid() = member_id);

-- Function to update updated_at timestamp for services
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for services
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_updated_at();

-- Function to update updated_at timestamp for duty_types
CREATE OR REPLACE FUNCTION update_duty_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for duty_types
CREATE TRIGGER update_duty_types_updated_at
  BEFORE UPDATE ON public.duty_types
  FOR EACH ROW
  EXECUTE FUNCTION update_duty_types_updated_at();

-- Function to update updated_at timestamp for service_assignments
CREATE OR REPLACE FUNCTION update_service_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for service_assignments
CREATE TRIGGER update_service_assignments_updated_at
  BEFORE UPDATE ON public.service_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_service_assignments_updated_at();

