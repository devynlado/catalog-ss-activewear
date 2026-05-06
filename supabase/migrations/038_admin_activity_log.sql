-- ============================================
-- ADMIN ACTIVITY LOG
-- WordPress-style audit trail for every admin/sales_rep action.
-- Append-only by design: nobody (not even admins) can UPDATE or DELETE rows
-- via the API. Cleanup happens server-side via the archive function below.
-- ============================================

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor snapshot. We snapshot name/role so a deleted profile or a later
  -- role change does not rewrite history.
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name TEXT,
  actor_role TEXT CHECK (actor_role IN ('admin', 'sales_rep') OR actor_role IS NULL),

  -- What happened.
  -- action: stable machine key like 'order.status_changed', 'coupon.deleted'.
  -- summary: human-readable, generic, no customer/lead PII.
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  summary TEXT NOT NULL,

  -- Forensics for "is this account suspicious?" detection.
  ip_address TEXT,
  user_agent TEXT,

  -- Burst detection flag set by lib/admin-audit.ts when an actor performs
  -- many actions in a short window.
  is_alert BOOLEAN NOT NULL DEFAULT FALSE,
  alert_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at
  ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_actor_id
  ON admin_activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action
  ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_resource
  ON admin_activity_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_alerts
  ON admin_activity_log(created_at DESC) WHERE is_alert = TRUE;

-- ============================================
-- ARCHIVE TABLE
-- Cold storage for entries older than the retention window. Same shape
-- as the live table plus an archived_at marker.
-- ============================================

CREATE TABLE IF NOT EXISTS admin_activity_log_archive (
  id UUID PRIMARY KEY,
  actor_id UUID,
  actor_name TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  summary TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  is_alert BOOLEAN NOT NULL DEFAULT FALSE,
  alert_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_archive_created_at
  ON admin_activity_log_archive(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_archive_actor_id
  ON admin_activity_log_archive(actor_id);

-- ============================================
-- ROW LEVEL SECURITY
-- Append-only enforcement: no INSERT/UPDATE/DELETE policies for end users.
-- Only the service role (which bypasses RLS) can write. Admins/sales_reps
-- can read but cannot tamper with history.
-- ============================================

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read admin activity log" ON admin_activity_log;
CREATE POLICY "Staff read admin activity log"
  ON admin_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'sales_rep')
    )
  );

DROP POLICY IF EXISTS "Staff read admin activity log archive" ON admin_activity_log_archive;
CREATE POLICY "Staff read admin activity log archive"
  ON admin_activity_log_archive FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'sales_rep')
    )
  );

-- Defense-in-depth: even if a policy is mistakenly added later, this trigger
-- prevents UPDATE on the live table for any non-superuser session. Service
-- role / postgres can still bypass via session_user check.
CREATE OR REPLACE FUNCTION prevent_admin_activity_log_update()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role', true) NOT IN ('postgres', 'service_role') THEN
    RAISE EXCEPTION 'admin_activity_log is append-only';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_activity_log_no_update ON admin_activity_log;
CREATE TRIGGER trg_admin_activity_log_no_update
  BEFORE UPDATE ON admin_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_activity_log_update();

-- ============================================
-- ARCHIVE FUNCTION (180-day retention)
-- Moves rows older than 180 days into the archive table. Run via pg_cron
-- below, or manually via: SELECT public.archive_old_admin_activity_log();
-- ============================================

CREATE OR REPLACE FUNCTION archive_old_admin_activity_log()
RETURNS INTEGER AS $$
DECLARE
  moved_count INTEGER := 0;
BEGIN
  WITH moved AS (
    DELETE FROM admin_activity_log
    WHERE created_at < NOW() - INTERVAL '180 days'
    RETURNING *
  )
  INSERT INTO admin_activity_log_archive (
    id, actor_id, actor_name, actor_role,
    action, resource_type, resource_id, summary,
    ip_address, user_agent, is_alert, alert_reason, created_at
  )
  SELECT
    id, actor_id, actor_name, actor_role,
    action, resource_type, resource_id, summary,
    ip_address, user_agent, is_alert, alert_reason, created_at
  FROM moved;

  GET DIAGNOSTICS moved_count = ROW_COUNT;
  RETURN moved_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION archive_old_admin_activity_log() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION archive_old_admin_activity_log() TO service_role;

-- ============================================
-- AUTOMATED RETENTION via pg_cron (optional)
-- Schedules the archive function to run daily at 03:00 UTC. If pg_cron
-- is not enabled on this Supabase project, this block silently no-ops
-- and the archive function can be invoked manually or from an Edge
-- Function on a cron schedule.
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('archive_admin_activity_log_daily')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'archive_admin_activity_log_daily'
    );

    PERFORM cron.schedule(
      'archive_admin_activity_log_daily',
      '0 3 * * *',
      $cron$ SELECT public.archive_old_admin_activity_log(); $cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron scheduling skipped: %', SQLERRM;
END $$;
