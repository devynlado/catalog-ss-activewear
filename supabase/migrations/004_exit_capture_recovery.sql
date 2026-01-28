-- Migration: Add recovery functionality to exit_captures table
-- This enables the "Save Quote for Later" feature with email recovery links

-- Add new columns for recovery functionality
ALTER TABLE exit_captures 
ADD COLUMN IF NOT EXISTS recovery_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Create index for fast token lookups (only on non-null tokens)
CREATE INDEX IF NOT EXISTS idx_exit_captures_token 
ON exit_captures(recovery_token) 
WHERE recovery_token IS NOT NULL;

-- Create index for finding expired, unrecovered captures (for cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_exit_captures_expires 
ON exit_captures(expires_at) 
WHERE recovered_at IS NULL;

-- Create index for finding captures that need reminders
CREATE INDEX IF NOT EXISTS idx_exit_captures_reminder
ON exit_captures(email_sent_at)
WHERE recovered_at IS NULL 
AND reminder_sent_at IS NULL;

-- Comment on new columns for documentation
COMMENT ON COLUMN exit_captures.recovery_token IS 'Unique token for recovery URL (UUID v4)';
COMMENT ON COLUMN exit_captures.expires_at IS 'When the recovery link expires (default 30 days)';
COMMENT ON COLUMN exit_captures.email_sent_at IS 'When the recovery email was sent';
COMMENT ON COLUMN exit_captures.email_opened_at IS 'When the recovery email was opened (via webhook)';
COMMENT ON COLUMN exit_captures.recovered_at IS 'When the user successfully recovered their cart';
COMMENT ON COLUMN exit_captures.reminder_sent_at IS 'When the 24hr reminder email was sent';
