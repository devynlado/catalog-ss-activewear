-- Migration: Add slug column to products table for SEO-friendly URLs
-- Run this migration in Supabase SQL Editor

-- Add slug column
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index for slug lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE slug IS NOT NULL;

-- Populate slugs for existing products: {brand_name}-{style_name} in lowercase, spaces to hyphens
UPDATE products 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      brand_name || '-' || style_name,
      '[^a-zA-Z0-9\-\s]', '', 'g'  -- Remove special chars except hyphens and spaces
    ),
    '\s+', '-', 'g'  -- Replace spaces with hyphens
  )
)
WHERE slug IS NULL;

-- Handle any duplicate slugs by appending style_id
WITH duplicates AS (
  SELECT slug, COUNT(*) as cnt
  FROM products
  WHERE slug IS NOT NULL
  GROUP BY slug
  HAVING COUNT(*) > 1
)
UPDATE products p
SET slug = p.slug || '-' || p.style_id
FROM duplicates d
WHERE p.slug = d.slug;

-- Add comment for documentation
COMMENT ON COLUMN products.slug IS 'SEO-friendly URL slug (e.g., gildan-5000)';
