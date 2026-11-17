import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

/**
 * LiveChat.com webhook receiver (Phase 2 #1).
 *
 * Archives public live-chat conversations + transcripts into Supabase so leads
 * live in our own DB, and emails sales when a new chat starts. Register this
 * endpoint in the LiveChat Developer Console with a secret, set that same value
 * as LIVECHAT_WEBHOOK_SECRET, and subscribe to:
 *   - incoming_chat       (a visitor started a chat)
 *   - incoming_event      (a new message/form in a chat)
 *   - chat_deactivated    (a chat ended)
 *
 * This is SEPARATE from the Supabase order_chat_messages ("customer chat").
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

function secretMatches(provided: unknown): boolean {
  const expected = process.env.LIVECHAT_WEBHOOK_SECRET;
  if (!expected) return false; // endpoint stays closed until a secret is set
  if (typeof provided !== 'string' || provided.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function authorType(authorId: string | null, customerId: string | null): string {
  if (!authorId) return 'unknown';
  if (customerId && authorId === customerId) return 'customer';
  // LiveChat system/bot authors look like "system" or have no customer match.
  if (/system|bot/i.test(authorId)) return 'system';
  return 'agent';
}

// Pull name / email / question out of a pre-chat "filled_form" event.
function parseFilledForm(event: Json): {
  name?: string;
  email?: string;
  question?: string;
} {
  const out: { name?: string; email?: string; question?: string } = {};
  const fields: Json[] = event?.fields || [];
  for (const f of fields) {
    const label = String(f?.label || f?.name || '').toLowerCase();
    const value =
      typeof f?.value === 'string'
        ? f.value
        : Array.isArray(f?.values)
          ? f.values.join(', ')
          : '';
    if (!value) continue;
    if (label.includes('mail')) out.email = value;
    else if (label.includes('name')) out.name = value;
    else if (label.includes('question') || label.includes('message')) out.question = value;
  }
  return out;
}

async function storeEvent(
  db: ReturnType<typeof getSupabase>,
  chatId: string,
  event: Json,
  customerId: string | null,
) {
  if (!event || !chatId) return;
  const row = {
    chat_id: chatId,
    event_id: event.id || null,
    author_type: authorType(event.author_id || null, customerId),
    author_id: event.author_id || null,
    text:
      typeof event.text === 'string'
        ? event.text
        : event.type === 'filled_form'
          ? JSON.stringify(parseFilledForm(event))
          : null,
    event_type: event.type || null,
    sent_at: event.created_at || null,
    raw: event,
  };
  const { error } = await db.from('live_chat_messages').insert(row);
  // 23505 = duplicate event_id (webhook re-delivery) — safe to ignore.
  if (error && error.code !== '23505') {
    console.error('[LiveChat webhook] storeEvent error:', error.message);
  }
}

async function refreshMessageCount(
  db: ReturnType<typeof getSupabase>,
  chatId: string,
) {
  const { count } = await db
    .from('live_chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('chat_id', chatId);
  if (typeof count === 'number') {
    await db
      .from('live_chat_conversations')
      .update({ message_count: count })
      .eq('chat_id', chatId);
  }
}

async function notifySales(conversation: {
  customer_name: string | null;
  customer_email: string | null;
  customer_question: string | null;
  source_url: string | null;
  chat_id: string;
}) {
  const to = process.env.SALES_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return;

  const name = conversation.customer_name || 'Website visitor';
  const email = conversation.customer_email ? ` (${conversation.customer_email})` : '';
  const question = conversation.customer_question
    ? `<div style="background:#f5f5f4;border-radius:8px;padding:16px;margin-bottom:16px;"><p style="margin:0;color:#374151;font-size:14px;">"${conversation.customer_question.slice(0, 300)}"</p></div>`
    : '';
  const page = conversation.source_url
    ? `<p style="color:#6b7280;margin:0 0 16px;font-size:13px;">On page: ${conversation.source_url}</p>`
    : '';

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Garment Decor <orders@garmentdecor.com>',
      to,
      subject: `New live chat from ${name}`,
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
          <h2 style="color:#070131;margin:0 0 8px;">New Live Chat Started</h2>
          <p style="color:#6b7280;margin:0 0 8px;">${name}${email}</p>
          ${page}
          ${question}
          <a href="https://my.livechat.com/archives" style="display:inline-block;background:#EE8935;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Open in LiveChat</a>
        </div>
      `,
    });
  } catch (err) {
    console.error('[LiveChat webhook] notifySales error:', err);
  }
}

async function handleIncomingChat(db: ReturnType<typeof getSupabase>, payload: Json) {
  const chat = payload?.chat;
  const chatId = chat?.id;
  if (!chatId) return;

  const thread = chat?.thread;
  const users: Json[] = chat?.users || [];
  const customer = users.find((u) => u?.type === 'customer');
  const lastVisit = customer?.last_visit || {};
  const lastPages: Json[] = lastVisit?.last_pages || [];
  const sourceUrl = lastPages[lastPages.length - 1]?.url || null;
  const referrer = lastVisit?.referrer || null;

  // Pre-chat form may arrive inside the thread events.
  const events: Json[] = thread?.events || [];
  let formData: { name?: string; email?: string; question?: string } = {};
  for (const ev of events) {
    if (ev?.type === 'filled_form') formData = { ...formData, ...parseFilledForm(ev) };
  }

  const conversation = {
    chat_id: chatId,
    thread_id: thread?.id || null,
    customer_id: customer?.id || null,
    customer_name: formData.name || customer?.name || null,
    customer_email: formData.email || customer?.email || null,
    customer_question: formData.question || null,
    source_url: sourceUrl,
    referrer,
    status: 'active' as const,
    started_at: thread?.created_at || new Date().toISOString(),
    raw: payload,
  };

  // Upsert by chat_id so re-deliveries don't create duplicates.
  const { data: existing } = await db
    .from('live_chat_conversations')
    .select('id, notified_at')
    .eq('chat_id', chatId)
    .maybeSingle();

  await db
    .from('live_chat_conversations')
    .upsert(conversation, { onConflict: 'chat_id' });

  // Archive any events that came with the chat.
  for (const ev of events) {
    await storeEvent(db, chatId, ev, customer?.id || null);
  }
  await refreshMessageCount(db, chatId);

  // Notify sales once per chat.
  if (!existing?.notified_at) {
    await notifySales(conversation);
    await db
      .from('live_chat_conversations')
      .update({ notified_at: new Date().toISOString() })
      .eq('chat_id', chatId);
  }
}

async function handleIncomingEvent(db: ReturnType<typeof getSupabase>, payload: Json) {
  const chatId = payload?.chat_id;
  const event = payload?.event;
  if (!chatId || !event) return;

  const { data: conv } = await db
    .from('live_chat_conversations')
    .select('customer_id')
    .eq('chat_id', chatId)
    .maybeSingle();

  await storeEvent(db, chatId, event, conv?.customer_id || null);
  await refreshMessageCount(db, chatId);

  // Keep lead details fresh if a form is submitted mid-chat.
  if (event.type === 'filled_form') {
    const form = parseFilledForm(event);
    const patch: Record<string, string> = {};
    if (form.name) patch.customer_name = form.name;
    if (form.email) patch.customer_email = form.email;
    if (form.question) patch.customer_question = form.question;
    if (Object.keys(patch).length) {
      await db.from('live_chat_conversations').update(patch).eq('chat_id', chatId);
    }
  }
}

async function handleChatDeactivated(db: ReturnType<typeof getSupabase>, payload: Json) {
  const chatId = payload?.chat_id;
  if (!chatId) return;
  await db
    .from('live_chat_conversations')
    .update({ status: 'closed', ended_at: new Date().toISOString() })
    .eq('chat_id', chatId);
}

export async function POST(request: NextRequest) {
  let body: Json;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // LiveChat includes the registration secret in the payload.
  if (!secretMatches(body?.secret_key)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = body?.action as string | undefined;
  const payload = body?.payload;

  try {
    const db = getSupabase();
    switch (action) {
      case 'incoming_chat':
        await handleIncomingChat(db, payload);
        break;
      case 'incoming_event':
        await handleIncomingEvent(db, payload);
        break;
      case 'chat_deactivated':
        await handleChatDeactivated(db, payload);
        break;
      default:
        // Unhandled action — acknowledge so LiveChat doesn't retry.
        return NextResponse.json({ ok: true, ignored: action || 'unknown' });
    }
  } catch (err) {
    // Return 500 so LiveChat retries transient failures (DB blips, etc.).
    console.error('[LiveChat webhook] handler error:', err);
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Simple health check (useful when verifying the URL is reachable).
export async function GET() {
  return NextResponse.json({ ok: true, service: 'livechat-webhook' });
}
