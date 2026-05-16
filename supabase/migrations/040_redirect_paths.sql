-- ============================================
-- GENERALIZE SLUG REDIRECTS TO ANY URL
--
-- Migration 039 created the redirect system for /product/<slug> only.
-- The "from" side was stored as a bare slug because the runtime hook
-- lived inside app/product/[slug]/page.tsx and stripped /product/ before
-- looking up the row.
--
-- This migration moves the runtime hook to app/not-found.tsx so it
-- catches 404s for ANY URL (services, blog posts, project pages,
-- landing pages, etc.) and updates the storage layer to match:
--
--   slug_redirects.from_slug          → slug_redirects.from_path
--   slug_redirect_history.from_slug   → slug_redirect_history.from_path
--   not_found_slugs.slug              → not_found_slugs.path
--
-- All existing rows are product redirects today, so backfill is a
-- mechanical `/product/` prefix on the renamed column. The migration is
-- fully idempotent: every step is guarded so re-running after a partial
-- apply is safe.
--
-- ⚠ slug_redirect_history has an append-only BEFORE UPDATE trigger that
--   blocks any session other than postgres/service_role. We disable it
--   around the one-shot backfill UPDATE and re-enable immediately after.
--   This is the standard PostgreSQL idiom for backfilling an audit
--   table that the application is never allowed to touch.
-- ============================================

-- ============================================
-- 1) slug_redirects: rename + backfill + reshape constraint.
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slug_redirects' AND column_name = 'from_slug'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slug_redirects' AND column_name = 'from_path'
  ) THEN
    ALTER TABLE slug_redirects RENAME COLUMN from_slug TO from_path;
  END IF;
END $$;

-- Backfill: every existing row was a /product/<slug> redirect. The LIKE
-- guard makes this safely re-runnable — already-migrated values are
-- skipped.
UPDATE slug_redirects
   SET from_path = '/product/' || from_path
 WHERE from_path NOT LIKE '/%';

-- Swap the partial index name so it stays honest. The underlying
-- column reference moves with the rename automatically.
DROP INDEX IF EXISTS idx_slug_redirects_from_slug_active;
CREATE INDEX IF NOT EXISTS idx_slug_redirects_from_path_active
  ON slug_redirects(from_path) WHERE is_active = true;

-- Tighten the CHECK to require a leading slash. The previous schema
-- only enforced target-shape; now we also defend the from-path shape
-- at the DB layer so a buggy client can never insert a bare slug.
ALTER TABLE slug_redirects
  DROP CONSTRAINT IF EXISTS slug_redirects_from_path_shape_check;
ALTER TABLE slug_redirects
  ADD CONSTRAINT slug_redirects_from_path_shape_check
  CHECK (from_path LIKE '/%' AND length(from_path) BETWEEN 2 AND 500);

-- ============================================
-- 2) slug_redirect_history: same rename + backfill.
-- ============================================
--
-- The table is guarded by a BEFORE UPDATE OR DELETE trigger that throws
-- 'slug_redirect_history is append-only' for non-elevated roles. We
-- disable the trigger for the duration of this transaction, do the
-- backfill, then immediately re-enable it. Existing rows hold either
-- bare legacy slugs (which we prefix) or the empty-string sentinel used
-- by the auto-promote system event (which stays as '').

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slug_redirect_history' AND column_name = 'from_slug'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slug_redirect_history' AND column_name = 'from_path'
  ) THEN
    ALTER TABLE slug_redirect_history RENAME COLUMN from_slug TO from_path;
  END IF;
END $$;

ALTER TABLE slug_redirect_history DISABLE TRIGGER trg_slug_redirect_history_no_update;

UPDATE slug_redirect_history
   SET from_path = '/product/' || from_path
 WHERE from_path <> '' AND from_path NOT LIKE '/%';

ALTER TABLE slug_redirect_history ENABLE TRIGGER trg_slug_redirect_history_no_update;

-- ============================================
-- 3) not_found_slugs: rename slug → path + backfill.
-- ============================================
--
-- The renamed column is the PRIMARY KEY. Postgres carries the PK
-- through a rename automatically; we just need to backfill the values.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'not_found_slugs' AND column_name = 'slug'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'not_found_slugs' AND column_name = 'path'
  ) THEN
    ALTER TABLE not_found_slugs RENAME COLUMN slug TO path;
  END IF;
END $$;

UPDATE not_found_slugs
   SET path = '/product/' || path
 WHERE path NOT LIKE '/%';

-- ============================================
-- 4) Refresh comments so future readers see the new scope.
-- ============================================

COMMENT ON TABLE slug_redirects IS
  'Maps legacy URLs (any path on the site) to current products, catalog/category pages, external URLs, or hard 404s. Drives the runtime redirect layer in app/not-found.tsx, which fires whenever Next.js is about to render a 404.';
COMMENT ON COLUMN slug_redirects.from_path IS
  'Full site-relative path to redirect FROM, e.g. /product/heavyweight-tee, /services/screen-printing-near-me. Normalized: leading /, lowercase, no trailing slash, no query string.';
COMMENT ON TABLE not_found_slugs IS
  'Every 404 caught by app/not-found.tsx is upserted here. Admin queue ignores bot/scanner traffic and resolved entries.';
COMMENT ON COLUMN not_found_slugs.path IS
  'Full site-relative path that 404''d, e.g. /product/heavyweight-tee or /services/old-name. Normalized to match slug_redirects.from_path so resolution can join cleanly.';
