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

// GET: Fetch all conversations with unread counts
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getServiceSupabase();
  const searchParams = request.nextUrl.searchParams;
  const filter = searchParams.get('filter') || 'all'; // all, unread

  // Get all orders that have chat messages, with the latest message
  const { data: chatOrders, error } = await db
    .from('order_chat_messages')
    .select('order_id')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Unique order IDs
  const orderIds = [...new Set(chatOrders?.map(m => m.order_id) || [])];

  if (orderIds.length === 0) {
    return NextResponse.json({ conversations: [] });
  }

  // Fetch order details for these orders
  const { data: orders } = await db
    .from('orders')
    .select('id, order_number, customer_name, customer_email, status')
    .in('id', orderIds);

  const orderMap = new Map((orders || []).map(o => [o.id, o]));

  // Build conversation summaries
  const conversations: ConversationSummary[] = [];

  for (const orderId of orderIds) {
    const order = orderMap.get(orderId);
    if (!order) continue;

    // Latest message
    const { data: lastMsg } = await db
      .from('order_chat_messages')
      .select('content, sender_type, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Unread customer messages count
    const { count: unreadCount } = await db
      .from('order_chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId)
      .eq('sender_type', 'customer')
      .is('read_at', null);

    if (filter === 'unread' && (unreadCount || 0) === 0) continue;

    conversations.push({
      order_id: orderId,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      last_message: lastMsg?.content || '',
      last_message_at: lastMsg?.created_at || '',
      last_sender_type: lastMsg?.sender_type || 'customer',
      unread_count: unreadCount || 0,
      order_status: order.status,
    });
  }

  // Sort by last_message_at desc, unread first
  conversations.sort((a, b) => {
    if (a.unread_count > 0 && b.unread_count === 0) return -1;
    if (a.unread_count === 0 && b.unread_count > 0) return 1;
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });

  // Total unread count across all conversations
  const { count: totalUnread } = await db
    .from('order_chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_type', 'customer')
    .is('read_at', null);

  return NextResponse.json({
    conversations,
    totalUnread: totalUnread || 0,
  });
}
