-- ============================================
-- RECENTLY VIEWED PRODUCTS TABLE
-- Tracks products users have viewed or quoted
-- for "Quick Reorder" feature on dashboard
-- ============================================

CREATE TABLE IF NOT EXISTS recently_viewed_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User who viewed/quoted
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Product identifier (slug for URL linking)
  product_slug TEXT NOT NULL,
  
  -- Cached product data for display without API call
  -- { styleName, brandName, title, imageUrl, price, salePrice }
  product_data JSONB NOT NULL DEFAULT '{}',
  
  -- Source: 'viewed' (browsed) or 'quoted' (added to quote)
  source TEXT NOT NULL DEFAULT 'viewed' CHECK (source IN ('viewed', 'quoted')),
  
  -- When it was viewed/quoted
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique per user+product (upsert on re-view)
  UNIQUE(user_id, product_slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed_products(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_time ON recently_viewed_products(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_source ON recently_viewed_products(source);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE recently_viewed_products ENABLE ROW LEVEL SECURITY;

-- Users can view their own recently viewed products
CREATE POLICY "Users can view own recently viewed"
  ON recently_viewed_products FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own recently viewed
CREATE POLICY "Users can insert own recently viewed"
  ON recently_viewed_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own (for upsert)
CREATE POLICY "Users can update own recently viewed"
  ON recently_viewed_products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own
CREATE POLICY "Users can delete own recently viewed"
  ON recently_viewed_products FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Extract products from quote items
-- Called when a quote is created to mark products as 'quoted'
-- ============================================

CREATE OR REPLACE FUNCTION extract_quoted_products()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
BEGIN
  -- Only run if there's a customer_id
  IF NEW.customer_id IS NOT NULL AND NEW.items IS NOT NULL THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      -- Upsert each product with source='quoted'
      INSERT INTO recently_viewed_products (
        user_id, 
        product_slug, 
        product_data, 
        source, 
        viewed_at
      )
      VALUES (
        NEW.customer_id,
        COALESCE(item->>'slug', item->>'styleNumber', item->>'styleName'),
        jsonb_build_object(
          'styleName', item->>'styleName',
          'brandName', item->>'brandName',
          'title', item->>'styleName',
          'imageUrl', item->>'imageUrl',
          'price', (item->>'unitPrice')::numeric
        ),
        'quoted',
        NOW()
      )
      ON CONFLICT (user_id, product_slug) 
      DO UPDATE SET 
        source = 'quoted',  -- Upgrade from 'viewed' to 'quoted'
        viewed_at = NOW(),
        product_data = EXCLUDED.product_data;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after quote creation
DROP TRIGGER IF EXISTS on_quote_created_extract_products ON quotes;
CREATE TRIGGER on_quote_created_extract_products
  AFTER INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION extract_quoted_products();
