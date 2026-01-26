import { NextRequest, NextResponse } from 'next/server';
import { 
  getProductsFromCache, 
  searchProductsFromCache, 
  getPopularProducts,
  getCacheStats 
} from '@/lib/product-cache';
import { getProducts, searchProducts, getProductsByStyleNumbers } from '@/lib/ss-activewear';
import { Product } from '@/lib/types';
import { POPULAR_PRODUCTS, ProductTier } from '@/lib/popular-products';

// ============================================================================
// CACHE STATUS CHECK
// ============================================================================
let cacheAvailable: boolean | null = null;

async function isCacheAvailable(): Promise<boolean> {
  if (cacheAvailable !== null) return cacheAvailable;
  
  try {
    const stats = await getCacheStats();
    cacheAvailable = stats.totalProducts > 0;
    console.log(`[Products API] Cache available: ${cacheAvailable} (${stats.totalProducts} products)`);
    return cacheAvailable;
  } catch (error) {
    console.log('[Products API] Cache check failed, using SS API fallback');
    cacheAvailable = false;
    return false;
  }
}

// Reset cache status periodically (every 5 minutes)
setInterval(() => {
  cacheAvailable = null;
}, 5 * 60 * 1000);

// ============================================================================
// STRICT MATCHING: Build map of brand+style combinations only
// Only exact matches count - no fuzzy/partial matching
// ============================================================================
const popularBrandStyleMap = new Map<string, ProductTier>();

// Helper to normalize brand names for matching
function normalizeBrandName(brand: string): string {
  return brand
    .toUpperCase()
    .trim()
    .replace(/[+]/g, ' ')  // BELLA+CANVAS -> BELLA CANVAS
    .replace(/\s+/g, ' '); // Multiple spaces to single
}

// Helper to normalize style numbers for matching
function normalizeStyleNumber(style: string): string {
  return style
    .toUpperCase()
    .trim()
    .replace(/[-\s]/g, ''); // Remove dashes and spaces: ST-350 -> ST350
}

POPULAR_PRODUCTS.forEach(p => {
  const styleNum = normalizeStyleNumber(p.styleNumber);
  const brandName = normalizeBrandName(p.brand);
  const tier = p.tier;
  
  // ONLY store brand+style combinations for strict matching
  const brandStyleKey = `${brandName}:${styleNum}`;
  popularBrandStyleMap.set(brandStyleKey, tier);
  
  // Also store common brand name variations
  // e.g., "BELLA CANVAS" and "BELLA+CANVAS" should both match
  const brandVariations = [brandName];
  if (brandName.includes(' ')) {
    brandVariations.push(brandName.replace(/ /g, '+'));
    brandVariations.push(brandName.replace(/ /g, ''));
  }
  
  for (const brandVar of brandVariations) {
    popularBrandStyleMap.set(`${brandVar}:${styleNum}`, tier);
  }
});

// ============================================================================
// BRAND TIER SYSTEM
// Used for secondary sorting - premium/popular brands appear before others
// ============================================================================
const BRAND_TIERS: Record<string, number> = {
  // Premium tier (0) - retail-quality, high demand, user-specified favorites
  'BELLA+CANVAS': 0,
  'NEXT LEVEL': 0,
  'NEXT LEVEL APPAREL': 0,
  'COMFORT COLORS': 0,
  'CHAMPION': 0,
  'INDEPENDENT': 0,
  'INDEPENDENT TRADING CO.': 0,
  'INDEPENDENT TRADING CO': 0,
  'INDEPENDENT TRADING COMPANY': 0,
  'LOS ANGELES APPAREL': 0,
  'SHAKA WEAR': 0,
  'SHAKAWEAR': 0,
  'LANE SEVEN': 0,
  'LANE SEVEN APPAREL': 0,
  'YUPOONG': 0,
  'FLEXFIT': 0,
  
  // Standard tier (1) - industry workhorses, reliable brands
  'GILDAN': 1,
  'HANES': 1,
  'PORT & COMPANY': 1,
  'PORT AND COMPANY': 1,
  'JERZEES': 1,
  'PORT AUTHORITY': 1,
  'SPORT-TEK': 1,
  'SPORTTEK': 1,
  'FRUIT OF THE LOOM': 1,
  'ANVIL': 1,
  'ALSTYLE': 1,
  'AMERICAN APPAREL': 1,
  
  // Specialty tier (2) - headwear, workwear specialists
  'RICHARDSON': 2,
  'NEW ERA': 2,
  'CARHARTT': 2,
  '47 BRAND': 2,
  'OUTDOOR CAP': 2,
  'SPORTSMAN': 2,
  'RABBIT SKINS': 2,
  'LAT': 2,
  'AUGUSTA SPORTSWEAR': 2,
  'A4': 2,
  'BADGER': 2,
  'CHARLES RIVER': 2,
  'CHARLES RIVER APPAREL': 2,
  'DRI DUCK': 2,
  'TRI-MOUNTAIN': 2,
  
  // Other (3) - everything else
};

