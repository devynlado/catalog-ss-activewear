-- Offline conversion support for contacts (Google Ads API)
-- Stores Google click identifiers captured at form submit, plus the upload
-- state, so qualified leads can be reported back to Google Ads as offline
-- conversions (and retracted when a lead is later marked as spam).
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS gclid TEXT,
  ADD COLUMN IF NOT EXISTS gbraid TEXT,
  ADD COLUMN IF NOT EXISTS wbraid TEXT,
  ADD COLUMN IF NOT EXISTS offline_conv_status TEXT,        -- null | 'uploaded' | 'retracted'
  ADD COLUMN IF NOT EXISTS offline_conv_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;

-- Quickly find leads that carry a Google click id (eligible for offline upload).
CREATE INDEX IF NOT EXISTS idx_contacts_gclid ON contacts(gclid) WHERE gclid IS NOT NULL;
