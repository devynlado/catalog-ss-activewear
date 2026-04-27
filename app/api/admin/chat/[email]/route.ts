import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import type { ChatMessage } from '@/lib/chat-helpers';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

async function getOrderIdsForCustomer(db: ReturnType<typeof getServiceSupabase>, email: string) {
  const { data } = await db
    .from('orders')
    .select('id')
    .ilike('customer_email', email);
  return (data || []).map(o => o.id);
}

// GET: Fetch all messages for a customer by email
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { profile } = await getServerProfile();
    if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email: encodedEmail } = await params;
    const customerEmail = decodeURIComponent(encodedEmail).toLowerCase();
    const db = getServiceSupabase();

    // Get messages via order IDs (works regardless of customer_email column)
    const orderIds = await getOrderIdsForCustomer(db, customerEmail);
    let messages: ChatMessage[] = [];

    if (orderIds.length > 0) {
      const { data: msgData } = await db
        .from('order_chat_messages')
        .select('*')
        .in('order_id', orderIds)
        .order('created_at', { ascending: true });
      messages = (msgData || []) as ChatMessage[];

      // Mark customer messages as read
      await db
        .from('order_chat_messages')
        .update({ read_at: new Date().toISOString() })
        .in('order_id', orderIds)
        .eq('sender_type', 'customer')
        .is('read_at', null);
    }

    // Get customer's orders for context
    const { data: orders } = await db
      .from('orders')
      .select('id, order_number, status, created_at')
      .ilike('customer_email', customerEmail)
      .neq('payment_status', 'pending')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      messages,
      orders: orders || [],
    });
  } catch (err) {
    console.error('[Admin Chat Email GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Admin sends a reply to a customer conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { profile } = await getServerProfile();
    if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email: encodedEmail } = await params;
    const customerEmail = decodeURIComponent(encodedEmail).toLowerCase();
    const db = getServiceSupabase();
    const body = await request.json();
    const { content, orderId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Verify orderId belongs to this customer if provided
    let verifiedOrderId: string | null = null;
    if (orderId) {
      const { data: order } = await db
        .from('orders')
        .select('id')
        .eq('id', orderId)
        .ilike('customer_email', customerEmail)
        .single();
      if (order) verifiedOrderId = order.id;
    }

    // If no order specified, use the most recent order (order_id may still be NOT NULL)
    if (!verifiedOrderId) {
      const { data: recentOrder } = await db
        .from('orders')
        .select('id')
        .ilike('customer_email', customerEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      verifiedOrderId = recentOrder?.id || null;
    }

    // Try insert with customer_email first
    let message: ChatMessage | null = null;
    const { data: msg1, error: err1 } = await db
      .from('order_chat_messages')
      .insert({
        order_id: verifiedOrderId,
        customer_email: customerEmail,
        sender_type: 'admin',
        sender_email: profile.email || user.email || 'admin@garmentdecor.com',
        sender_name: profile.full_name || 'Garment Decor Team',
        admin_profile_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (err1) {
      // Fallback: insert without customer_email
      if (!verifiedOrderId) {
        return NextResponse.json({ error: 'Cannot send — no orders found for customer' }, { status: 400 });
      }

      const { data: msg2, error: err2 } = await db
        .from('order_chat_messages')
        .insert({
          order_id: verifiedOrderId,
          sender_type: 'admin',
          sender_email: profile.email || user.email || 'admin@garmentdecor.com',
          sender_name: profile.full_name || 'Garment Decor Team',
          admin_profile_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (err2) {
        console.error('[Admin Chat Email POST] Error:', err2.message);
        return NextResponse.json({ error: err2.message }, { status: 500 });
      }
      message = msg2 as ChatMessage;
    } else {
      message = msg1 as ChatMessage;
    }

    // Get customer name for email notification
    const { data: customerOrder } = await db
      .from('orders')
      .select('customer_name, order_number')
      .ilike('customer_email', customerEmail)
      .neq('payment_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    sendCustomerNotification(
      customerEmail,
      customerOrder?.customer_name || 'Customer',
      customerOrder?.order_number || null,
      content.trim()
    ).catch(() => {});

    return NextResponse.json({ message: message as ChatMessage });
  } catch (err) {
    console.error('[Admin Chat Email POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendCustomerNotification(
  customerEmail: string,
  customerName: string,
  orderNumber: string | null,
  messagePreview: string
) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const orderLine = orderNumber ? ` regarding order ${orderNumber}` : '';

    await resend.emails.send({
      from: 'Garment Decor <orders@garmentdecor.com>',
      to: customerEmail,
      subject: `New message from Garment Decor${orderNumber ? ` — ${orderNumber}` : ''}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #070131; margin: 0 0 8px;">Hi ${customerName.split(' ')[0]},</h2>
          <p style="color: #6b7280; margin: 0 0 16px;">You have a new reply${orderLine}:</p>
          <div style="background: #f5f5f4; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0; color: #374151; font-size: 14px;">"${messagePreview.length > 300 ? messagePreview.substring(0, 300) + '...' : messagePreview}"</p>
          </div>
          <a href="https://www.garmentdecor.com/orders" style="display: inline-block; background: #EE8935; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">View Your Orders</a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">You can reply directly from your order tracking page.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Chat] Customer email error:', err);
  }
}
