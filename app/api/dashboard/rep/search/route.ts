import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerProfile } from '@/lib/supabase-server';
import { enrichItemsWithArtwork, getArtworkLinks } from '@/lib/artwork-server';

/**
 * GET /api/dashboard/rep/search?email=<client email>
 *
 * Sales-rep (and admin) lookup of a single client's quotes + leads by EMAIL
 * only (names are too collision-prone). Read-only: returns trimmed records with
 * artwork metadata (path/name/isImage) but NEVER a direct signed URL — downloads
 * must go through /api/dashboard/rep/artwork so every download is audit-logged.
 *
 * Fields intentionally omitted from the response (not needed by reps and/or
 * internal attribution): visitor_source, source (LP page), gclid/gbraid/wbraid,
 * offline_conv_*, qualified_at, assigned_sales_rep_id, customer_id.
 *
 * Every successful lookup is recorded to admin_activity_log (one row per record
 * viewed, keyed by record id — no client email/name in the log per the no-PII
 * convention).
 */

// Untyped service client: lets us read `artwork_paths` (added in migration 050
// but not yet in database.types) and bypass RLS, same pattern as the crons.
function getServiceSupabase() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getClientIp(request: NextRequest): string | null {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip') || null;
}

interface ViewLogRow {
  resource_type: 'quote' | 'contact';
  resource_id: string;
  summary: string;
}

export async function GET(request: NextRequest) {
  // --- Auth: sales_rep or admin only ---
  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const emailRaw = new URL(request.url).searchParams.get('email') || '';
  const email = emailRaw.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json(
      { error: 'Please enter a valid client email.' },
      { status: 400 },
    );
  }

  const supabase = getServiceSupabase();

  // Case-insensitive EXACT match (ilike without wildcards). Email is the only
  // search key — precise and avoids pulling another client's records.
  const [quotesRes, leadsRes] = await Promise.all([
    supabase
      .from('quotes')
      .select(
        'id, quote_id, customer_name, customer_email, customer_phone, company, items, decoration, finishing, decoration_methods, notes, subtotal, status, created_at',
      )
      .ilike('customer_email', email)
      .order('created_at', { ascending: false }),
    supabase
      .from('contacts')
      .select(
        'id, name, email, phone, company, service, message, quantity, status, is_spam, created_at, artwork_paths',
      )
      .ilike('email', email)
      .order('created_at', { ascending: false }),
  ]);

  if (quotesRes.error || leadsRes.error) {
    console.error(
      '[Rep Search] Query error:',
      quotesRes.error || leadsRes.error,
    );
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }

  // Enrich quote items with artwork metadata, then strip the signed URL so the
  // client can only download via the audited endpoint.
  const quotes = await Promise.all(
    (quotesRes.data || []).map(async (q) => {
      const rawItems = Array.isArray(q.items)
        ? (q.items as Array<Record<string, unknown>>)
        : [];
      const enriched = await enrichItemsWithArtwork(rawItems);
      const items = enriched.map((it) => {
        // Drop the transient signed URL; keep path/name/isImage for the button.
        const { artworkUrl: _drop, ...rest } = it as typeof it & {
          artworkUrl?: string | null;
        };
        void _drop;
        return rest;
      });
      return { ...q, items };
    }),
  );

  // Enrich lead artwork; strip URLs (keep path/name/isImage).
  const leads = await Promise.all(
    (leadsRes.data || []).map(async (c) => {
      const paths = Array.isArray(c.artwork_paths) ? c.artwork_paths : [];
      const links = paths.length ? await getArtworkLinks(paths) : [];
      const artwork = links.map((l) => ({
        path: l.path,
        name: l.name,
        isImage: l.isImage,
      }));
      const { artwork_paths: _omit, ...rest } = c as typeof c & {
        artwork_paths?: string[] | null;
      };
      void _omit;
      return { ...rest, artwork };
    }),
  );

  // --- Audit: record the "view" of each returned record (ids only, no PII) ---
  try {
    const rows: ViewLogRow[] = [
      ...quotes.map((q) => ({
        resource_type: 'quote' as const,
        resource_id: q.id as string,
        summary: 'viewed a quote via client lookup',
      })),
      ...leads.map((l) => ({
        resource_type: 'contact' as const,
        resource_id: l.id as string,
        summary: 'viewed a lead via client lookup',
      })),
    ];

    if (rows.length > 0) {
      const actorName =
        (profile.full_name && profile.full_name.trim()) ||
        (profile.email ? profile.email.split('@')[0] : null) ||
        'Unknown user';
      const ip = getClientIp(request);
      const ua = request.headers.get('user-agent');

      const { error: logErr } = await supabase.from('admin_activity_log').insert(
        rows.map((r) => ({
          actor_id: profile.id,
          actor_name: actorName,
          actor_role: profile.role,
          action: 'rep.view',
          resource_type: r.resource_type,
          resource_id: r.resource_id,
          summary: r.summary,
          ip_address: ip,
          user_agent: ua,
          is_alert: false,
          alert_reason: null,
        })),
      );
      if (logErr) console.error('[Rep Search] Audit insert failed:', logErr);
    }
  } catch (err) {
    // Logging must never break the lookup.
    console.error('[Rep Search] Audit logging threw:', err);
  }

  return NextResponse.json({
    email,
    quotes,
    leads,
    counts: { quotes: quotes.length, leads: leads.length },
  });
}
