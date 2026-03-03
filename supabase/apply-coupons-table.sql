-- ============================================
-- APPLY COUPONS TABLE (run once in Supabase SQL Editor)
-- Fix: "Could not find the table 'public.coupons' in the schema cache"
-- ============================================

-- 1. Ensure trigger helper exists (used by updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,

  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent_cart', 'fixed_cart', 'free_shipping')),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,

  free_shipping BOOLEAN NOT NULL DEFAULT false,

  min_cart_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),

  applies_to TEXT NOT NULL DEFAULT 'products_only' CHECK (applies_to IN ('cart_and_packages', 'products_only')),

  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  usage_limit_per_customer INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 3. Normalize code to uppercase (trigger)
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

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON coupons(created_at DESC);

-- 5. updated_at trigger
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (admin access via service role)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to coupons" ON coupons;
CREATE POLICY "Service role full access to coupons"
  ON coupons FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Add coupon columns to orders (if orders table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS coupon_code TEXT;
    CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);
  END IF;
END $$;
