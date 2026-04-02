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

// GET: Fetch chat messages for an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getOrderSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderNumber } = await params;
  const db = getSupabase();

  // Verify the order belongs to this customer
  const { data: order, error: orderErr } = await db
    .from('orders')
    .select('id')
    .eq('order_number', orderNumber)
    .ilike('customer_email', session.email)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const { data: messages, error } = await db
    .from('order_chat_messages')
    .select('*')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark admin messages as read
  await db
    .from('order_chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('order_id', order.id)
    .eq('sender_type', 'admin')
    .is('read_at', null);

  return NextResponse.json({ messages: messages as ChatMessage[], orderId: order.id });
}

// POST: Customer sends a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getOrderSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderNumber } = await params;
  const db = getSupabase();

  const { data: order, error: orderErr } = await db
    .from('orders')
    .select('id, customer_name, customer_email')
    .eq('order_number', orderNumber)
    .ilike('customer_email', session.email)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const body = await request.json();
  const { content, attachmentUrl } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
  }

  const { data: message, error } = await db
    .from('order_chat_messages')
    .insert({
      order_id: order.id,
      sender_type: 'customer',
      sender_email: session.email,
      sender_name: session.customer.name || order.customer_name,
      content: content.trim(),
      attachment_url: attachmentUrl || null,
      attachment_type: attachmentUrl ? 'image' : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send email notification to admin (non-blocking)
  sendAdminNotification(
    orderNumber,
    session.customer.name || order.customer_name || session.email,
    content.trim()
  ).catch(err => console.error('[Chat] Admin notification failed:', err));

  // Auto-reply if outside business hours
  if (!isBusinessHours()) {
    // Check if we already sent an auto-reply recently (within 4 hours)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data: recentAutoReply } = await db
      .from('order_chat_messages')
      .select('id')
      .eq('order_id', order.id)
      .eq('is_auto_reply', true)
      .gte('created_at', fourHoursAgo)
      .limit(1);

    if (!recentAutoReply?.length) {
      sendAutoReply(order.id, session.email, session.customer.name).catch(
        err => console.error('[Chat] Auto-reply failed:', err)
      );
    }
  }

  return NextResponse.json({ message: message as ChatMessage });
}

async function sendAdminNotification(orderNumber: string, customerName: string, messagePreview: string) {
  const adminEmail = process.env.SALES_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Garment Decor <orders@garmentdecor.com>',
      to: adminEmail,
      subject: `New chat message from ${customerName} — ${orderNumber}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #070131; margin: 0 0 8px;">New Customer Message</h2>
          <p style="color: #6b7280; margin: 0 0 16px;">Order <strong>${orderNumber}</strong> — ${customerName}</p>
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
