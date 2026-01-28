import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getProductById } from '@/lib/ss-activewear';
import { getProductByStyleId, getProductBySlug, getCacheStats } from '@/lib/product-cache';
import { ProductDetailClient } from './ProductDetailClient';
import { ProductBreadcrumbs } from '@/components/catalog/ProductBreadcrumbs';
import { CompanionProducts } from '@/components/builder/CompanionProducts';
import { RelatedProducts } from '@/components/builder/RelatedProducts';
import { Skeleton } from '@/components/ui/Skeleton';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

/**
 * Helper to get product - tries cache first, then SS API fallback
 */
async function getProductByNumericId(styleId: number) {
  // Try Supabase cache first (fast path)
  try {
    const stats = await getCacheStats();
    if (stats.totalProducts > 0) {
      const cachedProduct = await getProductByStyleId(styleId);
      if (cachedProduct) {
        console.log(`[Product Page] Using cache for style ${styleId}`);
        return cachedProduct;
      }
    }
  } catch (e) {
    console.warn('[Product Page] Cache lookup failed:', e);
  }
  
  // Fall back to SS API
  console.log(`[Product Page] Cache miss, using SS API for style ${styleId}`);
  return getProductById(styleId);
}

/**
 * Parse slug to extract brand and style (for fallback lookup)
 * e.g., "next-level-1533" -> { brand: "next level", style: "1533" }
 */
function parseSlugForLookup(slug: string): { brand: string; style: string } | null {
  // Common patterns: brand-style or brand-name-style
  // Try to find a numeric style number at the end
  const match = slug.match(/^(.+)-(\d+[a-z]*)$/i);
  if (match) {
    return {
      brand: match[1].replace(/-/g, ' '),
      style: match[2].toUpperCase(),
    };
  }
  return null;
}

/**
 * Get product by slug or numeric ID
 * If numeric ID, look up and redirect to slug URL for SEO
 */
async function getProduct(slugOrId: string) {
  // Check if it's a numeric ID (legacy URL)
  const numericId = parseInt(slugOrId, 10);
  const isNumericId = !isNaN(numericId) && slugOrId === numericId.toString();
  
  if (isNumericId) {
    // Legacy numeric URL - look up product and redirect to slug
    const product = await getProductByNumericId(numericId);
    if (product) {
      // Redirect to SEO-friendly slug URL
      redirect(`/product/${product.slug}`);
    }
    return null;
  }
  
  // Try slug lookup from cache
  try {
    const cachedProduct = await getProductBySlug(slugOrId);
    if (cachedProduct) {
      console.log(`[Product Page] Using cache for slug ${slugOrId}`);
      return cachedProduct;
    }
  } catch (e) {
    console.warn('[Product Page] Slug lookup failed:', e);
  }
  
  // Fallback: Parse slug and try to find by brand + style name
  // This handles cases where slug column isn't populated yet
  const parsed = parseSlugForLookup(slugOrId);
  if (parsed) {
    console.log(`[Product Page] Trying fallback lookup for ${parsed.brand} ${parsed.style}`);
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase');
      const supabase = createServerSupabaseClient();
      
      // Try to find product by style_name (case insensitive)
      const { data } = await supabase
        .from('products')
        .select('style_id')
        .ilike('style_name', parsed.style)
        .ilike('brand_name', `%${parsed.brand}%`)
        .limit(1)
        .single();
      
      const result = data as { style_id: number } | null;
      if (result?.style_id) {
        const product = await getProductByStyleId(result.style_id);
        if (product) {
          console.log(`[Product Page] Found via fallback: style ${result.style_id}`);
          return product;
        }
      }
    } catch (e) {
      console.warn('[Product Page] Fallback lookup failed:', e);
    }
  }
  
  return null;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const slugOrId = params.slug;
  
  // For numeric IDs, we'll redirect in the page component
  const numericId = parseInt(slugOrId, 10);
  const isNumericId = !isNaN(numericId) && slugOrId === numericId.toString();
  
  if (isNumericId) {
    const product = await getProductByNumericId(numericId);
    if (!product) return { title: 'Product Not Found' };
    return {
      title: `${product.title || product.styleName} - ${product.brandName} | Garment Decor`,
      description: product.description || `Shop ${product.styleName} by ${product.brandName}`,
    };
  }
  
  // Try slug lookup, then fallback
  let product = await getProductBySlug(slugOrId);
  
  if (!product) {
    // Fallback: Parse slug and find by brand + style
    const parsed = parseSlugForLookup(slugOrId);
    if (parsed) {
      try {
        const { createServerSupabaseClient } = await import('@/lib/supabase');
        const supabase = createServerSupabaseClient();
        const { data } = await supabase
          .from('products')
          .select('style_id')
          .ilike('style_name', parsed.style)
          .ilike('brand_name', `%${parsed.brand}%`)
          .limit(1)
          .single();
        
        const result = data as { style_id: number } | null;
        if (result?.style_id) {
          product = await getProductByStyleId(result.style_id);
        }
      } catch {
        // Ignore errors
      }
    }
  }
  
  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.title || product.styleName} - ${product.brandName} | Garment Decor`,
    description: product.description || `Shop ${product.styleName} by ${product.brandName}`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50/50">
      {/* Breadcrumb */}
      <div className="relative bg-gradient-to-r from-white via-stone-50/30 to-white border-b border-stone-200 overflow-hidden">
        {/* Subtle grain */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.01]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
          <ProductBreadcrumbs
            brandName={product.brandName}
            brandId={product.brandId}
            styleName={product.styleName}
            categories={product.categories}
          />
        </div>
      </div>

      {/* Product Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailClient product={product} />
        </Suspense>
      </div>

      {/* Companion Products (Complete the Look) */}
      <div className="relative bg-white border-t border-stone-200 overflow-hidden">
        {/* Decorative orb */}
        <div className="pointer-events-none absolute -left-32 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CompanionProducts styleId={product.styleId} />
        </div>
      </div>

      {/* Similar Products Section (using comparableGroup) */}
      <div className="relative bg-gradient-to-b from-stone-50 to-stone-100/50 border-t border-stone-200 overflow-hidden">
        {/* Grain texture */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Decorative orb */}
        <div className="pointer-events-none absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-navy-800/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <RelatedProducts
            styleId={product.styleId}
            brandId={product.brandId}
            currentProductId={product.id}
            title="Similar Products"
            maxProducts={8}
          />
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Skeleton className="aspect-square rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
