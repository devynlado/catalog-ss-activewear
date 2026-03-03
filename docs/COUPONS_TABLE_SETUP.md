# Fix: "Could not find the table 'public.coupons' in the schema cache"

This error means the `coupons` table has not been created in your Supabase database yet. The app and migrations define it, but the SQL must be run once in your project.

## Quick fix (recommended)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **SQL Editor**.
3. Open the file **`supabase/apply-coupons-table.sql`** in this repo, copy its full contents, and paste into the SQL Editor.
4. Click **Run** (or press Ctrl+Enter).

You should see “Success. No rows returned.” (or similar). The `public.coupons` table and related objects are now created.

5. Try adding a coupon again from the admin dashboard (**/admin/coupons**).

## What the script creates

- **`public.coupons`** table (code, discount_type, amount, dates, usage limits, etc.)
- Trigger to normalize coupon codes to uppercase
- Indexes and RLS policy for admin access
- Optional: `coupon_id` and `coupon_code` on `orders` if that table exists

## Using Supabase CLI instead

If you use the Supabase CLI and run migrations with `supabase db push` or `supabase migration up`, ensure **`supabase/migrations/015_coupons.sql`** is applied. If your remote DB is ahead or you don’t use migrations, use the SQL Editor method above.
