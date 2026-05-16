import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-redirects';

/**
 * GET /api/admin/redirects/history
 * Returns the global change history across all redirects, ordered by
 * most recent. Powers the History tab on /admin/redirects.
 */
export async function GET(request: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const limitRaw = parseInt(request.nextUrl.searchParams.get('limit') || '200', 10);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 200, 1), 500);

  // slug_redirect_history isn't in the generated Database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerSupabaseClient() as any;
  const { data, error } = await supabase
    .from('slug_redirect_history')
    .select('id, redirect_id, from_path, action, snapshot, changed_at, changed_by, changed_by_name')
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ history: data ?? [] });
}
