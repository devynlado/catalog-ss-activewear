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

// Batch settings for fetching products - smaller batches to avoid API throttling/timeouts
const BATCH_SIZE = 25;
const MAX_PARALLEL_BATCHES = 2;

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
  offset?: number;
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
  
  // CASE 1: Brand filter - API supports this, enrich with SKU data
  if (params?.brand && !params?.category) {
    console.log(`[getProducts] Brand filter: ${params.brand}`);
    const styles = await ssRequest<SSProduct[]>(`/styles/?brandID=${params.brand}`, { revalidate: 3600 });
    
    // Get style IDs and fetch SKU data for colors/sizes/prices
    const styleIds = styles.map(s => s.styleID).slice(0, limit); // Limit for performance
    const productsMap = await fetchProductsForStyles(styleIds);
    
    // Build enriched products
    let products: Product[] = [];
    for (const style of styles.slice(0, limit)) {
      const skuData = productsMap.get(style.styleID);
      if (skuData && skuData.length > 0) {
        try {
          const product = transformSkuDataToProduct(skuData);
          product.title = style.title || product.styleName;
          product.description = style.description || '';
          // Use styleImage as primary image
          if (style.styleImage) {
            product.imageUrl = buildImageUrl(style.styleImage);
          }
          // Set product flags from style data
          product.isSustainable = style.sustainableStyle || false;
          product.isNew = style.newStyle || false;
          if (style.categories) {
            const catIds = style.categories.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            product.categories = catIds.map(id => ({ id, name: '' }));
          }
          products.push(product);
        } catch (e) {
          products.push(transformProduct(style));
        }
      } else {
        products.push(transformProduct(style));
      }
    }
    
    // Apply color family filter if specified
    if (colorFamilies.length > 0) {
      products = filterByColorFamily(products, colorFamilies);
    }
    
    console.log(`[getProducts] Brand ${params.brand}: ${products.length} products in ${Date.now() - startTime}ms`);
    return products;
  }
  
  // CASE 2: Style name search - API supports this, enrich with SKU data
  if (params?.style) {
    console.log(`[getProducts] Style search: ${params.style}`);
    const styles = await ssRequest<SSProduct[]>(`/styles/?styleName=${encodeURIComponent(params.style)}`, { revalidate: 3600 });
    
    // Get style IDs and fetch SKU data for colors/sizes/prices
    const styleIds = styles.map(s => s.styleID);
    const productsMap = await fetchProductsForStyles(styleIds);
    
    // Build enriched products
    let products: Product[] = [];
    for (const style of styles) {
      const skuData = productsMap.get(style.styleID);
      if (skuData && skuData.length > 0) {
        try {
          const product = transformSkuDataToProduct(skuData);
          product.title = style.title || product.styleName;
          product.description = style.description || '';
          // Use styleImage as primary image
          if (style.styleImage) {
            product.imageUrl = buildImageUrl(style.styleImage);
          }
          // Set product flags from style data
          product.isSustainable = style.sustainableStyle || false;
          product.isNew = style.newStyle || false;
          if (style.categories) {
            const catIds = style.categories.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            product.categories = catIds.map(id => ({ id, name: '' }));
          }
          products.push(product);
        } catch (e) {
          products.push(transformProduct(style));
        }
      } else {
        products.push(transformProduct(style));
      }
    }
    
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
  
  // CASE 4: Category filter or no filter - use CACHED styles + fetch SKU data for colors
  console.log(`[getProducts] Using cached styles, category filter: ${categoryIds.join(',') || 'none'}`);
  
  const allStyles = await getCachedStyles();
  
  // First, filter styles by category (client-side since SS API ignores categoryID)
  let matchingStyles = allStyles;
  if (categoryIds.length > 0) {
    matchingStyles = allStyles.filter(style => {
      if (!style.categories) return false;
      const styleCats = style.categories.split(',').map(id => parseInt(id.trim(), 10));
      return categoryIds.every(catId => styleCats.includes(catId));
    });
  }
  
  // Apply brand filter if specified
  if (params?.brand) {
    matchingStyles = matchingStyles.filter(s => s.brandID?.toString() === params.brand);
  }
  
  console.log(`[getProducts] Found ${matchingStyles.length} styles matching filters`);
  
  // Apply offset for pagination, then limit
  const offset = params?.offset || 0;
  const stylesToFetch = matchingStyles.slice(offset, offset + limit);
  const styleIds = stylesToFetch.map(s => s.styleID);
  
  console.log(`[getProducts] Fetching SKU data for ${styleIds.length} styles (offset: ${offset}, limit: ${limit})`);
  
  // Fetch SKU data for colors/sizes/prices
  const productsMap = await fetchProductsForStyles(styleIds);
  
  // Build enriched products with full SKU data
  const products: Product[] = [];
  for (const style of stylesToFetch) {
    const skuData = productsMap.get(style.styleID);
    
    if (skuData && skuData.length > 0) {
      try {
        const product = transformSkuDataToProduct(skuData);
        // Merge in title and description from style data
        product.title = style.title || product.styleName;
        product.description = style.description || '';
        // Use styleImage as primary image (guaranteed to exist), fall back to colorFrontImage
        if (style.styleImage) {
          product.imageUrl = buildImageUrl(style.styleImage);
        }
        // Set product flags from style data
        product.isSustainable = style.sustainableStyle || false;
        product.isNew = style.newStyle || false;
        if (style.categories) {
          const catIds = style.categories.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
          product.categories = catIds.map(id => ({ id, name: '' }));
        }
        products.push(product);
      } catch (e) {
        // Fall back to basic transform if SKU transform fails
        products.push(transformProduct(style));
      }
    } else {
      // No SKU data, use basic transform
      products.push(transformProduct(style));
    }
  }
  
  console.log(`[getProducts] Returning ${products.length} products with SKU data in ${Date.now() - startTime}ms`);
  return products;
}

