import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerProfile } from '@/lib/supabase-server';
import { normalizeCouponCode } from '@/lib/coupon-utils';

async function requireAdmin() {
  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/** GET /api/admin/coupons/[id] */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('coupons').select('*').eq('id', id).single();

  if (error || !data) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}

/** PATCH /api/admin/coupons/[id] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
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

  const updates: Record<string, unknown> = {};
  if (code !== undefined) updates.code = normalizeCouponCode(code);
  if (description !== undefined) updates.description = description;
  if (discount_type !== undefined) {
    if (!['percent_cart', 'fixed_cart', 'free_shipping'].includes(discount_type)) {
      return NextResponse.json({ error: 'Invalid discount_type' }, { status: 400 });
    }
    updates.discount_type = discount_type;
  }
  if (amount !== undefined) updates.amount = Number(amount);
  if (free_shipping !== undefined) updates.free_shipping = Boolean(free_shipping);
  if (min_cart_amount !== undefined) updates.min_cart_amount = min_cart_amount == null ? null : Number(min_cart_amount);
  if (max_discount_amount !== undefined) updates.max_discount_amount = max_discount_amount == null ? null : Number(max_discount_amount);
  if (applies_to !== undefined) {
    if (!['cart_and_packages', 'products_only'].includes(applies_to)) {
      return NextResponse.json({ error: 'Invalid applies_to' }, { status: 400 });
    }
    updates.applies_to = applies_to;
  }
  if (starts_at !== undefined) updates.starts_at = starts_at || null;
  if (expires_at !== undefined) updates.expires_at = expires_at || null;
  if (usage_limit !== undefined) updates.usage_limit = usage_limit == null ? null : Number(usage_limit);
  if (usage_limit_per_customer !== undefined) updates.usage_limit_per_customer = usage_limit_per_customer == null ? null : Number(usage_limit_per_customer);

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('coupons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

/** DELETE /api/admin/coupons/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('coupons').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
