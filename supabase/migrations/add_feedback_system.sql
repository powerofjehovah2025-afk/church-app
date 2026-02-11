-- Migration: Add Feedback System
-- This migration creates tables for members to provide feedback on services/events

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('service', 'event', 'general')),
  related_id UUID, -- service_id or event_id (NULL for general feedback)
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- Optional 1-5 star rating
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'archived')),
  admin_notes TEXT, -- Admin can add notes
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for feedback
CREATE INDEX IF NOT EXISTS idx_feedback_submitted_by ON public.feedback(submitted_by);
CREATE INDEX IF NOT EXISTS idx_feedback_feedback_type ON public.feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_related_id ON public.feedback(related_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Members can submit feedback" ON public.feedback;
DROP POLICY IF EXISTS "Members can view their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can manage feedback" ON public.feedback;

-- RLS Policies for feedback
-- Members can submit feedback
CREATE POLICY "Members can submit feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = submitted_by);

-- Members can view their own feedback
CREATE POLICY "Members can view their own feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (auth.uid() = submitted_by);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can manage feedback (update status, add notes)
CREATE POLICY "Admins can manage feedback"
ON public.feedback
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Function to update updated_at timestamp for feedback
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for feedback
DROP TRIGGER IF EXISTS update_feedback_updated_at ON public.feedback;
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

