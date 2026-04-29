-- Migration: Manual product hide (admin-controlled)
--
-- Adds an admin-toggled "manually_hidden" flag, fully decoupled from the
-- existing `is_active` column. `is_active` continues to mean "we believe SS
-- Activewear still carries this style" — owned by the sync pipeline (see
-- lib/product-sync.ts: syncFullCatalog upserts is_active=true; the discontinued
-- detector flips it to false after a 48h grace window).
--
-- `manually_hidden` is owned by the admin UI (/admin/products/[styleId]) and
-- is NEVER touched by the sync pipeline. This separation lets an admin hide a
-- product based on out-of-band information from a supplier (e.g. "we're no
-- longer carrying this, but it's still on our website") without the next sync
-- silently un-hiding it.
--
-- Customer-visible queries should require BOTH `is_active = true` AND
-- `manually_hidden = false`. Admin queries continue to surface everything.
--
-- Safety:
--   * All new columns have non-breaking defaults; existing reads are unaffected.
--   * Adding a NOT NULL boolean with DEFAULT to ~5k rows is a metadata-only
--     change in modern Postgres and runs in milliseconds.

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS manually_hidden          BOOLEAN     NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS manually_hidden_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS manually_hidden_by       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS manually_hidden_reason   TEXT;

COMMENT ON COLUMN products.manually_hidden IS
    'Admin-toggled visibility flag. true = remove from customer catalog/feed/sitemap; product page renders an "unavailable" state instead. Independent of is_active (which tracks SS catalog presence). Owned by /admin/products UI; sync MUST NOT include this column in upsert payloads.';

COMMENT ON COLUMN products.manually_hidden_at IS
    'Timestamp the product was last hidden by an admin. NULL when manually_hidden = false.';

COMMENT ON COLUMN products.manually_hidden_by IS
    'Admin user who flipped manually_hidden to true. NULL when manually_hidden = false or when the user has been deleted.';

COMMENT ON COLUMN products.manually_hidden_reason IS
    'Optional free-text reason captured at hide time (e.g. "supplier told us via email this is dead"). Surfaced on the admin edit page only. NULL when manually_hidden = false.';

-- Partial index — the population of hidden products is small relative to the
-- catalog, and several queries need to inspect / filter them quickly.
CREATE INDEX IF NOT EXISTS idx_products_manually_hidden
    ON products(manually_hidden)
    WHERE manually_hidden = true;

-- Note: audit rows for hide/unhide reuse the existing product_admin_edits
-- table introduced in migration 036 with field = 'manually_hidden'. No new
-- audit table is required.
