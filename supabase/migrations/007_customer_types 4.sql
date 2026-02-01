-- ============================================
-- CUSTOMER TYPES & TRADE PRICING SCHEMA
-- Adds distributor vs direct customer distinction
-- with verification workflow and tax compliance
-- ============================================

-- Customer type enum
DO $$ BEGIN
  CREATE TYPE customer_type AS ENUM ('direct', 'distributor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Verification status enum
DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'denied');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Pricing tier enum (for future use)
DO $$ BEGIN
  CREATE TYPE pricing_tier AS ENUM ('standard', 'bronze', 'silver', 'gold', 'platinum');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ADD COLUMNS TO PROFILES TABLE
-- ============================================

-- Customer type (direct vs distributor)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS customer_type customer_type DEFAULT 'direct';

-- Verification workflow
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_status verification_status;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Industry credentials (for distributors)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS asi_number TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ppai_number TEXT;

-- Business classification
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS business_type TEXT;
-- Expected values: 'decorator', 'screen_printer', 'embroiderer', 
-- 'promo_distributor', 'brand', 'corporate', 'team_dealer', 'other'

-- Tax & Compliance
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tax_exempt BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS resale_certificate TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS resale_certificate_expiry DATE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Pricing tier (for future volume-based pricing)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pricing_tier pricing_tier DEFAULT 'standard';

-- ============================================
-- INDEXES FOR COMMON QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_customer_type ON profiles(customer_type);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_pricing_tier ON profiles(pricing_tier);

-- ============================================
-- UPDATE get_user_role FUNCTION
-- to also return customer_type for RLS if needed
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_customer_type()
RETURNS TEXT AS $$
  SELECT customer_type::TEXT FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
