import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Pacific Time business hours: Mon-Fri 8 AM to 6 PM
const BUSINESS_HOURS = {
  start: 8,
  end: 18,
  timezone: 'America/Los_Angeles',
};

export function isBusinessHours(): boolean {
  const now = new Date();
  const ptTime = new Date(now.toLocaleString('en-US', { timeZone: BUSINESS_HOURS.timezone }));
  const day = ptTime.getDay();
  const hour = ptTime.getHours();

  if (day === 0 || day === 6) return false;
  return hour >= BUSINESS_HOURS.start && hour < BUSINESS_HOURS.end;
}

export function getAutoReplyMessage(): string {
  return "Thank you for your message! Our team is currently offline. We're available Monday–Friday, 8 AM – 6 PM Pacific Time. We'll get back to you as soon as possible during business hours.";
}

export async function sendAutoReply(orderId: string, customerEmail: string, customerName: string | null) {
  const db = getServiceSupabase();

  const { error } = await db.from('order_chat_messages').insert({
    order_id: orderId,
    sender_type: 'admin',
    sender_email: 'system@garmentdecor.com',
    sender_name: 'Garment Decor',
    content: getAutoReplyMessage(),
    is_auto_reply: true,
  });

  if (error) {
    console.error('[Chat] Auto-reply insert error:', error.message);
  }
}

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_type: 'customer' | 'admin';
  sender_email: string;
  sender_name: string | null;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  read_at: string | null;
  is_auto_reply: boolean;
  created_at: string;
}

export interface ConversationSummary {
  order_id: string;
  order_number: string;
  customer_name: string | null;
  customer_email: string;
  last_message: string;
  last_message_at: string;
  last_sender_type: 'customer' | 'admin';
  unread_count: number;
  order_status: string;
}
