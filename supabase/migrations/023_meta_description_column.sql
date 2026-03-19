-- Migration: Move SEO meta description from description_optimized to a dedicated meta_description column
--
-- 1. Add new meta_description column
-- 2. Copy existing description_optimized values into meta_description
-- 3. Reset description_optimized back to NULL
--
-- This separates concerns:
--   description_optimized → reserved for display description improvements (future use)
--   meta_description      → SEO-only meta description for <meta>, JSON-LD, GMC feed

-- ============================================================================
-- STEP 1: Add the new column
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- ============================================================================
-- STEP 2: Copy data from description_optimized → meta_description
-- ============================================================================

UPDATE products
SET meta_description = description_optimized
WHERE description_optimized IS NOT NULL;

-- ============================================================================
-- STEP 3: Reset description_optimized back to NULL
-- ============================================================================

UPDATE products
SET description_optimized = NULL
WHERE description_optimized IS NOT NULL;
