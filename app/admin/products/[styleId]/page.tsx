import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getServerProfile } from '@/lib/supabase-server';
import { ProductEditClient } from './ProductEditClient';
import type { ProductEditInitialData, VariantColorGroup, VariantRow } from './types';

function getServiceSupabase() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

interface PageProps {
  params: { styleId: string };
}

export const metadata = {
  title: 'Edit Product',
  description: 'Edit a product\'s admin note and minimum order quantities.',
};

interface ProductRow {
  style_id: number;
  style_name: string;
  brand_name: string;
  brand_id: number | null;
  title_raw: string | null;
  title_optimized: string | null;
  primary_image_url: string | null;
  slug: string | null;
  is_active: boolean;
  admin_note: string | null;
  min_order_quantity: number | null;
}

interface SkuRow {
  sku: string;
  color_name: string;
  color_code: string;
  size_name: string;
  size_order: string | null;
  qty: number | null;
  availability: string | null;
  min_order_quantity: number | null;
}

function parseSizeOrder(s: string | null): number {
  if (!s) return Number.MAX_SAFE_INTEGER;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

function groupVariantsByColor(rows: SkuRow[]): VariantColorGroup[] {
  const byColor = new Map<string, VariantColorGroup>();
  for (const r of rows) {
    const key = r.color_code;
    let group = byColor.get(key);
    if (!group) {
      group = {
        color_name: r.color_name,
        color_code: r.color_code,
        skus: [],
      };
      byColor.set(key, group);
    }
    const variant: VariantRow = {
      sku: r.sku,
      size_name: r.size_name,
      size_order: r.size_order,
      qty: r.qty ?? 0,
      availability: r.availability ?? 'unknown',
      min_order_quantity: r.min_order_quantity,
    };
    group.skus.push(variant);
  }
  // Stable sort: sizes within a color by size_order ascending, then size_name.
  for (const group of byColor.values()) {
    group.skus.sort((a, b) => {
      const oa = parseSizeOrder(a.size_order);
      const ob = parseSizeOrder(b.size_order);
      if (oa !== ob) return oa - ob;
      return (a.size_name || '').localeCompare(b.size_name || '');
    });
  }
  // Colors alphabetical for predictable rendering.
  return [...byColor.values()].sort((a, b) =>
    a.color_name.localeCompare(b.color_name),
  );
}

export default async function AdminProductEditPage({ params }: PageProps) {
  // Permission: admin-only (mirrors /admin/products).
  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    redirect('/admin');
  }

  const styleId = parseInt(params.styleId, 10);
  if (!Number.isFinite(styleId) || styleId <= 0) {
    notFound();
  }

  const service = getServiceSupabase();

  const [productResult, skuResult] = await Promise.all([
    service
      .from('products')
      .select(
        `style_id, style_name, brand_name, brand_id, title_raw, title_optimized,
         primary_image_url, slug, is_active, admin_note, min_order_quantity`,
      )
      .eq('style_id', styleId)
      .maybeSingle(),
    service
      .from('product_skus')
      .select(
        `sku, color_name, color_code, size_name, size_order, qty, availability,
         min_order_quantity`,
      )
      .eq('style_id', styleId),
  ]);

  if (productResult.error) {
    console.error('[admin/products edit] product fetch failed:', productResult.error);
  }
  if (skuResult.error) {
    console.error('[admin/products edit] SKU fetch failed:', skuResult.error);
  }

  const product = productResult.data as ProductRow | null;
  if (!product) {
    notFound();
  }

  const skus = (skuResult.data || []) as SkuRow[];
  const variants = groupVariantsByColor(skus);

  const initialData: ProductEditInitialData = {
    product: {
      style_id: product.style_id,
      style_name: product.style_name,
      brand_name: product.brand_name,
      brand_id: product.brand_id,
      title:
        product.title_optimized || product.title_raw || product.style_name,
      primary_image_url: product.primary_image_url,
      slug: product.slug,
      is_active: product.is_active,
      admin_note: product.admin_note,
      min_order_quantity: product.min_order_quantity,
    },
    variants,
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin/products"
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to product search
        </Link>

        {/* Header card */}
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="relative h-16 w-16 flex-none overflow-hidden rounded-md border border-stone-200 bg-stone-50">
            {product.primary_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.primary_image_url}
                alt=""
                className="h-full w-full object-contain"
                loading="lazy"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{product.brand_name}</span>
              <span className="text-slate-300">•</span>
              <span>{product.style_name}</span>
              {!product.is_active && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-inset ring-red-200">
                  Hidden
                </span>
              )}
            </div>
            <h1 className="mt-0.5 truncate text-lg font-semibold text-navy-800 sm:text-xl">
              {initialData.product.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {variants.length} {variants.length === 1 ? 'color' : 'colors'} •{' '}
              {variants.reduce((acc, c) => acc + c.skus.length, 0)} variants total
            </p>
          </div>
          {product.slug && (
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
            >
              View public page
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>

        <ProductEditClient initialData={initialData} />
      </div>
    </div>
  );
}
