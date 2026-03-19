-- Garment Decor Database Schema
-- Run this in your Supabase SQL Editor to create the tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- QUOTES TABLE
-- Stores quote form submissions
-- ============================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id TEXT UNIQUE NOT NULL,           -- Human-readable ID (e.g., "QT-ABC123")
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  company TEXT,
  items JSONB NOT NULL,                    -- Array of cart items with product details
  decoration JSONB,                        -- Decoration preferences
  finishing TEXT[],                        -- Array of finishing options
  notes TEXT,                              -- Additional notes from customer
  subtotal DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'converted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);

-- ============================================
-- CONTACTS TABLE
-- Stores contact form submissions
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  service TEXT,                            -- Service they're interested in
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);

-- ============================================
-- ABANDONED CARTS TABLE
-- Captures carts when user enters email but doesn't complete quote
-- ============================================
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  items JSONB NOT NULL,                    -- Cart items at time of capture
  decoration JSONB,
  finishing TEXT[],
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovered BOOLEAN NOT NULL DEFAULT FALSE,
  recovery_sent_at TIMESTAMPTZ             -- When recovery email was sent
);

-- Index for recovery campaigns
CREATE INDEX IF NOT EXISTS idx_abandoned_email ON abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_recovered ON abandoned_carts(recovered);
CREATE INDEX IF NOT EXISTS idx_abandoned_captured ON abandoned_carts(captured_at DESC);

-- ============================================
-- EXIT CAPTURES TABLE
-- Stores emails from exit intent popup
-- ============================================
CREATE TABLE IF NOT EXISTS exit_captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  page_url TEXT,                           -- Which page they were on
  cart_items JSONB,                        -- Cart contents if any
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_exit_email ON exit_captures(email);
CREATE INDEX IF NOT EXISTS idx_exit_created ON exit_captures(created_at DESC);

-- ============================================
-- UPDATED_AT TRIGGER
-- Automatically update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Secure by default, service key bypasses
-- ============================================
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_captures ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON quotes FOR ALL USING (true);
CREATE POLICY "Service role full access" ON contacts FOR ALL USING (true);
CREATE POLICY "Service role full access" ON abandoned_carts FOR ALL USING (true);
CREATE POLICY "Service role full access" ON exit_captures FOR ALL USING (true);

-- ============================================
-- PRODUCT CACHE TABLES
-- Pre-cached product data from SS Activewear
-- ============================================

-- ============================================
-- PRODUCTS TABLE (~5,000 rows)
-- Parent-level product/style information
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    style_id            INT PRIMARY KEY,
    style_name          TEXT NOT NULL,
    brand_id            INT,
    brand_name          TEXT NOT NULL,
    title_raw           TEXT,                    -- Original title from SS API
    title_optimized     TEXT,                    -- For future AI optimization
    description_raw     TEXT,                    -- Original description from SS API
    description_optimized TEXT,                  -- For future AI optimization
    meta_description    TEXT,                    -- SEO meta description for <meta>, JSON-LD, GMC feed
    base_category       TEXT,
    product_type        TEXT,                    -- "T-Shirts > Core T-Shirts"
    google_category_id  INT,
    google_category_name TEXT,
    primary_image_url   TEXT,
    material            TEXT,
    gender              TEXT DEFAULT 'Unisex',
    age_group           TEXT DEFAULT 'Adult',
    is_sustainable      BOOLEAN DEFAULT false,
    is_new              BOOLEAN DEFAULT false,
    is_popular          BOOLEAN DEFAULT false,
    popular_tier        TEXT,                    -- bestseller, staff-pick, streetwear, value
    is_active           BOOLEAN DEFAULT true,    -- false if discontinued
    color_count         INT DEFAULT 0,
    base_price          DECIMAL(10,2),           -- Starting "from" price
    last_full_sync      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_is_popular ON products(is_popular);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_style_name ON products(style_name);
CREATE INDEX IF NOT EXISTS idx_products_popular_active ON products(is_popular, is_active);

-- Full-text search index for products
CREATE INDEX IF NOT EXISTS idx_products_search ON products 
    USING gin(to_tsvector('english', coalesce(title_raw, '') || ' ' || coalesce(brand_name, '') || ' ' || coalesce(style_name, '')));

