import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import type { ConversationSummary } from '@/lib/chat-helpers';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// GET: Fetch all conversations grouped by customer
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { profile } = await getServerProfile();
    if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getServiceSupabase();
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'all';

    // Get all orders that have chat messages — group by customer email via orders table
    const { data: chatOrders } = await db
      .from('order_chat_messages')
      .select('order_id')
      .not('order_id', 'is', null)
      .order('created_at', { ascending: false });

    const orderIds = [...new Set(chatOrders?.map(m => m.order_id).filter(Boolean) || [])];
    if (orderIds.length === 0) {
      return NextResponse.json({ conversations: [], totalUnread: 0 });
    }

    // Get order details to map order_id -> customer_email
    const { data: orders } = await db
      .from('orders')
      .select('id, order_number, customer_name, customer_email, status')
      .in('id', orderIds);

    // Group by customer_email
    const emailOrderMap = new Map<string, typeof orders>();
    for (const order of (orders || [])) {
      const email = order.customer_email?.toLowerCase();
      if (!email) continue;
      if (!emailOrderMap.has(email)) emailOrderMap.set(email, []);
      emailOrderMap.get(email)!.push(order);
    }

    const conversations: ConversationSummary[] = [];

    for (const [email, custOrders] of emailOrderMap.entries()) {
      if (!custOrders) continue;
      const custOrderIds = custOrders.map(o => o.id);

      // Latest message across all this customer's orders
      const { data: lastMsg } = await db
        .from('order_chat_messages')
        .select('content, sender_type, created_at')
        .in('order_id', custOrderIds)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Unread customer messages count
      const { count: unreadCount } = await db
        .from('order_chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('order_id', custOrderIds)
        .eq('sender_type', 'customer')
        .is('read_at', null);

      if (filter === 'unread' && (unreadCount || 0) === 0) continue;

      // Customer name from messages or orders
      let customerName: string | null = null;
      const { data: nameMsg } = await db
        .from('order_chat_messages')
        .select('sender_name')
        .in('order_id', custOrderIds)
        .eq('sender_type', 'customer')
        .not('sender_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      customerName = nameMsg?.sender_name || null;
      if (!customerName) {
        const namedOrder = custOrders.find(o => o.customer_name);
        customerName = namedOrder?.customer_name || null;
      }

      // All orders for this customer (not just ones with messages)
      const { data: allOrders } = await db
        .from('orders')
        .select('id, order_number, status')
        .ilike('customer_email', email)
        .neq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      const latestOrder = allOrders?.[0] || custOrders[0] || null;

      conversations.push({
        customer_email: email,
        customer_name: customerName,
        order_count: allOrders?.length || custOrders.length,
        last_message: lastMsg?.content || '',
        last_message_at: lastMsg?.created_at || '',
        last_sender_type: (lastMsg?.sender_type as 'customer' | 'admin') || 'customer',
        unread_count: unreadCount || 0,
        latest_order_number: latestOrder?.order_number || null,
        latest_order_status: latestOrder?.status || null,
      });
    }

    // Sort: unread first, then by last_message_at desc
    conversations.sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (a.unread_count === 0 && b.unread_count > 0) return 1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    const { count: totalUnread } = await db
      .from('order_chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_type', 'customer')
      .is('read_at', null);

    return NextResponse.json({
      conversations,
      totalUnread: totalUnread || 0,
    });
  } catch (err) {
    console.error('[Admin Chat] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
