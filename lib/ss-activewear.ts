import { 
  SSProduct, 
  SSProductSku,
  SSInventory, 
  SSCategory, 
  SSBrand,
  Product,
  ProductColor,
  ProductSize,
  Category,
  Brand 
} from './types';

const BASE_URL = 'https://api.ssactivewear.com/v2';

// ============================================
// STYLES CACHE
// Cache all styles in memory for fast filtering
// SS API doesn't support category filtering, so we filter client-side
// ============================================
let stylesCache: SSProduct[] | null = null;
let stylesCacheTime: number = 0;
const STYLES_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

async function getCachedStyles(): Promise<SSProduct[]> {
  const now = Date.now();
  
  // Return cached data if valid
  if (stylesCache && (now - stylesCacheTime) < STYLES_CACHE_TTL) {
    return stylesCache;
  }
  
  // Fetch fresh data
  console.log('[SS API] Fetching all styles for cache...');
  const startTime = Date.now();
  
  const styles = await ssRequest<SSProduct[]>('/styles/', { 
    revalidate: 3600,
    noCache: false,
    timeoutMs: 30000  // 30 second timeout for this large request
  });
  
  // Update cache
  stylesCache = styles;
  stylesCacheTime = now;
  
  console.log(`[SS API] Cached ${styles.length} styles in ${Date.now() - startTime}ms`);
  
  return styles;
}

// ============================================
// BACKGROUND PRODUCT CACHE
// Fetches all product data (pricing, colors) in background
// Stores extracted color/price info per styleID
// ============================================
interface CachedProductData {
  price: number;
  salePrice: number | null;
  colors: ProductColor[];
}

let productDataCache: Map<number, CachedProductData> | null = null;
let productCacheStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
let productCacheProgress: number = 0; // 0-100

// Batch settings for fetching products
const BATCH_SIZE = 100;
const MAX_PARALLEL_BATCHES = 4;

/**
 * Initialize the product cache in the background
 * This fetches all products and extracts pricing/color data
 */
