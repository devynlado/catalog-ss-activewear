-- ============================================
-- CUSTOMER WISHLISTS
-- Lets signed-in customers save products they like across devices.
-- Anonymous customers keep their wishlist client-side in localStorage and
-- merge into this table on login (see /api/wishlist/merge).
-- ============================================

CREATE TABLE IF NOT EXISTS customer_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner of the wishlist entry
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Product reference. We use style_id (matches the rest of the catalog —
  -- product_cache, cart items, reviews — all key by style_id, not slug).
  product_style_id BIGINT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per (user, product). Re-adding is a no-op (or upsert).
  UNIQUE(user_id, product_style_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_customer_wishlists_user
  ON customer_wishlists(user_id);

CREATE INDEX IF NOT EXISTS idx_customer_wishlists_user_created
  ON customer_wishlists(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_wishlists_product
  ON customer_wishlists(product_style_id);

-- ============================================
-- ROW LEVEL SECURITY
-- Mirrors the policy shape in 011_recently_viewed.sql.
-- Users can only see/modify their own wishlist rows.
-- ============================================

ALTER TABLE customer_wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wishlist" ON customer_wishlists;
CREATE POLICY "Users can view own wishlist"
  ON customer_wishlists FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wishlist" ON customer_wishlists;
CREATE POLICY "Users can insert own wishlist"
  ON customer_wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wishlist" ON customer_wishlists;
CREATE POLICY "Users can delete own wishlist"
  ON customer_wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- No UPDATE policy: wishlist rows are immutable (only insert + delete).
