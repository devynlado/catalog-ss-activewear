-- ============================================
-- ADD BUSINESS LICENSE & SELLER'S PERMIT
-- ============================================

-- Business License (required for trade pricing)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS business_license TEXT;

-- Seller's Permit (optional)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS sellers_permit TEXT;
