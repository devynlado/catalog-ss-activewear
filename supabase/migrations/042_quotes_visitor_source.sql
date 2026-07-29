-- Add visitor_source column to quotes table
-- Tracks the traffic channel (e.g., Google Ads, Organic Search, Direct) for each
-- quote request, mirroring the same column on contacts (see 028_contacts_visitor_source.sql).
-- Powers the "Quote Requests by Visitor Source" trend chart on /admin/quotes.
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS visitor_source TEXT;

CREATE INDEX IF NOT EXISTS idx_quotes_visitor_source ON quotes(visitor_source) WHERE visitor_source IS NOT NULL;
