-- ============================================
-- ADD WEBSITE & BILLING ADDRESS TO PROFILES
-- ============================================

-- Website
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS website TEXT;

-- Billing Address (structured fields)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS billing_address_street TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS billing_address_city TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS billing_address_state TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS billing_address_zip TEXT;
