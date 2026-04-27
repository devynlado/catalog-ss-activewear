-- ============================================
-- CATEGORY SYSTEM MIGRATION
-- Enables fast multi-attribute filtering via database
-- ============================================

-- ============================================
-- CATEGORIES TABLE
-- Stores all SS Activewear categories with classification
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id              INT PRIMARY KEY,           -- SS Activewear category ID
    name            TEXT NOT NULL,             -- Display name
    type            TEXT NOT NULL CHECK (type IN ('main', 'subcategory', 'attribute', 'guide')),
    attribute_group TEXT,                      -- For type='attribute': sleeve, material, weight, etc.
    parent_id       INT REFERENCES categories(id),
    slug            TEXT,                      -- URL-friendly name
    display_order   INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_attribute_group ON categories(attribute_group);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- ============================================
-- ATTRIBUTE_GROUPS TABLE
-- Defines filter groups shown in sidebar
-- ============================================
CREATE TABLE IF NOT EXISTS attribute_groups (
    id              TEXT PRIMARY KEY,          -- 'sleeve', 'material', 'weight', etc.
    display_name    TEXT NOT NULL,             -- 'Sleeve Length', 'Material', etc.
    display_order   INT DEFAULT 0,
    applies_to      INT[],                     -- Main category IDs this group applies to (null = all)
    is_active       BOOLEAN DEFAULT true
);

-- ============================================
-- PRODUCT_CATEGORIES JUNCTION TABLE
-- Links products to their categories (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
    style_id        INT NOT NULL REFERENCES products(style_id) ON DELETE CASCADE,
    category_id     INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (style_id, category_id)
);

-- Critical indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_style ON product_categories(style_id);

-- Composite index for filtering queries
CREATE INDEX IF NOT EXISTS idx_product_categories_composite ON product_categories(category_id, style_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at on categories table
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON categories FOR ALL USING (true);
CREATE POLICY "Service role full access" ON attribute_groups FOR ALL USING (true);
CREATE POLICY "Service role full access" ON product_categories FOR ALL USING (true);

-- ============================================
-- SEED ATTRIBUTE_GROUPS
-- Pre-populate the filter groups
-- ============================================
INSERT INTO attribute_groups (id, display_name, display_order, applies_to, is_active) VALUES
    ('sleeve', 'Sleeve Length', 1, ARRAY[21, 52], true),           -- T-Shirts, Polos
    ('collar', 'Collar Style', 2, ARRAY[21], true),                -- T-Shirts
    ('material', 'Material', 3, NULL, true),                       -- All categories
    ('weight', 'Weight', 4, ARRAY[21, 9], true),                   -- T-Shirts, Sweatshirts
    ('fit', 'Fit', 5, ARRAY[21, 9, 13], true),                     -- T-Shirts, Sweatshirts, Womens
    ('gender', 'Gender/Age', 6, NULL, true),                       -- All categories
    ('treatment', 'Treatment', 7, ARRAY[21, 9], true),             -- T-Shirts, Sweatshirts
    ('feature', 'Features', 8, NULL, true),                        -- All categories
    ('sustainable', 'Sustainable', 9, NULL, true),                 -- All categories
    ('structure', 'Structure', 10, ARRAY[11], true),               -- Headwear only
    ('panel', 'Panel Count', 11, ARRAY[11], true),                 -- Headwear only
    ('closure', 'Closure Type', 12, ARRAY[11], true),              -- Headwear only
    ('zipper', 'Zipper Style', 13, ARRAY[9, 15], true)             -- Sweatshirts, Jackets
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    display_order = EXCLUDED.display_order,
    applies_to = EXCLUDED.applies_to,
    is_active = EXCLUDED.is_active;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get products by multiple category IDs (AND logic)
-- Usage: SELECT * FROM get_products_by_categories(ARRAY[21, 57, 71])
-- Returns products that have ALL specified category IDs
CREATE OR REPLACE FUNCTION get_products_by_categories(category_ids INT[])
RETURNS TABLE (style_id INT) AS $$
BEGIN
    RETURN QUERY
    SELECT pc.style_id
    FROM product_categories pc
    WHERE pc.category_id = ANY(category_ids)
    GROUP BY pc.style_id
    HAVING COUNT(DISTINCT pc.category_id) = array_length(category_ids, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get category IDs for a product
CREATE OR REPLACE FUNCTION get_product_category_ids(p_style_id INT)
RETURNS INT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT category_id
        FROM product_categories
        WHERE style_id = p_style_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE categories IS 'SS Activewear categories classified by type (main, subcategory, attribute, guide)';
COMMENT ON TABLE attribute_groups IS 'Filter groups for the catalog sidebar (sleeve, material, weight, etc.)';
COMMENT ON TABLE product_categories IS 'Junction table linking products to categories for fast filtering';
COMMENT ON COLUMN categories.type IS 'main=top nav, subcategory=product types, attribute=filter options, guide=marketing collections';
COMMENT ON COLUMN categories.attribute_group IS 'For attributes: which filter group this belongs to (sleeve, material, etc.)';
COMMENT ON FUNCTION get_products_by_categories IS 'Returns products matching ALL specified category IDs';
