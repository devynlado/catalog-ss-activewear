-- ============================================
-- SPLIT SHIPMENTS: Multi-warehouse shipping support
-- ============================================

-- Track per-shipment data for orders spanning multiple warehouses
CREATE TABLE IF NOT EXISTS order_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipment_index INT NOT NULL DEFAULT 0,
  warehouse TEXT NOT NULL,
  shipping_method TEXT,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  actual_shipping_cost DECIMAL(10,2),
  carrier TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_shipments_order ON order_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipments_warehouse ON order_shipments(warehouse);
CREATE INDEX IF NOT EXISTS idx_order_shipments_tracking ON order_shipments(tracking_number);

-- Trigger to update updated_at on order_shipments
DROP TRIGGER IF EXISTS update_order_shipments_updated_at ON order_shipments;
CREATE TRIGGER update_order_shipments_updated_at
    BEFORE UPDATE ON order_shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies (same pattern as orders)
ALTER TABLE order_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view order shipments"
  ON order_shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_shipments.order_id
      AND (
        orders.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'sales_rep')
        )
      )
    )
  );

CREATE POLICY "Service role full access to order shipments"
  ON order_shipments FOR ALL
  USING (true);

-- ============================================
-- ADD partially_shipped STATUS
-- ============================================

-- Drop and recreate the status constraint to include 'partially_shipped'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'confirmed', 'awaiting_purchasing', 'ordered',
    'in_production', 'partially_shipped', 'shipped', 'delivered', 'cancelled'
  ));

-- ============================================
-- UPDATE 1801GD SUPPLIER
-- ============================================

-- LA Apparel products have synthetic style IDs in the 9001000-9010000 range
UPDATE products
  SET supplier = 'los_angeles_apparel'
  WHERE style_id >= 9001000 AND style_id < 9010000;

UPDATE product_colors
  SET supplier = 'los_angeles_apparel'
  WHERE style_id >= 9001000 AND style_id < 9010000;

UPDATE product_skus
  SET supplier = 'los_angeles_apparel'
  WHERE style_id >= 9001000 AND style_id < 9010000;

-- Update supplier column comment
COMMENT ON COLUMN products.supplier IS 'Supplier identifier: ss_activewear, otto_cap, los_angeles_apparel, or as_colour';
