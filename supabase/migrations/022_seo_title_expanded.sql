-- Migration: Update SEO Title (title_optimized) with expanded formula
--
-- New formula combines: brand_name, style_name, title_raw, gender, color count, size range
--   "{brand_name} {style_name} {clean_title} - {gender} | {N} Colors | Sizes {min}-{max}"
--   Target length: up to 150 characters.
--
-- Replaces the 65-char limit from migration 020 with a 150-char limit
-- to allow richer, more descriptive SEO titles.

-- ============================================================================
-- Regenerate title_optimized for ALL products
-- ============================================================================

WITH seo_base AS (
  SELECT
    p.style_id,
    p.brand_name,
    p.style_name,
    COALESCE(NULLIF(TRIM(p.gender), ''), 'Unisex') AS gender,
    CASE
      WHEN p.title_raw ILIKE p.brand_name || ' %'
        THEN TRIM(SUBSTRING(p.title_raw FROM LENGTH(p.brand_name) + 2))
      WHEN p.title_raw ILIKE p.brand_name || '%'
        THEN TRIM(SUBSTRING(p.title_raw FROM LENGTH(p.brand_name) + 1))
      ELSE COALESCE(p.title_raw, p.style_name)
    END AS clean_title,
    COALESCE(cc.cnt, 0) AS color_count,
    smin.size_name AS min_size,
    smax.size_name AS max_size
  FROM products p
  LEFT JOIN (
    SELECT style_id, COUNT(*) AS cnt FROM product_colors GROUP BY style_id
  ) cc USING (style_id)
  LEFT JOIN LATERAL (
    SELECT size_name FROM product_skus
    WHERE style_id = p.style_id
    ORDER BY size_order ASC
    LIMIT 1
  ) smin ON true
  LEFT JOIN LATERAL (
    SELECT size_name FROM product_skus
    WHERE style_id = p.style_id
    ORDER BY size_order DESC
    LIMIT 1
  ) smax ON true
),

seo_parts AS (
  SELECT
    style_id,
    -- Core: "{brand} {style} {clean_title}"
    brand_name || ' ' || style_name || ' ' || clean_title AS core,
    gender,
    color_count,
    min_size,
    max_size,
    -- Size range string: "Sizes S-5XL" or "One Size"
    CASE
      WHEN min_size IS NULL THEN NULL
      WHEN min_size = max_size THEN 'Size ' || min_size
      ELSE 'Sizes ' || min_size || '-' || max_size
    END AS size_range
  FROM seo_base
)

UPDATE products p
SET title_optimized = LEFT(
  CASE
    -- Full version: core - gender | N Colors | Sizes S-5XL
    WHEN s.size_range IS NOT NULL AND s.color_count > 1
      AND LENGTH(s.core || ' - ' || s.gender || ' | ' || s.color_count || ' Colors | ' || s.size_range) <= 150
      THEN s.core || ' - ' || s.gender || ' | ' || s.color_count || ' Colors | ' || s.size_range

    -- Without size range: core - gender | N Colors
    WHEN s.color_count > 1
      AND LENGTH(s.core || ' - ' || s.gender || ' | ' || s.color_count || ' Colors') <= 150
      THEN s.core || ' - ' || s.gender || ' | ' || s.color_count || ' Colors'

    -- Without color count: core - gender | Sizes S-5XL
    WHEN s.size_range IS NOT NULL
      AND LENGTH(s.core || ' - ' || s.gender || ' | ' || s.size_range) <= 150
      THEN s.core || ' - ' || s.gender || ' | ' || s.size_range

    -- Just gender: core - gender
    WHEN LENGTH(s.core || ' - ' || s.gender) <= 150
      THEN s.core || ' - ' || s.gender

    -- Core too long: truncate at word boundary
    ELSE REGEXP_REPLACE(LEFT(s.core, 150), '\s+\S*$', '')
  END,
  150
)
FROM seo_parts s
WHERE s.style_id = p.style_id;


-- ============================================================================
-- Safety trim: ensure no title exceeds 150 characters
-- ============================================================================

UPDATE products
SET title_optimized = REGEXP_REPLACE(LEFT(title_optimized, 151), '\s+\S*$', '')
WHERE LENGTH(title_optimized) > 150;
