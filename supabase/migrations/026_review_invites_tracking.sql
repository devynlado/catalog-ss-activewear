-- Migration: Review Invites Tracking Enhancement
-- Adds email delivery tracking columns to review_invites table
-- Run in Supabase SQL Editor

-- email_status: 'sent', 'failed', 'pending' (created but not yet attempted)
ALTER TABLE review_invites
  ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'sent'
    CHECK (email_status IN ('sent', 'failed', 'pending'));

-- Resend API message ID for delivery tracking
ALTER TABLE review_invites
  ADD COLUMN IF NOT EXISTS resend_message_id TEXT;

-- Error message when email_status = 'failed'
ALTER TABLE review_invites
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Track manual resend attempts
ALTER TABLE review_invites
  ADD COLUMN IF NOT EXISTS last_resent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_review_invites_email_status
  ON review_invites(email_status);
