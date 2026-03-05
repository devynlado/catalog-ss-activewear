-- ============================================
-- Add 'system_error' to order_activities activity_type
-- ============================================

ALTER TABLE order_activities
  DROP CONSTRAINT IF EXISTS order_activities_activity_type_check;

ALTER TABLE order_activities
  ADD CONSTRAINT order_activities_activity_type_check CHECK (
    activity_type IN (
      'created', 'payment_processing', 'payment_received', 'payment_failed',
      'confirmed', 'status_change', 'shipped', 'delivered',
      'refunded', 'note', 'cancelled', 'email_sent', 'system_error'
    )
  );