/**
 * Get brand tier for sorting (lower = higher priority)
 */
function getBrandTier(brandName: string): number {
  if (!brandName) return 3;
  const normalized = brandName.toUpperCase().trim();
  return BRAND_TIERS[normalized] ?? 3;
}

// ============================================================================
// STRICT MATCHING: Find tier for a product
// Only matches when BOTH brand AND style number match exactly
// ============================================================================
function findPopularTier(product: Product): ProductTier | null {
  const styleName = normalizeStyleNumber(product.styleName || '');
  const brandName = normalizeBrandName(product.brandName || '');
  
  if (!styleName || !brandName) {
    return null;
  }
  
  // Try brand+style combination (the ONLY matching method now)
  const brandStyleKey = `${brandName}:${styleName}`;
  if (popularBrandStyleMap.has(brandStyleKey)) {
    return popularBrandStyleMap.get(brandStyleKey)!;
  }
  
  // Try with brand name without spaces (e.g., "BELLACANVAS" for "BELLA CANVAS")
  const brandNoSpaces = brandName.replace(/\s/g, '');
  const altKey = `${brandNoSpaces}:${styleName}`;
  if (popularBrandStyleMap.has(altKey)) {
    return popularBrandStyleMap.get(altKey)!;
  }
  
  // No match - this product is not in our curated list
  return null;
}

// Add popular flags to products
function addPopularFlags(products: Product[]): Product[] {
  let matchedCount = 0;
  const matchedProducts: string[] = [];
  const unmatchedSample: string[] = [];
  
  const result = products.map(product => {
    const tier = findPopularTier(product);
    
    if (tier) {
      matchedCount++;
      if (matchedProducts.length < 5) {
        matchedProducts.push(`${product.brandName} ${product.styleName} (${tier})`);
      }
      return {
        ...product,
        isPopular: true,
        popularTier: tier,
      };
    } else {
      // Collect unmatched for debugging
      if (unmatchedSample.length < 5) {
        unmatchedSample.push(`${product.brandName} "${product.styleName}"`);
      }
    }
    return product;
  });
  
  // Log debug info
  console.log(`[addPopularFlags] Checked ${products.length} products, matched ${matchedCount} as popular (${((matchedCount/products.length)*100).toFixed(1)}%)`);
  if (matchedProducts.length > 0) {
    console.log(`[addPopularFlags] Matched examples:`, matchedProducts);
  }
  if (unmatchedSample.length > 0 && matchedCount < 5) {
    console.log(`[addPopularFlags] Unmatched examples:`, unmatchedSample);
    console.log(`[addPopularFlags] Popular map has ${popularBrandStyleMap.size} entries. Sample:`, Array.from(popularBrandStyleMap.keys()).slice(0, 15));
  }
  
  return result;
}

// ============================================================================
// SMART SORTING SYSTEM
// Sorts products to maximize user experience:
// 1. Popular (curated) products first
// 2. Then uses multiple signals: brand quality, color variety, price range
// ============================================================================

/**
 * Get color variety score (more colors = more popular/versatile product)
 * Score: 0-3 where higher is better
 */
function getColorVarietyScore(product: Product): number {
  const colorCount = product.colors?.length || 0;
  if (colorCount >= 15) return 3;  // Excellent variety
  if (colorCount >= 8) return 2;   // Good variety
  if (colorCount >= 4) return 1;   // Some variety
  return 0;                         // Limited options
}

/**
 * Get price range score - prefers mid-range products
 * Customers typically prefer $8-18 range (quality without premium markup)
 * Score: 0-3 where higher is better
 */
