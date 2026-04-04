import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyAdmin(serviceSupabase: ReturnType<typeof getServiceSupabase>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) return null;
  return user;
}

/**
 * GET /api/admin/customers — Paginated customer list built from orders + profiles.
 * Primary source: unique customer_email in orders table (captures both guests and registered).
 * Enriched with profiles data when available.
 */
export async function GET(request: NextRequest) {
  const serviceSupabase = getServiceSupabase();
  const user = await verifyAdmin(serviceSupabase);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const search = searchParams.get('search')?.trim() || '';
  const type = searchParams.get('type') || '';
  const state = searchParams.get('state') || '';
  const minSpent = parseFloat(searchParams.get('min_spent') || '') || 0;
  const maxSpent = parseFloat(searchParams.get('max_spent') || '') || 0;
  const minOrders = parseInt(searchParams.get('min_orders') || '', 10) || 0;
  const hasReviews = searchParams.get('has_reviews') === 'true';
  const dateFrom = searchParams.get('date_from') || '';
  const dateTo = searchParams.get('date_to') || '';
  const sortBy = searchParams.get('sort') || 'total_spent_desc';
  const pageSize = 25;

  // 1. Fetch ALL orders (we aggregate in-memory for flexibility)
  const { data: allOrders, error: ordersErr } = await serviceSupabase
    .from('orders')
    .select('customer_email, customer_name, customer_phone, company, customer_id, total, paid_at, payment_status, created_at, shipping_address');

  if (ordersErr) {
    console.error('[Admin Customers] Orders query error:', ordersErr);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  // 2. Group orders by customer_email → build raw customer map
  interface RawCustomer {
    email: string;
    name: string | null;
    phone: string | null;
    company: string | null;
    profileId: string | null;
    orderCount: number;
    totalSpent: number;
    firstOrder: string | null;
    lastOrder: string | null;
    firstSeen: string;
    shippingState: string | null;
    shippingCity: string | null;
  }

  const customerMap = new Map<string, RawCustomer>();

  for (const o of allOrders || []) {
    if (!o.customer_email) continue;
    const emailKey = o.customer_email.toLowerCase().trim();
    const isPaid = o.payment_status === 'paid';
    const total = isPaid ? (Number(o.total) || 0) : 0;
    const paidAt = isPaid ? (o.paid_at || o.created_at) : null;

    const existing = customerMap.get(emailKey);
    if (existing) {
      if (isPaid) {
        existing.orderCount++;
        existing.totalSpent += total;
        if (paidAt && (!existing.lastOrder || paidAt > existing.lastOrder)) existing.lastOrder = paidAt;
        if (paidAt && (!existing.firstOrder || paidAt < existing.firstOrder)) existing.firstOrder = paidAt;
      }
      if (!existing.name && o.customer_name) existing.name = o.customer_name;
      if (!existing.phone && o.customer_phone) existing.phone = o.customer_phone;
      if (!existing.company && o.company) existing.company = o.company;
      if (!existing.profileId && o.customer_id) existing.profileId = o.customer_id;
      if (o.created_at < existing.firstSeen) existing.firstSeen = o.created_at;

      if (!existing.shippingState && o.shipping_address) {
        const addr = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address;
        if (addr?.state) existing.shippingState = addr.state;
        if (addr?.city) existing.shippingCity = addr.city;
      }
    } else {
      let shippingState: string | null = null;
      let shippingCity: string | null = null;
      if (o.shipping_address) {
        const addr = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address;
        if (addr?.state) shippingState = addr.state;
        if (addr?.city) shippingCity = addr.city;
      }

      customerMap.set(emailKey, {
        email: o.customer_email,
        name: o.customer_name || null,
        phone: o.customer_phone || null,
        company: o.company || null,
        profileId: o.customer_id || null,
        orderCount: isPaid ? 1 : 0,
        totalSpent: total,
        firstOrder: paidAt,
        lastOrder: paidAt,
        firstSeen: o.created_at,
        shippingState,
        shippingCity,
      });
    }
  }

  // 3. Batch-fetch profiles to enrich (registered customers get richer data)
  const profileIds = [...new Set(
    [...customerMap.values()].map(c => c.profileId).filter(Boolean)
  )] as string[];

  const profileMap = new Map<string, {
    id: string; full_name: string | null; avatar_url: string | null;
    phone: string | null; company: string | null; customer_type: string;
    billing_address_city: string | null; billing_address_state: string | null;
    created_at: string; assigned_sales_rep_id: string | null;
  }>();

  if (profileIds.length > 0) {
    const { data: profiles } = await serviceSupabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, phone, company, customer_type, billing_address_city, billing_address_state, created_at, assigned_sales_rep_id')
      .in('id', profileIds);

    for (const p of profiles || []) {
      profileMap.set(p.email.toLowerCase().trim(), p);
    }
  }

  // 4. Batch-fetch reviews
  const { data: allReviews } = await serviceSupabase
    .from('reviews')
    .select('customer_email, rating, reward_coupon_id');

  const reviewStats = new Map<string, { count: number; totalRating: number; coupons: number }>();
  for (const r of allReviews || []) {
    if (!r.customer_email) continue;
    const emailKey = r.customer_email.toLowerCase().trim();
    if (!customerMap.has(emailKey)) continue;
    const existing = reviewStats.get(emailKey) || { count: 0, totalRating: 0, coupons: 0 };
    existing.count++;
    existing.totalRating += r.rating;
    if (r.reward_coupon_id) existing.coupons++;
    reviewStats.set(emailKey, existing);
  }

  // 5. Merge into final customer list
  let customers = [...customerMap.entries()].map(([emailKey, raw]) => {
    const profile = profileMap.get(emailKey);
    const rs = reviewStats.get(emailKey) || { count: 0, totalRating: 0, coupons: 0 };

    return {
      id: raw.profileId || emailKey,
      email: raw.email,
      full_name: profile?.full_name || raw.name || null,
      avatar_url: profile?.avatar_url || null,
      company: profile?.company || raw.company || null,
      phone: profile?.phone || raw.phone || null,
      customer_type: profile?.customer_type || 'direct',
      city: profile?.billing_address_city || raw.shippingCity || null,
      state: profile?.billing_address_state || raw.shippingState || null,
      created_at: profile?.created_at || raw.firstSeen,
      has_profile: !!profile,
      order_count: raw.orderCount,
      total_spent: Math.round(raw.totalSpent * 100) / 100,
      last_order_date: raw.lastOrder,
      first_order_date: raw.firstOrder,
      review_count: rs.count,
      avg_rating: rs.count > 0 ? Math.round((rs.totalRating / rs.count) * 10) / 10 : null,
      coupons_claimed: rs.coupons,
    };
  });

  // 6. Apply filters
  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(c =>
      (c.full_name || '').toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
  }
  if (type === 'direct' || type === 'distributor') {
    customers = customers.filter(c => c.customer_type === type);
  }
  if (state) {
    customers = customers.filter(c => c.state === state);
  }
  if (dateFrom) {
    customers = customers.filter(c =>
      c.first_order_date ? c.first_order_date >= dateFrom : c.created_at >= dateFrom
    );
  }
  if (dateTo) {
    const dEnd = `${dateTo}T23:59:59.999Z`;
    customers = customers.filter(c =>
      c.first_order_date ? c.first_order_date <= dEnd : c.created_at <= dEnd
    );
  }
  if (minSpent > 0) customers = customers.filter(c => c.total_spent >= minSpent);
  if (maxSpent > 0) customers = customers.filter(c => c.total_spent <= maxSpent);
  if (minOrders > 0) customers = customers.filter(c => c.order_count >= minOrders);
  if (hasReviews) customers = customers.filter(c => c.review_count > 0);

  // 7. Compute stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.order_count, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;
  const withReviews = customers.filter(c => c.review_count > 0).length;

  // 8. Sort
  const [sortField, sortDir] = sortBy.includes('_asc')
    ? [sortBy.replace('_asc', ''), 'asc'] as const
    : [sortBy.replace('_desc', ''), 'desc'] as const;

  customers.sort((a, b) => {
    let av: number, bv: number;
    switch (sortField) {
      case 'total_spent': av = a.total_spent; bv = b.total_spent; break;
      case 'order_count': av = a.order_count; bv = b.order_count; break;
      case 'last_order':
        av = a.last_order_date ? new Date(a.last_order_date).getTime() : 0;
        bv = b.last_order_date ? new Date(b.last_order_date).getTime() : 0;
        break;
      case 'created_at':
      default:
        av = new Date(a.created_at).getTime();
        bv = new Date(b.created_at).getTime();
        break;
    }
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  // 9. Paginate
  const totalPages = Math.ceil(totalCustomers / pageSize);
  const offset = (page - 1) * pageSize;
  const paged = customers.slice(offset, offset + pageSize);

  // 10. Collect distinct states for filter dropdown
  const stateSet = new Set<string>();
  for (const c of customers) {
    if (c.state) stateSet.add(c.state);
  }
  const states = [...stateSet].sort();

  return NextResponse.json({
    customers: paged,
    page,
    pageSize,
    total: totalCustomers,
    totalPages,
    stats: {
      totalCustomers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgOrderValue,
      withReviews,
    },
    states,
  });
}
