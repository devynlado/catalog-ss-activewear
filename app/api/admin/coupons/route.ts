import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerProfile, getServerUser } from '@/lib/supabase-server';
import { normalizeCouponCode } from '@/lib/coupon-utils';

/** Ensure request is from an admin; returns 401 if not */
async function requireAdmin() {
  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/** GET /api/admin/coupons – list all coupons */
export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

/** POST /api/admin/coupons – create coupon */
export async function POST(request: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const body = await request.json();
  const {
    code,
    description,
    discount_type,
    amount,
    free_shipping,
    min_cart_amount,
    max_discount_amount,
    applies_to,
    starts_at,
    expires_at,
    usage_limit,
    usage_limit_per_customer,
  } = body;

  if (!code || !discount_type) {
    return NextResponse.json(
      { error: 'code and discount_type are required' },
      { status: 400 }
    );
  }
  if (!['percent_cart', 'fixed_cart', 'free_shipping'].includes(discount_type)) {
    return NextResponse.json({ error: 'Invalid discount_type' }, { status: 400 });
  }
  if (discount_type !== 'free_shipping' && (amount == null || Number(amount) < 0)) {
    return NextResponse.json(
      { error: 'amount is required and must be >= 0 for this type' },
      { status: 400 }
    );
  }
  if (applies_to && !['cart_and_packages', 'products_only'].includes(applies_to)) {
    return NextResponse.json({ error: 'Invalid applies_to' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { user } = await getServerUser();
  const insert: Record<string, unknown> = {
    code: normalizeCouponCode(code),
    description: description ?? null,
    discount_type,
    amount: discount_type === 'free_shipping' ? 0 : Number(amount),
    free_shipping: Boolean(free_shipping),
    min_cart_amount: min_cart_amount != null ? Number(min_cart_amount) : null,
    max_discount_amount: max_discount_amount != null ? Number(max_discount_amount) : null,
    applies_to: applies_to ?? 'products_only',
    starts_at: starts_at || null,
    expires_at: expires_at || null,
    usage_limit: usage_limit != null ? Number(usage_limit) : null,
    usage_limit_per_customer: usage_limit_per_customer != null ? Number(usage_limit_per_customer) : null,
    created_by: user?.id ?? null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from('coupons').insert(insert as any).select().single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