function getPriceRangeScore(price: number): number {
  if (price >= 8 && price <= 18) return 3;   // Sweet spot - quality basics
  if (price >= 5 && price < 8) return 2;     // Budget-friendly
  if (price > 18 && price <= 30) return 2;   // Premium but reasonable
  if (price > 30) return 1;                   // Premium/specialty
  return 0;                                   // Very cheap (quality concerns)
}

/**
 * Sort products with popular items first, then smart secondary sorting
 * 
 * Sorting priority for non-popular products:
 * 1. New arrivals (isNew flag)
 * 2. Brand tier (premium brands like Bella+Canvas before Gildan)
 * 3. Color variety (products with more colors are more popular)
 * 4. Price range (mid-range $8-18 preferred)
 * 5. Final tiebreaker: price low-to-high
 */
function sortPopularFirst(products: Product[]): Product[] {
  const tierOrder: Record<ProductTier, number> = {
    'bestseller': 0,
    'staff-pick': 1,
    'streetwear': 2,
    'value': 3,
  };
  
  return [...products].sort((a, b) => {
    // 1. Popular products ALWAYS come first
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    
    // 2. Within popular products: sort by tier (bestseller > staff-pick > streetwear > value)
    if (a.isPopular && b.isPopular && a.popularTier && b.popularTier) {
      const tierDiff = tierOrder[a.popularTier] - tierOrder[b.popularTier];
      if (tierDiff !== 0) return tierDiff;
      // Within same tier, sort by brand tier then price
      const brandDiff = getBrandTier(a.brandName) - getBrandTier(b.brandName);
      if (brandDiff !== 0) return brandDiff;
      return (a.price || 0) - (b.price || 0);
    }
    
    // ========================================
    // NON-POPULAR PRODUCTS: Smart sorting
    // ========================================
    
    // 3. New arrivals come first
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    
    // 4. Sort by brand tier (premium brands first)
    const brandTierA = getBrandTier(a.brandName);
    const brandTierB = getBrandTier(b.brandName);
    if (brandTierA !== brandTierB) return brandTierA - brandTierB;
    
    // 5. Within same brand tier: color variety (more colors = higher rank)
    const colorScoreA = getColorVarietyScore(a);
    const colorScoreB = getColorVarietyScore(b);
    if (colorScoreA !== colorScoreB) return colorScoreB - colorScoreA; // Higher score first
    
    // 6. Within same color variety: prefer mid-range prices
    const priceA = a.price || 0;
    const priceB = b.price || 0;
    const priceScoreA = getPriceRangeScore(priceA);
    const priceScoreB = getPriceRangeScore(priceB);
    if (priceScoreA !== priceScoreB) return priceScoreB - priceScoreA; // Higher score first
    
    // 7. Final tiebreaker: price low to high
    return priceA - priceB;
  });
}

// Get unique popular style numbers for direct searching
function getPopularStyleNumbers(): string[] {
  // Get unique style numbers, prioritizing bestsellers and staff-picks
  const tierPriority: Record<ProductTier, number> = {
    'bestseller': 0,
    'staff-pick': 1,
    'streetwear': 2,
    'value': 3,
  };
  
  // Sort by tier and deduplicate by style number
  const sortedProducts = [...POPULAR_PRODUCTS].sort((a, b) => 
    tierPriority[a.tier] - tierPriority[b.tier]
  );
  
  const seen = new Set<string>();
  const styleNumbers: string[] = [];
  
  for (const p of sortedProducts) {
    const upper = p.styleNumber.toUpperCase();
    if (!seen.has(upper)) {
      seen.add(upper);
      styleNumbers.push(p.styleNumber);
    }
  }
  
  return styleNumbers;
}

