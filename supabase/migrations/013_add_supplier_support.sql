-- Migration: Add multi-supplier support
-- This migration adds supplier tracking to products, colors, and SKUs
-- to support Otto Cap alongside S&S Activewear

-- ============================================
-- ADD SUPPLIER COLUMNS
-- ============================================

-- Products table: track which supplier each product comes from
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier TEXT NOT NULL DEFAULT 'ss_activewear';
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_style_id TEXT;

-- Product colors table: track supplier
ALTER TABLE product_colors ADD COLUMN IF NOT EXISTS supplier TEXT NOT NULL DEFAULT 'ss_activewear';

-- Product SKUs table: track supplier and original SKU
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS supplier TEXT NOT NULL DEFAULT 'ss_activewear';
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS supplier_sku TEXT;

-- ============================================
-- ADD INDEXES FOR SUPPLIER QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier);
CREATE INDEX IF NOT EXISTS idx_products_supplier_style ON products(supplier_style_id);
CREATE INDEX IF NOT EXISTS idx_colors_supplier ON product_colors(supplier);
CREATE INDEX IF NOT EXISTS idx_skus_supplier ON product_skus(supplier);
CREATE INDEX IF NOT EXISTS idx_skus_supplier_sku ON product_skus(supplier_sku);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_products_supplier_active ON products(supplier, is_active);

-- ============================================
-- SEQUENCE FOR OTTO CAP STYLE IDS
-- ============================================

-- Otto Cap uses text-based style numbers (e.g., "31-069")
-- We generate numeric style_ids starting at 1,000,000 to avoid conflicts with S&S
CREATE SEQUENCE IF NOT EXISTS otto_style_id_seq START 1000000;

-- ============================================
-- ADD BASEBALL CAPS CATEGORY
-- ============================================

-- Insert Baseball Caps as a new subcategory under Headwear
-- Using ID 2000 to avoid conflicts with S&S category IDs (which go up to ~1252)
INSERT INTO categories (id, name, type, slug, parent_id, display_order, is_active)
VALUES (2000, 'Baseball Caps', 'subcategory', 'baseball-caps', 11, 1, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN products.supplier IS 'Supplier identifier: ss_activewear or otto_cap';
COMMENT ON COLUMN products.supplier_style_id IS 'Original style ID from supplier (e.g., "31-069" for Otto Cap)';
COMMENT ON COLUMN product_skus.supplier_sku IS 'Original SKU from supplier (e.g., "31-069-001" for Otto Cap)';
