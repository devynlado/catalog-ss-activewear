/**
 * Product Cache Library
 * 
 * Reads product data from Supabase cache.
 * This is the fast read path - ~100-200ms instead of 5-15 seconds from SS API.
 */

import { createServerSupabaseClient, getSupabaseClient } from './supabase';
import { Product, ProductColor, ProductSize } from './types';
import { ProductTier } from './popular-products';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductQueryOptions {
  search?: string;
  brand?: string;
  brandId?: number;
  category?: string;         // Legacy: single category ID
  categoryIds?: number[];    // New: array of category IDs for multi-filter (AND logic)
  colorFamily?: string;
  onSale?: boolean;
  sustainable?: boolean;
  featured?: boolean;
  streetwear?: boolean;
  page?: number;
  pageSize?: number;
  includeSkus?: boolean;  // Whether to include full SKU data (slower)
}

export interface ProductQueryResult {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// BRAND TIER SYSTEM (for sorting)
// ============================================================================

const BRAND_TIERS: Record<string, number> = {
  // Premium tier (0)
  'BELLA+CANVAS': 0,
  'NEXT LEVEL': 0,
  'NEXT LEVEL APPAREL': 0,
  'COMFORT COLORS': 0,
  'CHAMPION': 0,
  'INDEPENDENT': 0,
  'INDEPENDENT TRADING CO.': 0,
  'INDEPENDENT TRADING CO': 0,
  'LOS ANGELES APPAREL': 0,
  'SHAKA WEAR': 0,
  'LANE SEVEN': 0,
  'YUPOONG': 0,
  'FLEXFIT': 0,
  
  // Standard tier (1)
  'GILDAN': 1,
  'HANES': 1,
  'PORT & COMPANY': 1,
  'JERZEES': 1,
  'PORT AUTHORITY': 1,
  'SPORT-TEK': 1,
  'FRUIT OF THE LOOM': 1,
  'ANVIL': 1,
  'ALSTYLE': 1,
  'AMERICAN APPAREL': 1,
  
  // Specialty tier (2)
  'RICHARDSON': 2,
  'NEW ERA': 2,
  'CARHARTT': 2,
  '47 BRAND': 2,
  'OUTDOOR CAP': 2,
  'RABBIT SKINS': 2,
  'LAT': 2,
  'AUGUSTA SPORTSWEAR': 2,
  'A4': 2,
  'BADGER': 2,
  'CHARLES RIVER': 2,
  'DRI DUCK': 2,
};

function getBrandTier(brandName: string): number {
  if (!brandName) return 3;
  const normalized = brandName.toUpperCase().trim();
  return BRAND_TIERS[normalized] ?? 3;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get style IDs that match ALL specified category IDs (AND logic)
 * Uses the product_categories junction table for efficient filtering
 */
async function getStyleIdsByCategoryIds(categoryIds: number[]): Promise<number[]> {
  if (categoryIds.length === 0) return [];
  
  const supabase = createServerSupabaseClient();
  
  // Use the database function for efficient multi-category filtering
  // Cast to any to avoid RPC type issues
  const { data, error } = await (supabase as any)
    .rpc('get_products_by_categories', { category_ids: categoryIds });
  
  if (error) {
    console.error('[ProductCache] Category filter error:', error);
    // Fallback: do client-side filtering by querying product_categories directly
    const { data: pcData } = await supabase
      .from('product_categories')
      .select('style_id, category_id')
      .in('category_id', categoryIds);
    
    const rows = pcData as Array<{ style_id: number; category_id: number }> | null;
    if (!rows) return [];
    
    // Group by style_id and filter those that have ALL category IDs
    const styleCountMap = new Map<number, Set<number>>();
    for (const row of rows) {
      if (!styleCountMap.has(row.style_id)) {
        styleCountMap.set(row.style_id, new Set());
      }
      styleCountMap.get(row.style_id)!.add(row.category_id);
    }
    
    // Return style_ids that have ALL requested categories
    const matchingStyles: number[] = [];
    for (const [styleId, cats] of styleCountMap) {
      if (categoryIds.every(catId => cats.has(catId))) {
        matchingStyles.push(styleId);
      }
    }
    return matchingStyles;
  }
  
  return (data || []).map((row: { style_id: number }) => row.style_id);
}

/**
 * Get products from Supabase cache with filters
 */
export async function getProductsFromCache(options: ProductQueryOptions = {}): Promise<ProductQueryResult> {
  // #region agent log
  const startTime = Date.now();
  debugLogCache('product-cache.ts:getProductsFromCache', 'Query started', { options: JSON.stringify(options) }, 'D');
  // #endregion
  
  const {
    search,
    brand,
    brandId,
    category,
    categoryIds,
    colorFamily,
    onSale,
    sustainable,
    featured,
    streetwear,
    page = 1,
    pageSize = 20,
    includeSkus = false,
  } = options;
  
  const supabase = createServerSupabaseClient();
  
  // Parse category IDs from both legacy and new format
  let allCategoryIds: number[] = categoryIds || [];
  if (category) {
    // Legacy format: comma-separated IDs
    const parsedIds = category.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    allCategoryIds = [...new Set([...allCategoryIds, ...parsedIds])];
  }
  
  // If category filter specified, get matching style_ids first
  let categoryFilteredStyleIds: number[] | null = null;
  if (allCategoryIds.length > 0) {
    categoryFilteredStyleIds = await getStyleIdsByCategoryIds(allCategoryIds);
    console.log(`[ProductCache] Category filter [${allCategoryIds.join(',')}] matched ${categoryFilteredStyleIds.length} products`);
    
    // If no matches, return empty result
    if (categoryFilteredStyleIds.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  }
  
  // Build base query
  let query = supabase
    .from('products')
    .select(`
      style_id,
      style_name,
      slug,
      brand_id,
      brand_name,
      title_raw,
      title_optimized,
      description_raw,
      description_optimized,
      base_category,
      product_type,
      primary_image_url,
      is_sustainable,
      is_new,
      is_popular,
      popular_tier,
      is_active,
      color_count,
      base_price,
      min_retail_price,
      min_sale_price,
      is_on_sale,
      product_colors (
        id,
        color_name,
        color_code,
        color_family,
        swatch_image,
        front_image,
        back_image,
        side_image,
        on_model_front,
        on_model_back,
        on_model_side,
        availability
      )
    `, { count: 'exact' })
    .eq('is_active', true);
  
  // Apply category filter (must be first to limit results)
  if (categoryFilteredStyleIds && categoryFilteredStyleIds.length > 0) {
    query = query.in('style_id', categoryFilteredStyleIds);
  }
  
  // Apply other filters
  if (search) {
    // Use full-text search
    query = query.textSearch('title_raw', search, { type: 'websearch' });
  }
  
  if (brand) {
    // Brand name filter (case-insensitive)
    query = query.ilike('brand_name', brand);
  }
  
  if (brandId) {
    query = query.eq('brand_id', brandId);
  }
  
  if (sustainable) {
    query = query.eq('is_sustainable', true);
  }
  
  // Featured/popular filter
  if (featured || streetwear) {
    query = query.eq('is_popular', true);
  }
  
  if (streetwear) {
    query = query.eq('popular_tier', 'streetwear');
  }
  
  // Ordering: popular first, then by brand tier and price
  query = query
    .order('is_popular', { ascending: false })
    .order('base_price', { ascending: true });
  
  // Pagination
  const startIndex = (page - 1) * pageSize;
  query = query.range(startIndex, startIndex + pageSize - 1);
  
  const { data, count, error } = await query;
  
  if (error) {
    console.error('[ProductCache] Query error:', error);
    throw new Error(`Failed to query products: ${error.message}`);
  }
  
  // Transform to Product format
  const products: Product[] = (data || []).map(row => transformProduct(row));
  
  // Apply client-side filters that can't be done in Supabase easily
  let filteredProducts = products;
  
  if (colorFamily) {
    const families = colorFamily.split(',').map(f => f.trim().toLowerCase());
    filteredProducts = filteredProducts.filter(p =>
      p.colors.some(c => families.includes(c.colorFamily?.toLowerCase() || ''))
    );
  }
  
  // Sort products: popular tiers first, then brand tier, then price
  filteredProducts = sortProducts(filteredProducts);
  
  const total = count || filteredProducts.length;
  const totalPages = Math.ceil(total / pageSize);
  
  // #region agent log
  const queryDuration = Date.now() - startTime;
  debugLogCache('product-cache.ts:getProductsFromCache', 'Query completed', { durationMs: queryDuration, total, resultCount: filteredProducts.length }, 'D');
  console.log(`[PERF] getProductsFromCache completed in ${queryDuration}ms (${filteredProducts.length} products returned)`);
  // #endregion
  
  return {
    data: filteredProducts,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get popular products only (fast path for homepage/featured)
 */
export async function getPopularProducts(options: {
  page?: number;
  pageSize?: number;
  streetwear?: boolean;
  category?: string;
} = {}): Promise<ProductQueryResult> {
  return getProductsFromCache({
    ...options,
    featured: true,
  });
}

/**
 * Search products using full-text search
 */
export async function searchProductsFromCache(
  searchTerm: string,
  options: Omit<ProductQueryOptions, 'search'> = {}
): Promise<ProductQueryResult> {
  const supabase = createServerSupabaseClient();
  
  const {
    page = 1,
    pageSize = 20,
    featured,
    sustainable,
  } = options;
  
  // Use full-text search on products
  let query = supabase
    .from('products')
    .select(`
      style_id,
      style_name,
      brand_id,
      brand_name,
      title_raw,
      title_optimized,
      description_raw,
      description_optimized,
      base_category,
      product_type,
      primary_image_url,
      is_sustainable,
      is_new,
      is_popular,
      popular_tier,
      is_active,
      color_count,
      base_price,
      product_colors (
        id,
        color_name,
        color_code,
        color_family,
        swatch_image,
        front_image,
        back_image,
        side_image,
        on_model_front,
        on_model_back,
        on_model_side,
        availability
      )
    `, { count: 'exact' })
    .eq('is_active', true);
  
  // Search in title, brand, and style name
  // Using OR to search across multiple fields
  query = query.or(`title_raw.ilike.%${searchTerm}%,brand_name.ilike.%${searchTerm}%,style_name.ilike.%${searchTerm}%`);
  
  if (featured) {
    query = query.eq('is_popular', true);
  }
  
  if (sustainable) {
    query = query.eq('is_sustainable', true);
  }
  
  // Pagination
  const startIndex = (page - 1) * pageSize;
  query = query
    .order('is_popular', { ascending: false })
    .order('base_price', { ascending: true })
    .range(startIndex, startIndex + pageSize - 1);
  
  const { data, count, error } = await query;
  
  if (error) {
    console.error('[ProductCache] Search error:', error);
    throw new Error(`Failed to search products: ${error.message}`);
  }
  
  const products = (data || []).map(row => transformProduct(row));
  const sortedProducts = sortProducts(products);
  
  const total = count || products.length;
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    data: sortedProducts,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get a single product with full color and SKU data
 */
export async function getProductByStyleId(styleId: number): Promise<Product | null> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      style_id,
      style_name,
      slug,
      brand_id,
      brand_name,
      title_raw,
      title_optimized,
      description_raw,
      description_optimized,
      base_category,
      product_type,
      primary_image_url,
      is_sustainable,
      is_new,
      is_popular,
      popular_tier,
      is_active,
      color_count,
      base_price,
      product_colors (
        id,
        color_name,
        color_code,
        color_family,
        swatch_image,
        front_image,
        back_image,
        side_image,
        on_model_front,
        on_model_back,
        on_model_side,
        availability,
        product_skus (
          sku,
          size_name,
          size_code,
          size_order,
          retail_price,
          sale_price,
          gtin,
          qty,
          availability
        )
      )
    `)
    .eq('style_id', styleId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return transformProductWithSkus(data);
}

/**
 * Get a single product by slug (SEO-friendly URL)
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      style_id,
      style_name,
      slug,
      brand_id,
      brand_name,
      title_raw,
      title_optimized,
      description_raw,
      description_optimized,
      base_category,
      product_type,
      primary_image_url,
      is_sustainable,
      is_new,
      is_popular,
      popular_tier,
      is_active,
      color_count,
      base_price,
      product_colors (
        id,
        color_name,
        color_code,
        color_family,
        swatch_image,
        front_image,
        back_image,
        side_image,
        on_model_front,
        on_model_back,
        on_model_side,
        availability,
        product_skus (
          sku,
          size_name,
          size_code,
          size_order,
          retail_price,
          sale_price,
          gtin,
          qty,
          availability
        )
      )
    `)
    .eq('slug', slug)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return transformProductWithSkus(data);
}

/**
 * Get products by brand name
 */
export async function getProductsByBrand(
  brandName: string,
  options: { page?: number; pageSize?: number } = {}
): Promise<ProductQueryResult> {
  return getProductsFromCache({
    ...options,
    brand: brandName,
  });
}

// #region agent log
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/f9783fbf-d606-40ca-affb-413522dae600';
function debugLogCache(location: string, message: string, data: Record<string, any>, hypothesisId: string) {
  fetch(DEBUG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location, message, data, hypothesisId, timestamp: Date.now(), sessionId: 'debug-session' }) }).catch(() => {});
}
// #endregion

/**
 * Get cache stats (for monitoring)
 */
export async function getCacheStats(): Promise<{
  totalProducts: number;
  popularProducts: number;
  totalColors: number;
  totalSkus: number;
  lastSync: string | null;
}> {
  // #region agent log
  const startTime = Date.now();
  debugLogCache('product-cache.ts:getCacheStats', 'Starting cache stats query (5 parallel Supabase queries)', {}, 'A');
  console.log(`[PERF] getCacheStats starting (5 parallel Supabase count queries)`);
  // #endregion
  
  const supabase = createServerSupabaseClient();
  
  const [products, popular, colors, skus, syncLog] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_popular', true),
    supabase.from('product_colors').select('*', { count: 'exact', head: true }),
    supabase.from('product_skus').select('*', { count: 'exact', head: true }),
    supabase.from('sync_logs').select('completed_at').eq('status', 'completed').order('completed_at', { ascending: false }).limit(1).single(),
  ]);
  
  // #region agent log
  const duration = Date.now() - startTime;
  debugLogCache('product-cache.ts:getCacheStats', 'Cache stats query completed', { durationMs: duration, totalProducts: products.count }, 'A');
  console.log(`[PERF] getCacheStats completed in ${duration}ms (${products.count} products found)`);
  // #endregion
  
  const syncData = syncLog.data as { completed_at: string } | null;
  
  return {
    totalProducts: products.count || 0,
    popularProducts: popular.count || 0,
    totalColors: colors.count || 0,
    totalSkus: skus.count || 0,
    lastSync: syncData?.completed_at || null,
  };
}