/**
 * Get count of styles matching filters (without fetching SKU data)
 * Used for pagination - much faster than fetching full product data
 */
export async function getFilteredStyleCount(params?: {
  brand?: string;
  category?: string;
}): Promise<number> {
  const allStyles = await getCachedStyles();
  
  let matchingStyles = allStyles;
  
  // Apply category filter
  if (params?.category) {
    const categoryIds = params.category.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    if (categoryIds.length > 0) {
      matchingStyles = matchingStyles.filter(style => {
        if (!style.categories) return false;
        const styleCats = style.categories.split(',').map(id => parseInt(id.trim(), 10));
        return categoryIds.every(catId => styleCats.includes(catId));
      });
    }
  }
  
  // Apply brand filter
  if (params?.brand) {
    matchingStyles = matchingStyles.filter(s => s.brandID?.toString() === params.brand);
  }
  
  return matchingStyles.length;
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
      const style = styleData[0];
      product.title = style.title || product.styleName;
      product.description = style.description || '';
      // Use styleImage as primary image
      if (style.styleImage) {
        product.imageUrl = buildImageUrl(style.styleImage);
      }
      // Set product flags from style data
      product.isSustainable = style.sustainableStyle || false;
      product.isNew = style.newStyle || false;
      // Add categories from style data
      if (style.categories) {
        const catIds = style.categories.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
        product.categories = catIds.map(id => ({ id, name: '' }));
      }
      // Store baseCategory for breadcrumbs
      if (style.baseCategory) {
        (product as ProductWithExtras).baseCategory = style.baseCategory;
      }
    }
    
    return product;
  } catch (error) {
    console.error(`Error fetching product ${styleId}:`, error);
    return null;
  }
}

// Extended Product type with extras
interface ProductWithExtras extends Product {
  baseCategory?: string;
  companionStyleIds?: number[];
}

/**
 * Spec item from the /specs API
 */
export interface ProductSpec {
  specName: string;
  specValue: string;
}

/**
 * Spec data organized by size for table display
 */
