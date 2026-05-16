import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { logAdminActivity } from '@/lib/admin-audit';
import {
  requireAdmin,
  validateRedirectInput,
  writeHistory,
  type RedirectInputBody,
  type RedirectHistoryAction,
} from '@/lib/admin-redirects';

/** GET /api/admin/redirects/[id] – single redirect with full history. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  // slug_redirects isn't in the generated Database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerSupabaseClient() as any;

  const { data: redirectRow, error } = await supabase
    .from('slug_redirects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !redirectRow) {
    return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
  }

  const { data: history } = await supabase
    .from('slug_redirect_history')
    .select('id, action, snapshot, changed_at, changed_by, changed_by_name')
    .eq('redirect_id', id)
    .order('changed_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ redirect: redirectRow, history: history ?? [] });
}

/**
 * PATCH /api/admin/redirects/[id]
 * Partial update. Detects activate/deactivate/promote events so each one
 * writes a meaningful history row instead of a generic 'updated'.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as RedirectInputBody;
  const validation = validateRedirectInput(body, { isUpdate: true });
  if ('error' in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerSupabaseClient() as any;

  // Snapshot the pre-update row so we can detect transitions.
  const { data: previous, error: prevErr } = await supabase
    .from('slug_redirects')
    .select('*')
    .eq('id', id)
    .single();
  if (prevErr || !previous) {
    return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (validation.normalizedPath !== undefined) updates.from_path = validation.normalizedPath;
  if (validation.target_type !== undefined) updates.target_type = validation.target_type;
  if (validation.target_type === 'product') updates.to_product_id = validation.to_product_id;
  if (validation.target_type === 'category') updates.to_url = validation.to_url;
  if (validation.target_type === 'gone') {
    updates.to_product_id = null;
    updates.to_url = null;
  }
  if (validation.status_code !== undefined) updates.status_code = validation.status_code;
  if (body.auto_promote_days !== undefined) updates.promote_to_301_at = validation.promote_to_301_at;
  if (validation.is_active !== undefined) updates.is_active = validation.is_active;
  if (body.notes !== undefined) updates.notes = validation.notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  const { data: updated, error: updErr } = await supabase
    .from('slug_redirects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updErr) {
    if (updErr.code === '23505') {
      return NextResponse.json(
        { error: 'Another redirect already uses this from_path.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Pick the most specific history action for this update. Order matters:
  // is_active flips dominate, then 302→301 promotions, then everything
  // else falls under a generic 'updated' row.
  let action: RedirectHistoryAction = 'updated';
  const prevIsActive = previous.is_active as boolean;
  const prevStatusCode = previous.status_code as number;
  if (validation.is_active === true && prevIsActive === false) action = 'activated';
  else if (validation.is_active === false && prevIsActive === true) action = 'deactivated';
  else if (validation.status_code === 301 && prevStatusCode === 302) {
    action = 'promoted';
  }

  const fromPath =
    (updated?.from_path as string | undefined) ?? (previous.from_path as string);
  await writeHistory(id, fromPath, action, updated);

  await logAdminActivity(request, {
    action: `slug_redirect.${action}`,
    resourceType: 'slug_redirect',
    resourceId: id,
    summary: `${action} redirect for ${fromPath}`,
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/admin/redirects/[id]
 * Hard delete. Writes a 'deleted' history row with a pre-delete snapshot
 * before removing the live row, so the history tab stays useful even
 * after deletion.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerSupabaseClient() as any;

  const { data: existing } = await supabase
    .from('slug_redirects')
    .select('*')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
  }

  const fromPath = existing.from_path as string;
  await writeHistory(id, fromPath, 'deleted', existing);

  const { error } = await supabase.from('slug_redirects').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminActivity(request, {
    action: 'slug_redirect.deleted',
    resourceType: 'slug_redirect',
    resourceId: id,
    summary: `deleted redirect for ${fromPath}`,
  });

  return NextResponse.json({ ok: true });
}
