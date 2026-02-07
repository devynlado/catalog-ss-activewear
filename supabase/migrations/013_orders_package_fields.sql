-- ============================================
-- ADD MISSING FIELDS FOR PACKAGE ORDERS
-- Adds notes and metadata columns to orders table
-- ============================================

-- Add notes column for order-specific instructions
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add metadata column for package-specific data (embroidery locations, 3D puff, etc.)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index on metadata for querying package orders
CREATE INDEX IF NOT EXISTS idx_orders_metadata ON orders USING GIN (metadata);

-- Comment for documentation
COMMENT ON COLUMN orders.notes IS 'Customer-provided order notes or special instructions';
COMMENT ON COLUMN orders.metadata IS 'Additional order metadata (package type, embroidery details, logo URLs, etc.)';
