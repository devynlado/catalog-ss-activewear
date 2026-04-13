-- Migration: Dynamic copy location tracking on contacts
-- Tracks which location-personalized copy variant the visitor saw when submitting a lead form.

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS resolved_location TEXT;

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS copy_variant TEXT;

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS resolution_source TEXT;

CREATE INDEX IF NOT EXISTS idx_contacts_resolved_location
  ON contacts(resolved_location) WHERE resolved_location IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_copy_variant
  ON contacts(copy_variant) WHERE copy_variant IS NOT NULL;
