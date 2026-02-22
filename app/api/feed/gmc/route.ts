import { NextRequest, NextResponse } from 'next/server';
import { POPULAR_PRODUCTS, ProductCategory, ProductTier } from '@/lib/popular-products';
import { 
  generateFeedRow, 
  generateCSV, 
  GMCFeedRow,
  ProductVariant 
} from '@/lib/gmc-feed';
import { createServerSupabaseClient } from '@/lib/supabase';

// Type for cached product from Supabase
interface CachedProduct {
  style_id: number;
  style_name: string;
  slug: string | null;
  brand_name: string;
  title_raw: string | null;
  title_optimized: string | null;
  description_raw: string | null;
  description_optimized: string | null;
  primary_image_url: string | null;
  popular_tier: string | null;
  base_category: string | null;
  product_type: string | null;
  google_category_id: number | null;
  google_category_name: string | null;
  material: string | null;
  gender: string | null;
  age_group: string | null;
  product_skus: Array<{
    sku: string;
    color_name: string;
    color_code: string;
    size_name: string;
    cogs: number;
    retail_price: number;
    sale_price: number | null;
    auto_min_price: number;
    gtin: string | null;
    piece_weight: number;
    qty: number;
    availability: string;
  }>;
}

// ============================================================================
// BASE CATEGORY → ProductCategory FALLBACK MAP
// Maps base_category values from Supabase to GMC feed ProductCategory
// ============================================================================
const BASE_CATEGORY_MAP: Record<string, ProductCategory> = {
  't-shirts': 't-shirts',
  'tees': 't-shirts',
  'short sleeve': 't-shirts',
  'long sleeve': 'long-sleeve',
  'long-sleeve': 'long-sleeve',
  'tank tops': 'tank-tops',
  'tank-tops': 'tank-tops',
  'tanks': 'tank-tops',
  'sweatshirts': 'crewneck',
  'crewneck': 'crewneck',
  'crewnecks': 'crewneck',
  'fleece': 'hoodies',
  'hoodies': 'hoodies',
  'hoodie': 'hoodies',
  'pullover': 'hoodies',
  'zip hoodies': 'zip-hoodies',
  'zip-hoodies': 'zip-hoodies',
  'full zip': 'zip-hoodies',
  'quarter zip': 'quarter-zip',
  'quarter-zip': 'quarter-zip',
  'polos': 'polos',
  'polo': 'polos',
  'performance': 'performance',
  'athletic': 'performance',
  'activewear': 'performance',
  'headwear': 'headwear',
  'caps': 'headwear',
  'hats': 'headwear',
  'beanies': 'headwear',
  'outerwear': 'outerwear',
  'jackets': 'outerwear',
  'jacket': 'outerwear',
  'youth': 'youth',
  'kids': 'youth',
  'womens': 'womens',
  "women's": 'womens',
  'ladies': 'womens',
};

/**
 * Resolve a ProductCategory from various product fields.
 * Priority: POPULAR_PRODUCTS match > base_category > product_type > default
 */
function resolveCategory(
  product: CachedProduct,
  popularCategoryMap: Map<number, ProductCategory>
): ProductCategory {
  // 1. Check if product is in POPULAR_PRODUCTS
  const popularCategory = popularCategoryMap.get(product.style_id);
  if (popularCategory) return popularCategory;
  
  // 2. Try base_category
  if (product.base_category) {
    const normalized = product.base_category.toLowerCase().trim();
    if (BASE_CATEGORY_MAP[normalized]) return BASE_CATEGORY_MAP[normalized];
    // Partial match
    for (const [key, value] of Object.entries(BASE_CATEGORY_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) return value;
    }
  }
  
  // 3. Try product_type (e.g. "T-Shirts > Core T-Shirts")
  if (product.product_type) {
    const normalized = product.product_type.toLowerCase().trim();
    for (const [key, value] of Object.entries(BASE_CATEGORY_MAP)) {
      if (normalized.includes(key)) return value;
    }
  }
  
  // 4. Default
  return 't-shirts';
}