export async function initializeProductCache(): Promise<void> {
  if (productCacheStatus === 'loading' || productCacheStatus === 'ready') {
    return; // Already loading or loaded
  }
  
  productCacheStatus = 'loading';
  productCacheProgress = 0;
  console.log('[Product Cache] Starting background initialization...');
  
  try {
    const startTime = Date.now();
    
    // First, get all style IDs from the styles cache
    const allStyles = await getCachedStyles();
    const allStyleIds = allStyles.map(s => s.styleID);
    
    console.log(`[Product Cache] Fetching product data for ${allStyleIds.length} styles...`);
    
    // Split into batches
    const batches: number[][] = [];
    for (let i = 0; i < allStyleIds.length; i += BATCH_SIZE) {
      batches.push(allStyleIds.slice(i, i + BATCH_SIZE));
    }
    
    const totalBatches = batches.length;
    const cache = new Map<number, CachedProductData>();
    let completedBatches = 0;
    
    // Process batches in parallel groups
    for (let i = 0; i < batches.length; i += MAX_PARALLEL_BATCHES) {
      const batchGroup = batches.slice(i, i + MAX_PARALLEL_BATCHES);
      
      const batchPromises = batchGroup.map(async (batch) => {
        const styleIdParam = batch.join(',');
        try {
          const skuData = await ssRequest<SSProductSku[]>(`/products/?styleID=${styleIdParam}`, {
            revalidate: 3600,
            timeoutMs: 45000
          });
          return skuData;
        } catch (error) {
          console.error(`[Product Cache] Batch failed:`, error);
          return [];
        }
      });
      
      const results = await Promise.all(batchPromises);
      
      // Process results and extract color/price data
      for (const skuData of results) {
        // Group SKUs by styleID
        const styleGroups = new Map<number, SSProductSku[]>();
        for (const sku of skuData) {
          if (!styleGroups.has(sku.styleID)) {
            styleGroups.set(sku.styleID, []);
          }
          styleGroups.get(sku.styleID)!.push(sku);
        }
        
        // Extract unique colors and pricing for each style
        styleGroups.forEach((skus, styleId) => {
          const colorMap = new Map<string, ProductColor>();
          let minPrice = Infinity;
          let minSalePrice: number | null = null;
          
          for (const sku of skus) {
            // Track lowest price
            const price = sku.customerPrice || sku.piecePrice || 0;
            if (price > 0 && price < minPrice) {
              minPrice = price;
            }
            if (sku.salePrice && (minSalePrice === null || sku.salePrice < minSalePrice)) {
              minSalePrice = sku.salePrice;
            }
            
            // Deduplicate colors by colorCode
            if (!colorMap.has(sku.colorCode)) {
              colorMap.set(sku.colorCode, {
                colorName: sku.colorName,
                colorCode: sku.colorCode,
                colorFamily: sku.colorFamily,
                swatchImage: sku.colorSwatchImage ? buildImageUrl(sku.colorSwatchImage) : '',
                swatchTextColor: sku.colorSwatchTextColor || '#000000',
                frontImage: sku.colorFrontImage ? buildImageUrl(sku.colorFrontImage) : '',
                backImage: sku.colorBackImage ? buildImageUrl(sku.colorBackImage) : '',
                sideImage: sku.colorSideImage ? buildImageUrl(sku.colorSideImage) : '',
                sizes: [],
              });
            }
          }
          
          cache.set(styleId, {
            price: minPrice === Infinity ? 0 : minPrice,
            salePrice: minSalePrice,
            colors: Array.from(colorMap.values()),
          });
        });
      }
      
      completedBatches += batchGroup.length;
      productCacheProgress = Math.round((completedBatches / totalBatches) * 100);
      
      if (completedBatches % 20 === 0 || completedBatches === totalBatches) {
        console.log(`[Product Cache] Progress: ${productCacheProgress}% (${cache.size} styles cached)`);
      }
    }
    
    productDataCache = cache;
    productCacheStatus = 'ready';
    console.log(`[Product Cache] Complete! ${cache.size} styles cached in ${Math.round((Date.now() - startTime) / 1000)}s`);
    
  } catch (error) {
    console.error('[Product Cache] Failed to initialize:', error);
    productCacheStatus = 'error';
  }
}

/**
 * Get the current cache status
 */
export function getProductCacheStatus(): { status: string; progress: number } {
  return { status: productCacheStatus, progress: productCacheProgress };
}

/**
 * Get cached product data for a specific style
 */
function getCachedProductData(styleId: number): CachedProductData | null {
  if (!productDataCache) return null;
  return productDataCache.get(styleId) || null;
}

/**
 * Fetch products for specific style IDs (used for color filtering)
 */
async function fetchProductsForStyles(styleIds: number[]): Promise<Map<number, SSProductSku[]>> {
  if (styleIds.length === 0) {
    return new Map();
  }
  
  const startTime = Date.now();
  console.log(`[SS API] Fetching products for ${styleIds.length} styles...`);
  
  // Split into batches
  const batches: number[][] = [];
  for (let i = 0; i < styleIds.length; i += BATCH_SIZE) {
    batches.push(styleIds.slice(i, i + BATCH_SIZE));
  }
  
  const groupedProducts = new Map<number, SSProductSku[]>();
  
  // Process batches in parallel groups
  for (let i = 0; i < batches.length; i += MAX_PARALLEL_BATCHES) {
    const batchGroup = batches.slice(i, i + MAX_PARALLEL_BATCHES);
    
    const batchPromises = batchGroup.map(async (batch) => {
      const styleIdParam = batch.join(',');
      try {
        const skuData = await ssRequest<SSProductSku[]>(`/products/?styleID=${styleIdParam}`, {
          revalidate: 3600,
          timeoutMs: 30000
        });
        return skuData;
      } catch (error) {
        console.error(`[SS API] Batch fetch failed:`, error);
        return [];
      }
    });
    
    const results = await Promise.all(batchPromises);
    
    for (const skuData of results) {
      for (const sku of skuData) {
        if (!groupedProducts.has(sku.styleID)) {
          groupedProducts.set(sku.styleID, []);
        }
        groupedProducts.get(sku.styleID)!.push(sku);
      }
    }
  }
  
  console.log(`[SS API] Fetched ${groupedProducts.size} styles in ${Date.now() - startTime}ms`);
  
  return groupedProducts;
}

