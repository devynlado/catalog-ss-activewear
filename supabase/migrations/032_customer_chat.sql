-- ============================================
-- CUSTOMER-BASED CHAT — Migrate from order-only
-- to customer-based conversations with optional
-- order context
-- ============================================

-- 1. Add customer_email column
ALTER TABLE order_chat_messages ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- 2. Backfill from the orders table
UPDATE order_chat_messages m
SET customer_email = (
  SELECT o.customer_email FROM orders o WHERE o.id = m.order_id
)
WHERE m.customer_email IS NULL AND m.order_id IS NOT NULL;

-- 3. For any rows that still have NULL (orphaned), use sender_email
UPDATE order_chat_messages
SET customer_email = sender_email
WHERE customer_email IS NULL AND sender_type = 'customer';

-- 4. For admin messages that still have NULL, use the order's customer_email
UPDATE order_chat_messages m
SET customer_email = (
  SELECT o.customer_email FROM orders o WHERE o.id = m.order_id
)
WHERE m.customer_email IS NULL;

-- 5. Make order_id nullable (allows general messages not tied to an order)
ALTER TABLE order_chat_messages ALTER COLUMN order_id DROP NOT NULL;

-- 6. Add index on customer_email for fast lookups
CREATE INDEX IF NOT EXISTS idx_order_chat_customer_email ON order_chat_messages(customer_email);

-- 7. Composite index for customer + unread queries
CREATE INDEX IF NOT EXISTS idx_order_chat_customer_unread
  ON order_chat_messages(customer_email, sender_type)
  WHERE read_at IS NULL;
