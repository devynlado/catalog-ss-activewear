-- ============================================
-- LOCK profiles.role AGAINST SELF-ESCALATION
-- ============================================
-- The "Users can update own profile" RLS policy (migration 005) lets a user
-- update their own row, but RLS is row-level — it can't stop them from also
-- flipping their own `role` to 'admin'/'sales_rep' via a direct anon-key call.
-- The policy comment claimed "but not role" without enforcing it.
--
-- Postgres can't express column-level write rules in a policy, so we enforce
-- column immutability with a BEFORE UPDATE trigger instead. `role` may only
-- change from a privileged session or by an admin.
--
-- We key off `current_user` (NOT the `role` GUC): PostgREST runs public API
-- requests as `anon` / `authenticated`, while the SQL editor runs as `postgres`
-- and the service key runs as `service_role`. So we restrict ONLY the two
-- public request roles and let every privileged role through — this is what the
-- earlier `current_setting('role')` check got wrong (that GUC is 'none' in the
-- SQL editor, which blocked legitimate promotions).

CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- No change → nothing to guard (covers normal profile edits: name, phone,
  -- calendly_url, notification_preferences, etc. that re-send the same role).
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  -- Privileged sessions (SQL editor = postgres, API service key = service_role,
  -- migrations, internal roles) may change it freely.
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  -- Within an authenticated API request, admins may still manage roles.
  IF public.get_user_role() = 'admin' THEN
    RETURN NEW;
  END IF;

  -- A normal (non-admin) user trying to change their (or another) role: reject.
  RAISE EXCEPTION 'Changing profiles.role is not allowed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_change();