/**
 * Get Basic Auth header for SS Activewear API
 */
function getAuthHeader(): string {
  const username = process.env.SS_USERNAME;
  const apiKey = process.env.SS_API_KEY;
  
  if (!username || !apiKey) {
    throw new Error('SS_USERNAME and SS_API_KEY environment variables are required');
  }
  
  const credentials = Buffer.from(`${username}:${apiKey}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Make an authenticated request to SS Activewear API
 * Includes timeout handling to prevent hanging requests
 */
async function ssRequest<T>(
  endpoint: string, 
  options: { revalidate?: number; noCache?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const { revalidate = 14400, noCache = false, timeoutMs = 30000 } = options; // 30 second timeout
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  const fetchOptions: RequestInit & { next?: { revalidate?: number } } = {
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
  };
  
  // Only add caching if not disabled
  if (!noCache) {
    fetchOptions.next = { revalidate };
  } else {
    fetchOptions.cache = 'no-store';
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SS API Error: ${response.status} - ${errorText}`);
      throw new Error(`SS Activewear API Error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`SS Activewear API timeout after ${timeoutMs}ms for ${endpoint}`);
    }
    throw error;
  }
}

/**
 * Get all products with optional filtering
 * 
 * ARCHITECTURE:
 * - Uses CACHED styles data for fast category filtering (SS API ignores categoryID)
 * - Brand filtering uses direct API call (brandID actually works)
 * - Style name search uses direct API call
 * - First request caches 5,885 styles; subsequent requests filter from memory (<100ms)
 */
export async function getProducts(params?: {
  style?: string;
  brand?: string;
  category?: string;
  colorFamily?: string;
  limit?: number;
}): Promise<Product[]> {
  const limit = params?.limit || 100;
  const startTime = Date.now();
  
  // Parse category IDs
  const categoryIds: number[] = params?.category
    ? params.category.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
    : [];
  
  // Parse color families (OR logic - match any)
  const colorFamilies: string[] = params?.colorFamily
    ? params.colorFamily.split(',').map(cf => cf.trim().toLowerCase()).filter(Boolean)
    : [];
  
  // CASE 1: Brand filter - API supports this, use direct call for fresh data
  if (params?.brand && !params?.category) {
    console.log(`[getProducts] Brand filter: ${params.brand}`);
    const styles = await ssRequest<SSProduct[]>(`/styles/?brandID=${params.brand}`, { revalidate: 3600 });
    let products = styles.map(transformProduct);
    
    // Apply color family filter if specified
    if (colorFamilies.length > 0) {
      products = filterByColorFamily(products, colorFamilies);
    }
    
    console.log(`[getProducts] Brand ${params.brand}: ${products.length} products in ${Date.now() - startTime}ms`);
    return products.slice(0, limit);
  }
  
  // CASE 2: Style name search - API supports this
  if (params?.style) {
    console.log(`[getProducts] Style search: ${params.style}`);
    const styles = await ssRequest<SSProduct[]>(`/styles/?styleName=${encodeURIComponent(params.style)}`, { revalidate: 3600 });
    let products = styles.map(transformProduct);
    
    // Apply category filter if also specified
    if (categoryIds.length > 0) {
      products = filterByCategory(products, categoryIds);
    }
    
    // Apply color family filter if specified
    if (colorFamilies.length > 0) {
      products = filterByColorFamily(products, colorFamilies);
    }
    
    console.log(`[getProducts] Style "${params.style}": ${products.length} products in ${Date.now() - startTime}ms`);
    return products.slice(0, limit);
  }
  
  // CASE 3: Color family filter - requires CATEGORY to be selected first
  // This prevents fetching all 203K products just for color browsing
  if (colorFamilies.length > 0) {
    // Require category to be selected for color filtering
    if (categoryIds.length === 0) {
      console.log(`[getProducts] Color filter without category - returning empty (category required)`);
      return []; // Return empty - UI should prompt user to select a category first
    }
    
    console.log(`[getProducts] Color filter: ${colorFamilies.join(',')} + category: ${categoryIds.join(',')}`);
    
    // Step 1: Get style IDs that match the category from cached styles
    const allStyles = await getCachedStyles();
    const matchingStyleIds: number[] = [];
    
    for (const style of allStyles) {
      if (style.categories) {
        const styleCats = style.categories.split(',').map(id => parseInt(id.trim(), 10));
        if (categoryIds.every(catId => styleCats.includes(catId))) {
          matchingStyleIds.push(style.styleID);
        }
      }
    }
    
    console.log(`[getProducts] Found ${matchingStyleIds.length} styles matching category`);
    
    // Step 2: Fetch products ONLY for the matching styles (batched, fast!)
    const productsMap = await fetchProductsForStyles(matchingStyleIds);
    
    // Step 3: Transform the products
    let products: Product[] = [];
    productsMap.forEach((skus) => {
      if (skus && skus.length > 0) {
        try {
          products.push(transformSkuDataToProduct(skus));
        } catch (e) {
          // Skip invalid products
        }
      }
    });
    
    // Apply brand filter if specified
    if (params?.brand) {
      const brandId = parseInt(params.brand, 10);
      products = products.filter(p => p.brandId === brandId);
    }
    
    // Apply color family filter
    products = filterByColorFamily(products, colorFamilies);
    
    console.log(`[getProducts] Color filter: ${products.length} products in ${Date.now() - startTime}ms`);
    return products.slice(0, limit);
  }
  
  // CASE 4: Category filter or no filter - use CACHED styles (fast!)
  // SS API ignores categoryID, so we fetch all styles once and filter client-side
  console.log(`[getProducts] Using cached styles, category filter: ${categoryIds.join(',') || 'none'}`);
  
  // Trigger background cache initialization (non-blocking)
  if (productCacheStatus === 'idle') {
    // Start loading in background - don't await
    initializeProductCache().catch(err => console.error('[Product Cache] Background init failed:', err));
  }
  
  const allStyles = await getCachedStyles();
  
  // Transform styles and enrich with cached product data (pricing, colors)
  let products = allStyles.map(style => {
    const baseProduct = transformProduct(style);
    
    // Try to enrich with cached pricing and color data
    const cachedData = getCachedProductData(style.styleID);
    if (cachedData) {
      return {
        ...baseProduct,
        price: cachedData.price || baseProduct.price,
        salePrice: cachedData.salePrice,
        colors: cachedData.colors.length > 0 ? cachedData.colors : baseProduct.colors,
      };
    }
    
    return baseProduct;
  });
  
  // Apply category filter (client-side since API ignores it)
  if (categoryIds.length > 0) {
    products = filterByCategory(products, categoryIds);
  }
  
  // Apply brand filter if specified along with category
  if (params?.brand) {
    const brandId = parseInt(params.brand, 10);
    products = products.filter(p => p.brandId === brandId);
  }
  
  console.log(`[getProducts] Filtered to ${products.length} products (cache: ${productCacheStatus}) in ${Date.now() - startTime}ms`);
  return products.slice(0, limit);
}

/**
 * Filter products by category IDs (AND logic - must have ALL categories)
 */
function filterByCategory(products: Product[], categoryIds: number[]): Product[] {
  if (categoryIds.length === 0) return products;
  
  return products.filter(product => {
    const productCatIds = new Set(product.categories.map(c => c.id));
    return categoryIds.every(catId => productCatIds.has(catId));
  });
}

/**
 * Filter products by color family (OR logic - match ANY color family)
 */
function filterByColorFamily(products: Product[], colorFamilies: string[]): Product[] {
  if (colorFamilies.length === 0) return products;
  
  return products.filter(product => {
    return product.colors.some(color => {
      const productColorFamily = (color.colorFamily || '').toLowerCase();
      return colorFamilies.some(cf => 
        productColorFamily.includes(cf) || cf.includes(productColorFamily)
      );
    });
  });
}

// Note: getProductsFromStyles is no longer needed - getProducts now uses getCachedStyles directly

/**
 * Get a single product by style ID with full color/size/inventory details
 */
export async function getProductById(styleId: number): Promise<Product | null> {
  try {
    // Fetch both basic style info and detailed SKU data in parallel
    const [styleData, skuData] = await Promise.all([
      ssRequest<SSProduct[]>(`/styles/?styleID=${styleId}`).catch(() => []),
      ssRequest<SSProductSku[]>(`/products/?styleID=${styleId}`).catch(() => []),
    ]);
    
    if (!skuData || skuData.length === 0) {
      // Fall back to basic style data if no SKU data
      if (styleData && styleData.length > 0) {
        return transformProduct(styleData[0]);
      }
      return null;
    }
    
    // Transform SKU data to product with colors/sizes
    const product = transformSkuDataToProduct(skuData);
    
    // Merge in title and description from style data if available
    if (styleData && styleData.length > 0) {
      product.title = styleData[0].title || product.styleName;
      product.description = styleData[0].description || '';
    }
    
    return product;
  } catch (error) {
    console.error(`Error fetching product ${styleId}:`, error);
    return null;
  }
}

/**
 * Search products by keyword or style number
 * Uses smart matching: exact/prefix first, then broadens if no results
 * Returns rich product data with colors and prices
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const normalizedQuery = query.trim().toUpperCase();
  
  if (!normalizedQuery) {
    return [];
  }
  
  // Check if query looks like a style number (alphanumeric, typically 2-10 chars)
  const isLikelyStyleNumber = /^[A-Z0-9]{2,10}$/i.test(normalizedQuery);
  
  // Try exact/prefix match first via styleName parameter
  let results = await getProducts({ style: normalizedQuery, limit: 100 });
  
  // If we got results, return them
  if (results.length > 0) {
    return results;
  }
  
  // Smart fallback: for style-number-like queries, try fetching all styles
  // and filtering client-side (SS API styleName param can be picky)
  if (isLikelyStyleNumber) {
    try {
      // Fetch from styles endpoint without filter, then search client-side
      // This is heavier but catches cases where SS API exact match fails
      const allStyles = await ssRequest<SSProduct[]>('/styles/', { 
        revalidate: 3600,
        noCache: true 
      });
      
      // Filter by styleName containing or starting with the query
      const matchingStyles = allStyles.filter(style => {
        const styleName = (style.styleName || style.uniqueStyleName || '').toUpperCase();
        // Exact match, prefix match, or contains match
        return styleName === normalizedQuery || 
               styleName.startsWith(normalizedQuery) ||
               styleName.includes(normalizedQuery);
      });
      
      if (matchingStyles.length > 0) {
        // Sort: exact matches first, then prefix, then contains
        matchingStyles.sort((a, b) => {
          const aName = (a.styleName || '').toUpperCase();
          const bName = (b.styleName || '').toUpperCase();
          
          const aExact = aName === normalizedQuery ? 0 : 1;
          const bExact = bName === normalizedQuery ? 0 : 1;
          if (aExact !== bExact) return aExact - bExact;
          
          const aPrefix = aName.startsWith(normalizedQuery) ? 0 : 1;
          const bPrefix = bName.startsWith(normalizedQuery) ? 0 : 1;
          if (aPrefix !== bPrefix) return aPrefix - bPrefix;
          
          return aName.localeCompare(bName);
        });
        
        // Transform and return (limit to avoid huge responses)
        results = matchingStyles.slice(0, 50).map(transformProduct);
        
        // For better UX, try to enrich with SKU data for the first few results
        // to get color swatches (optional enhancement)
        if (results.length <= 10) {
          const enrichedResults = await Promise.all(
            results.map(async (product) => {
              try {
                const enriched = await getProductById(product.styleId);
                return enriched || product;
              } catch {
                return product;
              }
            })
          );
          return enrichedResults;
        }
        
        return results;
      }
    } catch (error) {
      console.error('Fallback search failed:', error);
    }
  }
  
  // No results found
  return [];
}

/**
 * Get real-time inventory for a specific style
 * Uses the /products/ endpoint which includes qty data
 */
export async function getInventory(styleId: number): Promise<SSProductSku[]> {
  // Use shorter cache for inventory data (5 minutes)
  const skuData = await ssRequest<SSProductSku[]>(
    `/products/?styleID=${styleId}`,
    { revalidate: 300 }
  );
  return skuData;
}

/**
 * Get inventory grouped by color and size
 */
export async function getInventoryMatrix(styleId: number): Promise<Map<string, Map<string, number>>> {
  const skuData = await getInventory(styleId);
  
  // Group inventory by color -> size -> quantity
  const matrix = new Map<string, Map<string, number>>();
  
  for (const sku of skuData) {
    const colorKey = sku.colorCode;
    
    if (!matrix.has(colorKey)) {
      matrix.set(colorKey, new Map());
    }
    
    const colorInventory = matrix.get(colorKey)!;
    // Sum up qty from all warehouses (the qty field already has total)
    colorInventory.set(sku.sizeName, sku.qty || 0);
  }
  
  return matrix;
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  const ssCategories = await ssRequest<SSCategory[]>('/categories/', { noCache: true });
  
  return ssCategories
    .filter(cat => cat.categoryID && cat.name)
    .map(cat => ({
      id: cat.categoryID,
      name: cat.name.trim(),
    }));
}

/**
 * Get all brands
 */
export async function getBrands(): Promise<Brand[]> {
  const ssBrands = await ssRequest<SSBrand[]>('/brands/', { noCache: true });
  
  return ssBrands
    .filter(brand => brand.brandID && (brand.brandName || brand.name))
    .map(brand => ({
      id: brand.brandID,
      name: (brand.brandName || brand.name || '').trim(),
      image: (brand.brandImage || brand.image) ? buildImageUrl(brand.brandImage || brand.image || '') : '',
    }));
}

/**
 * Get products by category
 */
export async function getProductsByCategory(categoryId: number): Promise<Product[]> {
  const ssProducts = await ssRequest<SSProduct[]>(`/styles/?categoryID=${categoryId}`);
  return ssProducts.map(transformProduct);
}

/**
 * Get products by brand
 */
export async function getProductsByBrand(brandId: number): Promise<Product[]> {
  const ssProducts = await ssRequest<SSProduct[]>(`/styles/?brandID=${brandId}`);
  return ssProducts.map(transformProduct);
}

/**
 * Transform SS Activewear product to our Product type
 */
function transformProduct(ssProduct: SSProduct): Product {
  // Handle color variants if available
  const colors: ProductColor[] = ssProduct.styles?.map(style => ({
    colorName: style.colorName,
    colorCode: style.colorCode,
    swatchImage: style.colorSwatchImage ? buildImageUrl(style.colorSwatchImage) : '',
    swatchTextColor: style.colorSwatchTextColor || '#000000',
    frontImage: style.colorFrontImage ? buildImageUrl(style.colorFrontImage) : buildImageUrl(ssProduct.styleImage),
    backImage: style.colorBackImage ? buildImageUrl(style.colorBackImage) : '',
    sideImage: style.colorSideImage ? buildImageUrl(style.colorSideImage) : (style.colorDirectSideImage ? buildImageUrl(style.colorDirectSideImage) : ''),
    sizes: style.sizes?.map(size => ({
      name: size.sizeName,
      code: size.sizeCode,
      price: size.piecePrice || size.customerPrice || 0,
      salePrice: size.salePrice,
      qty: size.qty || 0,
      gtin: size.gtin || '',
    })) || [],
  })) || [];

  // Parse category IDs from comma-separated string
  const categoryIds = ssProduct.categories 
    ? ssProduct.categories.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
    : [];
  
  return {
    id: ssProduct.styleID.toString(),
    styleId: ssProduct.styleID,
    styleName: ssProduct.styleName || ssProduct.uniqueStyleName,
    brandName: ssProduct.brandName,
    brandId: ssProduct.brandID || 0,
    title: ssProduct.title || ssProduct.styleName,
    description: ssProduct.description || '',
    basePrice: ssProduct.basePrice || 0,
    price: ssProduct.ourPrice || ssProduct.basePrice || 0,
    salePrice: ssProduct.salePrice || null,
    imageUrl: buildImageUrl(ssProduct.styleImage),
    categories: categoryIds.map(id => ({ id, name: ssProduct.baseCategory || '' })),
    colors,
  };
}

/**
 * Build full image URL from SS Activewear image path
 * Normalizes paths and handles various input formats
 */
function buildImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  // Already a full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Remove leading slashes for consistency
  const cleanPath = imagePath.replace(/^\/+/, '');
  
  // Check if it's a CDN path
  if (cleanPath.startsWith('cdn.') || cleanPath.startsWith('cdnm.')) {
    return `https://${cleanPath}`;
  }
  
  // Default to www.ssactivewear.com
  return `https://www.ssactivewear.com/${cleanPath}`;
}

