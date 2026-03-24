-- Migration: Product Review System
-- Creates reviews table, review_invites table, adds aggregate columns to products
-- Run in Supabase SQL Editor

-- ============================================
-- REVIEWS TABLE
-- Stores per-product customer reviews
-- photos JSONB stores reviewer avatar URL as single-element array ['url']
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    style_id INT NOT NULL REFERENCES products(style_id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE SET NULL,
    order_item_id UUID,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    body TEXT NOT NULL,
    photos JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified_purchase BOOLEAN NOT NULL DEFAULT true,
    reward_coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    admin_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(customer_email, style_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_style_id ON reviews(style_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_email ON reviews(customer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_style_approved ON reviews(style_id) WHERE status = 'approved';

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Service role full access') THEN
        CREATE POLICY "Service role full access" ON reviews FOR ALL USING (true);
    END IF;
END $$;

-- ============================================
-- REVIEW_INVITES TABLE
-- Tracks review invite emails sent after delivery
-- ============================================
CREATE TABLE IF NOT EXISTS review_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_review_invites_token ON review_invites(token);
CREATE INDEX IF NOT EXISTS idx_review_invites_email ON review_invites(customer_email);

ALTER TABLE review_invites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_invites' AND policyname = 'Service role full access') THEN
        CREATE POLICY "Service role full access" ON review_invites FOR ALL USING (true);
    END IF;
END $$;

-- ============================================
-- AGGREGATE COLUMNS ON PRODUCTS
-- Denormalized for fast product page loads
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- ============================================
-- HELPER: Recalculate product review aggregates
-- Called after review approval/rejection
-- ============================================
CREATE OR REPLACE FUNCTION recalculate_review_aggregates(p_style_id INT)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET avg_rating = sub.avg_rating,
        review_count = sub.review_count
    FROM (
        SELECT
            ROUND(AVG(rating)::numeric, 2) AS avg_rating,
            COUNT(*) AS review_count
        FROM reviews
        WHERE style_id = p_style_id AND status = 'approved'
    ) sub
    WHERE style_id = p_style_id;

    -- If no approved reviews, reset to defaults
    IF NOT FOUND OR (SELECT COUNT(*) FROM reviews WHERE style_id = p_style_id AND status = 'approved') = 0 THEN
        UPDATE products
        SET avg_rating = NULL, review_count = 0
        WHERE style_id = p_style_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
