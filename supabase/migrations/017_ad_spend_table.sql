-- ============================================
-- AD SPEND ENTRIES TABLE
-- Manual (and eventually automated) ad spend tracking
-- ============================================

CREATE TABLE IF NOT EXISTS ad_spend_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  platform TEXT NOT NULL DEFAULT 'google_ads',
  spend DECIMAL(10,2) NOT NULL,
  impressions INT,
  clicks INT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, platform)
);

-- RLS
ALTER TABLE ad_spend_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to ad_spend_entries"
  ON ad_spend_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access to ad_spend_entries"
  ON ad_spend_entries FOR ALL
  USING (true);

CREATE INDEX IF NOT EXISTS idx_ad_spend_date ON ad_spend_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_spend_platform_date ON ad_spend_entries(platform, date DESC);
