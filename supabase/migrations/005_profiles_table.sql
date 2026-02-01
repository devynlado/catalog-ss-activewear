-- ============================================
-- PROFILES TABLE
-- Extends Supabase Auth users with app-specific data
-- Supports: customers, sales reps, admins
-- ============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' 
    CHECK (role IN ('customer', 'sales_rep', 'admin')),
  phone TEXT,
  company TEXT,
  assigned_sales_rep_id UUID REFERENCES profiles(id),
  calendly_url TEXT,  -- Sales reps can add their booking link
  notification_preferences JSONB DEFAULT '{
    "email_new_message": true,
    "email_quote_status": true,
    "email_marketing": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_rep ON profiles(assigned_sales_rep_id);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- Works for both email/password AND Google OAuth
-- Also links existing quotes to the new user
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with data from auth metadata
  -- Google OAuth provides: name, picture, email
  -- Email signup provides: full_name (if passed)
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',  -- Google provides 'name'
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'  -- Google provides 'picture'
    )
  );
  
  -- Link any existing quotes to this new user (by email match)
  -- This handles the case where someone submits a quote anonymously
  -- and later creates an account with the same email
  UPDATE public.quotes 
  SET customer_id = NEW.id 
  WHERE LOWER(TRIM(customer_email)) = LOWER(TRIM(NEW.email)) 
    AND customer_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- UPDATE QUOTES TABLE
-- Add customer_id and assigned_sales_rep_id columns
-- ============================================

-- Add customer_id column to link quotes to user accounts
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES profiles(id);

-- Add assigned_sales_rep_id for sales rep assignment
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS assigned_sales_rep_id UUID REFERENCES profiles(id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_assigned_rep ON quotes(assigned_sales_rep_id);

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================

-- Apply the existing updated_at trigger to profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Sales reps can view their assigned customers
CREATE POLICY "Sales reps view assigned customers"
  ON profiles FOR SELECT
  USING (
    assigned_sales_rep_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales_rep')
    )
  );

-- Admins have full access
CREATE POLICY "Admins full access"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow insert for new users (the trigger runs as SECURITY DEFINER)
CREATE POLICY "Enable insert for authenticated users" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ============================================
-- UPDATE QUOTES RLS
-- Allow customers to see their own quotes
-- ============================================

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Customers view own quotes" ON quotes;

-- Customers can view their own quotes (by customer_id or email)
CREATE POLICY "Customers view own quotes"
  ON quotes FOR SELECT
  USING (
    customer_id = auth.uid() OR
    LOWER(TRIM(customer_email)) = LOWER(TRIM((SELECT email FROM profiles WHERE id = auth.uid()))) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales_rep')
    )
  );

-- ============================================
-- HELPER FUNCTION: Get user role
-- Useful for middleware and API routes
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;