export interface SpecTableData {
  sizes: string[]; // Ordered list of sizes (S, M, L, XL, etc.)
  specs: Array<{
    specName: string;
    values: Record<string, string>; // { "S": "28", "M": "29", ... }
  }>;
}

/**
 * Get product specifications from the /specs API
 * Returns data organized for table display with sizes as columns
 */
export async function getProductSpecs(styleId: number): Promise<SpecTableData> {
  try {
    console.log(`[getProductSpecs] Fetching specs for styleID: ${styleId}`);
    
    // Use noCache to avoid the 2MB cache limit issue
    // SS API returns: { specID, styleID, partNumber, brandName, styleName, sizeName, sizeOrder, specName, value }
    const allSpecs = await ssRequest<Array<{ 
      styleID: number;
      specName: string; 
      sizeName: string;
      sizeOrder: string;
      value: string;
    }>>(
      `/specs/?styleID=${styleId}`,
      { noCache: true, timeoutMs: 15000 }
    );
    
    console.log(`[getProductSpecs] Raw specs response length: ${allSpecs?.length || 0}`);
    
    if (!allSpecs || allSpecs.length === 0) {
      return { sizes: [], specs: [] };
    }
    
    // Filter to only specs for this styleID (API may return all specs)
    const filteredSpecs = allSpecs.filter(spec => spec.styleID === styleId);
    console.log(`[getProductSpecs] Filtered to ${filteredSpecs.length} specs for styleID ${styleId}`);
    
    if (filteredSpecs.length === 0) {
      return { sizes: [], specs: [] };
    }
    
    // Collect all unique sizes with their order
    const sizeOrderMap = new Map<string, string>();
    for (const spec of filteredSpecs) {
      if (spec.sizeName && !sizeOrderMap.has(spec.sizeName)) {
        sizeOrderMap.set(spec.sizeName, spec.sizeOrder || 'Z99');
      }
    }
    
    // Sort sizes by sizeOrder
    const sizes = Array.from(sizeOrderMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([sizeName]) => sizeName);
    
    // Group specs by specName, then by size
    const specMap = new Map<string, Record<string, string>>();
    for (const spec of filteredSpecs) {
      if (!spec.specName || !spec.value) continue;
      
      if (!specMap.has(spec.specName)) {
        specMap.set(spec.specName, {});
      }
      specMap.get(spec.specName)![spec.sizeName] = spec.value;
    }
    
    // Convert to array format
    const specs = Array.from(specMap.entries()).map(([specName, values]) => ({
      specName,
      values,
    }));
    
    return { sizes, specs };
  } catch (error) {
    console.error(`Error fetching specs for style ${styleId}:`, error);
    return { sizes: [], specs: [] };
  }
}

/**
 * Companion product info
 */
export interface CompanionProduct {
  styleId: number;
  styleName: string;
  title: string;
  brandName: string;
  imageUrl: string;
  price: number;
}

/**
 * Get companion products for a style using the companionGroup ID
 * companionGroup is a numeric ID - we need to find all styles that share this group
 */
export async function getCompanionProducts(styleId: number): Promise<CompanionProduct[]> {
  try {
    // First, get the style data to find its companion group
    const styleData = await ssRequest<Array<SSProduct & { companionGroup?: number }>>(
      `/styles/?styleID=${styleId}`,
      { revalidate: 3600, noCache: true }
    );
    
    const companionGroupId = styleData?.[0]?.companionGroup;
    console.log(`[getCompanionProducts] Style ${styleId} companionGroup ID:`, companionGroupId);
    
    if (!styleData || styleData.length === 0 || !companionGroupId) {
      console.log(`[getCompanionProducts] No companion group found for style ${styleId}`);
      return [];
    }
    
    // Fetch all styles that have the same companionGroup
    // Use the cached styles to find companions by group ID
    const allStyles = await getCachedStyles();
    const companionStyles = (allStyles as Array<SSProduct & { companionGroup?: number }>)
      .filter(style => 
        style.companionGroup === companionGroupId && 
        style.styleID !== styleId
      )
      .slice(0, 8); // Limit to 8 for performance
    
    console.log(`[getCompanionProducts] Found ${companionStyles.length} companions in group ${companionGroupId}`);
    
    if (companionStyles.length === 0) {
      return [];
    }
    
    // Transform to simplified companion product format
    return companionStyles.map(style => ({
      styleId: style.styleID,
      styleName: style.styleName,
      title: style.title || style.styleName,
      brandName: style.brandName,
      imageUrl: buildImageUrl(style.styleImage),
      price: style.ourPrice || style.basePrice || 0,
    }));
  } catch (error) {
    console.error(`Error fetching companion products for style ${styleId}:`, error);
    return [];
  }
}

