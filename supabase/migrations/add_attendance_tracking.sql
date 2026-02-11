-- Migration: Add Attendance Tracking System
-- This migration creates tables for tracking member attendance at services

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  checked_in_at TIMESTAMPTZ, -- When they checked in (if using check-in system)
  notes TEXT, -- Optional notes
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Who recorded this attendance
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, member_id) -- One attendance record per member per service
);

-- Create indexes for attendance
CREATE INDEX IF NOT EXISTS idx_attendance_service_id ON public.attendance(service_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON public.attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON public.attendance(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Admins can manage all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Members can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Members can mark their own attendance" ON public.attendance;

-- RLS Policies for attendance
-- Admins can manage all attendance
CREATE POLICY "Admins can manage all attendance"
ON public.attendance
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Members can view their own attendance
CREATE POLICY "Members can view their own attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (auth.uid() = member_id);

-- Members can mark their own attendance (self-check-in)
CREATE POLICY "Members can mark their own attendance"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = member_id);

-- Function to update updated_at timestamp for attendance
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for attendance
DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();

