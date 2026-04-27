-- Migration: Product Admin Overrides (admin_note + min_order_quantity)
-- Adds two admin-editable fields on top of the SS Activewear product cache,
-- plus an audit log of every admin edit.
--
-- Notes on safety:
--   * All new columns are nullable and additive. Existing reads are unaffected.
--   * lib/product-sync.ts builds its upsert payloads explicitly and does NOT
--     include any of these new columns, so syncs will not overwrite admin
--     edits. (Verified at lines 457-485, 539-555, 970-999, 1052-1068.)
--   * Adding a nullable INT column to product_skus (~2M rows) is metadata-only
--     in Postgres and runs in milliseconds.

-- ============================================
-- STYLE-LEVEL OVERRIDES
-- admin_note            : customer-visible note rendered above the fold on
--                         the product page. Plain text. NULL = no note.
-- min_order_quantity    : default minimum order quantity for any variant of
--                         this style that does NOT have its own override.
-- ============================================
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS admin_note         TEXT,
    ADD COLUMN IF NOT EXISTS min_order_quantity INT
        CHECK (min_order_quantity IS NULL OR min_order_quantity >= 1);

COMMENT ON COLUMN products.admin_note IS
    'Customer-visible note rendered above the fold on this product''s public page only. Plain text. NULL = no note.';

COMMENT ON COLUMN products.min_order_quantity IS
    'Default minimum order quantity for variants of this style that have no per-SKU override. NULL = no minimum. Per-SKU values in product_skus.min_order_quantity take precedence. Validation is always per-variant; this acts as inheritance, not as a sum-across-cart rule.';

-- ============================================
-- VARIANT-LEVEL OVERRIDE
-- min_order_quantity    : per-SKU minimum order quantity. Takes precedence
--                         over the style-level default. NULL = inherit.
-- ============================================
ALTER TABLE product_skus
    ADD COLUMN IF NOT EXISTS min_order_quantity INT
        CHECK (min_order_quantity IS NULL OR min_order_quantity >= 1);

COMMENT ON COLUMN product_skus.min_order_quantity IS
    'Per-variant minimum order quantity for this specific SKU. Takes precedence over products.min_order_quantity. NULL = inherit the style default.';

-- ============================================
-- AUDIT LOG
-- Append-only record of every admin edit to a product or one of its SKUs.
-- field IN ('admin_note', 'min_order_quantity').
-- sku IS NULL for style-level edits, populated for per-SKU edits.
-- ============================================
CREATE TABLE IF NOT EXISTS product_admin_edits (
    id          BIGSERIAL PRIMARY KEY,
    style_id    INT  NOT NULL REFERENCES products(style_id)    ON DELETE CASCADE,
    sku         TEXT          REFERENCES product_skus(sku)     ON DELETE CASCADE,
    field       TEXT NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    edited_by   UUID          REFERENCES auth.users(id)        ON DELETE SET NULL,
    edited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_admin_edits_style
    ON product_admin_edits(style_id, edited_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_admin_edits_recent
    ON product_admin_edits(edited_at DESC);

-- ============================================
-- RLS — service role only (writes happen via API routes that hold the
-- service role key after admin auth check, matching the pattern used by
-- product_admin_edits' sibling tables).
-- ============================================
ALTER TABLE product_admin_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON product_admin_edits FOR ALL USING (true);
