-- Checkpoint table for chunked inventory sync cron
-- Tracks which offset the cron left off at so the next run continues seamlessly.
CREATE TABLE IF NOT EXISTS sync_inventory_checkpoint (
    id              INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row
    current_offset  INT NOT NULL DEFAULT 0,
    last_run_at     TIMESTAMPTZ,
    last_chunk_products INT DEFAULT 0,
    last_chunk_skus     INT DEFAULT 0,
    cycle_complete      BOOLEAN DEFAULT false
);

INSERT INTO sync_inventory_checkpoint (id, current_offset)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Log table for stock check failures at checkout
-- Records when a customer tries to buy an item that was in-stock per cache
-- but out-of-stock per live SS API check.
CREATE TABLE IF NOT EXISTS stock_check_failures (
    id              BIGSERIAL PRIMARY KEY,
    sku             TEXT NOT NULL,
    style_id        INT,
    color_name      TEXT,
    size_name       TEXT,
    requested_qty   INT,
    cached_qty      INT,
    live_qty        INT,
    customer_email  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_check_failures_sku
    ON stock_check_failures(sku);

CREATE INDEX IF NOT EXISTS idx_stock_check_failures_created
    ON stock_check_failures(created_at DESC);
