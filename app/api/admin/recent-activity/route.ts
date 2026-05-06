import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 15;

/**
 * GET /api/admin/recent-activity
 *
 * Returns the most recent admin/sales_rep audit entries. Used by the
 * Recent Activity widget on /admin and the full /admin/activity page.
 *
 * Query params:
 *   - limit:   number of rows (default 15, max 100)
 *   - offset:  pagination offset (default 0)
 *   - actor:   optional actor_id filter (UUID)
 *   - action:  optional substring match on the action key
 *   - alerts:  '1' to return only burst-detection alerts
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);
  const actorFilter = url.searchParams.get('actor');
  const actionFilter = url.searchParams.get('action');
  const alertsOnly = url.searchParams.get('alerts') === '1';

  const service = getServiceSupabase();

  let query = service
    .from('admin_activity_log')
    .select(
      'id, actor_id, actor_name, actor_role, action, resource_type, resource_id, summary, ip_address, is_alert, alert_reason, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (actorFilter) query = query.eq('actor_id', actorFilter);
  if (actionFilter) query = query.ilike('action', `%${actionFilter}%`);
  if (alertsOnly) query = query.eq('is_alert', true);

  const { data, error, count } = await query;

  if (error) {
    console.error('[recent-activity] query failed:', error);
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
  }

  return NextResponse.json({
    activity: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}
