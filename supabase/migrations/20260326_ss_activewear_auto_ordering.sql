-- =============================================================
-- SS Activewear Automatic Ordering & Tracking
-- Migration: New tables + alterations to existing tables
-- =============================================================

-- 1. SS Orders — tracks each order placed with SS Activewear
CREATE TABLE IF NOT EXISTS ss_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES order_shipments(id) ON DELETE SET NULL,
  ss_order_number TEXT NOT NULL,
  ss_invoice_number TEXT,
  ss_guid TEXT NOT NULL,
  ss_warehouse TEXT,
  ss_order_status TEXT,
  ss_delivery_status TEXT,
  ss_expected_delivery_date TIMESTAMPTZ,
  ss_ship_date TIMESTAMPTZ,
  ss_tracking_number TEXT,
  ss_carrier TEXT,
  ss_subtotal DECIMAL(10,2),
  ss_shipping DECIMAL(10,2),
  ss_total DECIMAL(10,2),
  ss_total_weight DECIMAL(10,2),
  ss_total_boxes INTEGER,
  ss_raw_response JSONB,
  line_errors JSONB,
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  last_polled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ss_orders_order_id ON ss_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_ss_orders_ss_order_number ON ss_orders(ss_order_number);
CREATE INDEX IF NOT EXISTS idx_ss_orders_status ON ss_orders(ss_order_status);

-- 2. SS Tracking Events — checkpoint history from the Tracking API
CREATE TABLE IF NOT EXISTS ss_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ss_order_id UUID NOT NULL REFERENCES ss_orders(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  carrier TEXT,
  checkpoint_date TIMESTAMPTZ,
  checkpoint_location TEXT,
  checkpoint_status TEXT,
  actual_delivery_date TIMESTAMPTZ,
  signed_by TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ss_tracking_events_ss_order_id ON ss_tracking_events(ss_order_id);

-- 3. SS Activity Log — dedicated log for all SS Activewear operations
CREATE TABLE IF NOT EXISTS ss_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ss_order_id UUID REFERENCES ss_orders(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ss_activity_log_order_id ON ss_activity_log(order_id);
CREATE INDEX IF NOT EXISTS idx_ss_activity_log_ss_order_id ON ss_activity_log(ss_order_id);

-- 4. SS Returns — schema for future returns integration
CREATE TABLE IF NOT EXISTS ss_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ss_order_id UUID REFERENCES ss_orders(id) ON DELETE SET NULL,
  ss_return_number TEXT,
  ss_rma_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  items JSONB,
  ss_raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ss_returns_order_id ON ss_returns(order_id);

-- 5. Delivery Estimates Cache — caches DaysInTransit responses by zip
CREATE TABLE IF NOT EXISTS delivery_estimates_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code TEXT NOT NULL,
  warehouse_abbr TEXT NOT NULL,
  days_in_transit INTEGER NOT NULL,
  cutoff_time TEXT NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(zip_code, warehouse_abbr)
);

CREATE INDEX IF NOT EXISTS idx_delivery_estimates_zip ON delivery_estimates_cache(zip_code);

-- 6. Alter orders table — add SS-related columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expected_delivery_date TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ss_auto_order_failed BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ss_auto_order_error TEXT;

-- 7. Alter order_shipments table — add SS-related columns
ALTER TABLE order_shipments ADD COLUMN IF NOT EXISTS ss_order_number TEXT;
ALTER TABLE order_shipments ADD COLUMN IF NOT EXISTS ss_invoice_number TEXT;
ALTER TABLE order_shipments ADD COLUMN IF NOT EXISTS ss_guid TEXT;
ALTER TABLE order_shipments ADD COLUMN IF NOT EXISTS expected_delivery_date TIMESTAMPTZ;
ALTER TABLE order_shipments ADD COLUMN IF NOT EXISTS delivery_status TEXT;
ALTER TABLE order_shipments ADD COLUMN IF NOT EXISTS last_checkpoint_location TEXT;
ALTER TABLE order_shipments ADD COLUMN IF NOT EXISTS last_checkpoint_message TEXT;
ALTER TABLE order_shipments ADD COLUMN IF NOT EXISTS last_checkpoint_at TIMESTAMPTZ;