-- ============================================
-- PRODUCT_COLORS TABLE (~250,000 rows)
-- Color variants with swatches and images
-- ============================================
CREATE TABLE IF NOT EXISTS product_colors (
    id                  TEXT PRIMARY KEY,        -- "styleId-colorCode" e.g., "12345-NAV"
    style_id            INT NOT NULL REFERENCES products(style_id) ON DELETE CASCADE,
    color_name          TEXT NOT NULL,
    color_code          TEXT NOT NULL,
    color_family        TEXT,                    -- "Blue", "Red", etc.
    swatch_image        TEXT,
    front_image         TEXT,
    back_image          TEXT,
    side_image          TEXT,
    on_model_front      TEXT,
    on_model_back       TEXT,
    on_model_side       TEXT,
    additional_images   TEXT[],
    availability        TEXT DEFAULT 'in_stock', -- Aggregated from SKUs
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for product_colors
CREATE INDEX IF NOT EXISTS idx_colors_style_id ON product_colors(style_id);
CREATE INDEX IF NOT EXISTS idx_colors_color_family ON product_colors(color_family);
CREATE INDEX IF NOT EXISTS idx_colors_availability ON product_colors(availability);

-- ============================================
-- PRODUCT_SKUS TABLE (~2,000,000 rows)
-- Full SKU-level data for GMC feed + inventory
-- ============================================
CREATE TABLE IF NOT EXISTS product_skus (
    sku                 TEXT PRIMARY KEY,
    style_id            INT NOT NULL REFERENCES products(style_id) ON DELETE CASCADE,
    color_id            TEXT NOT NULL REFERENCES product_colors(id) ON DELETE CASCADE,
    color_name          TEXT NOT NULL,
    color_code          TEXT NOT NULL,
    size_name           TEXT NOT NULL,
    size_code           TEXT,
    size_order          TEXT,                    -- For sorting sizes correctly
    cogs                DECIMAL(10,2),           -- cost_of_goods_sold (wholesale price)
    retail_price        DECIMAL(10,2),           -- cogs * 1.40
    sale_price          DECIMAL(10,2),           -- Sale price if on sale
    auto_min_price      DECIMAL(10,2),           -- cogs * 1.12 (floor for Google auto-pricing)
    gtin                TEXT,                    -- UPC/EAN
    piece_weight        DECIMAL(6,3),            -- Weight in lbs
    qty                 INT DEFAULT 0,           -- Current inventory quantity
    availability        TEXT DEFAULT 'in_stock', -- in_stock or out_of_stock
    last_inventory_sync TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for product_skus
CREATE INDEX IF NOT EXISTS idx_skus_style_id ON product_skus(style_id);
CREATE INDEX IF NOT EXISTS idx_skus_color_id ON product_skus(color_id);
CREATE INDEX IF NOT EXISTS idx_skus_availability ON product_skus(availability);
CREATE INDEX IF NOT EXISTS idx_skus_style_color ON product_skus(style_id, color_id);

-- ============================================
-- SYNC_LOGS TABLE
-- Track sync job status for monitoring
-- ============================================
CREATE TABLE IF NOT EXISTS sync_logs (
    id                  SERIAL PRIMARY KEY,
    sync_type           TEXT NOT NULL,           -- 'full', 'inventory', 'popular'
    status              TEXT NOT NULL,           -- 'started', 'completed', 'failed'
    products_synced     INT DEFAULT 0,
    colors_synced       INT DEFAULT 0,
    skus_synced         INT DEFAULT 0,
    error_message       TEXT,
    started_at          TIMESTAMPTZ DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);

-- Index for sync_logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_type ON sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started ON sync_logs(started_at DESC);

-- ============================================
-- TRIGGERS FOR PRODUCT TABLES
-- ============================================

-- Auto-update updated_at on products table
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS FOR PRODUCT TABLES
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything on product tables
CREATE POLICY "Service role full access" ON products FOR ALL USING (true);
CREATE POLICY "Service role full access" ON product_colors FOR ALL USING (true);
CREATE POLICY "Service role full access" ON product_skus FOR ALL USING (true);
CREATE POLICY "Service role full access" ON sync_logs FOR ALL USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get effective title (optimized or raw)
CREATE OR REPLACE FUNCTION get_product_title(p products)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(p.title_optimized, p.title_raw, p.style_name);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get effective description (optimized or raw)
CREATE OR REPLACE FUNCTION get_product_description(p products)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(p.description_optimized, p.description_raw, '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
