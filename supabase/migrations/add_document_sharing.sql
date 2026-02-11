-- Migration: Add Document Sharing System
-- This migration creates tables for managing document uploads and sharing

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Storage path (e.g., Supabase Storage path)
  file_size BIGINT, -- File size in bytes
  mime_type TEXT, -- MIME type (e.g., 'application/pdf', 'image/png')
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false, -- If true, all members can view
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON public.documents(is_public);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

-- Create document_shares junction table for sharing with specific members/roles
CREATE TABLE IF NOT EXISTS public.document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  shared_with_type TEXT NOT NULL CHECK (shared_with_type IN ('member', 'role', 'all')),
  shared_with_id UUID, -- member_id or role_id (NULL if shared_with_type = 'all')
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_download BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, shared_with_type, shared_with_id) -- Prevent duplicate shares
);

-- Create indexes for document_shares
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON public.document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with ON public.document_shares(shared_with_type, shared_with_id);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view public documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view documents shared with them" ON public.documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can manage document shares" ON public.document_shares;
DROP POLICY IF EXISTS "Users can view document shares" ON public.document_shares;

-- RLS Policies for documents
-- Admins can manage all documents
CREATE POLICY "Admins can manage all documents"
ON public.documents
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view public documents
CREATE POLICY "Users can view public documents"
ON public.documents
FOR SELECT
TO authenticated
USING (is_public = true);

-- Users can view documents shared with them
CREATE POLICY "Users can view documents shared with them"
ON public.documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.document_shares ds
    WHERE ds.document_id = documents.id
    AND (
      ds.shared_with_type = 'all'
      OR (ds.shared_with_type = 'member' AND ds.shared_with_id = auth.uid())
      OR (ds.shared_with_type = 'role' AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = (SELECT name FROM public.roles WHERE id = ds.shared_with_id::text LIMIT 1)
      ))
    )
  )
);

-- Users can upload documents
CREATE POLICY "Users can upload documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

-- Users can view and update their own documents
CREATE POLICY "Users can view their own documents"
ON public.documents
FOR SELECT
TO authenticated
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (auth.uid() = uploaded_by)
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own documents"
ON public.documents
FOR DELETE
TO authenticated
USING (auth.uid() = uploaded_by);

-- RLS Policies for document_shares
-- Admins can manage all document shares
CREATE POLICY "Admins can manage document shares"
ON public.document_shares
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view document shares for documents they own or have access to
CREATE POLICY "Users can view document shares"
ON public.document_shares
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents
    WHERE documents.id = document_shares.document_id
    AND (
      documents.uploaded_by = auth.uid()
      OR documents.is_public = true
      OR EXISTS (
        SELECT 1 FROM public.document_shares ds2
        WHERE ds2.document_id = documents.id
        AND (
          ds2.shared_with_type = 'all'
          OR (ds2.shared_with_type = 'member' AND ds2.shared_with_id = auth.uid())
        )
      )
    )
  )
);

-- Function to update updated_at timestamp for documents
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for documents
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