// ============================================================================
// TRANSFORM FUNCTIONS
// ============================================================================

function transformProduct(row: any): Product {
  const colors: ProductColor[] = (row.product_colors || []).map((c: any) => ({
    colorName: c.color_name,
    colorCode: c.color_code,
    colorFamily: c.color_family || '',
    swatchImage: c.swatch_image || '',
    swatchTextColor: '#000000',
    frontImage: c.front_image || '',
    backImage: c.back_image || '',
    sideImage: c.side_image || '',
    onModelFrontImage: c.on_model_front || '',
    onModelBackImage: c.on_model_back || '',
    onModelSideImage: c.on_model_side || '',
    sizes: [], // Sizes loaded separately if needed
  }));
  
  const title = row.title_optimized || row.title_raw || row.style_name;
  const description = row.description_optimized || row.description_raw || '';
  
  // Generate slug if not in database
  const slug = row.slug || `${row.brand_name}-${row.style_name}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  
  // Use min_retail_price for display, fall back to base_price for backward compatibility
  const price = row.min_retail_price || row.base_price || 0;
  const salePrice = row.is_on_sale ? row.min_sale_price : null;
  
  return {
    id: String(row.style_id),
    styleId: row.style_id,
    styleName: row.style_name,
    slug,
    brandName: row.brand_name,
    brandId: row.brand_id || 0,
    title,
    description,
    basePrice: row.base_price || 0,
    price,
    salePrice,
    imageUrl: row.primary_image_url || '',
    categories: [],
    colors,
    isOnSale: row.is_on_sale || false,
    isSustainable: row.is_sustainable || false,
    isNew: row.is_new || false,
    isPopular: row.is_popular || false,
    popularTier: row.popular_tier as ProductTier | undefined,
  };
}

// Canonical apparel size order for fallback sorting
const SIZE_ORDER: Record<string, number> = {
  // Youth sizes (sort first)
  'YXS': 1, 'YS': 2, 'YM': 3, 'YL': 4, 'YXL': 5,
  
  // Adult letter sizes
  'XXS': 10, 'XS': 11, 'S': 12, 'SM': 12,
  'M': 13, 'MD': 13, 'MED': 13,
  'L': 14, 'LG': 14,
  'XL': 15,
  '2XL': 16, 'XXL': 16, '2X': 16,
  '3XL': 17, '3X': 17,
  '4XL': 18, '4X': 18,
  '5XL': 19, '5X': 19,
  '6XL': 20, '6X': 20,
  
  // One size
  'OS': 50, 'OSFA': 50, 'ONE SIZE': 50,
};

function getSizeOrder(sku: { size_order?: string; size_name: string }): number {
  // 1. Try SS API size_order first (most reliable - numeric sort value)
  if (sku.size_order) {
    const parsed = parseInt(sku.size_order, 10);
    if (!isNaN(parsed)) return parsed;
  }
  
  // 2. Try canonical letter/youth size map
  const normalized = sku.size_name.toUpperCase().trim();
  if (SIZE_ORDER[normalized] !== undefined) {
    return SIZE_ORDER[normalized];
  }
  
  // 3. Try numeric sort (for pants: 28, 30, 32...)
  const numeric = parseFloat(normalized);
  if (!isNaN(numeric)) {
    return 100 + numeric;  // Offset so 30 -> 130, 32 -> 132
  }
  
  // 4. Unknown - sort at end
  return 999;
}

function transformProductWithSkus(row: any): Product {
  const colors: ProductColor[] = (row.product_colors || []).map((c: any) => {
    const sizes: ProductSize[] = (c.product_skus || [])
      .sort((a: any, b: any) => {
        // Use comprehensive size ordering
        return getSizeOrder(a) - getSizeOrder(b);
      })
      .map((s: any) => ({
        name: s.size_name,
        code: s.size_code || s.size_name,
        price: s.retail_price || 0,
        salePrice: s.sale_price || null,
        qty: s.qty || 0,
        gtin: s.gtin || '',
      }));
    
    return {
      colorName: c.color_name,
      colorCode: c.color_code,
      colorFamily: c.color_family || '',
      swatchImage: c.swatch_image || '',
      swatchTextColor: '#000000',
      frontImage: c.front_image || '',
      backImage: c.back_image || '',
      sideImage: c.side_image || '',
      onModelFrontImage: c.on_model_front || '',
      onModelBackImage: c.on_model_back || '',
      onModelSideImage: c.on_model_side || '',
      sizes,
    };
  });
  
  const title = row.title_optimized || row.title_raw || row.style_name;
  const description = row.description_optimized || row.description_raw || '';
  
  // Calculate min prices from all SKUs for display
  // This ensures product card and detail page show the same "From $X" price
  const allSkus = colors.flatMap(c => c.sizes);
  const retailPrices = allSkus.map(s => s.price).filter(p => p > 0);
  const salePrices = allSkus.map(s => s.salePrice).filter((p): p is number => p !== null && p > 0);
  
  const minRetailPrice = retailPrices.length > 0 ? Math.min(...retailPrices) : (row.base_price || 0);
  const minSalePrice = salePrices.length > 0 ? Math.min(...salePrices) : null;
  
  // Product is on sale if there's a sale price lower than the retail price
  const isOnSale = minSalePrice !== null && minSalePrice < minRetailPrice;
  
  // Generate slug if not in database
  const slug = row.slug || `${row.brand_name}-${row.style_name}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  
  return {
    id: String(row.style_id),
    styleId: row.style_id,
    styleName: row.style_name,
    slug,
    brandName: row.brand_name,
    brandId: row.brand_id || 0,
    title,
    description,
    basePrice: row.base_price || 0,
    price: minRetailPrice,  // Use calculated min from SKUs
    salePrice: isOnSale ? minSalePrice : null,  // Only set if genuinely on sale
    imageUrl: row.primary_image_url || '',
    categories: [],
    colors,
    isOnSale,
    isSustainable: row.is_sustainable || false,
    isNew: row.is_new || false,
    isPopular: row.is_popular || false,
    popularTier: row.popular_tier as ProductTier | undefined,
  };
}

// ============================================================================
// SORTING
// ============================================================================

function sortProducts(products: Product[]): Product[] {
  const tierOrder: Record<ProductTier, number> = {
    'bestseller': 0,
    'staff-pick': 1,
    'streetwear': 2,
    'value': 3,
  };
  
  return [...products].sort((a, b) => {
    // 1. Popular products first
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    
    // 2. Within popular: sort by tier
    if (a.isPopular && b.isPopular && a.popularTier && b.popularTier) {
      const tierDiff = tierOrder[a.popularTier] - tierOrder[b.popularTier];
      if (tierDiff !== 0) return tierDiff;
    }
    
    // 3. New products next
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    
    // 4. Brand tier
    const brandTierA = getBrandTier(a.brandName);
    const brandTierB = getBrandTier(b.brandName);
    if (brandTierA !== brandTierB) return brandTierA - brandTierB;
    
    // 5. Color variety (more colors = more popular)
    const colorCountA = a.colors?.length || 0;
    const colorCountB = b.colors?.length || 0;
    if (colorCountA !== colorCountB) return colorCountB - colorCountA;
    
    // 6. Price low to high
    return (a.price || 0) - (b.price || 0);
  });
}
