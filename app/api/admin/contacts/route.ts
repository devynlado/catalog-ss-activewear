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

/**
 * GET /api/admin/contacts?page=1&status=new&source=lp_embroidery&visitor_source=Google+Ads&date_from=&date_to=&search=&show_spam=false
 */
export async function GET(request: NextRequest) {
  const serviceSupabase = getServiceSupabase();
  const user = await verifyAdmin(serviceSupabase);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const status = searchParams.get('status') || 'all';
  const source = searchParams.get('source') || '';
  const visitorSource = searchParams.get('visitor_source') || '';
  const dateFrom = searchParams.get('date_from') || '';
  const dateTo = searchParams.get('date_to') || '';
  const search = searchParams.get('search')?.trim() || '';
  const showSpam = searchParams.get('show_spam') === 'true';
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  let query = serviceSupabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (status === 'spam') {
    query = query.eq('is_spam', true);
  } else if (status !== 'all') {
    query = query.eq('status', status);
    if (!showSpam) query = query.eq('is_spam', false);
  } else if (!showSpam) {
    query = query.eq('is_spam', false);
  }

  if (source) {
    if (source === '(null)') {
      query = query.is('source', null);
    } else {
      query = query.eq('source', source);
    }
  }

  if (visitorSource) {
    if (visitorSource === '(untracked)') {
      query = query.is('visitor_source', null);
    } else {
      query = query.eq('visitor_source', visitorSource);
    }
  }

  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59.999Z`);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,message.ilike.%${search}%`
    );
  }

  const { data: contacts, count, error } = await query;

  if (error) {
    console.error('[Admin Contacts] Query error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }

  // Aggregate stats (run in parallel)
  const [
    { count: totalCount },
    { count: spamCount },
    { count: blockedCount },
    { count: weekCount },
  ] = await Promise.all([
    serviceSupabase.from('contacts').select('*', { count: 'exact', head: true }).eq('is_spam', false),
    serviceSupabase.from('contacts').select('*', { count: 'exact', head: true }).eq('is_spam', true),
    serviceSupabase.from('blocked_emails').select('*', { count: 'exact', head: true }),
    serviceSupabase.from('contacts').select('*', { count: 'exact', head: true })
      .eq('is_spam', false)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // Source breakdown
  const { data: allContacts } = await serviceSupabase
    .from('contacts')
    .select('source, is_spam, created_at')
    .eq('is_spam', false);

  const sourceStats: Record<string, { total: number; thisWeek: number }> = {};
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const c of allContacts || []) {
    const key = c.source || '(null)';
    if (!sourceStats[key]) sourceStats[key] = { total: 0, thisWeek: 0 };
    sourceStats[key].total++;
    if (new Date(c.created_at).getTime() > weekAgo) {
      sourceStats[key].thisWeek++;
    }
  }

  const sourceRanking = Object.entries(sourceStats)
    .map(([source, stats]) => ({ source, ...stats }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({
    contacts: contacts || [],
    page,
    pageSize,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
    stats: {
      total: totalCount || 0,
      thisWeek: weekCount || 0,
      spam: spamCount || 0,
      blocked: blockedCount || 0,
    },
    sourceRanking,
  });
}
