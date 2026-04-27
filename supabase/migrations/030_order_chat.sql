-- ============================================
-- ORDER CHAT — Simple messaging between
-- customers (via order session) and admins
-- ============================================

CREATE TABLE IF NOT EXISTS order_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Sender identification
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  sender_email TEXT NOT NULL,
  sender_name TEXT,

  -- For admin senders, link to profile
  admin_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Message content
  content TEXT NOT NULL,
  attachment_url TEXT,
  attachment_type TEXT CHECK (attachment_type IN ('image', NULL)),

  -- Read tracking
  read_at TIMESTAMPTZ,

  -- Auto-reply flag
  is_auto_reply BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_chat_order_id ON order_chat_messages(order_id);
CREATE INDEX idx_order_chat_created_at ON order_chat_messages(created_at DESC);
CREATE INDEX idx_order_chat_sender_type ON order_chat_messages(sender_type);
CREATE INDEX idx_order_chat_unread ON order_chat_messages(order_id, sender_type) WHERE read_at IS NULL;

-- RLS: Disabled since we use service role key for all operations
-- (Customer auth is cookie-based, not Supabase Auth)
ALTER TABLE order_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to order_chat_messages"
  ON order_chat_messages FOR ALL
  USING (true)
  WITH CHECK (true);
