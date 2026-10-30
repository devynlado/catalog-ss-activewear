import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerProfile } from '@/lib/supabase-server';
import { getArtworkLink } from '@/lib/artwork-server';
import { logAdminActivity } from '@/lib/admin-audit';

/**
 * GET /api/dashboard/rep/artwork?path=<storage path>
 *
 * Audited artwork download for sales reps (and admins). Instead of handing the
 * browser a direct Supabase signed URL (which we could never log), the rep UI
 * links here: we verify the caller, confirm the path really belongs to a
 * lead/quote, record the download in admin_activity_log, mint a fresh short-
 * lived signed URL, and 302-redirect the browser to it.
 */

const SIGNED_TTL_SECONDS = 60; // Just long enough for the redirect to resolve.
const PATH_RE = /^\d{4}-\d{2}-\d{2}\/[A-Za-z0-9._-]+$/;

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

/** True when `path` is referenced by some contact or quote (prevents reps from
 * probing arbitrary bucket objects). */
async function pathIsReferenced(
  supabase: ReturnType<typeof getServiceSupabase>,
  path: string,
): Promise<boolean> {
  const [{ data: c }, { data: q }] = await Promise.all([
    supabase
      .from('contacts')
      .select('id')
      .contains('artwork_paths', [path])
      .limit(1),
    supabase
      .from('quotes')
      .select('id')
      .contains('artwork_paths', [path])
      .limit(1),
  ]);
  return (c?.length ?? 0) > 0 || (q?.length ?? 0) > 0;
}

export async function GET(request: NextRequest) {
  // --- Auth: sales_rep or admin only ---
  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const path = new URL(request.url).searchParams.get('path') || '';
  if (!PATH_RE.test(path)) {
    return NextResponse.json({ error: 'Invalid artwork path' }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  if (!(await pathIsReferenced(supabase, path))) {
    return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
  }

  // Record the download BEFORE redirecting (resource_id = path, no PII).
  await logAdminActivity(request, {
    action: 'rep.artwork_downloaded',
    resourceType: 'artwork',
    resourceId: path,
    summary: 'downloaded a customer artwork file',
  });

  const link = await getArtworkLink(path, SIGNED_TTL_SECONDS);
  if (!link?.url) {
    return NextResponse.json(
      { error: 'Artwork file is no longer available.' },
      { status: 404 },
    );
  }

  return NextResponse.redirect(link.url);
}
