-- ============================================
-- ORDER STATUS WORKFLOW OVERHAUL
-- Adds awaiting_purchasing and ordered statuses.
-- Migrates existing confirmed orders to awaiting_purchasing.
-- Adds ordered_at timestamp.
-- ============================================

-- 1. Drop and re-create the status CHECK constraint with new values
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN (
      'pending', 'confirmed', 'awaiting_purchasing', 'ordered',
      'in_production', 'shipped', 'delivered', 'cancelled'
    )
  );

-- 2. Add ordered_at timestamp
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMPTZ;

-- 3. Migrate existing confirmed orders to awaiting_purchasing
UPDATE orders
  SET status = 'awaiting_purchasing'
  WHERE status = 'confirmed';

-- 4. Update order_activities constraint to include new activity types
ALTER TABLE order_activities
  DROP CONSTRAINT IF EXISTS order_activities_activity_type_check;

ALTER TABLE order_activities
  ADD CONSTRAINT order_activities_activity_type_check CHECK (
    activity_type IN (
      'created', 'payment_processing', 'payment_received', 'payment_failed',
      'confirmed', 'awaiting_purchasing', 'ordered', 'status_change',
      'shipped', 'delivered', 'refunded', 'note', 'cancelled', 'email_sent'
    )
  );
