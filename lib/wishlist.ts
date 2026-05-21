/**
 * Server-side helpers for the customer wishlist.
 *
 * All functions assume the caller has already verified `user.id` via
 * `createSupabaseServerClient().auth.getUser()`. They do NOT enforce auth
 * themselves — RLS on `customer_wishlists` is the second line of defence.
 *
 * Public surface (mirror in API routes):
 *   - listWishlist(userId)           → number[] of style_ids, newest first
 *   - addToWishlist(userId, id)      → idempotent insert (unique constraint)
 *   - removeFromWishlist(userId, id) → idempotent delete
 *   - mergeIntoWishlist(userId, ids) → bulk upsert (used at login)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_MERGE_BATCH = 200;

function toStyleId(value: unknown): number | null {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value)
      : NaN;
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

/** Normalize an unknown-shape list of style_ids → unique, positive integers. */
export function normalizeStyleIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out = new Set<number>();
  for (const value of raw) {
    const id = toStyleId(value);
    if (id !== null) out.add(id);
  }
  return Array.from(out);
}

export async function listWishlist(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string
): Promise<number[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('customer_wishlists')
    .select('product_style_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Array<{ product_style_id: number }>)
    .map((row) => row.product_style_id)
    .filter((id): id is number => typeof id === 'number');
}

export async function addToWishlist(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  productStyleId: number
): Promise<{ ok: boolean; error?: string }> {
  const id = toStyleId(productStyleId);
  if (id === null) return { ok: false, error: 'Invalid product id' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('customer_wishlists')
    .upsert(
      { user_id: userId, product_style_id: id },
      { onConflict: 'user_id,product_style_id', ignoreDuplicates: true }
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function removeFromWishlist(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  productStyleId: number
): Promise<{ ok: boolean; error?: string }> {
  const id = toStyleId(productStyleId);
  if (id === null) return { ok: false, error: 'Invalid product id' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('customer_wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('product_style_id', id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function mergeIntoWishlist(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  productStyleIds: number[]
): Promise<{ ok: boolean; merged: number; error?: string }> {
  const ids = normalizeStyleIds(productStyleIds).slice(0, MAX_MERGE_BATCH);
  if (ids.length === 0) return { ok: true, merged: 0 };

  const rows = ids.map((id) => ({
    user_id: userId,
    product_style_id: id,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('customer_wishlists')
    .upsert(rows, {
      onConflict: 'user_id,product_style_id',
      ignoreDuplicates: true,
    });

  if (error) return { ok: false, merged: 0, error: error.message };
  return { ok: true, merged: ids.length };
}
