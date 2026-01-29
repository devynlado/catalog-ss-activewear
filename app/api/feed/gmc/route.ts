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
// FETCH FROM SUPABASE CACHE (fast)
// ============================================================================
async function fetchFromSupabase(): Promise<{
  rows: GMCFeedRow[];
  fromCache: boolean;
}> {
  const supabase = createServerSupabaseClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';
  
  // Check if we have cached data
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('is_popular', true);
  
  if (!count || count === 0) {
    return { rows: [], fromCache: false };
  }
  
  // Fetch all popular products with their SKUs
  const { data, error } = await supabase
    .from('products')
    .select(`
      style_id,
      style_name,
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
    .eq('is_popular', true);
  
  if (error || !data) {
    console.error('[GMC Feed] Supabase query error:', error);
    return { rows: [], fromCache: false };
  }
  
  // Cast to typed array
  const products = data as CachedProduct[];
  
  // Fetch color images separately (no FK relationship in Supabase)
  const styleIds = products.map(p => p.style_id);
  type ColorRecord = { style_id: number; color_code: string; front_image: string | null; back_image: string | null; side_image: string | null };
  const { data: colorData } = await supabase
    .from('product_colors')
    .select('style_id, color_code, front_image, back_image, side_image')
    .in('style_id', styleIds) as { data: ColorRecord[] | null };
  
  // Build a lookup map: style_id -> color_code -> images
  const colorImageMap = new Map<number, Map<string, { front: string | null; back: string | null; side: string | null }>>();
  if (colorData) {
    for (const color of colorData) {
      if (!colorImageMap.has(color.style_id)) {
        colorImageMap.set(color.style_id, new Map());
      }
      colorImageMap.get(color.style_id)!.set(color.color_code, {
        front: color.front_image,
        back: color.back_image,
        side: color.side_image,
      });
    }
  }
  console.log(`[GMC Feed] Loaded color images for ${colorImageMap.size} products`);
  
  // Build a map of style_id -> category from POPULAR_PRODUCTS
  const categoryMap = new Map<number, ProductCategory>();
  const styleIdMap = new Map<string, number>();
  
  // First, build a lookup of styleName -> styleId from products
  for (const p of products) {
    styleIdMap.set(p.style_name.toLowerCase(), p.style_id);
  }
  
  // Then map popular products to their categories
  for (const pop of POPULAR_PRODUCTS) {
    // Try to find matching product by style name
    const matchingProduct = products.find(p => 
      p.style_name.toLowerCase().includes(pop.styleNumber.toLowerCase()) ||
      pop.styleNumber.toLowerCase().includes(p.style_name.toLowerCase().split(' ')[0])
    );
    if (matchingProduct) {
      categoryMap.set(matchingProduct.style_id, pop.category);
    }
  }
  
  // Generate GMC rows from cached data
  const feedRows: GMCFeedRow[] = [];
  
  for (const product of products) {
    const skus = product.product_skus || [];
    const category = categoryMap.get(product.style_id) || 't-shirts' as ProductCategory;
    const tier = (product.popular_tier || 'value') as ProductTier;
    
    // Get color images for this product from the pre-built map
    const productColorMap = colorImageMap.get(product.style_id);
    
    for (const sku of skus) {
      const variant: ProductVariant = {
        sku: sku.sku,
        styleId: product.style_id,
        styleName: product.title_optimized || product.title_raw || product.style_name,
        brandName: product.brand_name,
        colorName: sku.color_name,
        colorCode: sku.color_code,
        sizeName: sku.size_name,
        customerPrice: sku.cogs || 0,  // COGS for pricing calculation
        gtin: sku.gtin || '',
        qty: sku.qty || 0,  // Inventory quantity
        pieceWeight: sku.piece_weight || 0,
        material: product.material || '',
        colorSwatchImage: '',
        styleImage: product.primary_image_url || '',
      };
      
      const row = generateFeedRow(variant, category, tier, baseUrl);
      
      // Override with cached values
      row.availability = sku.availability === 'in_stock' ? 'in_stock' : 'out_of_stock';
      // Set quantity based on availability (0 if out of stock, actual qty or 999 if in stock)
      row.quantity = sku.availability === 'in_stock' ? String(sku.qty || 999) : '0';
      row.price = sku.retail_price ? `${sku.retail_price.toFixed(2)} USD` : row.price;
      if (sku.sale_price) {
        row.sale_price = `${sku.sale_price.toFixed(2)} USD`;
      }
      row.cost_of_goods_sold = sku.cogs ? `${sku.cogs.toFixed(2)} USD` : '';
      row.auto_pricing_min_price = sku.auto_min_price ? `${sku.auto_min_price.toFixed(2)} USD` : '';
      
      // Build additional_image_link from color images (front, back, side)
      const colorImages = productColorMap?.get(sku.color_code);
      if (colorImages) {
        const additionalImages: string[] = [];
        // Add back and side images if they exist
        if (colorImages.back && colorImages.back !== colorImages.front) {
          additionalImages.push(colorImages.back);
        }
        if (colorImages.side && colorImages.side !== colorImages.front) {
          additionalImages.push(colorImages.side);
        }
        // Use color front image as primary if available
        if (colorImages.front && colorImages.front !== row.image_link) {
          row.image_link = colorImages.front;
        }
        if (additionalImages.length > 0) {
          row.additional_image_link = additionalImages.join(',');
        }
      }
      
      feedRows.push(row);
    }
  }
  
  console.log(`[GMC Feed] Generated ${feedRows.length} rows from Supabase cache`);
  return { rows: feedRows, fromCache: true };
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
    if (!forceRefresh) {
      try {
        const cached = await fetchFromSupabase();
        if (cached.fromCache && cached.rows.length > 0) {
          feedRows = cached.rows;
          source = 'supabase_cache';
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
