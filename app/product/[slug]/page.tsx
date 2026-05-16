import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getProductById } from '@/lib/ss-activewear';
import { getProductByStyleId, getProductBySlug, getCacheStats } from '@/lib/product-cache';
import type { Product } from '@/lib/types';
import { ProductDetailClient } from './ProductDetailClient';
import { ProductBreadcrumbs } from '@/components/catalog/ProductBreadcrumbs';
import { CompanionProducts } from '@/components/builder/CompanionProducts';
import { RelatedProducts } from '@/components/builder/RelatedProducts';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { ProductFAQ } from './ProductFAQ';
import { getProductFaqItems } from './productFaqData';
import { validateDiscountToken, GoogleDiscount } from '@/lib/google-discount';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { DiscontinuedProductPage } from './DiscontinuedProductPage';

// NOTE: The legacy slug-redirect intercept that used to live in this
// file was moved to `app/not-found.tsx` so it now covers every URL on
// the site (services, blog posts, project pages, marketing URLs, etc.),
// not just /product/<slug>. The "Last-chance recovery before 404" you
// might be looking for is in lib/slug-redirects.ts → lookupRedirect,
// invoked from the global not-found component.

/**
 * Decide whether the product should render the "no longer available" view
 * instead of the buyable detail page. Both conditions force noindex in
 * generateMetadata so de-listed URLs eventually fall out of Google.
 */
function isProductUnavailable(product: Product): boolean {
  return product.isActive === false || product.manuallyHidden === true;
}

function getUnavailableReason(
  product: Product,
): 'discontinued' | 'manually_hidden' {
  // manually_hidden takes priority over discontinued when both are set, since
  // it represents an explicit admin decision.
  return product.manuallyHidden ? 'manually_hidden' : 'discontinued';
}

// Initial variant resolved from URL params (color/size from GMC feed links)
export interface InitialVariant {
  colorCode: string;
  colorName: string;
  sizeName: string;
}

interface ProductPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    pv2?: string;
    color?: string;
    size?: string;
    [key: string]: string | string[] | undefined;
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
 * Preserves query parameters (especially pv2 for Google Automated Discounts)
 */
