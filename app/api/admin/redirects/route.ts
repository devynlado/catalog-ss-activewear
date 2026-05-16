import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerUser } from '@/lib/supabase-server';
import { logAdminActivity } from '@/lib/admin-audit';
import { type SlugRedirectTargetType } from '@/lib/slug-redirects';
import {
  requireAdmin,
  validateRedirectInput,
  writeHistory,
  markNotFoundResolved,
} from '@/lib/admin-redirects';

interface RedirectListRow {
  id: string;
  from_path: string;
  target_type: SlugRedirectTargetType;
  to_product_id: number | null;
  to_url: string | null;
  status_code: number;
  promote_to_301_at: string | null;
  is_active: boolean;
  notes: string | null;
  hits: number;
  last_hit_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface ProductSnapshot {
  style_id: number;
  style_name: string;
  brand_name: string;
  title_optimized: string | null;
  title_raw: string | null;
  slug: string | null;
  is_active: boolean;
  manually_hidden: boolean;
}

/**
 * GET /api/admin/redirects
 * Returns every redirect row plus a light snapshot of the target product
 * (when target_type='product') so the admin table can render brand+style
 * without a separate fetch.
 */
export async function GET(request: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const url = request.nextUrl;
  const includeInactive = url.searchParams.get('includeInactive') !== 'false';
  const search = url.searchParams.get('search')?.trim().toLowerCase() || '';

  // slug_redirects isn't in the generated Database types — cast to any
  // for unknown-table queries (same pattern as other admin routes).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerSupabaseClient() as any;
  let query = supabase
    .from('slug_redirects')
    .select(
      'id, from_path, target_type, to_product_id, to_url, status_code, promote_to_301_at, is_active, notes, hits, last_hit_at, created_at, updated_at, created_by'
    )
    .order('updated_at', { ascending: false })
    .limit(500);

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }
  if (search) {
    // Escape ilike metacharacters before interpolation.
    const safe = search.replace(/[\\%_]/g, (m) => `\\${m}`);
    query = query.or(`from_path.ilike.%${safe}%,to_url.ilike.%${safe}%,notes.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as RedirectListRow[];

  // Hydrate product snapshots for product-type redirects in one batched query.
  const productIds = Array.from(
    new Set(rows.map((r) => r.to_product_id).filter((id): id is number => id != null)),
  );
  const productMap = new Map<number, ProductSnapshot>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('style_id, style_name, brand_name, title_optimized, title_raw, slug, is_active, manually_hidden')
      .in('style_id', productIds);
    for (const p of (products ?? []) as ProductSnapshot[]) {
      productMap.set(p.style_id, p);
    }
  }

  const enriched = rows.map((r) => ({
    ...r,
    target_product: r.to_product_id != null ? productMap.get(r.to_product_id) ?? null : null,
  }));

  return NextResponse.json({ redirects: enriched });
}

interface CreateRedirectBody {
  from_path?: string;
  target_type?: SlugRedirectTargetType;
  to_product_id?: number | null;
  to_url?: string | null;
  status_code?: number;
  auto_promote_days?: number | null;
  is_active?: boolean;
  notes?: string | null;
  resolved_path_key?: string | null;
}

/**
 * POST /api/admin/redirects
 * Create a redirect row. Validates target shape and writes a 'created'
 * history row in the same request.
 */
export async function POST(request: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const body = (await request.json().catch(() => ({}))) as CreateRedirectBody;
  const validation = validateRedirectInput(body, { isUpdate: false });
  if ('error' in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerSupabaseClient() as any;
  const { user } = await getServerUser();

  const insertPayload = {
    from_path: validation.normalizedPath!,
    target_type: validation.target_type!,
    to_product_id: validation.to_product_id,
    to_url: validation.to_url,
    status_code: validation.status_code!,
    promote_to_301_at: validation.promote_to_301_at,
    is_active: validation.is_active ?? true,
    notes: validation.notes,
    created_by: user?.id ?? null,
  };

  const { data, error } = await supabase
    .from('slug_redirects')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `A redirect for '${validation.normalizedPath}' already exists.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inserted = data as any;

  await writeHistory(inserted.id, validation.normalizedPath!, 'created', inserted);

  // If this redirect was created in response to an unresolved-slug entry,
  // mark that entry as resolved so it falls off the queue.
  if (body.resolved_path_key) {
    await markNotFoundResolved(body.resolved_path_key, 'redirect', inserted.id, user?.id ?? null);
  }

  await logAdminActivity(request, {
    action: 'slug_redirect.created',
    resourceType: 'slug_redirect',
    resourceId: inserted.id,
    summary: `created redirect for ${validation.normalizedPath}`,
  });

  return NextResponse.json(inserted);
}

