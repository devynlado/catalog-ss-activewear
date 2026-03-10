-- ============================================
-- PROFITABILITY TRACKING COLUMNS
-- Adds cost/profit tracking and attribution to orders
-- ============================================

-- Cost tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_cogs DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_shipping_cost DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_fee DECIMAL(10,2);

-- Attribution tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gclid TEXT;

-- Tracks whether COGS was captured live at checkout or backfilled from current prices
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cogs_source TEXT DEFAULT 'live'
  CHECK (cogs_source IN ('live', 'backfill'));

-- Index for attribution queries
CREATE INDEX IF NOT EXISTS idx_orders_utm_source ON orders(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_gclid ON orders(gclid) WHERE gclid IS NOT NULL;
