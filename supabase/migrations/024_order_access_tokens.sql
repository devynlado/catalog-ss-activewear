-- Migration: Order access tokens and tracking sessions
--
-- Enables passwordless order tracking:
--   1. Each order gets a unique access_token (UUID) included in confirmation emails
--   2. Customers verify with token + email to create a tracking session
--   3. Session cookie grants access to all orders for that email

-- ============================================================================
-- STEP 1: Add access_token to orders table
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_orders_access_token ON orders (access_token) WHERE access_token IS NOT NULL;

-- ============================================================================
-- STEP 2: Backfill existing orders with access tokens
-- ============================================================================

UPDATE orders
SET access_token = gen_random_uuid()::text
WHERE access_token IS NULL;

-- ============================================================================
-- STEP 3: Create order_tracking_sessions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_tracking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_tracking_sessions_token
    ON order_tracking_sessions (session_token);

CREATE INDEX IF NOT EXISTS idx_order_tracking_sessions_email
    ON order_tracking_sessions (email);

-- Auto-cleanup expired sessions (optional: run via cron or let queries filter)