async function getProduct(slugOrId: string, searchParams?: Record<string, string | string[] | undefined>) {
  // Check if it's a numeric ID (legacy URL)
  const numericId = parseInt(slugOrId, 10);
  const isNumericId = !isNaN(numericId) && slugOrId === numericId.toString();
  
  if (isNumericId) {
    // Legacy numeric URL - look up product and redirect to slug
    const product = await getProductByNumericId(numericId);
    if (product) {
      // Preserve query params (especially pv2 for Google Automated Discounts)
      const queryString = searchParams 
        ? new URLSearchParams(
            Object.entries(searchParams).reduce((acc, [key, value]) => {
              if (typeof value === 'string') acc[key] = value;
              return acc;
            }, {} as Record<string, string>)
          ).toString()
        : '';
      
      const redirectUrl = queryString 
        ? `/product/${product.slug}?${queryString}`
        : `/product/${product.slug}`;
      
      redirect(redirectUrl);
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

/**
 * Build a variant-level SEO title when ?color= and/or ?size= params are present.
 * Format: "{brand} {style} {clean_title} - {gender} | {color} | {size}"
 * Falls back to the parent-level title_optimized from the DB when no variant params match.
 */
function buildVariantSeoTitle(
  product: Product,
  colorParam?: string | null,
  sizeParam?: string | null,
): { title: string; matchedColor?: string; matchedSize?: string } {
  const baseTitle = product.title || product.styleName;
  const gender = product.gender || 'Unisex';

  let matchedColorName: string | undefined;
  let matchedSizeName: string | undefined;

  if (colorParam && product.colors?.length) {
    const color = product.colors.find(
      c => c.colorName.toLowerCase() === colorParam.toLowerCase() ||
           c.colorCode.toLowerCase() === colorParam.toLowerCase()
    );
    if (color) {
      matchedColorName = color.colorName;
      if (sizeParam && color.sizes?.length) {
        const size = color.sizes.find(
          s => s.name.toLowerCase() === sizeParam.toLowerCase()
        );
        if (size) matchedSizeName = size.name;
      }
    }
  }

  if (matchedColorName) {
    const parts = [`${product.brandName} ${product.styleName} ${baseTitle} - ${gender}`, matchedColorName];
    if (matchedSizeName) parts.push(matchedSizeName);
    const variantTitle = parts.join(' | ');
    return {
      title: variantTitle.length <= 150 ? variantTitle : variantTitle.slice(0, 150).replace(/\s+\S*$/, ''),
      matchedColor: matchedColorName,
      matchedSize: matchedSizeName,
    };
  }

  return { title: product.seoTitle || `${baseTitle} - ${product.brandName}` };
}

export async function generateMetadata({ params, searchParams }: ProductPageProps) {
  const slugOrId = params.slug;
  const colorParam = typeof searchParams.color === 'string' ? searchParams.color : null;
  const sizeParam = typeof searchParams.size === 'string' ? searchParams.size : null;
  
  // For numeric IDs, we'll redirect in the page component
  const numericId = parseInt(slugOrId, 10);
  const isNumericId = !isNaN(numericId) && slugOrId === numericId.toString();
  
  if (isNumericId) {
    const product = await getProductByNumericId(numericId);
    if (!product) return { title: 'Product Not Found' };
    const { title } = buildVariantSeoTitle(product, colorParam, sizeParam);
    return {
      title,
      description: product.metaDescription || product.description || `Shop ${product.styleName} by ${product.brandName}`,
    };
  }
  
  // Try slug lookup, then fallback
  let product = await getProductBySlug(slugOrId);
  
  if (!product) {
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

  const { title, matchedColor, matchedSize } = buildVariantSeoTitle(product, colorParam, sizeParam);
  const description = product.metaDescription || product.description || `Shop ${product.styleName} by ${product.brandName}. View colors, sizes, inventory and get wholesale pricing.`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';

  // Unavailable products (manually hidden or auto-discontinued) keep their
  // URL alive but tell Google not to index them. We still allow link-following
  // so crawlers can move on to the "browse similar" CTAs.
  const unavailable = isProductUnavailable(product);

  // Self-referencing canonical: include variant params when they resolved to a valid variant
  let productUrl = `${baseUrl}/product/${product.slug}`;
  if (matchedColor) {
    const canonicalParams = new URLSearchParams();
    canonicalParams.set('color', matchedColor);
    if (matchedSize) canonicalParams.set('size', matchedSize);
    productUrl += `?${canonicalParams.toString()}`;
  }
  
  const imageUrl = product.imageUrl || `${baseUrl}/images/og-default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
    },
    robots: unavailable
      ? { index: false, follow: true }
      : undefined,
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: 'Garment Decor',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: `${product.title || product.styleName} by ${product.brandName}`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const product = await getProduct(params.slug, searchParams);

  if (!product) {
    // Product not found → fall through to the global 404 handler.
    // `app/not-found.tsx` checks the slug_redirects table for any
    // matching legacy URL and either redirects or logs the miss to the
    // unresolved-slugs queue. We don't need a product-specific intercept
    // here anymore.
    notFound();
  }

  if (isProductUnavailable(product)) {
    return (
      <DiscontinuedProductPage
        product={product}
        reason={getUnavailableReason(product)}
      />
    );
  }
  
  // Check for Google automated discount token (pv2 parameter)
  let googleDiscount: GoogleDiscount | null = null;
  const pv2Token = searchParams.pv2;
  
  if (pv2Token && typeof pv2Token === 'string') {
    const merchantId = process.env.GOOGLE_MERCHANT_ID;
    
    if (merchantId) {
      // Validate the JWT token server-side
      const result = await validateDiscountToken(pv2Token, merchantId);
      
      if (result.success) {
        // Token is valid, pass discount to client
        googleDiscount = result.discount;
        console.log(`[Product Page] Valid Google discount for ${result.discount.offerId}: $${result.discount.price}`);
      } else {
        console.warn(`[Product Page] Invalid Google discount token: ${result.error}`);
      }
    } else {
      console.warn('[Product Page] GOOGLE_MERCHANT_ID not configured, skipping discount validation');
    }
  }

  // Resolve initial variant from URL params (color/size from GMC feed links)
  // This enables single-variant-first landing for PMax / Google Shopping ads
  let initialVariant: InitialVariant | null = null;
  const colorParam = typeof searchParams.color === 'string' ? searchParams.color : null;
  const sizeParam = typeof searchParams.size === 'string' ? searchParams.size : null;
  
  if (colorParam && product.colors && product.colors.length > 0) {
    // Match color by name (case-insensitive) or by code
    const matchedColor = product.colors.find(
      c => c.colorName.toLowerCase() === colorParam.toLowerCase() ||
           c.colorCode.toLowerCase() === colorParam.toLowerCase()
    );
    
    if (matchedColor) {
      if (sizeParam) {
        // Match size by name (case-insensitive)
        const matchedSize = matchedColor.sizes.find(
          s => s.name.toLowerCase() === sizeParam.toLowerCase()
        );
        if (matchedSize) {
          initialVariant = {
            colorCode: matchedColor.colorCode,
            colorName: matchedColor.colorName,
            sizeName: matchedSize.name,
          };
        } else {
          // Color matched but size didn't — still pre-select the color (no size pre-fill)
          initialVariant = {
            colorCode: matchedColor.colorCode,
            colorName: matchedColor.colorName,
            sizeName: '',
          };
        }
      } else {
        // Only color in URL, no size — pre-select color only
        initialVariant = {
          colorCode: matchedColor.colorCode,
          colorName: matchedColor.colorName,
          sizeName: '',
        };
      }
    }
  }

  // Build variant-aware SEO title for JSON-LD (same logic as generateMetadata)
  const { title: jsonLdTitle } = buildVariantSeoTitle(product, colorParam, sizeParam);

  // Build variant-aware canonical URL for JSON-LD
  let jsonLdUrl = `https://garmentdecor.com/product/${product.slug}`;
  if (initialVariant?.colorName) {
    const params = new URLSearchParams();
    params.set('color', initialVariant.colorName);
    if (initialVariant.sizeName) params.set('size', initialVariant.sizeName);
    jsonLdUrl += `?${params.toString()}`;
  }

  // Build breadcrumb data for structured data
  const breadcrumbItems = [
    { name: 'Home', url: 'https://garmentdecor.com' },
    { name: 'Catalog', url: 'https://garmentdecor.com/catalog' },
    { name: product.brandName, url: `https://garmentdecor.com/catalog?brand=${product.brandId}` },
    { name: product.title || product.styleName, url: `https://garmentdecor.com/product/${product.slug}` },
  ];

  return (
    <>
      {/* Structured Data — uses variant-level title when ?color=&size= are present */}
      <ProductJsonLd
        name={jsonLdTitle}
        description={product.metaDescription || product.description || `${product.styleName} by ${product.brandName}`}
        image={product.imageUrl || ''}
        brand={product.brandName}
        sku={product.styleName}
        price={product.salePrice || product.price}
        url={jsonLdUrl}
        aggregateRating={
          product.reviewCount && product.reviewCount > 0 && product.avgRating
            ? { ratingValue: product.avgRating, reviewCount: product.reviewCount }
            : null
        }
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      {/* FAQ Structured Data */}
      {(() => {
        const productName = `${product.brandName} ${product.styleName}`;
        const faqItems = getProductFaqItems(productName);
        const faqSchema = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map(item => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a,
            },
          })),
        };
        return (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          />
        );
      })()}

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
      <div className="relative overflow-hidden">
        {/* Grain texture */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-1/2 h-64 w-64 rounded-full bg-navy-800/5 blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:py-10 sm:px-6 lg:px-8">
          <Suspense fallback={<ProductDetailSkeleton />}>
            <ProductDetailClient product={product} googleDiscount={googleDiscount} initialVariant={initialVariant} />
          </Suspense>
        </div>
      </div>

      {/* Companion Products (Complete the Look) */}
      <div className="relative bg-white border-t border-stone-200 overflow-hidden">
        {/* Decorative orb */}
        <div className="pointer-events-none absolute -left-32 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CompanionProducts styleId={product.styleId} />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="relative bg-white border-t border-stone-200 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <ProductFAQ productName={`${product.brandName} ${product.styleName}`} />
        </div>
      </div>

      {/* Customer Reviews — only rendered when product has at least one review */}
      {product.reviewCount != null && product.reviewCount > 0 && (
        <div className="relative bg-white border-t border-stone-200 overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <ReviewSection styleId={product.styleId} productName={`${product.brandName} ${product.styleName}`} />
          </div>
        </div>
      )}

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
    </>
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