// ============================================================================
// FETCH FROM SUPABASE CACHE (fast)
// Now fetches ALL active products with slugs (not just popular)
// ============================================================================
async function fetchFromSupabase(): Promise<{
  rows: GMCFeedRow[];
  fromCache: boolean;
  debug?: { colorRecords: number; colorProducts: number; totalProducts: number; skippedSkus: number; debug1801?: any };
}> {
  const supabase = createServerSupabaseClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';
  
  // Check if we have cached data (any active products)
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('slug', 'is', null);
  
  if (!count || count === 0) {
    return { rows: [], fromCache: false };
  }
  
  // Fetch ALL active products with slugs and their SKUs
  // Use pagination to handle large catalogs (Supabase default limit is 1000)
  const allProducts: CachedProduct[] = [];
  const PAGE_SIZE = 1000;
  let page = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        style_id,
        style_name,
        slug,
        brand_name,
        title_raw,
        title_optimized,
        description_raw,
        description_optimized,
        primary_image_url,
        popular_tier,
        base_category,
        product_type,
        google_category_id,
        google_category_name,
        material,
        gender,
        age_group,
        product_skus (
          sku,
          color_name,
          color_code,
          size_name,
          cogs,
          retail_price,
          sale_price,
          auto_min_price,
          gtin,
          piece_weight,
          qty,
          availability
        )
      `)
      .eq('is_active', true)
      .not('slug', 'is', null)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    
    if (error) {
      console.error(`[GMC Feed] Supabase query error (page ${page}):`, error);
      break;
    }
    
    if (data && data.length > 0) {
      allProducts.push(...(data as CachedProduct[]));
      hasMore = data.length === PAGE_SIZE;
      page++;
    } else {
      hasMore = false;
    }
  }
  
  if (allProducts.length === 0) {
    return { rows: [], fromCache: false };
  }
  
  console.log(`[GMC Feed] Fetched ${allProducts.length} active products with slugs`);
  
  // Fetch color images separately (batch by style IDs)
  const styleIds = allProducts.map(p => p.style_id);
  type ColorRecord = { style_id: number; color_code: string; front_image: string | null; back_image: string | null; side_image: string | null };
  
  // Fetch colors in batches to handle large catalogs
  const allColorData: ColorRecord[] = [];
  const COLOR_BATCH = 500;
  for (let i = 0; i < styleIds.length; i += COLOR_BATCH) {
    const batchIds = styleIds.slice(i, i + COLOR_BATCH);
    const { data: colorData } = await supabase
      .from('product_colors')
      .select('style_id, color_code, front_image, back_image, side_image')
      .in('style_id', batchIds)
      .limit(50000) as { data: ColorRecord[] | null };
    if (colorData) {
      allColorData.push(...colorData);
    }
  }
  
  // Build a lookup map: style_id -> color_code -> images
  const colorImageMap = new Map<number, Map<string, { front: string | null; back: string | null; side: string | null }>>();
  for (const color of allColorData) {
    if (!colorImageMap.has(color.style_id)) {
      colorImageMap.set(color.style_id, new Map());
    }
    colorImageMap.get(color.style_id)!.set(String(color.color_code), {
      front: color.front_image,
      back: color.back_image,
      side: color.side_image,
    });
  }
  console.log(`[GMC Feed] Loaded ${allColorData.length} color records for ${colorImageMap.size} products`);
  
  // Build popular products category map (for products in POPULAR_PRODUCTS list)
  const popularCategoryMap = new Map<number, ProductCategory>();
  for (const pop of POPULAR_PRODUCTS) {
    const matchingProduct = allProducts.find(p => 
      p.style_name.toLowerCase().includes(pop.styleNumber.toLowerCase()) ||
      pop.styleNumber.toLowerCase().includes(p.style_name.toLowerCase().split(' ')[0])
    );
    if (matchingProduct) {
      popularCategoryMap.set(matchingProduct.style_id, pop.category);
    }
  }
  
  // Generate GMC rows from cached data
  const feedRows: GMCFeedRow[] = [];
  let skippedProducts = 0;
  let skippedSkus = 0;
  
  for (const product of allProducts) {
    // Skip products without slugs (shouldn't happen after query filter, but be safe)
    if (!product.slug) {
      skippedProducts++;
      continue;
    }
    
    const skus = product.product_skus || [];
    const category = resolveCategory(product, popularCategoryMap);
    const tier = (product.popular_tier || 'value') as ProductTier;
    
    // Get color images for this product from the pre-built map
    const productColorMap = colorImageMap.get(product.style_id);
    
    for (const sku of skus) {
      // Skip SKUs without valid COGS or auto_min_price
      // These would send invalid data to Google and hurt the "valid COGS / min price" share
      if (!sku.cogs || sku.cogs <= 0 || !sku.auto_min_price || sku.auto_min_price <= 0) {
        skippedSkus++;
        continue;
      }
      
      // Extract style number from the first token of style_name (e.g., "G500 Heavy Cotton Tee" → "G500")
      const styleNumber = product.style_name.split(/\s+/)[0] || '';

      const variant: ProductVariant = {
        sku: sku.sku,
        styleId: product.style_id,
        styleName: product.title_raw || product.style_name,
        styleNumber,
        brandName: product.brand_name,
        colorName: sku.color_name,
        colorCode: sku.color_code,
        sizeName: sku.size_name,
        customerPrice: sku.cogs,
        gtin: sku.gtin || '',
        qty: sku.qty || 0,
        pieceWeight: sku.piece_weight || 0,
        material: product.material || '',
        colorSwatchImage: '',
        styleImage: product.primary_image_url || '',
        slug: product.slug,
        titleOverride: product.title_optimized || undefined,
        descriptionOverride: product.description_optimized || undefined,
      };
      
      const row = generateFeedRow(variant, category, tier, baseUrl);
      
      // Override with cached values
      row.availability = sku.availability === 'in_stock' ? 'in_stock' : 'out_of_stock';
      row.quantity = sku.availability === 'in_stock' ? String(sku.qty || 999) : '0';
      row.price = sku.retail_price ? `${sku.retail_price.toFixed(2)} USD` : row.price;
      if (sku.sale_price) {
        row.sale_price = `${sku.sale_price.toFixed(2)} USD`;
      }
      row.cost_of_goods_sold = `${sku.cogs.toFixed(2)} USD`;
      row.auto_pricing_min_price = `${sku.auto_min_price.toFixed(2)} USD`;
      
      // Use google_category_id from DB if available (more specific than the map)
      if (product.google_category_id) {
        row.google_product_category = String(product.google_category_id);
      }
      
      // Use gender and age_group from DB if available
      if (product.gender) {
        row.gender = product.gender;
      }
      if (product.age_group) {
        row.age_group = product.age_group;
      }
      
      // Build additional_image_link from color images (front, back, side)
      const colorImages = productColorMap?.get(String(sku.color_code));
      if (colorImages) {
        const normalizeCdnUrl = (url: string | null) => 
          url ? url.replace('www.ssactivewear.com', 'cdn.ssactivewear.com') : null;
        
        const front = normalizeCdnUrl(colorImages.front);
        const back = normalizeCdnUrl(colorImages.back);
        const side = normalizeCdnUrl(colorImages.side);
        
        const additionalImages: string[] = [];
        if (back && back !== front) {
          additionalImages.push(back);
        }
        if (side && side !== front) {
          additionalImages.push(side);
        }
        if (front && front !== row.image_link) {
          row.image_link = front;
        }
        if (additionalImages.length > 0) {
          row.additional_image_link = additionalImages.join(',');
        }
      }
      
      feedRows.push(row);
    }
  }
  
  if (skippedProducts > 0) {
    console.warn(`[GMC Feed] Skipped ${skippedProducts} products without slugs`);
  }
  if (skippedSkus > 0) {
    console.warn(`[GMC Feed] Skipped ${skippedSkus} SKUs without valid COGS/auto_min_price`);
  }
  console.log(`[GMC Feed] Generated ${feedRows.length} rows from ${allProducts.length} products (Supabase cache)`);
  
  // Debug: trace why 1801GD color images are missing
  const inStyleIds = styleIds.includes(9001801);
  const colorDataFor1801 = allColorData.filter(c => c.style_id === 9001801);
  const debug1801 = colorImageMap.get(9001801);
  const debug1801Info = {
    inStyleIds,
    colorDataCount: colorDataFor1801.length,
    colorDataSample: colorDataFor1801.slice(0, 2).map(c => ({ code: c.color_code, front: c.front_image?.split('/').pop()?.slice(0, 30) })),
    inMap: !!debug1801,
    mapSize: debug1801?.size || 0,
  };

  return { 
    rows: feedRows, 
    fromCache: true,
    debug: { colorRecords: allColorData.length, colorProducts: colorImageMap.size, totalProducts: allProducts.length, skippedSkus, debug1801: debug1801Info }
  };
}

// ============================================================================
// FETCH FROM SS API (slow fallback)
// ============================================================================

// SS Activewear API credentials
const SS_USERNAME = process.env.SS_USERNAME;
const SS_API_KEY = process.env.SS_API_KEY;

// Fetch products from SS Activewear API
async function fetchSSProducts(styleNumbers: string[]): Promise<Map<string, {
  styleId: number;
  styleName: string;
  brandName: string;
  description: string;
  variants: ProductVariant[];
}>> {
  if (!SS_USERNAME || !SS_API_KEY) {
    throw new Error('SS Activewear credentials not configured');
  }

  const auth = Buffer.from(`${SS_USERNAME}:${SS_API_KEY}`).toString('base64');
  const results = new Map();

  // Fetch styles to get style IDs
  const stylesResponse = await fetch('https://api.ssactivewear.com/v2/styles/', {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 86400 }, // Cache for 24 hours
  });

  if (!stylesResponse.ok) {
    throw new Error(`Failed to fetch styles: ${stylesResponse.status}`);
  }

  const allStyles = await stylesResponse.json();
  
  // Filter to our popular products and create a map
  const styleMap = new Map<string, { styleId: number; styleName: string; brandName: string; description: string }>();
  
  for (const style of allStyles) {
    const styleNum = style.styleNumber?.toString() || style.styleName?.split(' ')[0];
    if (styleNumbers.includes(styleNum)) {
      styleMap.set(styleNum, {
        styleId: style.styleID,
        styleName: style.title || style.styleName,
        brandName: style.brandName,
        description: style.description || '',
      });
    }
  }

  // Fetch products for matched styles (in batches)
  const styleIds = Array.from(styleMap.values()).map(s => s.styleId);
  const BATCH_SIZE = 25;
  
  for (let i = 0; i < styleIds.length; i += BATCH_SIZE) {
    const batchIds = styleIds.slice(i, i + BATCH_SIZE);
    const idsParam = batchIds.join(',');
    
    const productsResponse = await fetch(
      `https://api.ssactivewear.com/v2/products/?styleID=${idsParam}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (productsResponse.ok) {
      const products = await productsResponse.json();
      
      // Group products by style
      for (const product of products) {
        const styleInfo = Array.from(styleMap.entries()).find(
          ([, v]) => v.styleId === product.styleID
        );
        
        if (styleInfo) {
          const [styleNum, info] = styleInfo;
          
          if (!results.has(styleNum)) {
            results.set(styleNum, {
              ...info,
              variants: [],
            });
          }
          
          results.get(styleNum).variants.push({
            sku: product.sku,
            styleId: product.styleID,
            styleName: info.styleName,
            brandName: info.brandName,
            colorName: product.colorName,
            colorCode: product.colorCode,
            sizeName: product.sizeName,
            customerPrice: product.customerPrice || product.salePrice || 0,
            gtin: product.gtin,
            pieceWeight: product.pieceWeight,
            material: product.brandName, // SS API doesn't return material directly
            colorSwatchImage: product.colorSwatchImage,
            styleImage: product.styleImage,
          });
        }
      }
    }
  }

  return results;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const limit = parseInt(searchParams.get('limit') || '0') || undefined;
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';
    
    let feedRows: GMCFeedRow[] = [];
    let source = 'ss_api';
    
    // ========================================================================
    // TRY SUPABASE CACHE FIRST (fast: ~1-2 seconds vs 30-60 seconds)
    // ========================================================================
    let debugInfo: { colorRecords: number; colorProducts: number; totalProducts?: number; skippedSkus?: number } | undefined;
    if (!forceRefresh) {
      try {
        const cached = await fetchFromSupabase();
        if (cached.fromCache && cached.rows.length > 0) {
          feedRows = cached.rows;
          source = 'supabase_cache';
          debugInfo = cached.debug;
          console.log(`[GMC Feed] Using Supabase cache (${feedRows.length} rows)`);
        }
      } catch (cacheError) {
        console.warn('[GMC Feed] Cache fetch failed:', cacheError);
        // Fall through to SS API
      }
    }
    
    // ========================================================================
    // FALLBACK: SS API (slow)
    // ========================================================================
    if (feedRows.length === 0) {
      console.log('[GMC Feed] Using SS API fallback');
      source = 'ss_api';
      
      // Get style numbers from popular products
      let styleNumbers = [...new Set(POPULAR_PRODUCTS.map(p => p.styleNumber))];
      
      if (limit) {
        styleNumbers = styleNumbers.slice(0, limit);
      }
      
      // Fetch product data from SS Activewear
      const productsMap = await fetchSSProducts(styleNumbers);
      
      // Generate feed rows
      for (const product of POPULAR_PRODUCTS) {
        const ssProduct = productsMap.get(product.styleNumber);
        
        if (ssProduct && ssProduct.variants.length > 0) {
          // Create a row for each variant (color/size combination)
          for (const variant of ssProduct.variants) {
            const row = generateFeedRow(
              variant,
              product.category,
              product.tier,
              baseUrl
            );
            feedRows.push(row);
          }
        }
      }
    }
    
    // Apply limit to rows if specified
    const finalRows = limit ? feedRows.slice(0, limit * 50) : feedRows;
    
    if (format === 'json') {
      return NextResponse.json({
        count: finalRows.length,
        source,
        debug: debugInfo,
        products: finalRows,
      });
    }
    
    // Default: CSV format
    const csv = generateCSV(finalRows);
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="garment-decor-gmc-feed.csv"',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Feed-Source': source,
      },
    });
  } catch (error) {
    console.error('GMC Feed Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate feed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support HEAD requests for feed validation
export async function HEAD() {
  return new NextResponse(null, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
    },
  });
}
