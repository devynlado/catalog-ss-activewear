import { NextResponse } from 'next/server';
import { getComparableProducts } from '@/lib/ss-activewear';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * Drop any styleIds that are inactive or manually hidden in our DB. The SS
 * Activewear API doesn't know about either flag — comparables come straight
 * from there — so we have to intersect against `products` ourselves.
 */
async function filterVisibleStyleIds(styleIds: number[]): Promise<Set<number>> {
  if (styleIds.length === 0) return new Set();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select('style_id')
    .in('style_id', styleIds)
    .eq('is_active', true)
    .eq('manually_hidden', false);
  if (error) {
    console.warn(
      '[comparable] visibility filter query failed; returning all:',
      error.message,
    );
    // Fail-open: showing too many is preferable to showing none.
    return new Set(styleIds);
  }
  const rows = (data || []) as Array<{ style_id: number }>;
  return new Set(rows.map((r) => r.style_id));
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const styleId = parseInt(params.id, 10);
    
    if (isNaN(styleId)) {
      return NextResponse.json(
        { error: 'Invalid style ID' },
        { status: 400 }
      );
    }

    const products = await getComparableProducts(styleId, 8);
    const visible = await filterVisibleStyleIds(
      products.map((p) => p.styleId),
    );
    const filtered = products.filter((p) => visible.has(p.styleId));

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching comparable products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparable products' },
      { status: 500 }
    );
  }
}
