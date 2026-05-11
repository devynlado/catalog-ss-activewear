-- ============================================
-- SLUG REDIRECTS
-- Recovers traffic to legacy URLs (e.g. old WordPress / Meta Catalog slugs)
-- that no longer match a product in the current catalog.
--
-- Three target types are supported:
--   product  -> 301/302 to a specific product page (by style_id)
--   category -> 301/302 to a catalog URL (e.g. /catalog?category=t-shirts)
--   gone     -> hard miss (page renders notFound() with noindex)
--
-- Lifecycle: new redirects start as 302 (temporary) for an auto-promotion
-- window (default 14 days). When `promote_to_301_at <= now()` and
-- `status_code = 302`, lib/slug-redirects.ts lazily promotes to 301 on
-- read. Avoids needing a cron job and only promotes redirects actually
-- in use.
-- ============================================

DO $$ BEGIN
  CREATE TYPE slug_redirect_target_type AS ENUM ('product', 'category', 'gone');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS slug_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source slug we redirect FROM, e.g. 'womens-fine-jersey-tee-2'.
  -- Stored normalized: lowercase, trimmed, no surrounding slashes.
  from_slug TEXT NOT NULL UNIQUE,

  target_type slug_redirect_target_type NOT NULL,

  -- Target identifiers — exactly one of these is required per target_type:
  --   product  -> to_product_id (FK to products.style_id)
  --   category -> to_url (string, e.g. '/catalog?category=t-shirts')
  --   gone     -> neither (page just 404s with noindex)
  to_product_id INTEGER REFERENCES products(style_id) ON DELETE SET NULL,
  to_url TEXT,

  -- HTTP status code served on redirect. 302 = temporary, 301 = permanent.
  -- New redirects default to 302 and auto-promote to 301 after the window.
  status_code INTEGER NOT NULL DEFAULT 302 CHECK (status_code IN (301, 302, 307)),

  -- Timestamp at which a 302 becomes eligible for promotion to 301.
  -- NULL means the admin opted out of auto-promotion (stays 302 forever).
  promote_to_301_at TIMESTAMPTZ,

  -- Soft toggle. Inactive rows are ignored at lookup time, allowing
  -- one-click rollback without losing the mapping or its history.
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Free-text admin note (e.g. "old WP slug from Meta Catalog").
  notes TEXT,

  -- Hit counter + last-hit timestamp so admins can see usage at a glance.
  hits INTEGER NOT NULL DEFAULT 0,
  last_hit_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enforce target-shape integrity at the DB layer. The API enforces this
-- too, but the constraint stops accidental bad rows if anyone bypasses it.
ALTER TABLE slug_redirects
  DROP CONSTRAINT IF EXISTS slug_redirects_target_shape_check;
ALTER TABLE slug_redirects
  ADD CONSTRAINT slug_redirects_target_shape_check
  CHECK (
    (target_type = 'product'  AND to_product_id IS NOT NULL AND to_url IS NULL) OR
    (target_type = 'category' AND to_url IS NOT NULL AND to_product_id IS NULL) OR
    (target_type = 'gone'     AND to_product_id IS NULL AND to_url IS NULL)
  );

