-- Migration: Coupon Email Campaign — 30-day retention send tracking
--
-- Tracks which customers have been sent coupon campaign emails.
-- UNIQUE(customer_email, campaign) enforces one-send-per-customer at the DB level.

CREATE TABLE IF NOT EXISTS coupon_email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number TEXT,
  coupon_code TEXT NOT NULL,
  campaign TEXT NOT NULL DEFAULT '30day_retention',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resend_id TEXT,
  UNIQUE(customer_email, campaign)
);

CREATE INDEX IF NOT EXISTS idx_coupon_email_sends_email
  ON coupon_email_sends (customer_email);

CREATE INDEX IF NOT EXISTS idx_coupon_email_sends_campaign
  ON coupon_email_sends (campaign, sent_at);

-- RLS: service-role only (accessed from API routes, not client)
ALTER TABLE coupon_email_sends ENABLE ROW LEVEL SECURITY;
