-- ============================================
-- FIX INFINITE RECURSION IN PROFILES RLS
-- The issue: policies that query profiles to check roles
-- cause infinite recursion
-- ============================================

-- Create a function to get user role that bypasses RLS
-- Using public schema since auth schema is protected
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Sales reps view assigned customers" ON profiles;
DROP POLICY IF EXISTS "Admins full access" ON profiles;

-- Recreate policies using the helper function (no recursion)

-- Sales reps can view their assigned customers
CREATE POLICY "Sales reps view assigned customers"
  ON profiles FOR SELECT
  USING (
    assigned_sales_rep_id = auth.uid() OR
    public.get_user_role() IN ('admin', 'sales_rep')
  );

-- Admins have full access
CREATE POLICY "Admins full access"
  ON profiles FOR ALL
  USING (public.get_user_role() = 'admin');

-- ============================================
-- Also fix the quotes RLS if it has similar issues
-- ============================================

DROP POLICY IF EXISTS "Customers view own quotes" ON quotes;

CREATE POLICY "Customers view own quotes"
  ON quotes FOR SELECT
  USING (
    customer_id = auth.uid() OR
    LOWER(TRIM(customer_email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid()))) OR
    public.get_user_role() IN ('admin', 'sales_rep')
  );
