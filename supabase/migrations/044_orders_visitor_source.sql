-- Add visitor_source column to orders table
-- Stores the derived traffic channel for each order so the /admin/orders
-- "Visitor Source" filter can run server-side (indexed) instead of scanning
-- every order in JS. Mirrors the visitor_source columns on contacts (028) and
-- quotes (042), but stores a stable canonical KEY rather than a display label
-- so the filter can query it directly.
--
-- Canonical keys (produced by classifyOrderSource() in lib/order-source.ts):
--   'google_ads' | 'organic_search' | 'ai' | 'social'
--   'referral'   | 'email'          | 'other' | 'direct'
--
-- The values are derived from the existing attribution columns
-- (utm_source / utm_medium / gclid / referrer). New orders populate this at
-- write time; existing orders are backfilled in 045_backfill_orders_visitor_source.sql.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS visitor_source TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_visitor_source ON orders(visitor_source) WHERE visitor_source IS NOT NULL;
