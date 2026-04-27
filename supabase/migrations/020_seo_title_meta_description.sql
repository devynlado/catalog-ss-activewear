-- Migration: Populate SEO Title (title_optimized) and Meta Description (description_optimized)
--
-- SEO Title: Combines brand_name, style_name, title_raw, and color count.
--   Target length: 50-65 characters.
--
-- Meta Description: Injects keyword (brand_name + style_name) into description_raw.
--   Target length: 140-165 characters.
--
-- These fields are used ONLY for <title>, <meta description>, and JSON-LD schema.
-- They do NOT affect the product display title or description on the website.

-- ============================================================================
-- STEP 1: Populate SEO Title (title_optimized)
-- ============================================================================
-- Formula:
--   base = "{brand_name} {style_name} {clean_title}"
--   where clean_title = title_raw with leading brand_name removed (avoids duplication)
--
--   If base is 50-65 chars  → use as-is
--   If base > 65 chars      → truncate at word boundary
--   If base < 50 chars      → append " | {N} Colors" or " - Shop Online"

WITH seo_base AS (
  SELECT
    p.style_id,
    p.brand_name,
    p.style_name,
    -- Remove brand name prefix from title_raw to avoid "Gildan Gildan 5000 ..."
    CASE
      WHEN p.title_raw ILIKE p.brand_name || ' %'
        THEN TRIM(SUBSTRING(p.title_raw FROM LENGTH(p.brand_name) + 2))
      WHEN p.title_raw ILIKE p.brand_name || '%'
        THEN TRIM(SUBSTRING(p.title_raw FROM LENGTH(p.brand_name) + 1))
      ELSE COALESCE(p.title_raw, p.style_name)
    END AS clean_title,
    COALESCE(c.cnt, 0) AS color_count
  FROM products p
  LEFT JOIN (
    SELECT style_id, COUNT(*) AS cnt FROM product_colors GROUP BY style_id
  ) c USING (style_id)
),
seo_titles AS (
  SELECT
    style_id,
    brand_name || ' ' || style_name || ' ' || clean_title AS full_title,
    color_count
  FROM seo_base
)
UPDATE products p
SET title_optimized = CASE
  -- Already in ideal range
  WHEN LENGTH(t.full_title) BETWEEN 50 AND 65
    THEN t.full_title

  -- Too long: truncate at word boundary to fit within 65 chars
  WHEN LENGTH(t.full_title) > 65
    THEN REGEXP_REPLACE(LEFT(t.full_title, 66), '\s+\S*$', '')

  -- Too short: try appending color count (e.g. "| 52 Colors")
  WHEN t.color_count > 1
    AND LENGTH(t.full_title || ' | ' || t.color_count || ' Colors') <= 65
    THEN t.full_title || ' | ' || t.color_count || ' Colors'

  -- Too short: try "Shop Online" suffix
  WHEN LENGTH(t.full_title || ' - Shop Online') <= 65
    THEN t.full_title || ' - Shop Online'

  -- Fallback: use as-is even if short
  ELSE t.full_title
END
FROM seo_titles t
WHERE t.style_id = p.style_id;


-- ============================================================================
-- STEP 2: Populate Meta Description (description_optimized)
-- ============================================================================
-- Formula:
--   keyword = "{brand_name} {style_name}"
--   base = "Shop the {keyword}. {cleaned_description_raw}"
--   where cleaned_description_raw has the keyword prefix stripped if already present
--
--   If base is 140-165 chars → use as-is
--   If base > 165 chars      → truncate at word boundary + "."
--   If base < 140 chars      → pad with inventory/pricing call-to-action

WITH desc_base AS (
  SELECT
    style_id,
    brand_name,
    style_name,
    brand_name || ' ' || style_name AS keyword,
    -- Strip keyword from description start to avoid "Shop the Gildan 5000. Gildan 5000 is..."
    CASE
      WHEN TRIM(COALESCE(description_raw, '')) = '' THEN NULL
      WHEN TRIM(description_raw) ILIKE brand_name || ' ' || style_name || ' %'
        THEN TRIM(SUBSTRING(TRIM(description_raw) FROM LENGTH(brand_name || ' ' || style_name) + 2))
      WHEN TRIM(description_raw) ILIKE 'The ' || brand_name || ' ' || style_name || ' %'
        THEN TRIM(SUBSTRING(TRIM(description_raw) FROM LENGTH('The ' || brand_name || ' ' || style_name) + 2))
      ELSE TRIM(description_raw)
    END AS clean_desc
  FROM products
),
desc_full AS (
  SELECT
    style_id,
    keyword,
    CASE
      WHEN clean_desc IS NOT NULL
        THEN 'Shop the ' || keyword || '. ' || clean_desc
      ELSE
        'Shop the ' || keyword || ' at Garment Decor. Browse all available colors, sizes, and live inventory. Wholesale pricing with volume discounts starting at 50 pieces.'
    END AS raw_meta
  FROM desc_base
)
UPDATE products p
SET description_optimized = CASE
  -- Already in ideal range
  WHEN LENGTH(d.raw_meta) BETWEEN 140 AND 165
    THEN d.raw_meta

  -- Too long: truncate at word boundary and add period
  WHEN LENGTH(d.raw_meta) > 165
    THEN REGEXP_REPLACE(LEFT(d.raw_meta, 163), '\s+\S*$', '') || '.'

  -- Too short: pad with call-to-action text
  WHEN LENGTH(d.raw_meta || ' Browse colors, sizes & live inventory at Garment Decor.') BETWEEN 140 AND 165
    THEN d.raw_meta || ' Browse colors, sizes & live inventory at Garment Decor.'

  WHEN LENGTH(d.raw_meta || ' Available in multiple colors and sizes. Wholesale pricing at Garment Decor.') <= 165
    THEN d.raw_meta || ' Available in multiple colors and sizes. Wholesale pricing at Garment Decor.'

  -- Fallback: use as-is
  ELSE d.raw_meta
END
FROM desc_full d
WHERE d.style_id = p.style_id;


-- ============================================================================
-- STEP 3: Safety trim — ensure no values exceed maximum length
-- ============================================================================

UPDATE products
SET title_optimized = REGEXP_REPLACE(LEFT(title_optimized, 66), '\s+\S*$', '')
WHERE LENGTH(title_optimized) > 65;

UPDATE products
SET description_optimized = REGEXP_REPLACE(LEFT(description_optimized, 163), '\s+\S*$', '') || '.'
WHERE LENGTH(description_optimized) > 165;
