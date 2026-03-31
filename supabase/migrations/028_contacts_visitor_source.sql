-- Add visitor_source column to contacts table
-- Tracks the traffic channel (e.g., Google Ads, Organic Search, Direct)
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS visitor_source TEXT;

CREATE INDEX IF NOT EXISTS idx_contacts_visitor_source ON contacts(visitor_source) WHERE visitor_source IS NOT NULL;
