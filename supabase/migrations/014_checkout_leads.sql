-- ============================================
-- CHECKOUT LEADS TABLE
-- Captures email + phone from checkout form for sales follow-up.
-- Upserted by email so repeat visits update cart data, not create duplicates.
-- ============================================

CREATE TABLE IF NOT EXISTS checkout_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  customer_name TEXT,
  company TEXT,
  cart_items JSONB,
  cart_total DECIMAL(10,2),
  item_count INT,
  source_url TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'ignored')),
  converted_order_id UUID REFERENCES orders(id),
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index on email for upsert behavior
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_leads_email ON checkout_leads(email);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_checkout_leads_status ON checkout_leads(status);
CREATE INDEX IF NOT EXISTS idx_checkout_leads_created_at ON checkout_leads(created_at DESC);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_checkout_leads_updated_at ON checkout_leads;
CREATE TRIGGER update_checkout_leads_updated_at
    BEFORE UPDATE ON checkout_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE checkout_leads ENABLE ROW LEVEL SECURITY;

-- Staff can view all leads
CREATE POLICY "Staff view checkout leads"
  ON checkout_leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales_rep')
    )
  );

-- Service role has full access (for API routes)
CREATE POLICY "Service role full access to checkout leads"
  ON checkout_leads FOR ALL
  USING (true);