// Apply client-side filters (onSale, sustainable)
function applyProductFilters(products: Product[], filters: { onSale?: boolean; sustainable?: boolean }): Product[] {
  let filtered = products;
  
  if (filters.onSale) {
    filtered = filtered.filter(p => p.isOnSale);
  }
  
  if (filters.sustainable) {
    filtered = filtered.filter(p => p.isSustainable);
  }
  
  return filtered;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const brand = searchParams.get('brand');
    const category = searchParams.get('category');
    const style = searchParams.get('style');
    const colorFamily = searchParams.get('colorFamily');
    const attr = searchParams.get('attr'); // Attribute category IDs
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    
    // Quick filters
    const onSale = searchParams.get('onSale') === 'true';
    const sustainable = searchParams.get('sustainable') === 'true';
    const featured = searchParams.get('featured') === 'true'; // Popular products only
    const streetwear = searchParams.get('streetwear') === 'true'; // Streetwear tier only
    const hasQuickFilters = onSale || sustainable;
    const hasPopularFilters = featured || streetwear;

    // ========================================================================
    // TRY SUPABASE CACHE FIRST (fast path: ~100-200ms)
    // ========================================================================
    const useCache = await isCacheAvailable();
    
    if (useCache) {
      console.log('[Products API] Using Supabase cache');
      
      try {
        // Search query
        if (search) {
          const result = await searchProductsFromCache(search, {
            page,
            pageSize,
            featured: hasPopularFilters,
            sustainable,
          });
          return NextResponse.json(result);
        }
        
        // No filters - show popular products
        const noFilters = !brand && !category && !attr && !colorFamily && !style;
        
        if (noFilters || hasPopularFilters) {
          const result = await getPopularProducts({
            page,
            pageSize,
            streetwear,
          });
          return NextResponse.json(result);
        }
        
        // With filters
        const result = await getProductsFromCache({
          brand: brand || undefined,
          colorFamily: colorFamily || undefined,
          sustainable,
          featured: hasPopularFilters,
          streetwear,
          page,
          pageSize,
        });
        return NextResponse.json(result);
        
      } catch (cacheError) {
        console.error('[Products API] Cache error, falling back to SS API:', cacheError);
        // Fall through to SS API fallback
      }
    }
    
    // ========================================================================
    // FALLBACK: SS ACTIVEWEAR API (slow path: 5-15 seconds)
    // Used when cache is empty or has errors
    // ========================================================================
    console.log('[Products API] Using SS API fallback');

    let allProducts;

    if (search) {
      // Search by keyword or style number - limit to reasonable amount
      allProducts = await searchProducts(search);
      
      // Add popular flags
      allProducts = addPopularFlags(allProducts);
      
      // Apply quick filters to search results
      if (hasQuickFilters) {
        allProducts = applyProductFilters(allProducts, { onSale, sustainable });
      }
      
      // Filter to featured/streetwear only if requested
      if (featured) {
        allProducts = allProducts.filter(p => p.isPopular);
      }
      if (streetwear) {
        allProducts = allProducts.filter(p => p.isPopular && p.popularTier === 'streetwear');
      }
      
      // Apply smart sorting to search results
      allProducts = sortPopularFirst(allProducts);
      
      // Slice search results for pagination
      const total = allProducts.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedProducts = allProducts.slice(startIndex, startIndex + pageSize);
      
      return NextResponse.json({
        data: paginatedProducts,
        total,
        page,
        pageSize,
        totalPages,
      });
    }
    
    // Combine main category with attribute categories for filtering
    const allCategoryIds = [category, attr].filter(Boolean).join(',') || undefined;
    
    // SPECIAL CASE: Featured/Popular Products filter
    // When this filter is active, we use efficient batch lookup for popular style numbers
    if (hasPopularFilters && !search) {
      console.log(`[API] Featured filter active. Fetching popular products directly...`);
      
      // Get the popular style numbers to search for
      const popularStyleNums = getPopularStyleNumbers();
      
      // For streetwear filter, only search for streetwear tier products
      const stylesToSearch = streetwear 
        ? POPULAR_PRODUCTS.filter(p => p.tier === 'streetwear').map(p => p.styleNumber)
        : popularStyleNums;
      
      // Parse category ID if specified
      const categoryIdNum = category ? parseInt(category.split(',')[0], 10) : undefined;
      
      // Use the efficient batch lookup function
      let products = await getProductsByStyleNumbers(stylesToSearch, {
        categoryId: categoryIdNum,
        limit: 150, // Get enough products to filter
      });
      
      // Add popular flags to all fetched products
      products = addPopularFlags(products);
      
      // Filter to only actually popular products (in case some non-popular were included)
      let popularProducts = products.filter(p => p.isPopular);
      
      // For streetwear, filter to only streetwear tier
      if (streetwear) {
        popularProducts = popularProducts.filter(p => p.popularTier === 'streetwear');
      }
      
      console.log(`[API] Found ${popularProducts.length} popular products`);
      
      // Apply color family filter if specified
      if (colorFamily) {
        const colorFamilies = colorFamily.split(',').map(c => c.trim().toLowerCase());
        popularProducts = popularProducts.filter(p =>
          p.colors.some(c => colorFamilies.includes(c.colorFamily?.toLowerCase() || ''))
        );
      }
      
      // Apply quick filters
      if (hasQuickFilters) {
        popularProducts = applyProductFilters(popularProducts, { onSale, sustainable });
      }
      
      // Sort by tier priority
      popularProducts = sortPopularFirst(popularProducts);
      
      // Paginate results
      const total = popularProducts.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedProducts = popularProducts.slice(startIndex, startIndex + pageSize);
      
      return NextResponse.json({
        data: paginatedProducts,
        total,
        page,
        pageSize,
        totalPages,
      });
    }
    
    // When only quick filters (onSale/sustainable) are active (no featured filter)
    if (hasQuickFilters) {
      // Fetch a large batch to find enough matching products
      const fetchLimit = category ? 300 : 500;
      
      allProducts = await getProducts({
        style: style || undefined,
        brand: brand || undefined,
        category: allCategoryIds,
        colorFamily: colorFamily || undefined,
        limit: fetchLimit,
        offset: 0,
      });
      
      // Add popular flags
      allProducts = addPopularFlags(allProducts);
      
      // Apply quick filters
      allProducts = applyProductFilters(allProducts, { onSale, sustainable });
      
      // Apply smart sorting
      allProducts = sortPopularFirst(allProducts);
      
      // Paginate filtered results
      const total = allProducts.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedProducts = allProducts.slice(startIndex, startIndex + pageSize);
      
      return NextResponse.json({
        data: paginatedProducts,
        total,
        page,
        pageSize,
        totalPages,
      });
    }
    
    // Normal pagination - ALWAYS apply smart sorting
    // SPECIAL CASE: When no filters applied, ONLY show curated popular products
    // This gives customers a curated shopping experience instead of overwhelming them
    const noFilters = !brand && !category && !attr && !colorFamily && !style;
    
    if (noFilters) {
      console.log(`[API] No filters - showing ONLY curated popular products`);
      
      // Fetch ALL popular products from our curated list
      const popularStyleNums = getPopularStyleNumbers();
      let popularProducts = await getProductsByStyleNumbers(popularStyleNums, { limit: 500 });
      popularProducts = addPopularFlags(popularProducts);
      popularProducts = popularProducts.filter(p => p.isPopular); // Only keep matched popular
      popularProducts = sortPopularFirst(popularProducts);
      
      console.log(`[API] Found ${popularProducts.length} curated popular products`);
      
      // Paginate the curated list ONLY
      const total = popularProducts.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedProducts = popularProducts.slice(startIndex, startIndex + pageSize);
      
      return NextResponse.json({
        data: paginatedProducts,
        total,
        page,
        pageSize,
        totalPages,
      });
    }
    
    // WITH FILTERS: Fetch filtered products and apply smart sorting
    const fetchLimit = Math.max(page * pageSize * 2, 150); // Fetch enough for sorting
    
    allProducts = await getProducts({
      style: style || undefined,
      brand: brand || undefined,
      category: allCategoryIds,
      colorFamily: colorFamily || undefined,
      limit: fetchLimit,
      offset: 0,
    });
    
    // Add popular flags and sort
    allProducts = addPopularFlags(allProducts);
    allProducts = sortPopularFirst(allProducts);
    
    // Paginate the sorted results
    const startIndex = (page - 1) * pageSize;
    const paginatedProducts = allProducts.slice(startIndex, startIndex + pageSize);

    // For total count: use the fetched products count if it's less than fetch limit,
    // otherwise get from cache (this fixes the "0 products" bug for brand filter)
    let total: number;
    if (allProducts.length < fetchLimit) {
      // We fetched all matching products, use actual count
      total = allProducts.length;
    } else {
      // There might be more, get count from cache
      const { getFilteredStyleCount } = await import('@/lib/ss-activewear');
      total = await getFilteredStyleCount({
        brand: brand || undefined,
        category: allCategoryIds,
      });
      // If cache returns 0 but we have products, use product count
      if (total === 0 && allProducts.length > 0) {
        total = allProducts.length;
      }
    }
    
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: paginatedProducts,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
