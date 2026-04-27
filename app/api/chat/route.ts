import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrderSession } from '@/lib/order-session';
import { isBusinessHours, sendAutoReply, type ChatMessage } from '@/lib/chat-helpers';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

async function getCustomerOrderIds(db: ReturnType<typeof getSupabase>, email: string) {
  const { data: orders } = await db
    .from('orders')
    .select('id')
    .ilike('customer_email', email);
  return (orders || []).map(o => o.id);
}

// GET: Fetch all chat messages for the authenticated customer
export async function GET() {
  try {
    const session = await getOrderSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getSupabase();
    const email = session.email.toLowerCase();

    // Try customer_email column, fall back to order-based lookup
    let messages: ChatMessage[] = [];
    const { data: msgData, error: msgError } = await db
      .from('order_chat_messages')
      .select('*')
      .ilike('customer_email', email)
      .order('created_at', { ascending: true });

    if (msgError) {
      // Fallback: query via orders table
      const orderIds = await getCustomerOrderIds(db, email);
      if (orderIds.length > 0) {
        const { data: fallbackMsgs } = await db
          .from('order_chat_messages')
          .select('*')
          .in('order_id', orderIds)
          .order('created_at', { ascending: true });
        messages = (fallbackMsgs || []) as ChatMessage[];
      }

      // Mark admin messages as read via order_id
      if (orderIds.length > 0) {
        await db
          .from('order_chat_messages')
          .update({ read_at: new Date().toISOString() })
          .in('order_id', orderIds)
          .eq('sender_type', 'admin')
          .is('read_at', null);
      }
    } else {
      messages = (msgData || []) as ChatMessage[];
      // Mark admin messages as read
      await db
        .from('order_chat_messages')
        .update({ read_at: new Date().toISOString() })
        .ilike('customer_email', email)
        .eq('sender_type', 'admin')
        .is('read_at', null);
    }

    // Fetch customer's orders for the optional order picker
    const { data: orders } = await db
      .from('orders')
      .select('id, order_number, status')
      .ilike('customer_email', email)
      .neq('payment_status', 'pending')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      messages,
      orders: orders || [],
      customerEmail: email,
    });
  } catch (err) {
    console.error('[Chat GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Customer sends a message (with optional order context)
export async function POST(request: NextRequest) {
  try {
    const session = await getOrderSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getSupabase();
    const email = session.email.toLowerCase();
    const body = await request.json();
    const { content, attachmentUrl, orderId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // If orderId is provided, verify it belongs to this customer
    let verifiedOrderId: string | null = null;
    let orderNumber: string | null = null;
    if (orderId) {
      const { data: order } = await db
        .from('orders')
        .select('id, order_number')
        .eq('id', orderId)
        .ilike('customer_email', email)
        .single();
      if (order) {
        verifiedOrderId = order.id;
        orderNumber = order.order_number;
      }
    }

    // Try insert with customer_email first
    let message: ChatMessage | null = null;
    const { data: msg1, error: err1 } = await db
      .from('order_chat_messages')
      .insert({
        order_id: verifiedOrderId,
        customer_email: email,
        sender_type: 'customer',
        sender_email: email,
        sender_name: session.customer.name || null,
        content: content.trim(),
        attachment_url: attachmentUrl || null,
        attachment_type: attachmentUrl ? 'image' : null,
      })
      .select()
      .single();

    if (err1) {
      // Fallback: insert without customer_email (column doesn't exist yet)
      let fallbackOrderId = verifiedOrderId;
      if (!fallbackOrderId) {
        const { data: recentOrder } = await db
          .from('orders')
          .select('id')
          .ilike('customer_email', email)
          .neq('payment_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        fallbackOrderId = recentOrder?.id || null;
      }

      if (!fallbackOrderId) {
        return NextResponse.json({ error: 'No orders found' }, { status: 400 });
      }

      const { data: msg2, error: err2 } = await db
        .from('order_chat_messages')
        .insert({
          order_id: fallbackOrderId,
          sender_type: 'customer',
          sender_email: email,
          sender_name: session.customer.name || null,
          content: content.trim(),
          attachment_url: attachmentUrl || null,
          attachment_type: attachmentUrl ? 'image' : null,
        })
        .select()
        .single();

      if (err2) {
        console.error('[Chat POST] Insert error:', err2.message);
        return NextResponse.json({ error: err2.message }, { status: 500 });
      }
      message = msg2 as ChatMessage;
    } else {
      message = msg1 as ChatMessage;
    }

    // Send email notification to admin (non-blocking, fire-and-forget)
    sendAdminNotification(
      email,
      session.customer.name || email,
      content.trim(),
      orderNumber,
    ).catch(() => {});

    // Auto-reply if outside business hours (non-blocking)
    try {
      if (!isBusinessHours()) {
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        const orderIds = await getCustomerOrderIds(db, email);

        let hasRecentAutoReply = false;
        if (orderIds.length > 0) {
          const { data: recentAR } = await db
            .from('order_chat_messages')
            .select('id')
            .in('order_id', orderIds)
            .eq('is_auto_reply', true)
            .gte('created_at', fourHoursAgo)
            .limit(1);
          hasRecentAutoReply = (recentAR?.length || 0) > 0;
        }

        if (!hasRecentAutoReply) {
          sendAutoReply(email, session.customer.name, verifiedOrderId).catch(() => {});
        }
      }
    } catch {
      // Auto-reply is best-effort
    }

    return NextResponse.json({ message: message as ChatMessage });
  } catch (err) {
    console.error('[Chat POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendAdminNotification(
  customerEmail: string,
  customerName: string,
  messagePreview: string,
  orderNumber: string | null,
) {
  const adminEmail = process.env.SALES_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const orderLine = orderNumber ? ` — Order ${orderNumber}` : '';

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Garment Decor <orders@garmentdecor.com>',
      to: adminEmail,
      subject: `New chat message from ${customerName}${orderLine}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #070131; margin: 0 0 8px;">New Customer Message</h2>
          <p style="color: #6b7280; margin: 0 0 16px;">${customerName} (${customerEmail})${orderLine}</p>
          <div style="background: #f5f5f4; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0; color: #374151; font-size: 14px;">"${messagePreview.length > 300 ? messagePreview.substring(0, 300) + '...' : messagePreview}"</p>
          </div>
          <a href="https://www.garmentdecor.com/admin/chat" style="display: inline-block; background: #EE8935; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">View in Dashboard</a>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Chat] Email notification error:', err);
  }
}
