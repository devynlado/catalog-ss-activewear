-- Garment Decor Database Schema
-- Run this in your Supabase SQL Editor to create the tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- QUOTES TABLE
-- Stores quote form submissions
-- ============================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id TEXT UNIQUE NOT NULL,           -- Human-readable ID (e.g., "QT-ABC123")
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  company TEXT,
  items JSONB NOT NULL,                    -- Array of cart items with product details
  decoration JSONB,                        -- Decoration preferences
  finishing TEXT[],                        -- Array of finishing options
  notes TEXT,                              -- Additional notes from customer
  subtotal DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'converted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);

-- ============================================
-- CONTACTS TABLE
-- Stores contact form submissions
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  service TEXT,                            -- Service they're interested in
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);

-- ============================================
-- ABANDONED CARTS TABLE
-- Captures carts when user enters email but doesn't complete quote
-- ============================================
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  items JSONB NOT NULL,                    -- Cart items at time of capture
  decoration JSONB,
  finishing TEXT[],
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovered BOOLEAN NOT NULL DEFAULT FALSE,
  recovery_sent_at TIMESTAMPTZ             -- When recovery email was sent
);

-- Index for recovery campaigns
CREATE INDEX IF NOT EXISTS idx_abandoned_email ON abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_recovered ON abandoned_carts(recovered);
CREATE INDEX IF NOT EXISTS idx_abandoned_captured ON abandoned_carts(captured_at DESC);

-- ============================================
-- EXIT CAPTURES TABLE
-- Stores emails from exit intent popup
-- ============================================
CREATE TABLE IF NOT EXISTS exit_captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  page_url TEXT,                           -- Which page they were on
  cart_items JSONB,                        -- Cart contents if any
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_exit_email ON exit_captures(email);
CREATE INDEX IF NOT EXISTS idx_exit_created ON exit_captures(created_at DESC);

-- ============================================
-- UPDATED_AT TRIGGER
-- Automatically update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Secure by default, service key bypasses
-- ============================================
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_captures ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON quotes FOR ALL USING (true);
CREATE POLICY "Service role full access" ON contacts FOR ALL USING (true);
CREATE POLICY "Service role full access" ON abandoned_carts FOR ALL USING (true);
CREATE POLICY "Service role full access" ON exit_captures FOR ALL USING (true);
