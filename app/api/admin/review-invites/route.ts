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
 * GET /api/admin/review-invites?tab=all|sent|reviewed|pending|failed&page=1&search=
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

  // Fetch invites
  let query = serviceSupabase
    .from('review_invites')
    .select('*', { count: 'exact' })
    .order('sent_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (tab === 'failed') {
    query = query.eq('email_status', 'failed');
  } else if (tab === 'sent') {
    query = query.eq('email_status', 'sent');
  }

  if (search) {
    query = query.or(`customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`);
  }

  const { data: invites, count, error } = await query;

  if (error) {
    console.error('[Admin Review Invites] Query error:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }

  // Collect order_ids and emails to cross-reference with reviews and orders
  const orderIds = [...new Set((invites || []).map(i => i.order_id))];
  const emails = [...new Set((invites || []).map(i => i.customer_email))];

  // Fetch orders for order_number
  let orderMap: Record<string, { order_number: string; delivered_at: string | null }> = {};
  if (orderIds.length > 0) {
    const { data: orders } = await serviceSupabase
      .from('orders')
      .select('id, order_number, delivered_at')
      .in('id', orderIds);
    if (orders) {
      orderMap = Object.fromEntries(orders.map(o => [o.id, { order_number: o.order_number, delivered_at: o.delivered_at }]));
    }
  }

  // Fetch reviews by these emails to determine who has reviewed
  let reviewMap: Record<string, { id: string; rating: number; status: string; created_at: string }> = {};
  if (emails.length > 0) {
    const { data: reviews } = await serviceSupabase
      .from('reviews')
      .select('id, customer_email, rating, status, created_at, order_id')
      .in('customer_email', emails);
    if (reviews) {
      for (const r of reviews) {
        const key = r.order_id || r.customer_email;
        if (!reviewMap[key]) {
          reviewMap[key] = { id: r.id, rating: r.rating, status: r.status, created_at: r.created_at };
        }
      }
      for (const r of reviews) {
        reviewMap[r.customer_email] = { id: r.id, rating: r.rating, status: r.status, created_at: r.created_at };
      }
    }
  }

  const enriched = (invites || []).map(inv => {
    const order = orderMap[inv.order_id];
    const review = reviewMap[inv.order_id] || reviewMap[inv.customer_email] || null;
    return {
      ...inv,
      order_number: order?.order_number || null,
      delivered_at: order?.delivered_at || null,
      review: review ? {
        id: review.id,
        rating: review.rating,
        status: review.status,
        created_at: review.created_at,
      } : null,
    };
  });

  // Apply tab filtering for 'reviewed' and 'pending' (post-query since they depend on join)
  let filtered = enriched;
  if (tab === 'reviewed') {
    filtered = enriched.filter(i => i.review !== null);
  } else if (tab === 'pending') {
    filtered = enriched.filter(i => i.review === null && i.email_status === 'sent');
  }

  // Stats (aggregate counts) — fetch in parallel for the stats bar
  const [
    { count: totalInvites },
    { count: totalFailed },
    { count: totalSent },
  ] = await Promise.all([
    serviceSupabase.from('review_invites').select('*', { count: 'exact', head: true }),
    serviceSupabase.from('review_invites').select('*', { count: 'exact', head: true }).eq('email_status', 'failed'),
    serviceSupabase.from('review_invites').select('*', { count: 'exact', head: true }).eq('email_status', 'sent'),
  ]);

  // Count reviewed (need to join)
  const { data: allInviteEmails } = await serviceSupabase
    .from('review_invites')
    .select('customer_email');
  const allEmails = [...new Set((allInviteEmails || []).map(i => i.customer_email))];
  let reviewedCount = 0;
  if (allEmails.length > 0) {
    const { count: rc } = await serviceSupabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .in('customer_email', allEmails);
    reviewedCount = rc || 0;
  }

  return NextResponse.json({
    invites: filtered,
    page,
    pageSize,
    total: tab === 'reviewed' || tab === 'pending' ? filtered.length : (count || 0),
    totalPages: tab === 'reviewed' || tab === 'pending'
      ? 1
      : Math.ceil((count || 0) / pageSize),
    stats: {
      total: totalInvites || 0,
      sent: (totalSent || 0) - reviewedCount,
      reviewed: reviewedCount,
      failed: totalFailed || 0,
    },
  });
}
