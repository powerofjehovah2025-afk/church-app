-- Migration: Add follow-up tracking and assignment fields

ALTER TABLE newcomers
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS contacted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contact_notes TEXT;

-- Create index so the Team Member's dashboard loads instantly
CREATE INDEX IF NOT EXISTS idx_newcomers_assigned_to 
ON newcomers(assigned_to) 
WHERE assigned_to IS NOT NULL;
