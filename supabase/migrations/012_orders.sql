-- ============================================
-- ORDERS TABLE
-- Stores completed purchases (direct checkout or converted quotes)
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  
  -- Customer (optional for guest checkout)
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  company TEXT,
  
  -- Source quote (optional - only for converted quotes)
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  
  -- Order snapshot (locked at time of purchase)
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Addresses
  shipping_address JSONB,
  billing_address JSONB,
  
  -- Payment
  payment_method TEXT CHECK (payment_method IN ('card', 'ach', 'invoice')),
  payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  po_number TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Fulfillment (managed by Deconetwork in future)
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled')),
  tracking_number TEXT,
  carrier TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Risk/Fraud
  risk_score INT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE (Audit Trail)
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  
  type TEXT NOT NULL CHECK (type IN ('charge', 'refund')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_refund_id TEXT,
  
  failure_code TEXT,
  failure_message TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER ACTIVITIES TABLE (Lifecycle Log)
-- ============================================

CREATE TABLE IF NOT EXISTS order_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (
    activity_type IN (
      'created', 'payment_processing', 'payment_received', 'payment_failed',
      'confirmed', 'status_change', 'shipped', 'delivered', 
      'refunded', 'note', 'cancelled'
    )
  ),
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

CREATE INDEX idx_order_activities_order ON order_activities(order_id);
CREATE INDEX idx_order_activities_created ON order_activities(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_activities ENABLE ROW LEVEL SECURITY;

-- Orders: Customers can view their own
CREATE POLICY "Customers view own orders"
  ON orders FOR SELECT
  USING (
    customer_id = auth.uid() OR
    LOWER(TRIM(customer_email)) = LOWER(TRIM(
      (SELECT email FROM profiles WHERE id = auth.uid())
    )) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales_rep')
    )
  );

-- Orders: Service role has full access (for API routes)
CREATE POLICY "Service role full access to orders"
  ON orders FOR ALL
  USING (true);

-- Payments: Follow order access pattern
CREATE POLICY "View payments for own orders"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = payments.order_id
      AND (
        orders.customer_id = auth.uid() OR
        LOWER(TRIM(orders.customer_email)) = LOWER(TRIM(
          (SELECT email FROM profiles WHERE id = auth.uid())
        )) OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'sales_rep')
        )
      )
    )
  );

-- Payments: Service role has full access
CREATE POLICY "Service role full access to payments"
  ON payments FOR ALL
  USING (true);

-- Order activities: Staff only for viewing
CREATE POLICY "Staff view order activities"
  ON order_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales_rep')
    )
  );

-- Order activities: Service role has full access
CREATE POLICY "Service role full access to order activities"
  ON order_activities FOR ALL
  USING (true);

-- ============================================
-- UPDATE SIGNUP TRIGGER (Auto-link orders)
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with data from auth metadata
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  );
  
  -- Link existing quotes to new user (by email match)
  UPDATE public.quotes 
  SET customer_id = NEW.id 
  WHERE LOWER(TRIM(customer_email)) = LOWER(TRIM(NEW.email)) 
    AND customer_id IS NULL;
  
  -- Link existing orders to new user (by email match)
  UPDATE public.orders 
  SET customer_id = NEW.id 
  WHERE LOWER(TRIM(customer_email)) = LOWER(TRIM(NEW.email)) 
    AND customer_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
