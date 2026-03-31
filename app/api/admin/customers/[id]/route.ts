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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/admin/customers/[id] — Full customer detail.
 * [id] can be a profile UUID (for registered users) or an email address (for guests).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const serviceSupabase = getServiceSupabase();
  const user = await verifyAdmin(serviceSupabase);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawId = decodeURIComponent(params.id);
  const isUUID = UUID_RE.test(rawId);

  // Resolve the customer's email and optional profile
  let profile: Record<string, any> | null = null;
  let customerEmail: string;

  if (isUUID) {
    const { data: p } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', rawId)
      .single();

    if (p) {
      profile = p;
      customerEmail = (p.email as string).toLowerCase();
    } else {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
  } else {
    customerEmail = rawId.toLowerCase().trim();

    // Try to find a profile by email
    const { data: p } = await serviceSupabase
      .from('profiles')
      .select('*')
      .ilike('email', customerEmail)
      .maybeSingle();

    if (p) profile = p;
  }

  // Fetch assigned sales rep
  let assignedRep = null;
  if (profile?.assigned_sales_rep_id) {
    const { data: rep } = await serviceSupabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, phone, calendly_url')
      .eq('id', profile.assigned_sales_rep_id)
      .single();
    assignedRep = rep;
  }

  // Fetch all orders for this customer
  let orderQuery = serviceSupabase
    .from('orders')
    .select('id, order_number, status, payment_status, total, subtotal, shipping_cost, discount_amount, items, coupon_code, created_at, paid_at, shipped_at, delivered_at, customer_name, customer_phone, company, shipping_address')
    .ilike('customer_email', customerEmail)
    .order('created_at', { ascending: false });

  const { data: orders } = await orderQuery;

  if ((!orders || orders.length === 0) && !profile) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  // Derive customer info from orders when no profile
  let derivedName: string | null = null;
  let derivedPhone: string | null = null;
  let derivedCompany: string | null = null;
  let derivedCity: string | null = null;
  let derivedState: string | null = null;
  let derivedStreet: string | null = null;
  let derivedZip: string | null = null;

  for (const o of orders || []) {
    if (!derivedName && o.customer_name) derivedName = o.customer_name;
    if (!derivedPhone && o.customer_phone) derivedPhone = o.customer_phone;
    if (!derivedCompany && o.company) derivedCompany = o.company;
    if (!derivedCity && o.shipping_address) {
      const addr = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address;
      if (addr?.city) derivedCity = addr.city;
      if (addr?.state) derivedState = addr.state;
      if (addr?.line1 || addr?.street) derivedStreet = addr.line1 || addr.street;
      if (addr?.postal_code || addr?.zip) derivedZip = addr.postal_code || addr.zip;
    }
  }

  const paidOrders = (orders || []).filter(o => o.payment_status === 'paid');
  const totalSpent = paidOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const firstOrder = paidOrders.length > 0 ? paidOrders[paidOrders.length - 1].paid_at || paidOrders[paidOrders.length - 1].created_at : null;
  const lastOrder = paidOrders.length > 0 ? paidOrders[0].paid_at || paidOrders[0].created_at : null;

  const orderSummaries = (orders || []).map(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    const itemCount = items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
    const productCount = items.length;
    return {
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      payment_status: o.payment_status,
      total: o.total,
      subtotal: o.subtotal,
      shipping_cost: o.shipping_cost,
      discount_amount: o.discount_amount,
      coupon_code: o.coupon_code,
      item_count: itemCount,
      product_count: productCount,
      created_at: o.created_at,
      paid_at: o.paid_at,
      shipped_at: o.shipped_at,
      delivered_at: o.delivered_at,
    };
  });

  // Fetch reviews
  const { data: reviews } = await serviceSupabase
    .from('reviews')
    .select('id, style_id, rating, title, body, status, reward_coupon_id, created_at')
    .ilike('customer_email', customerEmail)
    .order('created_at', { ascending: false });

  const styleIds = [...new Set((reviews || []).map(r => r.style_id))];
  let productMap = new Map<number, { title: string; brandName: string }>();
  if (styleIds.length > 0) {
    const { data: products } = await serviceSupabase
      .from('products')
      .select('style_id, title, brand_name')
      .in('style_id', styleIds);
    for (const p of products || []) {
      productMap.set(p.style_id, { title: p.title, brandName: p.brand_name });
    }
  }

  const couponIds = (reviews || []).filter(r => r.reward_coupon_id).map(r => r.reward_coupon_id);
  let couponMap = new Map<string, { code: string; discount_type: string; amount: number; used_count: number }>();
  if (couponIds.length > 0) {
    const { data: coupons } = await serviceSupabase
      .from('coupons')
      .select('id, code, discount_type, amount, used_count')
      .in('id', couponIds);
    for (const c of coupons || []) {
      couponMap.set(c.id, { code: c.code, discount_type: c.discount_type, amount: Number(c.amount), used_count: c.used_count });
    }
  }

  const enrichedReviews = (reviews || []).map(r => {
    const product = productMap.get(r.style_id);
    const coupon = r.reward_coupon_id ? couponMap.get(r.reward_coupon_id) : null;
    return {
      ...r,
      product_title: product?.title || `Product #${r.style_id}`,
      brand_name: product?.brandName || '',
      reward_coupon: coupon ? {
        code: coupon.code,
        discount_type: coupon.discount_type,
        amount: coupon.amount,
        used: coupon.used_count > 0,
      } : null,
    };
  });

  // Build profile response (from DB profile or derived from orders)
  const profileResponse = profile ? {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    company: profile.company,
    phone: profile.phone,
    customer_type: profile.customer_type || 'direct',
    verification_status: profile.verification_status || null,
    business_type: profile.business_type || null,
    website: profile.website || null,
    asi_number: profile.asi_number || null,
    ppai_number: profile.ppai_number || null,
    billing_address_street: profile.billing_address_street || null,
    billing_address_city: profile.billing_address_city || null,
    billing_address_state: profile.billing_address_state || null,
    billing_address_zip: profile.billing_address_zip || null,
    tax_exempt: profile.tax_exempt || false,
    pricing_tier: profile.pricing_tier || 'standard',
    created_at: profile.created_at,
    has_profile: true,
  } : {
    id: null,
    email: customerEmail,
    full_name: derivedName,
    avatar_url: null,
    company: derivedCompany,
    phone: derivedPhone,
    customer_type: 'direct',
    verification_status: null,
    business_type: null,
    website: null,
    asi_number: null,
    ppai_number: null,
    billing_address_street: derivedStreet,
    billing_address_city: derivedCity,
    billing_address_state: derivedState,
    billing_address_zip: derivedZip,
    tax_exempt: false,
    pricing_tier: 'standard',
    created_at: (orders && orders.length > 0) ? orders[orders.length - 1].created_at : new Date().toISOString(),
    has_profile: false,
  };

  const metrics = {
    total_spent: Math.round(totalSpent * 100) / 100,
    order_count: paidOrders.length,
    all_order_count: (orders || []).length,
    avg_order_value: paidOrders.length > 0 ? Math.round((totalSpent / paidOrders.length) * 100) / 100 : 0,
    first_order_date: firstOrder,
    last_order_date: lastOrder,
    review_count: (reviews || []).length,
    avg_rating: (reviews || []).length > 0
      ? Math.round(((reviews || []).reduce((s, r) => s + r.rating, 0) / (reviews || []).length) * 10) / 10
      : null,
    coupons_claimed: couponIds.length,
  };

  return NextResponse.json({
    profile: profileResponse,
    assigned_rep: assignedRep,
    orders: orderSummaries,
    reviews: enrichedReviews,
    metrics,
  });
}
