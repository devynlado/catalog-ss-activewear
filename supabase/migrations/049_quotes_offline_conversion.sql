-- Offline conversion support for quotes (Google Ads Data Manager API)
-- Stores Google click identifiers captured at quote submit, plus the upload
-- state, so qualified quote requests can be reported back to Google Ads as
-- offline conversions. Unlike contacts, quotes have no spam concept, so there
-- is no retraction path — offline_conv_status is null | 'uploaded'.
-- Qualified quotes use a SEPARATE conversion action from contacts
-- (GADS_QUALIFIED_QUOTE_CONVERSION_ACTION) at a flat value (default $150).
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS gclid TEXT,
  ADD COLUMN IF NOT EXISTS gbraid TEXT,
  ADD COLUMN IF NOT EXISTS wbraid TEXT,
  ADD COLUMN IF NOT EXISTS offline_conv_status TEXT,        -- null | 'uploaded'
  ADD COLUMN IF NOT EXISTS offline_conv_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;

-- Quickly find quotes that carry a Google click id (eligible for offline upload).
CREATE INDEX IF NOT EXISTS idx_quotes_gclid ON quotes(gclid) WHERE gclid IS NOT NULL;