CREATE INDEX IF NOT EXISTS idx_slug_redirects_from_slug_active
  ON slug_redirects(from_slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_slug_redirects_target_type
  ON slug_redirects(target_type);
CREATE INDEX IF NOT EXISTS idx_slug_redirects_promote
  ON slug_redirects(promote_to_301_at)
  WHERE status_code = 302 AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_slug_redirects_to_product
  ON slug_redirects(to_product_id) WHERE to_product_id IS NOT NULL;

COMMENT ON TABLE slug_redirects IS
  'Maps legacy /product/<slug> URLs to current products, catalog categories, or hard 404s. Drives the runtime redirect layer in app/product/[slug]/page.tsx.';
COMMENT ON COLUMN slug_redirects.status_code IS
  'Initial 302 (safe to fix), auto-promoted to 301 (SEO-permanent) after promote_to_301_at.';
COMMENT ON COLUMN slug_redirects.is_active IS
  'Soft toggle for one-click rollback. Inactive rows are ignored at lookup but kept for history.';

-- ============================================
-- SLUG REDIRECT HISTORY (append-only)
-- Every create/update/activate/deactivate/promote/delete writes one row.
-- Used for "who changed what" and as the source for revert actions.
-- ============================================

CREATE TABLE IF NOT EXISTS slug_redirect_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  redirect_id UUID NOT NULL,                   -- not a hard FK so we survive deletion
  from_slug TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'created', 'updated', 'activated', 'deactivated',
    'promoted', 'deleted', 'imported'
  )),
  -- Snapshot of the row state at the time of the change (post-change for
  -- create/update/activate/deactivate/promote/import; pre-change for delete).
  snapshot JSONB NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_slug_redirect_history_redirect_id
  ON slug_redirect_history(redirect_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_slug_redirect_history_changed_at
  ON slug_redirect_history(changed_at DESC);

COMMENT ON TABLE slug_redirect_history IS
  'Append-only audit log for every change to slug_redirects. Powers the History tab in /admin/redirects.';

-- ============================================
-- NOT FOUND SLUGS
-- Queue of /product/<slug> URLs that fell through to notFound(). Drives
-- the "Unresolved Slugs" admin queue. Bot/scanner traffic is logged but
-- not surfaced (is_bot = true), to keep the queue actionable.
-- ============================================

CREATE TABLE IF NOT EXISTS not_found_slugs (
  slug TEXT PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 1,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_referrer TEXT,
  last_user_agent TEXT,
  -- Set when an admin creates a redirect or explicitly marks the slug as junk.
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_type TEXT CHECK (resolution_type IN ('redirect', 'ignored') OR resolution_type IS NULL),
  resolution_redirect_id UUID REFERENCES slug_redirects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_not_found_slugs_unresolved
  ON not_found_slugs(last_seen DESC) WHERE resolved = false AND is_bot = false;
CREATE INDEX IF NOT EXISTS idx_not_found_slugs_hits
  ON not_found_slugs(hits DESC) WHERE resolved = false AND is_bot = false;

COMMENT ON TABLE not_found_slugs IS
  'Every miss against /product/<slug> is upserted here. Admin queue ignores bot traffic and resolved entries.';

-- ============================================
-- updated_at trigger for slug_redirects
-- ============================================

CREATE OR REPLACE FUNCTION update_slug_redirects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_slug_redirects_updated_at ON slug_redirects;
CREATE TRIGGER trg_slug_redirects_updated_at
  BEFORE UPDATE ON slug_redirects
  FOR EACH ROW
  EXECUTE FUNCTION update_slug_redirects_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- All writes happen via the service role (bypasses RLS) from the
-- /api/admin/redirects routes. Public reads are not exposed via RLS;
-- the runtime redirect lookup in app/product/[slug]/page.tsx uses the
-- service-role client too, since it runs server-side.
-- ============================================

ALTER TABLE slug_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE slug_redirect_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE not_found_slugs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read slug_redirects" ON slug_redirects;
CREATE POLICY "Staff read slug_redirects"
  ON slug_redirects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'sales_rep')
    )
  );

DROP POLICY IF EXISTS "Staff read slug_redirect_history" ON slug_redirect_history;
CREATE POLICY "Staff read slug_redirect_history"
  ON slug_redirect_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'sales_rep')
    )
  );

DROP POLICY IF EXISTS "Staff read not_found_slugs" ON not_found_slugs;
CREATE POLICY "Staff read not_found_slugs"
  ON not_found_slugs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'sales_rep')
    )
  );

-- Defense-in-depth: prevent direct UPDATE/DELETE of history rows by any
-- non-service-role session, even if a policy is mistakenly added later.
CREATE OR REPLACE FUNCTION prevent_slug_redirect_history_update()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role', true) NOT IN ('postgres', 'service_role') THEN
    RAISE EXCEPTION 'slug_redirect_history is append-only';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_slug_redirect_history_no_update ON slug_redirect_history;
CREATE TRIGGER trg_slug_redirect_history_no_update
  BEFORE UPDATE OR DELETE ON slug_redirect_history
  FOR EACH ROW
  EXECUTE FUNCTION prevent_slug_redirect_history_update();
