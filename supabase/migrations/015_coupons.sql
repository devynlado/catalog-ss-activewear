-- ============================================
-- COUPONS TABLE
-- Admin-managed discount codes for cart and packages
-- ============================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Discount: percent_cart | fixed_cart | free_shipping (v1)
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent_cart', 'fixed_cart', 'free_shipping')),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Free shipping (economy only); can combine with amount
  free_shipping BOOLEAN NOT NULL DEFAULT false,

  -- Constraints
  min_cart_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),

  -- Apply scope: cart_and_packages | products_only
  applies_to TEXT NOT NULL DEFAULT 'products_only' CHECK (applies_to IN ('cart_and_packages', 'products_only')),

  -- Validity
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Usage
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  usage_limit_per_customer INT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Normalize code to uppercase for lookups (trigger)
CREATE OR REPLACE FUNCTION normalize_coupon_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code := UPPER(TRIM(NEW.code));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_coupon_code_trigger ON coupons;
CREATE TRIGGER normalize_coupon_code_trigger
  BEFORE INSERT OR UPDATE OF code ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION normalize_coupon_code();

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_expires_at ON coupons(expires_at);
CREATE INDEX idx_coupons_created_at ON coupons(created_at DESC);

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: coupons are admin-only; validation is done via API with service role
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to coupons"
  ON coupons FOR ALL
  USING (true);

-- ============================================
-- ORDERS: add coupon reference
-- ============================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);
