-- Add referrer column to orders table
-- Stores the document.referrer from the visitor's first touch (e.g. google.com, chatgpt.com)
-- Used alongside utm_source/utm_medium/gclid for more accurate channel attribution
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referrer TEXT;
