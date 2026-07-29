import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyAdmin(serviceSupabase: ReturnType<typeof getServiceSupabase>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) return null;
  return user;
}

// Visitor source channels we explicitly chart.
// Anything else is grouped under "Other" so the chart stays focused on the 5 requested lines.
const TRACKED_SOURCES = ['Google Ads', 'Organic Search', 'Organic Social', 'Referral', 'Direct'] as const;
type TrackedSource = (typeof TRACKED_SOURCES)[number];

function normalizeSource(value: string | null): TrackedSource | 'Other' {
  // NULL visitor_source = pre-tracking ("Untracked") quotes.
  // Group those into "Other" rather than "Direct" to keep attribution honest.
  if (!value) return 'Other';
  const v = value.trim();
  if ((TRACKED_SOURCES as readonly string[]).includes(v)) return v as TrackedSource;
  return 'Other';
}

/**
 * Returns YYYY-MM-DD for the given instant, evaluated in the given IANA timezone.
 * Using en-CA because it formats as YYYY-MM-DD by default. Handles DST automatically.
 * Falls back to UTC bucketing if the timezone is invalid.
 */
function dateKeyInTz(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/** Increment a YYYY-MM-DD string by one day (timezone-agnostic, calendar math only). */
function nextYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(next.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * GET /api/admin/quotes/leads-trend?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&tz=America/Los_Angeles
 * Returns per-day quote-request count bucketed by visitor source channel.
 */
export async function GET(request: NextRequest) {
  const serviceSupabase = getServiceSupabase();
  const user = await verifyAdmin(serviceSupabase);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateFromParam = searchParams.get('date_from') || '';
  const dateToParam = searchParams.get('date_to') || '';
  const timeZone = searchParams.get('tz') || 'UTC';

  // Validate the timezone (Intl will throw on Format if invalid).
  let safeTz = timeZone;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  } catch {
    safeTz = 'UTC';
  }

  // Resolve "today" in the requested timezone.
  const todayKey = dateKeyInTz(new Date(), safeTz);

  let fromKey = dateFromParam;
  let toKey = dateToParam;

  if (!toKey) toKey = todayKey;
  if (!fromKey) {
    // Default: 30 days ending today (inclusive).
    let cursor = toKey;
    for (let i = 0; i < 29; i++) {
      const [y, m, d] = cursor.split('-').map(Number);
      const prev = new Date(Date.UTC(y, m - 1, d - 1));
      const yy = prev.getUTCFullYear();
      const mm = String(prev.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(prev.getUTCDate()).padStart(2, '0');
      cursor = `${yy}-${mm}-${dd}`;
    }
    fromKey = cursor;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromKey) || !/^\d{4}-\d{2}-\d{2}$/.test(toKey) || fromKey > toKey) {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
  }

  // Query a slightly wider UTC window than the requested local-tz range so we don't
  // miss quotes whose UTC date differs from their tz date (timezone offset can be ±14h).
  const queryFromUtc = new Date(`${fromKey}T00:00:00.000Z`);
  queryFromUtc.setUTCDate(queryFromUtc.getUTCDate() - 1);
  const queryToUtc = new Date(`${toKey}T23:59:59.999Z`);
  queryToUtc.setUTCDate(queryToUtc.getUTCDate() + 1);

  const { data, error } = await serviceSupabase
    .from('quotes')
    .select('created_at, visitor_source')
    .gte('created_at', queryFromUtc.toISOString())
    .lte('created_at', queryToUtc.toISOString());

  if (error) {
    console.error('[Admin Quotes] Leads-trend query error:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes trend' }, { status: 500 });
  }

  // Seed every day in the requested range so the chart has no gaps.
  type Row = Record<TrackedSource | 'Other', number> & { date: string; total: number };
  const buckets = new Map<string, Row>();
  let cursorKey = fromKey;
  while (cursorKey <= toKey) {
    buckets.set(cursorKey, {
      date: cursorKey,
      total: 0,
      'Google Ads': 0,
      'Organic Search': 0,
      'Organic Social': 0,
      'Referral': 0,
      'Direct': 0,
      'Other': 0,
    });
    if (cursorKey === toKey) break;
    cursorKey = nextYmd(cursorKey);
  }

  let totalsTotal = 0;
  const totalsBySource: Record<TrackedSource | 'Other', number> = {
    'Google Ads': 0,
    'Organic Search': 0,
    'Organic Social': 0,
    'Referral': 0,
    'Direct': 0,
    'Other': 0,
  };

  for (const row of data || []) {
    const d = new Date(row.created_at as string);
    const key = dateKeyInTz(d, safeTz);
    const bucket = buckets.get(key);
    if (!bucket) continue; // outside the visible range (buffer days)
    const channel = normalizeSource(row.visitor_source as string | null);
    bucket[channel] += 1;
    bucket.total += 1;
    totalsBySource[channel] += 1;
    totalsTotal += 1;
  }

  const series = Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    from: fromKey,
    to: toKey,
    timeZone: safeTz,
    days: series.length,
    total: totalsTotal,
    totalsBySource,
    data: series,
  });
}
