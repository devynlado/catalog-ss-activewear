-- ============================================
-- MESSAGES TABLE
-- Supports quote-related conversations between
-- customers, sales reps, and admins
-- ============================================

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Message content
  content TEXT NOT NULL,
  
  -- Sender (required)
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Recipient (required)
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Optional: Link to a specific quote
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  
  -- Read status
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_quote ON messages(quote_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Composite index for conversation lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(
  LEAST(sender_id, recipient_id),
  GREATEST(sender_id, recipient_id),
  created_at DESC
);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
  );

-- Users can insert messages they send
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can update messages they received (to mark as read)
CREATE POLICY "Recipients can mark messages read"
  ON messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Admins have full access
CREATE POLICY "Admins full access to messages"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- QUOTE NOTES/ACTIVITY LOG
-- Internal notes and status changes on quotes
-- ============================================

CREATE TABLE IF NOT EXISTS quote_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to quote
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  
  -- Who made the activity
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Activity type
  activity_type TEXT NOT NULL CHECK (
    activity_type IN ('status_change', 'note', 'assignment', 'email_sent', 'call_logged')
  ),
  
  -- Activity details (JSON for flexibility)
  -- For status_change: { from: 'new', to: 'contacted' }
  -- For note: { content: 'Customer prefers blue...' }
  -- For assignment: { from_rep_id: null, to_rep_id: 'uuid' }
  details JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quote_activities_quote ON quote_activities(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_activities_user ON quote_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_activities_type ON quote_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_quote_activities_created ON quote_activities(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY FOR ACTIVITIES
-- ============================================

ALTER TABLE quote_activities ENABLE ROW LEVEL SECURITY;

-- Sales reps and admins can view activities
CREATE POLICY "Staff can view quote activities"
  ON quote_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales_rep')
    )
  );

-- Sales reps and admins can create activities
CREATE POLICY "Staff can create quote activities"
  ON quote_activities FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales_rep')
    )
  );

-- Admins can delete activities
CREATE POLICY "Admins can delete quote activities"
  ON quote_activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
