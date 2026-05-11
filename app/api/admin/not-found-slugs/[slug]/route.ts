import { NextRequest, NextResponse } from 'next/server';
import { logAdminActivity } from '@/lib/admin-audit';
import { getServerUser } from '@/lib/supabase-server';
import { normalizeSlug } from '@/lib/slug-redirects';
import { requireAdmin, markNotFoundResolved } from '@/lib/admin-redirects';

/**
 * PATCH /api/admin/not-found-slugs/[slug]
 * Admin actions on a single unresolved slug. Currently supported:
 *
 *   { action: 'ignore' }  → mark as junk/spam so it leaves the queue
 *                           without creating a redirect.
 *
 * (The 'redirect' resolution path is handled by POST /api/admin/redirects
 *  with `resolved_slug_key` set — that flow creates the redirect row AND
 *  marks the not_found_slug as resolved in a single request.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(decodeURIComponent(rawSlug));
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const action = body.action;
  if (action !== 'ignore') {
    return NextResponse.json(
      { error: "Supported actions: 'ignore'" },
      { status: 400 },
    );
  }

  const { user } = await getServerUser();
  await markNotFoundResolved(slug, 'ignored', null, user?.id ?? null);

  await logAdminActivity(request, {
    action: 'slug_redirect.miss_ignored',
    resourceType: 'not_found_slug',
    resourceId: slug,
    summary: `ignored unresolved slug /${slug}`,
  });

  return NextResponse.json({ ok: true });
}