/**
 * Get comparable/similar products for a style using the comparableGroup field
 * comparableGroup is a string - styles with the same group are similar
 * Returns enriched products with colors for the full card display
 */
export async function getComparableProducts(styleId: number, maxProducts: number = 8): Promise<Product[]> {
  try {
    // First, get the style data to find its comparable group
    const allStyles = await getCachedStyles();
    const currentStyle = (allStyles as Array<SSProduct & { comparableGroup?: string }>)
      .find(s => s.styleID === styleId);
    
    const comparableGroupId = currentStyle?.comparableGroup;
    console.log(`[getComparableProducts] Style ${styleId} comparableGroup:`, comparableGroupId);
    
    if (!currentStyle || !comparableGroupId) {
      console.log(`[getComparableProducts] No comparable group found for style ${styleId}`);
      return [];
    }
    
    // Find styles with the same comparableGroup
    const comparableStyles = (allStyles as Array<SSProduct & { comparableGroup?: string }>)
      .filter(style => 
        style.comparableGroup === comparableGroupId && 
        style.styleID !== styleId
      )
      .slice(0, maxProducts);
    
    console.log(`[getComparableProducts] Found ${comparableStyles.length} comparable styles in group "${comparableGroupId}"`);
    
    if (comparableStyles.length === 0) {
      return [];
    }
    
    // Fetch enriched product data with colors
    const styleIds = comparableStyles.map(s => s.styleID);
    const productsMap = await fetchProductsForStyles(styleIds);
    
    const products: Product[] = [];
    productsMap.forEach((skus, styleId) => {
      if (skus && skus.length > 0) {
        try {
          const product = transformSkuDataToProduct(skus);
          // Merge in title and description from style data
          const styleInfo = comparableStyles.find(s => s.styleID === styleId);
          if (styleInfo) {
            product.title = styleInfo.title || product.styleName;
            product.description = styleInfo.description || '';
            // FIX: Use styleImage as primary image
            if (styleInfo.styleImage) {
              product.imageUrl = buildImageUrl(styleInfo.styleImage);
            }
          }
          products.push(product);
        } catch (e) {
          console.warn(`Skipping invalid comparable product for style ${styleId}`);
        }
      }
    });

    return products;
  } catch (error) {
    console.error(`Error fetching comparable products for style ${styleId}:`, error);
    return [];
  }
}