/**
 * Transform SKU data (from /products/ endpoint) into a Product with colors and sizes
 */
function transformSkuDataToProduct(skuData: SSProductSku[]): Product {
  if (skuData.length === 0) {
    throw new Error('No SKU data provided');
  }

  const firstSku = skuData[0];
  
  // Group SKUs by color
  const colorMap = new Map<string, SSProductSku[]>();
  for (const sku of skuData) {
    const key = sku.colorCode;
    if (!colorMap.has(key)) {
      colorMap.set(key, []);
    }
    colorMap.get(key)!.push(sku);
  }

  // Build color variants with sizes
  const colors: ProductColor[] = [];
  colorMap.forEach((skus, colorCode) => {
    const firstColorSku = skus[0];
    
    // Build sizes for this color
    const sizes: ProductSize[] = skus.map(sku => ({
      name: sku.sizeName,
      code: sku.sizeCode,
      price: sku.piecePrice || sku.customerPrice || 0,
      salePrice: sku.salePrice || null,
      qty: sku.qty || 0,
      gtin: sku.gtin || '',
    }));

    // Sort sizes by sizeOrder
    sizes.sort((a, b) => {
      const skuA = skus.find(s => s.sizeCode === a.code);
      const skuB = skus.find(s => s.sizeCode === b.code);
      return (skuA?.sizeOrder || '').localeCompare(skuB?.sizeOrder || '');
    });

    colors.push({
      colorName: firstColorSku.colorName,
      colorCode: firstColorSku.colorCode,
      colorFamily: firstColorSku.colorFamily || firstColorSku.colorGroupName || '',
      swatchImage: buildImageUrl(firstColorSku.colorSwatchImage),
      swatchTextColor: firstColorSku.colorSwatchTextColor || '#000000',
      frontImage: buildImageUrl(firstColorSku.colorFrontImage),
      backImage: buildImageUrl(firstColorSku.colorBackImage),
      sideImage: buildImageUrl(firstColorSku.colorSideImage || firstColorSku.colorDirectSideImage),
      sizes,
    });
  });

  // Sort colors alphabetically
  colors.sort((a, b) => a.colorName.localeCompare(b.colorName));

  // Get base price from first SKU
  const basePrice = firstSku.piecePrice || firstSku.customerPrice || 0;

  return {
    id: firstSku.styleID.toString(),
    styleId: firstSku.styleID,
    styleName: firstSku.styleName,
    brandName: firstSku.brandName,
    brandId: parseInt(firstSku.brandID, 10) || 0,
    title: firstSku.styleName, // Products endpoint doesn't have title
    description: '', // Products endpoint doesn't have description
    basePrice,
    price: basePrice,
    salePrice: firstSku.salePrice || null,
    imageUrl: buildImageUrl(firstSku.colorFrontImage),
    categories: [],
    colors,
  };
}

/**
 * Calculate the stock status for a quantity
 */
export function getStockStatus(qty: number): 'high' | 'low' | 'out' {
  if (qty === 0) return 'out';
  if (qty <= 11) return 'low';
  return 'high';
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}
