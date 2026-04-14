-- Track when a product is detected as discontinued at SS Activewear.
-- Products flagged for 48+ hours are auto-hidden (is_active = false).
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS discontinued_detected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manually_kept_active BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_discontinued
  ON products(discontinued_detected_at) WHERE discontinued_detected_at IS NOT NULL;
