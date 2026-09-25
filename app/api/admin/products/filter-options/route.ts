import { NextResponse } from 'next/server';
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

export interface AdminProductFilterOptions {
  brands: string[];
  categories: string[];
}

// Distinct brand/category values change rarely (only on catalog sync), so we
// cache the computed lists in-module to avoid re-scanning the products table on
// every admin page load.
const CACHE_TTL_MS = 10 * 60 * 1000;
let cache: { data: AdminProductFilterOptions; expiresAt: number } | null = null;

const PAGE_SIZE = 1000; // PostgREST hard cap per request.
const MAX_PAGES = 40; // Safety bound (40k rows) — plenty for the catalog.

export async function GET() {
  // Auth: admin only (mirrors the rest of /admin/products).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  if (cache && cache.expiresAt > Date.now()) {
    return NextResponse.json(cache.data);
  }

  const service = getServiceSupabase();
  const brands = new Set<string>();
  const categories = new Set<string>();

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const { data, error } = await service
        .from('products')
        .select('brand_name, base_category')
        .order('style_id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1) as {
        data: Array<{ brand_name: string | null; base_category: string | null }> | null;
        error: unknown;
      };

      if (error) {
        console.error('[admin/products/filter-options] fetch failed:', error);
        break;
      }
      if (!data || data.length === 0) break;

      for (const row of data) {
        if (row.brand_name && row.brand_name.trim()) brands.add(row.brand_name.trim());
        if (row.base_category && row.base_category.trim()) {
          categories.add(row.base_category.trim());
        }
      }

      if (data.length < PAGE_SIZE) break;
    }
  } catch (err) {
    console.error('[admin/products/filter-options] unexpected error:', err);
  }

  const result: AdminProductFilterOptions = {
    brands: Array.from(brands).sort((a, b) => a.localeCompare(b)),
    categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
  };

  cache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };

  return NextResponse.json(result);
}