/**
 * Enhanced search with multi-field matching and relevance scoring
 * Searches: styleName, brandName, title, description
 * Supports multi-word queries (e.g., "Gildan Navy Cotton")
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const normalizedQuery = query.trim().toUpperCase();
  
  if (!normalizedQuery) {
    return [];
  }
  
  console.log(`[searchProducts] Searching for: "${normalizedQuery}"`);
  
  // Parse query into individual search terms
  const searchTerms = normalizedQuery.split(/\s+/).filter(term => term.length >= 2);
  
  try {
    // STEP 1: Get all styles from cache
    const allStyles = await getCachedStyles();
    
    // STEP 2: Score each style based on multi-field matching
    const scoredStyles: Array<{ style: SSProduct; score: number }> = [];
    
    for (const style of allStyles) {
      let score = 0;
      const styleName = (style.styleName || '').toUpperCase();
      const brandName = (style.brandName || '').toUpperCase();
      const title = (style.title || '').toUpperCase();
      const description = (style.description || '').toUpperCase();
      
      for (const term of searchTerms) {
        // Style number matching (highest priority)
        if (styleName === term) {
          score += 100; // Exact style match
        } else if (styleName.startsWith(term)) {
          score += 80; // Style prefix match
        } else if (styleName.includes(term)) {
          score += 60; // Style contains match
        }
        
        // Brand name matching
        if (brandName === term) {
          score += 70; // Exact brand match
        } else if (brandName.includes(term)) {
          score += 50; // Brand contains match
        }
        
        // Title matching
        if (title.includes(term)) {
          score += 30; // Title contains match
        }
        
        // Description matching (lowest priority)
        if (description.includes(term)) {
          score += 10; // Description contains match
        }
      }
      
      // Only include products with at least some match
      if (score > 0) {
        scoredStyles.push({ style, score });
      }
    }
    
    console.log(`[searchProducts] Found ${scoredStyles.length} matching styles`);
    
    if (scoredStyles.length === 0) {
      return [];
    }
    
    // Sort by score (highest first), then by style name
    scoredStyles.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.style.styleName || '').localeCompare(b.style.styleName || '');
    });
    
    // Limit to top 50 matches
    const topMatches = scoredStyles.slice(0, 50).map(s => s.style);
    const styleIds = topMatches.map(s => s.styleID);
    
    // STEP 3: Fetch SKU data for all matching styles (batch fetch for colors/sizes/prices)
    console.log(`[searchProducts] Fetching SKU data for ${styleIds.length} styles...`);
    const productsMap = await fetchProductsForStyles(styleIds);
    
    // STEP 4: Build enriched products with full SKU data
    const products: Product[] = [];
    for (const style of topMatches) {
      const skuData = productsMap.get(style.styleID);
      
      if (skuData && skuData.length > 0) {
        // Full product with colors/sizes/prices from SKU data
        try {
          const product = transformSkuDataToProduct(skuData);
          // Merge in title and description from style data
          product.title = style.title || product.styleName;
          product.description = style.description || '';
          // Use styleImage as primary image
          if (style.styleImage) {
            product.imageUrl = buildImageUrl(style.styleImage);
          }
          // Add product flags
          product.isSustainable = style.sustainableStyle || false;
          product.isNew = style.newStyle || false;
          if (style.categories) {
            const catIds = style.categories.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            product.categories = catIds.map(id => ({ id, name: '' }));
          }
          products.push(product);
        } catch (e) {
          // Fall back to basic transform if SKU transform fails
          products.push(transformProduct(style));
        }
      } else {
        // No SKU data, use basic transform
        products.push(transformProduct(style));
      }
    }
    
    console.log(`[searchProducts] Returning ${products.length} products with SKU data`);
    return products;
    
  } catch (error) {
    console.error('[searchProducts] Error:', error);
    return [];
  }
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
 * Get products by a list of style numbers (efficient batch lookup)
 * Used for fetching popular products directly
 * @param styleNumbers - List of style numbers to search for (e.g., ['G500', '3001', '18500'])
 * @param options - Optional filtering options
 */
