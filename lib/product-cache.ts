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
  category?: string;
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
 * Get products from Supabase cache with filters
 */
export async function getProductsFromCache(options: ProductQueryOptions = {}): Promise<ProductQueryResult> {
  const {
    search,
    brand,
    brandId,
    category,
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
  
  // Build base query
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
  
  // Apply filters
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
  const supabase = createServerSupabaseClient();
  
  const [products, popular, colors, skus, syncLog] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_popular', true),
    supabase.from('product_colors').select('*', { count: 'exact', head: true }),
    supabase.from('product_skus').select('*', { count: 'exact', head: true }),
    supabase.from('sync_logs').select('completed_at').eq('status', 'completed').order('completed_at', { ascending: false }).limit(1).single(),
  ]);
  
  return {
    totalProducts: products.count || 0,
    popularProducts: popular.count || 0,
    totalColors: colors.count || 0,
    totalSkus: skus.count || 0,
    lastSync: syncLog.data?.completed_at || null,
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
  
  return {
    id: String(row.style_id),
    styleId: row.style_id,
    styleName: row.style_name,
    brandName: row.brand_name,
    brandId: row.brand_id || 0,
    title,
    description,
    basePrice: row.base_price || 0,
    price: row.base_price || 0,
    salePrice: null,
    imageUrl: row.primary_image_url || '',
    categories: [],
    colors,
    isOnSale: false,
    isSustainable: row.is_sustainable || false,
    isNew: row.is_new || false,
    isPopular: row.is_popular || false,
    popularTier: row.popular_tier as ProductTier | undefined,
  };
}

function transformProductWithSkus(row: any): Product {
  const colors: ProductColor[] = (row.product_colors || []).map((c: any) => {
    const sizes: ProductSize[] = (c.product_skus || [])
      .sort((a: any, b: any) => {
        // Sort by size_order
        const orderA = parseInt(a.size_order) || 999;
        const orderB = parseInt(b.size_order) || 999;
        return orderA - orderB;
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
  
  return {
    id: String(row.style_id),
    styleId: row.style_id,
    styleName: row.style_name,
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
