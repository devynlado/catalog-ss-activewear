-- Migration: Contact Leads Monitoring & Spam Management
-- Adds spam tracking to contacts table and creates blocked_emails table
-- Run in Supabase SQL Editor

-- ============================================
-- CONTACTS TABLE — add spam tracking columns
-- source/variant/quantity already exist from earlier implicit migration
-- ============================================
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS is_spam BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

-- Drop old CHECK constraint if it exists, then add expanded one
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_status_check;
ALTER TABLE contacts
  ADD CONSTRAINT contacts_status_check
  CHECK (status IN ('new', 'contacted', 'resolved', 'spam'));

CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_is_spam ON contacts(is_spam) WHERE is_spam = true;

-- ============================================
-- BLOCKED_EMAILS TABLE
-- Maintains a blocklist for contact form submissions
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT,
  blocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_blocked_emails_email ON blocked_emails(email);

ALTER TABLE blocked_emails ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocked_emails' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON blocked_emails FOR ALL USING (true);
  END IF;
END $$;