export async function getProductsByStyleNumbers(
  styleNumbers: string[],
  options?: { categoryId?: number; limit?: number }
): Promise<Product[]> {
  if (styleNumbers.length === 0) return [];
  
  console.log(`[getProductsByStyleNumbers] Searching for ${styleNumbers.length} style numbers...`);
  
  try {
    // Get all cached styles
    const allStyles = await getCachedStyles();
    
    // Build a set of normalized style numbers for fast lookup
    const styleSet = new Set(
      styleNumbers.map(s => s.toUpperCase().replace(/[-\s]/g, ''))
    );
    
    // Also include variations
    for (const styleNum of styleNumbers) {
      const upper = styleNum.toUpperCase();
      styleSet.add(upper);
      styleSet.add(upper.replace(/[-\s]/g, '')); // No dashes/spaces
      // Add with/without prefix
      if (/^[A-Z]/.test(upper)) {
        styleSet.add(upper.replace(/^[A-Z]+[-]?/, '')); // Numbers only
      }
      if (/^\d+$/.test(upper)) {
        styleSet.add('G' + upper); // Gildan style
      }
    }
    
    // Filter styles that match our style numbers
    const matchingStyles = allStyles.filter(style => {
      const styleName = (style.styleName || '').toUpperCase().replace(/[-\s]/g, '');
      const uniqueName = (style.uniqueStyleName || '').toUpperCase().replace(/[-\s]/g, '');
      
      // Direct match
      if (styleSet.has(styleName) || styleSet.has(uniqueName)) {
        return true;
      }
      
      // Check if styleName contains any of our target style numbers
      for (const targetStyle of styleNumbers) {
        const normalized = targetStyle.toUpperCase().replace(/[-\s]/g, '');
        if (styleName.includes(normalized) || normalized.includes(styleName)) {
          return true;
        }
      }
      
      return false;
    });
    
    console.log(`[getProductsByStyleNumbers] Found ${matchingStyles.length} matching styles in cache`);
    
    // Apply category filter if specified
    let filteredStyles = matchingStyles;
    if (options?.categoryId) {
      filteredStyles = matchingStyles.filter(style => {
        const catIds = (style.categories || '').split(',').map(id => parseInt(id.trim(), 10));
        return catIds.includes(options.categoryId!);
      });
      console.log(`[getProductsByStyleNumbers] After category filter: ${filteredStyles.length} styles`);
    }
    
    // Limit results if specified
    const limit = options?.limit || 100;
    const stylesToFetch = filteredStyles.slice(0, limit);
    
    if (stylesToFetch.length === 0) {
      return [];
    }
    
    // Fetch SKU data for matching styles
    const styleIds = stylesToFetch.map(s => s.styleID);
    const productsMap = await fetchProductsForStyles(styleIds);
    
    // Build products with full data
    const products: Product[] = [];
    for (const style of stylesToFetch) {
      const skuData = productsMap.get(style.styleID);
      if (skuData && skuData.length > 0) {
        try {
          const product = transformSkuDataToProduct(skuData);
          product.title = style.title || product.styleName;
          product.description = style.description || '';
          if (style.styleImage) {
            product.imageUrl = buildImageUrl(style.styleImage);
          }
          product.isSustainable = style.sustainableStyle || false;
          product.isNew = style.newStyle || false;
          if (style.categories) {
            const catIds = style.categories.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            product.categories = catIds.map(id => ({ id, name: '' }));
          }
          products.push(product);
        } catch (e) {
          products.push(transformProduct(style));
        }
      } else {
        products.push(transformProduct(style));
      }
    }
    
    console.log(`[getProductsByStyleNumbers] Returning ${products.length} products`);
    return products;
  } catch (error) {
    console.error('[getProductsByStyleNumbers] Error:', error);
    return [];
  }
}

/**
 * Transform SS Activewear product to our Product type
 * Applies retail markup (1.40x) to all COGS prices
 */
const RETAIL_MARKUP = 1.40;

