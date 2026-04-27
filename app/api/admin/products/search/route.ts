import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';

function getServiceSupabase() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MIN_QUERY_LENGTH = 2;

export interface AdminProductSearchResult {
  style_id: number;
  style_name: string;
  brand_name: string;
  title: string;
  primary_image_url: string | null;
  slug: string | null;
  is_active: boolean;
  has_admin_note: boolean;
  min_order_quantity: number | null;
  variant_overrides_count: number;
}

interface AdminProductSearchResponse {
  results: AdminProductSearchResult[];
  truncated: boolean;
}

interface ProductRow {
  style_id: number;
  style_name: string;
  brand_name: string;
  title_raw: string | null;
  title_optimized: string | null;
  primary_image_url: string | null;
  slug: string | null;
  is_active: boolean;
  admin_note: string | null;
  min_order_quantity: number | null;
}

/**
 * Score a row for relevance. Higher = better match.
 * Used to surface exact style-number matches above brand/title fuzz matches.
 */
function scoreRow(row: ProductRow, q: string): number {
  const needle = q.toLowerCase();
  const styleName = (row.style_name || '').toLowerCase();
  const brand = (row.brand_name || '').toLowerCase();
  const titleEffective = (row.title_optimized || row.title_raw || '').toLowerCase();

  if (styleName === needle) return 100;
  if (styleName.startsWith(needle)) return 80;
  if (styleName.includes(needle)) return 60;
  if (titleEffective.startsWith(needle)) return 40;
  if (titleEffective.includes(needle)) return 25;
  if (brand.startsWith(needle)) return 20;
  if (brand.includes(needle)) return 10;
  return 1;
}

export async function GET(request: NextRequest) {
  // Auth: must be logged in
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Permission: admin only (per product spec)
  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const limitRaw = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const limit = Math.min(
    Math.max(Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  if (q.length < MIN_QUERY_LENGTH) {
    const empty: AdminProductSearchResponse = { results: [], truncated: false };
    return NextResponse.json(empty);
  }

  const service = getServiceSupabase();

  // Escape ilike special characters to prevent pattern-injection.
  const safe = q.replace(/[\\%_]/g, (m) => `\\${m}`);
  const pattern = `%${safe}%`;

  // Search across the four most relevant fields. Note: this query intentionally
  // does NOT filter by is_active — admins need to manage hidden products too.
  // Fetch limit + 1 to detect truncation; over-fetch a small extra slice to
  // give the relevance scorer something to re-rank.
  const overFetch = Math.min(limit * 3, 80);
  const { data, error } = await service
    .from('products')
    .select(
      `
      style_id,
      style_name,
      brand_name,
      title_raw,
      title_optimized,
      primary_image_url,
      slug,
      is_active,
      admin_note,
      min_order_quantity
    `,
    )
    .or(
      `style_name.ilike.${pattern},brand_name.ilike.${pattern},title_raw.ilike.${pattern},title_optimized.ilike.${pattern}`,
    )
    .limit(overFetch);

  if (error) {
    console.error('[admin/products/search] Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  const rows = (data || []) as ProductRow[];

  // Re-rank by relevance, then trim to the requested limit.
  const ranked = [...rows].sort((a, b) => {
    const sa = scoreRow(a, q);
    const sb = scoreRow(b, q);
    if (sb !== sa) return sb - sa;
    return (a.style_name || '').localeCompare(b.style_name || '');
  });
  const truncated = ranked.length > limit;
  const trimmed = ranked.slice(0, limit);

  // Augment with variant override counts in one batched query.
  const styleIds = trimmed.map((r) => r.style_id);
  const variantOverrides = new Map<number, number>();
  if (styleIds.length > 0) {
    const { data: variantRows, error: variantErr } = await service
      .from('product_skus')
      .select('style_id')
      .in('style_id', styleIds)
      .not('min_order_quantity', 'is', null);

    if (variantErr) {
      console.warn(
        '[admin/products/search] variant override count query failed:',
        variantErr.message,
      );
    } else if (Array.isArray(variantRows)) {
      for (const row of variantRows as Array<{ style_id: number }>) {
        variantOverrides.set(
          row.style_id,
          (variantOverrides.get(row.style_id) || 0) + 1,
        );
      }
    }
  }

  const results: AdminProductSearchResult[] = trimmed.map((r) => ({
    style_id: r.style_id,
    style_name: r.style_name,
    brand_name: r.brand_name,
    title: r.title_optimized || r.title_raw || r.style_name,
    primary_image_url: r.primary_image_url,
    slug: r.slug,
    is_active: r.is_active,
    has_admin_note: !!(r.admin_note && r.admin_note.trim().length > 0),
    min_order_quantity: r.min_order_quantity,
    variant_overrides_count: variantOverrides.get(r.style_id) || 0,
  }));

  const response: AdminProductSearchResponse = { results, truncated };
  return NextResponse.json(response);
}
