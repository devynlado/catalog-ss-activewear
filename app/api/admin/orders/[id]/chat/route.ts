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

// GET: Fetch chat messages for an order (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: orderId } = await params;
  const db = getServiceSupabase();

  const { data: messages, error } = await db
    .from('order_chat_messages')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark customer messages as read
  await db
    .from('order_chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .eq('sender_type', 'customer')
    .is('read_at', null);

  return NextResponse.json({ messages: messages as ChatMessage[] });
}

// POST: Admin sends a reply
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: orderId } = await params;
  const db = getServiceSupabase();
  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
  }

  // Get order details for notification
  const { data: order } = await db
    .from('orders')
    .select('order_number, customer_email, customer_name')
    .eq('id', orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const { data: message, error } = await db
    .from('order_chat_messages')
    .insert({
      order_id: orderId,
      customer_email: order.customer_email?.toLowerCase() || null,
      sender_type: 'admin',
      sender_email: profile.email || user.email || 'admin@garmentdecor.com',
      sender_name: profile.full_name || 'Garment Decor Team',
      admin_profile_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send email notification to customer (non-blocking)
  if (order.customer_email) {
    sendCustomerNotification(
      order.customer_email,
      order.customer_name || 'Customer',
      order.order_number,
      content.trim()
    ).catch(err => console.error('[Chat] Customer notification failed:', err));
  }

  return NextResponse.json({ message: message as ChatMessage });
}

async function sendCustomerNotification(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  messagePreview: string
) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Garment Decor <orders@garmentdecor.com>',
      to: customerEmail,
      subject: `New reply on your order ${orderNumber} — Garment Decor`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #070131; margin: 0 0 8px;">Hi ${customerName.split(' ')[0]},</h2>
          <p style="color: #6b7280; margin: 0 0 16px;">You have a new reply on order <strong>${orderNumber}</strong>:</p>
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
