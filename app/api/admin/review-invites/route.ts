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
 * GET /api/admin/review-invites?tab=all|not_sent|sent|reviewed|failed&page=1&search=
 *
 * Shows ALL delivered orders, including those that haven't received an invite yet.
 */
export async function GET(request: NextRequest) {
  const serviceSupabase = getServiceSupabase();
  const user = await verifyAdmin(serviceSupabase);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'all';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const search = searchParams.get('search')?.trim() || '';
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  // --- Strategy ---
  // 1. Query delivered orders as the base
  // 2. LEFT JOIN with review_invites and reviews
  // 3. Filter by tab

  // Build the delivered orders query
  let ordersQuery = serviceSupabase
    .from('orders')
    .select('id, order_number, customer_email, customer_name, delivered_at, items, status', { count: 'exact' })
    .eq('status', 'delivered')
    .not('delivered_at', 'is', null)
    .order('delivered_at', { ascending: false });

  if (search) {
    ordersQuery = ordersQuery.or(`customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`);
  }

  // For tabs that need pre-filtering on invite status, we handle differently
  if (tab === 'not_sent') {
    // Fetch all delivered orders, then exclude those with invites
    const { data: allOrders, error: allErr } = await ordersQuery;
    if (allErr) {
      console.error('[Review Invites] Orders query error:', allErr);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    const allOrderIds = (allOrders || []).map(o => o.id);
    const invitedIds = new Set<string>();
    if (allOrderIds.length > 0) {
      const { data: invites } = await serviceSupabase
        .from('review_invites')
        .select('order_id')
        .in('order_id', allOrderIds);
      for (const inv of invites || []) invitedIds.add(inv.order_id);
    }

    const notSentOrders = (allOrders || []).filter(o => !invitedIds.has(o.id));
    const paginated = notSentOrders.slice(offset, offset + pageSize);

    const items = paginated.map(order => buildNotSentItem(order));
    const stats = await getStats(serviceSupabase);

    return NextResponse.json({
      invites: items,
      page,
      pageSize,
      total: notSentOrders.length,
      totalPages: Math.ceil(notSentOrders.length / pageSize),
      stats,
    });
  }

  if (tab === 'failed' || tab === 'sent') {
    // These filter by invite status — query review_invites directly
    let invQuery = serviceSupabase
      .from('review_invites')
      .select('*', { count: 'exact' })
      .eq('email_status', tab === 'sent' ? 'sent' : 'failed')
      .order('sent_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (search) {
      invQuery = invQuery.or(`customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }

    const { data: invites, count, error } = await invQuery;
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
    }

    const enriched = await enrichInvites(serviceSupabase, invites || []);
    const stats = await getStats(serviceSupabase);

    return NextResponse.json({
      invites: enriched,
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats,
    });
  }

  if (tab === 'reviewed') {
    // Get all invites, then filter by those with reviews
    const { data: allInvites } = await serviceSupabase
      .from('review_invites')
      .select('*')
      .order('sent_at', { ascending: false });

    const enriched = await enrichInvites(serviceSupabase, allInvites || []);
    const withReviews = enriched.filter(i => i.review !== null);
    const paginated = withReviews.slice(offset, offset + pageSize);
    const stats = await getStats(serviceSupabase);

    return NextResponse.json({
      invites: paginated,
      page,
      pageSize,
      total: withReviews.length,
      totalPages: Math.ceil(withReviews.length / pageSize),
      stats,
    });
  }

  // tab === 'all' — show all delivered orders, merged with invite data
  const { data: allOrders, count: orderCount, error: ordersErr } = await ordersQuery
    .range(offset, offset + pageSize - 1);

  if (ordersErr) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  const orderIds = (allOrders || []).map(o => o.id);

  // Get invites for these orders
  let inviteMap: Record<string, {
    id: string; token: string; sent_at: string; email_status: string;
    resend_message_id: string | null; error_message: string | null; last_resent_at: string | null;
  }> = {};
  if (orderIds.length > 0) {
    const { data: invites } = await serviceSupabase
      .from('review_invites')
      .select('*')
      .in('order_id', orderIds);
    for (const inv of invites || []) {
      inviteMap[inv.order_id] = inv;
    }
  }

  // Get reviews for these orders
  const emails = [...new Set((allOrders || []).map(o => o.customer_email))];
  let reviewMap: Record<string, { id: string; rating: number; status: string; created_at: string }> = {};
  if (emails.length > 0) {
    const { data: reviews } = await serviceSupabase
      .from('reviews')
      .select('id, customer_email, rating, status, created_at, order_id')
      .in('customer_email', emails);
    for (const r of reviews || []) {
      if (r.order_id) reviewMap[r.order_id] = { id: r.id, rating: r.rating, status: r.status, created_at: r.created_at };
      reviewMap[r.customer_email] = { id: r.id, rating: r.rating, status: r.status, created_at: r.created_at };
    }
  }

  const items = (allOrders || []).map(order => {
    const invite = inviteMap[order.id];
    const review = reviewMap[order.id] || reviewMap[order.customer_email] || null;

    if (invite) {
      return {
        id: invite.id,
        order_id: order.id,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        token: invite.token,
        sent_at: invite.sent_at,
        email_status: invite.email_status as 'sent' | 'failed' | 'pending',
        resend_message_id: invite.resend_message_id,
        error_message: invite.error_message,
        last_resent_at: invite.last_resent_at,
        order_number: order.order_number,
        delivered_at: order.delivered_at,
        review: review ? { id: review.id, rating: review.rating, status: review.status, created_at: review.created_at } : null,
      };
    }

    return buildNotSentItem(order, review);
  });

  const stats = await getStats(serviceSupabase);

  return NextResponse.json({
    invites: items,
    page,
    pageSize,
    total: orderCount || 0,
    totalPages: Math.ceil((orderCount || 0) / pageSize),
    stats,
  });
}

function buildNotSentItem(
  order: { id: string; order_number: string; customer_email: string; customer_name: string | null; delivered_at: string | null },
  review?: { id: string; rating: number; status: string; created_at: string } | null,
) {
  return {
    id: `order-${order.id}`,
    order_id: order.id,
    customer_email: order.customer_email,
    customer_name: order.customer_name,
    token: null,
    sent_at: null,
    email_status: 'not_sent' as const,
    resend_message_id: null,
    error_message: null,
    last_resent_at: null,
    order_number: order.order_number,
    delivered_at: order.delivered_at,
    review: review ? { id: review.id, rating: review.rating, status: review.status, created_at: review.created_at } : null,
  };
}

async function enrichInvites(
  db: ReturnType<typeof getServiceSupabase>,
  invites: Array<Record<string, unknown>>,
) {
  const orderIds = [...new Set(invites.map(i => i.order_id as string))];
  const emails = [...new Set(invites.map(i => i.customer_email as string))];

  let orderMap: Record<string, { order_number: string; delivered_at: string | null }> = {};
  if (orderIds.length > 0) {
    const { data: orders } = await db.from('orders').select('id, order_number, delivered_at').in('id', orderIds);
    if (orders) orderMap = Object.fromEntries(orders.map(o => [o.id, { order_number: o.order_number, delivered_at: o.delivered_at }]));
  }

  let reviewMap: Record<string, { id: string; rating: number; status: string; created_at: string }> = {};
  if (emails.length > 0) {
    const { data: reviews } = await db.from('reviews').select('id, customer_email, rating, status, created_at, order_id').in('customer_email', emails);
    for (const r of reviews || []) {
      if (r.order_id) reviewMap[r.order_id] = { id: r.id, rating: r.rating, status: r.status, created_at: r.created_at };
      reviewMap[r.customer_email] = { id: r.id, rating: r.rating, status: r.status, created_at: r.created_at };
    }
  }

  return invites.map(inv => {
    const order = orderMap[inv.order_id as string];
    const review = reviewMap[inv.order_id as string] || reviewMap[inv.customer_email as string] || null;
    return {
      ...inv,
      order_number: order?.order_number || null,
      delivered_at: order?.delivered_at || null,
      review: review ? { id: review.id, rating: review.rating, status: review.status, created_at: review.created_at } : null,
    };
  });
}

async function getStats(db: ReturnType<typeof getServiceSupabase>) {
  const [
    { count: totalDelivered },
    { count: totalInvites },
    { count: totalFailed },
    { count: totalSent },
  ] = await Promise.all([
    db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered').not('delivered_at', 'is', null),
    db.from('review_invites').select('*', { count: 'exact', head: true }),
    db.from('review_invites').select('*', { count: 'exact', head: true }).eq('email_status', 'failed'),
    db.from('review_invites').select('*', { count: 'exact', head: true }).eq('email_status', 'sent'),
  ]);

  // Count reviewed
  const { data: allInviteEmails } = await db.from('review_invites').select('customer_email');
  const allEmails = [...new Set((allInviteEmails || []).map(i => i.customer_email))];
  let reviewedCount = 0;
  if (allEmails.length > 0) {
    const { count: rc } = await db.from('reviews').select('*', { count: 'exact', head: true }).in('customer_email', allEmails);
    reviewedCount = rc || 0;
  }

  const notSent = (totalDelivered || 0) - (totalInvites || 0);

  return {
    totalDelivered: totalDelivered || 0,
    totalInvited: totalInvites || 0,
    notSent: Math.max(0, notSent),
    sent: (totalSent || 0) - reviewedCount,
    reviewed: reviewedCount,
    failed: totalFailed || 0,
  };
}
