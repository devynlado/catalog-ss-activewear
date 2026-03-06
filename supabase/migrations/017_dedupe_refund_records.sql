-- ============================================
-- Remove duplicate refund records
-- The same refund was previously recorded twice: once by the admin API
-- and once by the Stripe charge.refunded webhook. This removes the
-- duplicate (keeps the earlier row, deletes the later one) when both
-- have the same order_id, same amount, and were created within 5 minutes.
-- ============================================

-- 1) Duplicate refund payments (type='refund', same order_id and amount, created within 5 min)
--    Keeps the earliest row per (order_id, amount), deletes the rest when they're within 5 min.
DELETE FROM payments
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY order_id, amount ORDER BY created_at ASC) AS rn,
           COUNT(*) OVER (PARTITION BY order_id, amount) AS cnt,
           MAX(created_at) OVER (PARTITION BY order_id, amount) - MIN(created_at) OVER (PARTITION BY order_id, amount) AS gap
    FROM payments
    WHERE type = 'refund' AND status = 'succeeded'
  ) sub
  WHERE sub.cnt >= 2 AND sub.gap <= INTERVAL '5 minutes' AND sub.rn >= 2
);

-- 2) Duplicate refunded activities (activity_type='refunded', same order_id and details.amount, within 5 min)
--    Keeps the earliest row per (order_id, amount), deletes the rest when they're within 5 min.
DELETE FROM order_activities
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY order_id, COALESCE((details->>'amount')::numeric, 0)
             ORDER BY created_at ASC
           ) AS rn,
           COUNT(*) OVER (
             PARTITION BY order_id, COALESCE((details->>'amount')::numeric, 0)
           ) AS cnt,
           MAX(created_at) OVER (
             PARTITION BY order_id, COALESCE((details->>'amount')::numeric, 0)
           ) - MIN(created_at) OVER (
             PARTITION BY order_id, COALESCE((details->>'amount')::numeric, 0)
           ) AS gap
    FROM order_activities
    WHERE activity_type = 'refunded'
  ) sub
  WHERE sub.cnt >= 2 AND sub.gap <= INTERVAL '5 minutes' AND sub.rn >= 2
);
