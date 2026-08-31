-- =============================================================
-- SS Activewear Order Idempotency & Duplicate Prevention
-- =============================================================
-- Root cause this migration addresses:
--   The retry cron re-sent orders that had ACTUALLY succeeded at S&S but
--   were recorded as "failed" on our side (POST timeout / lost response /
--   error after S&S committed). Combined with a non-atomic read-then-POST
--   idempotency check and no DB-level guard, this produced true duplicate
--   orders at S&S (e.g. ORD-260813-E0MS, ORD-260816-4564).
--
-- This migration is purely ADDITIVE (safe to deploy before the code that
-- uses it): it adds a per-order placement state machine used as an atomic
-- mutex, plus unique safety nets on the S&S identifiers.
-- =============================================================

-- 1. Placement state machine on orders (atomic mutex for placeSSOrder)
--      none    = never attempted
--      placing = an attempt currently holds the claim (in-flight)
--      placed  = at least one SS order confirmed for this order
--      unknown = attempt outcome is undetermined (timeout / 5xx / network /
--                post-commit error) — MUST be verified against S&S before
--                any re-send, otherwise we risk a duplicate order
--      failed  = definitive, safe-to-retry failure (all lines rejected,
--                no S&S items, bad address, kill switch, etc.)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ss_order_placement_state TEXT NOT NULL DEFAULT 'none';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ss_order_placement_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_ss_order_placement_state_check
    CHECK (ss_order_placement_state IN ('none', 'placing', 'placed', 'unknown', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Backfill placement state from existing data.
--    placed: any order that already has a row in ss_orders.
UPDATE orders o
SET ss_order_placement_state = 'placed'
WHERE o.ss_order_placement_state = 'none'
  AND EXISTS (SELECT 1 FROM ss_orders s WHERE s.order_id = o.id);

--    failed: flagged as failed and has no ss_orders row. These are treated as
--    "unknown" going forward (verify-before-resend) but we seed them as
--    'failed' so the retry path re-examines them exactly once via S&S lookup.
UPDATE orders o
SET ss_order_placement_state = 'unknown'
WHERE o.ss_order_placement_state = 'none'
  AND o.ss_auto_order_failed = TRUE
  AND NOT EXISTS (SELECT 1 FROM ss_orders s WHERE s.order_id = o.id);

CREATE INDEX IF NOT EXISTS idx_orders_ss_placement_state
  ON orders(ss_order_placement_state);

-- 3. Unique safety nets on ss_orders.
--    S&S guid / order number are globally unique, so these prevent inserting
--    the SAME S&S order twice (e.g. during reconciliation via ON CONFLICT).
--    They intentionally DO NOT constrain order_id — a single order may legitimately
--    map to multiple S&S orders when S&S splits it across warehouses.
--    NOTE: If the table already contains duplicate guids/order numbers (it should
--    not), these index creations will fail loudly so the duplicates can be cleaned
--    up first. That is intended.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ss_orders_ss_guid
  ON ss_orders(ss_guid);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ss_orders_ss_order_number
  ON ss_orders(ss_order_number);

-- 4. Idempotency ledger for processed Stripe webhook events. Lets the webhook
--    handler skip events Stripe re-delivers (payment_intent.succeeded can arrive
--    more than once), closing the "two webhooks racing placeSSOrder" window.
CREATE TABLE IF NOT EXISTS processed_stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
