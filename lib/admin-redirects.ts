/**
 * Shared helpers for the /api/admin/redirects routes.
 *
 * Lives in lib/ rather than alongside the route.ts files because Next.js
 * forbids non-handler exports from a `route.ts` module.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from './supabase';
import { getServerProfile, getServerUser } from './supabase-server';
import {
  normalizePath,
  computePromoteAt,
  DEFAULT_PROMOTE_DAYS,
  type SlugRedirectTargetType,
} from './slug-redirects';

export const VALID_TARGET_TYPES: SlugRedirectTargetType[] = ['product', 'category', 'gone'];
export const VALID_STATUS_CODES = [301, 302, 307] as const;

export type RedirectHistoryAction =
  | 'created'
  | 'updated'
  | 'activated'
  | 'deactivated'
  | 'promoted'
  | 'deleted'
  | 'imported';

export interface RedirectInputBody {
  from_path?: string;
  target_type?: SlugRedirectTargetType;
  to_product_id?: number | null;
  to_url?: string | null;
  status_code?: number;
  auto_promote_days?: number | null;
  is_active?: boolean;
  notes?: string | null;
  /**
   * When the redirect was created in response to an entry in the
   * not_found_slugs queue, this is the full path of that entry so we
   * can mark it resolved in the same request.
   */
  resolved_path_key?: string | null;
}

export interface ValidatedRedirectInput {
  normalizedPath?: string;
  target_type?: SlugRedirectTargetType;
  to_product_id: number | null;
  to_url: string | null;
  status_code?: number;
  promote_to_301_at: string | null;
  is_active?: boolean;
  notes: string | null;
}

/** Reject non-admin callers with a 401 JSON body. */
export async function requireAdmin() {
  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * Validate the create/update payload. POST passes `isUpdate=false`
 * (required fields must be present); PATCH passes `isUpdate=true`
 * (only provided fields are validated, but target-shape rules still
 * apply whenever target_type is included).
 */
export function validateRedirectInput(
  body: RedirectInputBody,
  opts: { isUpdate: boolean },
): ValidatedRedirectInput | { error: string } {
  const out: ValidatedRedirectInput = {
    to_product_id: null,
    to_url: null,
    promote_to_301_at: null,
    notes: null,
  };

  if (body.from_path !== undefined || !opts.isUpdate) {
    const fromPath = normalizePath(body.from_path ?? '');
    if (!fromPath) {
      return { error: 'from_path is required and must be a non-empty site-relative path' };
    }
    if (fromPath.length > 500) return { error: 'from_path is too long (max 500 chars)' };
    if (fromPath === '/') return { error: 'Cannot redirect from the site root' };
    out.normalizedPath = fromPath;
  }

  if (body.target_type !== undefined || !opts.isUpdate) {
    if (!body.target_type || !VALID_TARGET_TYPES.includes(body.target_type)) {
      return { error: `target_type must be one of: ${VALID_TARGET_TYPES.join(', ')}` };
    }
    out.target_type = body.target_type;
  }

  const effectiveType = out.target_type;
  if (effectiveType === 'product') {
    if (body.to_product_id == null || !Number.isFinite(Number(body.to_product_id))) {
      return { error: 'Product redirects require to_product_id (numeric style_id)' };
    }
    out.to_product_id = Number(body.to_product_id);
    out.to_url = null;
  } else if (effectiveType === 'category') {
    const url = (body.to_url ?? '').trim();
    if (!url) return { error: 'Category redirects require to_url' };
    if (!url.startsWith('/')) {
      return { error: 'to_url must be a site-relative path starting with /' };
    }
    out.to_url = url;
    out.to_product_id = null;
  } else if (effectiveType === 'gone') {
    out.to_product_id = null;
    out.to_url = null;
  }

  if (body.status_code !== undefined || !opts.isUpdate) {
    const code = body.status_code ?? 302;
    if (!VALID_STATUS_CODES.includes(code as (typeof VALID_STATUS_CODES)[number])) {
      return { error: `status_code must be one of: ${VALID_STATUS_CODES.join(', ')}` };
    }
    out.status_code = code;
  }

  if (body.auto_promote_days !== undefined || !opts.isUpdate) {
    const raw = body.auto_promote_days;
    const days = raw === null || raw === undefined ? DEFAULT_PROMOTE_DAYS : Number(raw);
    // Only attach an auto-promotion timestamp when the redirect starts as
    // 302 — 301 is already permanent, 307 is treated like 302 in our model
    // but admins can promote manually.
    if ((out.status_code ?? 302) === 302 && raw !== null && Number.isFinite(days) && days >= 0) {
      out.promote_to_301_at = computePromoteAt(days);
    } else {
      out.promote_to_301_at = null;
    }
  }

  if (body.is_active !== undefined) out.is_active = Boolean(body.is_active);
  if (body.notes !== undefined) out.notes = body.notes ? body.notes.trim().slice(0, 1000) : null;

  return out;
}

export async function writeHistory(
  redirectId: string,
  fromPath: string,
  action: RedirectHistoryAction,
  snapshot: unknown,
): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    const { user } = await getServerUser();
    let actorName: string | null = null;
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single<{ full_name: string | null; email: string | null }>();
      actorName = data?.full_name?.trim() || data?.email?.split('@')[0] || null;
    }
    // slug_redirect_history isn't in the generated Database types yet —
    // cast to any to bypass the typed-client write narrowing, same pattern
    // used elsewhere in the admin API.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('slug_redirect_history').insert({
      redirect_id: redirectId,
      from_path: fromPath,
      action,
      snapshot,
      changed_by: user?.id ?? null,
      changed_by_name: actorName,
    });
  } catch (err) {
    console.warn('[admin/redirects] history write failed:', err);
  }
}

export async function markNotFoundResolved(
  path: string,
  resolutionType: 'redirect' | 'ignored',
  redirectId: string | null,
  userId: string | null,
): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('not_found_slugs')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        resolution_type: resolutionType,
        resolution_redirect_id: redirectId,
      })
      .eq('path', normalizePath(path));
  } catch (err) {
    console.warn('[admin/redirects] mark not-found resolved failed:', err);
  }
}
