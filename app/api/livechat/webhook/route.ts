import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

/**
 * LiveChat.com webhook receiver (Phase 2 #1).
 *
 * Archives public live-chat conversations + transcripts into Supabase so leads
 * live in our own DB, and emails sales when a new chat starts. SEPARATE from the
 * Supabase order_chat_messages ("customer chat") used on authenticated /orders.
 *
 * Supports BOTH LiveChat webhook formats:
 *   - Native "Chat webhooks" (Automate with webhooks), v2 format:
 *       event_type = chat_started | chat_ended, with chat / visitor /
 *       pre_chat_survey data types. `chat_ended` carries the full transcript in
 *       `chat.messages[]`.
 *   - Platform API webhooks (Developer Console): action = incoming_chat |
 *       chat_deactivated, with a `secret_key` in the body.
 *
 * AUTH: the native v2 webhook has no body secret, so secure the Target URL with
 * a query secret, e.g.
 *   https://www.garmentdecor.com/api/livechat/webhook?key=YOUR_SECRET
 * and set the same value as LIVECHAT_WEBHOOK_SECRET. The Platform `secret_key`
 * is also accepted. If no secret is configured, we fall back to matching the
 * payload's license_id against NEXT_PUBLIC_LIVECHAT_LICENSE.
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

function safeEqual(a: unknown, b: unknown): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  try {
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function isAuthorized(request: NextRequest, body: Json): boolean {
  const secret = process.env.LIVECHAT_WEBHOOK_SECRET;
  if (secret) {
    const q = request.nextUrl.searchParams;
    const provided = q.get('key') || q.get('token') || q.get('secret');
    if (safeEqual(provided, secret)) return true; // native v2: secret in URL
    if (safeEqual(body?.secret_key, secret)) return true; // platform: secret in body
    return false;
  }
  // No secret configured — weak fallback: accept only our own license id.
  const license = process.env.NEXT_PUBLIC_LIVECHAT_LICENSE;
  if (license && String(body?.license_id) === String(license)) return true;
  return false;
}

// LiveChat v2 timestamps are unix seconds; guard against ms just in case.
function toIso(ts: unknown): string | null {
  const n = typeof ts === 'number' ? ts : Number(ts);
  if (!n || Number.isNaN(n)) return null;
  const ms = n < 1e12 ? n * 1000 : n;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function mapAuthorType(userType: unknown): string {
  if (userType === 'visitor') return 'customer';
  if (userType === 'agent') return 'agent';
  if (userType === 'supervisor') return 'agent';
  return 'system';
}

// Extract name / email / question from a v2 pre_chat_survey array.
function parseSurvey(survey: Json[]): {
  name?: string;
  email?: string;
  question?: string;
} {
  const out: { name?: string; email?: string; question?: string } = {};
  for (const f of survey || []) {
    const answer = Array.isArray(f?.answer)
      ? f.answer.map((a: Json) => a?.label ?? a).join(', ')
      : f?.answer;
    if (!answer || typeof answer !== 'string') continue;
    const type = String(f?.type || '').toLowerCase();
    const label = String(f?.label || '').toLowerCase();
    if (type === 'email' || label.includes('mail')) out.email = answer;
    else if (type === 'name' || label.includes('name')) out.name = answer;
    else if (type === 'question' || label.includes('question') || label.includes('message'))
      out.question = answer;
    else if (!out.question) out.question = answer; // capture any other free text
  }
  return out;
}

async function notifySales(conv: {
  customer_name: string | null;
  customer_email: string | null;
  customer_question: string | null;
  source_url: string | null;
}) {
  const to = process.env.SALES_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return;

  const name = conv.customer_name || 'Website visitor';
  const email = conv.customer_email ? ` (${conv.customer_email})` : '';
  const question = conv.customer_question
    ? `<div style="background:#f5f5f4;border-radius:8px;padding:16px;margin-bottom:16px;"><p style="margin:0;color:#374151;font-size:14px;">"${conv.customer_question.slice(0, 300)}"</p></div>`
    : '';
  const page = conv.source_url
    ? `<p style="color:#6b7280;margin:0 0 16px;font-size:13px;">On page: ${conv.source_url}</p>`
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
          <h2 style="color:#070131;margin:0 0 8px;">New Live Chat</h2>
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

// Replace the stored transcript for a chat with the full set from chat_ended.
async function replaceTranscript(
  db: ReturnType<typeof getSupabase>,
  chatId: string,
  messages: Json[],
) {
  if (!Array.isArray(messages)) return;
  await db.from('live_chat_messages').delete().eq('chat_id', chatId);
  const rows = messages
    .filter((m) => m && (m.text || m.json))
    .map((m, i) => ({
      chat_id: chatId,
      event_id: `${chatId}:${m.timestamp ?? 'na'}:${i}`,
      author_type: mapAuthorType(m.user_type),
      author_id: m.agent_id || m.author_name || null,
      text: typeof m.text === 'string' ? m.text : null,
      event_type: 'message',
      sent_at: toIso(m.timestamp),
      raw: m,
    }));
  if (rows.length) {
    const { error } = await db.from('live_chat_messages').insert(rows);
    if (error) console.error('[LiveChat webhook] transcript insert error:', error.message);
  }
  await db
    .from('live_chat_conversations')
    .update({ message_count: rows.length })
    .eq('chat_id', chatId);
}

// ---- Native v2 handlers --------------------------------------------------

async function handleV2(db: ReturnType<typeof getSupabase>, body: Json) {
  const eventType = body?.event_type as string | undefined;
  const chat = body?.chat || {};
  const chatId = chat?.id;
  if (!chatId) return;

  const visitor = body?.visitor || {};
  const survey = parseSurvey(body?.pre_chat_survey || []);
  const sourceUrl = chat?.url || visitor?.page_current || null;
  const referrer = chat?.referer || null;

  const base = {
    chat_id: chatId,
    customer_id: visitor?.id || null,
    customer_name: survey.name || visitor?.name || null,
    customer_email: survey.email || visitor?.email || null,
    customer_question: survey.question || null,
    source_url: sourceUrl,
    referrer,
    raw: body,
  };

  const { data: existing } = await db
    .from('live_chat_conversations')
    .select('id, notified_at')
    .eq('chat_id', chatId)
    .maybeSingle();

  if (eventType === 'chat_ended') {
    await db.from('live_chat_conversations').upsert(
      {
        ...base,
        status: 'closed',
        started_at: toIso(chat?.started_timestamp),
        ended_at: toIso(chat?.ended_timestamp) || new Date().toISOString(),
      },
      { onConflict: 'chat_id' },
    );
    await replaceTranscript(db, chatId, chat?.messages || []);
  } else {
    // chat_started (and any other start-like event)
    await db.from('live_chat_conversations').upsert(
      {
        ...base,
        status: 'active',
        started_at: toIso(chat?.started_timestamp) || new Date().toISOString(),
      },
      { onConflict: 'chat_id' },
    );
  }

  // Notify sales once per chat.
  if (!existing?.notified_at) {
    await notifySales(base);
    await db
      .from('live_chat_conversations')
      .update({ notified_at: new Date().toISOString() })
      .eq('chat_id', chatId);
  }
}

// ---- Platform API handlers (Developer Console webhooks) ------------------

async function handlePlatform(db: ReturnType<typeof getSupabase>, body: Json) {
  const action = body?.action as string | undefined;
  const payload = body?.payload || {};

  if (action === 'chat_deactivated') {
    const chatId = payload?.chat_id;
    if (!chatId) return;
    await db
      .from('live_chat_conversations')
      .update({ status: 'closed', ended_at: new Date().toISOString() })
      .eq('chat_id', chatId);
    return;
  }

  if (action === 'incoming_chat') {
    const chat = payload?.chat || {};
    const chatId = chat?.id;
    if (!chatId) return;
    const users: Json[] = chat?.users || [];
    const customer = users.find((u) => u?.type === 'customer');
    const lastVisit = customer?.last_visit || {};
    const lastPages: Json[] = lastVisit?.last_pages || [];

    const base = {
      chat_id: chatId,
      thread_id: chat?.thread?.id || null,
      customer_id: customer?.id || null,
      customer_name: customer?.name || null,
      customer_email: customer?.email || null,
      customer_question: null as string | null,
      source_url: lastPages[lastPages.length - 1]?.url || null,
      referrer: lastVisit?.referrer || null,
      status: 'active' as const,
      started_at: chat?.thread?.created_at || new Date().toISOString(),
      raw: body,
    };

    const { data: existing } = await db
      .from('live_chat_conversations')
      .select('notified_at')
      .eq('chat_id', chatId)
      .maybeSingle();

    await db.from('live_chat_conversations').upsert(base, { onConflict: 'chat_id' });

    if (!existing?.notified_at) {
      await notifySales(base);
      await db
        .from('live_chat_conversations')
        .update({ notified_at: new Date().toISOString() })
        .eq('chat_id', chatId);
    }
  }
}

export async function POST(request: NextRequest) {
  let body: Json;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isAuthorized(request, body)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getSupabase();
    if (body?.event_type) {
      await handleV2(db, body); // native "Chat webhooks" format
    } else if (body?.action) {
      await handlePlatform(db, body); // Platform API format
    } else {
      return NextResponse.json({ ok: true, ignored: 'unknown_format' });
    }
  } catch (err) {
    // 500 → LiveChat retries transient failures (DB blips, etc.).
    console.error('[LiveChat webhook] handler error:', err);
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Simple health check (useful when verifying the URL is reachable).
export async function GET() {
  return NextResponse.json({ ok: true, service: 'livechat-webhook' });
}