function transformProduct(ssProduct: SSProduct): Product {
  // Handle color variants if available
  // Apply retail markup to COGS prices
  const colors: ProductColor[] = ssProduct.styles?.map(style => ({
    colorName: style.colorName,
    colorCode: style.colorCode,
    swatchImage: style.colorSwatchImage ? buildImageUrl(style.colorSwatchImage) : '',
    swatchTextColor: style.colorSwatchTextColor || '#000000',
    frontImage: style.colorFrontImage ? buildImageUrl(style.colorFrontImage) : buildImageUrl(ssProduct.styleImage),
    backImage: style.colorBackImage ? buildImageUrl(style.colorBackImage) : '',
    sideImage: style.colorSideImage ? buildImageUrl(style.colorSideImage) : (style.colorDirectSideImage ? buildImageUrl(style.colorDirectSideImage) : ''),
    sizes: style.sizes?.map(size => {
      const cogs = size.piecePrice || size.customerPrice || 0;
      const retailPrice = Math.round(cogs * RETAIL_MARKUP * 100) / 100;
      
      // Only set sale price if genuinely on sale (sale COGS < regular COGS)
      let saleRetailPrice: number | null = null;
      if (size.salePrice && size.salePrice > 0 && size.salePrice < cogs) {
        saleRetailPrice = Math.round(size.salePrice * RETAIL_MARKUP * 100) / 100;
      }
      
      return {
        name: size.sizeName,
        code: size.sizeCode,
        price: retailPrice,
        salePrice: saleRetailPrice,
        qty: size.qty || 0,
        gtin: size.gtin || '',
      };
    }) || [],
  })) || [];

  // Parse category IDs from comma-separated string
  const categoryIds = ssProduct.categories 
    ? ssProduct.categories.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
    : [];
  
  // Calculate min prices from all sizes
  const allSizes = colors.flatMap(c => c.sizes);
  const retailPrices = allSizes.map(s => s.price).filter(p => p > 0);
  const salePrices = allSizes.map(s => s.salePrice).filter((p): p is number => p !== null && p > 0);
  
  const minRetailPrice = retailPrices.length > 0 ? Math.min(...retailPrices) : 0;
  const minSalePrice = salePrices.length > 0 ? Math.min(...salePrices) : null;
  
  // Product is on sale if there's a genuine sale price
  const isOnSale = minSalePrice !== null && minSalePrice < minRetailPrice;
  
  // Generate SEO-friendly slug from brand and style
  const styleName = ssProduct.styleName || ssProduct.uniqueStyleName;
  const slug = `${ssProduct.brandName}-${styleName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    id: ssProduct.styleID.toString(),
    styleId: ssProduct.styleID,
    styleName,
    brandName: ssProduct.brandName,
    brandId: ssProduct.brandID || 0,
    slug,
    title: ssProduct.title || ssProduct.styleName,
    description: ssProduct.description || '',
    basePrice: minRetailPrice,
    price: minRetailPrice,
    salePrice: isOnSale ? minSalePrice : null,
    imageUrl: buildImageUrl(ssProduct.styleImage),
    categories: categoryIds.map(id => ({ id, name: ssProduct.baseCategory || '' })),
    colors,
    // Product flags
    isOnSale,
    isSustainable: ssProduct.sustainableStyle || false,
    isNew: ssProduct.newStyle || false,
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
      // Flat product images
      frontImage: buildImageUrl(firstColorSku.colorFrontImage),
      backImage: buildImageUrl(firstColorSku.colorBackImage),
      sideImage: buildImageUrl(firstColorSku.colorSideImage || firstColorSku.colorDirectSideImage),
      // Model images
      onModelFrontImage: buildImageUrl(firstColorSku.colorOnModelFrontImage),
      onModelBackImage: buildImageUrl(firstColorSku.colorOnModelBackImage),
      onModelSideImage: buildImageUrl(firstColorSku.colorOnModelSideImage),
      sizes,
    });
  });

  // Sort colors alphabetically
  colors.sort((a, b) => a.colorName.localeCompare(b.colorName));

  // Get base price from first SKU
  const basePrice = firstSku.piecePrice || firstSku.customerPrice || 0;
  const salePrice = firstSku.salePrice || null;

  // Generate SEO-friendly slug from brand and style
  const slug = `${firstSku.brandName}-${firstSku.styleName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    id: firstSku.styleID.toString(),
    styleId: firstSku.styleID,
    styleName: firstSku.styleName,
    brandName: firstSku.brandName,
    brandId: parseInt(firstSku.brandID, 10) || 0,
    slug,
    title: firstSku.styleName, // Products endpoint doesn't have title
    description: '', // Products endpoint doesn't have description
    basePrice,
    price: basePrice,
    salePrice,
    imageUrl: buildImageUrl(firstSku.colorFrontImage),
    categories: [],
    colors,
    // Flags - isOnSale is determined by salePrice vs price
    isOnSale: salePrice !== null && salePrice > 0 && salePrice < basePrice,
    // isSustainable and isNew are set from style data after transform
    isSustainable: false,
    isNew: false,
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
