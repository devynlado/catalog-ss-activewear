-- ============================================
-- LIVE CHAT ARCHIVE (LiveChat.com → Supabase)
-- Phase 2 #1: archive public live-chat conversations + transcripts so leads
-- live in our own DB (not only in the third-party LiveChat dashboard).
--
-- Populated by the webhook endpoint at /api/livechat/webhook. This is SEPARATE
-- from the Supabase-backed "customer chat" (order_chat_messages) which only
-- serves authenticated /orders pages.
-- ============================================

-- One row per LiveChat chat (keyed by LiveChat's chat_id for idempotent upsert).
CREATE TABLE IF NOT EXISTS live_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  thread_id TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_question TEXT,       -- from the pre-chat form, when provided
  source_url TEXT,              -- page the visitor was on
  referrer TEXT,                -- where they came from (attribution)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  message_count INT DEFAULT 0,
  notified_at TIMESTAMPTZ,      -- when sales was emailed about this chat
  raw JSONB,                    -- full webhook payload (nothing is lost)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotency: upsert conversations by LiveChat chat_id.
CREATE UNIQUE INDEX IF NOT EXISTS idx_live_chat_conversations_chat_id
  ON live_chat_conversations(chat_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_conversations_status
  ON live_chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_live_chat_conversations_created_at
  ON live_chat_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_chat_conversations_email
  ON live_chat_conversations(customer_email);

-- Individual messages/events within a chat.
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  event_id TEXT,                -- LiveChat event id (for dedupe)
  author_type TEXT CHECK (author_type IN ('customer', 'agent', 'system', 'unknown')),
  author_id TEXT,
  text TEXT,
  event_type TEXT,              -- message | filled_form | system_message | ...
  sent_at TIMESTAMPTZ,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dedupe repeated webhook deliveries of the same event.
CREATE UNIQUE INDEX IF NOT EXISTS idx_live_chat_messages_event_id
  ON live_chat_messages(event_id)
  WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_chat_id
  ON live_chat_messages(chat_id, sent_at);

-- Auto-update updated_at on conversations.
DROP TRIGGER IF EXISTS update_live_chat_conversations_updated_at ON live_chat_conversations;
CREATE TRIGGER update_live_chat_conversations_updated_at
    BEFORE UPDATE ON live_chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE live_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Staff (admin / sales_rep) can read archived live chats.
CREATE POLICY "Staff view live chat conversations"
  ON live_chat_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'sales_rep')
    )
  );

CREATE POLICY "Staff view live chat messages"
  ON live_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'sales_rep')
    )
  );

-- Service role (webhook API route) has full access.
CREATE POLICY "Service role full access to live chat conversations"
  ON live_chat_conversations FOR ALL
  USING (true);

CREATE POLICY "Service role full access to live chat messages"
  ON live_chat_messages FOR ALL
  USING (true);
