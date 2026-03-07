/**
 * Product Sync Library
 * 
 * Syncs product data from SS Activewear API to Supabase cache.
 * 
 * Sync Types:
 * - Full Sync: All product metadata, colors, SKUs (weekly)
 * - Inventory Sync: Only qty/availability updates (daily)
 * - Popular Sync: Just the curated 335 popular products (faster for testing)
 */

import { createServerSupabaseClient } from './supabase';
import { SSProduct, SSProductSku } from './types';
import { POPULAR_PRODUCTS, ProductCategory, PopularProduct } from './popular-products';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SS_BASE_URL = 'https://api.ssactivewear.com/v2';
const BATCH_SIZE = 25;
const MAX_PARALLEL_BATCHES = 2;
const REQUEST_TIMEOUT = 45000; // 45 seconds

// Pricing multipliers
const MARKET_MARKUP = 1.40;     // 40% markup on SS prices to match competitor pricing (JiffyShirts, AllDayShirts)
const RETAIL_MARKUP = 1.40;      // Fallback only - used if SS piecePrice unavailable
const AUTO_MIN_MARKUP = 1.12;   // 12% markup on COGS for Google auto-pricing floor

// Google category mappings
const GOOGLE_CATEGORY_MAP: Record<ProductCategory, { id: number; name: string }> = {
  't-shirts': { id: 212, name: 'Apparel & Accessories > Clothing > Shirts & Tops' },
  'long-sleeve': { id: 212, name: 'Apparel & Accessories > Clothing > Shirts & Tops' },
  'tank-tops': { id: 212, name: 'Apparel & Accessories > Clothing > Shirts & Tops' },
  'crewneck': { id: 5598, name: 'Apparel & Accessories > Clothing > Shirts & Tops > Sweatshirts' },
  'hoodies': { id: 5598, name: 'Apparel & Accessories > Clothing > Shirts & Tops > Sweatshirts' },
  'zip-hoodies': { id: 5598, name: 'Apparel & Accessories > Clothing > Shirts & Tops > Sweatshirts' },
  'quarter-zip': { id: 5598, name: 'Apparel & Accessories > Clothing > Shirts & Tops > Sweatshirts' },
  'polos': { id: 212, name: 'Apparel & Accessories > Clothing > Shirts & Tops' },
  'performance': { id: 5322, name: 'Apparel & Accessories > Clothing > Activewear' },
  'headwear': { id: 173, name: 'Apparel & Accessories > Clothing Accessories > Hats' },
  'outerwear': { id: 5506, name: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets' },
  'youth': { id: 212, name: 'Apparel & Accessories > Clothing > Shirts & Tops' },
  'womens': { id: 212, name: 'Apparel & Accessories > Clothing > Shirts & Tops' },
};

// Generate URL slug from brand name and style name
// e.g., "GILDAN" + "5000" -> "gildan-5000"
function generateSlug(brandName: string, styleName: string): string {
  const combined = `${brandName}-${styleName}`;
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\-\s]/g, '') // Remove special chars
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '');        // Trim leading/trailing hyphens
}

const PRODUCT_TYPE_MAP: Record<ProductCategory, string> = {
  't-shirts': 'T-Shirts > Core T-Shirts',
  'long-sleeve': 'T-Shirts > Long Sleeve T-Shirts',
  'tank-tops': 'T-Shirts > Tank Tops',
  'crewneck': 'Sweatshirts > Crewneck Sweatshirts',
  'hoodies': 'Sweatshirts > Hoodies',
  'zip-hoodies': 'Sweatshirts > Zip Hoodies',
  'quarter-zip': 'Sweatshirts > Quarter Zip',
  'polos': 'Polos',
  'performance': 'Performance > Athletic Wear',
  'headwear': 'Headwear > Caps & Hats',
  'outerwear': 'Outerwear > Jackets',
  'youth': 'Youth > Youth T-Shirts',
  'womens': 'Womens > Womens T-Shirts',
};

// ============================================================================
// TYPES
// ============================================================================

export interface SyncResult {
  success: boolean;
  syncType: 'full' | 'inventory' | 'popular';
  productsProcessed: number;
  colorsProcessed: number;
  skusProcessed: number;
  categoriesLinked: number;
  errors: string[];
  duration: number;
}

interface SyncLog {
  id?: number;
  sync_type: string;
  status: string;
  products_synced: number;
  colors_synced: number;
  skus_synced: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

// ============================================================================
// SS ACTIVEWEAR API
// ============================================================================

function getAuthHeader(): string {
  const username = process.env.SS_USERNAME;
  const apiKey = process.env.SS_API_KEY;
  
  if (!username || !apiKey) {
    throw new Error('SS_USERNAME and SS_API_KEY environment variables are required');
  }
  
  return `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`;
}

async function ssRequest<T>(endpoint: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(`${SS_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`SS API Error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`SS API timeout after ${REQUEST_TIMEOUT}ms`);
    }
    throw error;
  }
}

async function fetchAllStyles(): Promise<SSProduct[]> {
  console.log('[Sync] Fetching all styles from SS API...');
  const styles = await ssRequest<SSProduct[]>('/styles/');
  console.log(`[Sync] Fetched ${styles.length} styles`);
  return styles;
}

async function fetchSkuData(styleIds: number[]): Promise<SSProductSku[]> {
  if (styleIds.length === 0) return [];
  
  const idsParam = styleIds.join(',');
  const skus = await ssRequest<SSProductSku[]>(`/products/?styleID=${idsParam}`);
  return skus;
}

// ============================================================================
// SYNC LOGGING
// ============================================================================

async function logSyncStart(syncType: string): Promise<number> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await (supabase as any)
    .from('sync_logs')
    .insert({
      sync_type: syncType,
      status: 'started',
      products_synced: 0,
      colors_synced: 0,
      skus_synced: 0,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('[Sync] Failed to create sync log:', error);
    return -1;
  }
  
  return data?.id || -1;
}

async function logSyncComplete(
  logId: number,
  stats: { products: number; colors: number; skus: number }
): Promise<void> {
  if (logId < 0) return;
  
  const supabase = createServerSupabaseClient();
  
  await (supabase as any)
    .from('sync_logs')
    .update({
      status: 'completed',
      products_synced: stats.products,
      colors_synced: stats.colors,
      skus_synced: stats.skus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);
}

async function logSyncFailed(logId: number, errorMessage: string): Promise<void> {
  if (logId < 0) return;
  
  const supabase = createServerSupabaseClient();
  
  await (supabase as any)
    .from('sync_logs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);
}

// ============================================================================
// CHECKPOINT FUNCTIONS (for resume capability)
// ============================================================================

async function updateSyncCheckpoint(
  logId: number, 
  batchIndex: number, 
  totalBatches: number
): Promise<void> {
  if (logId < 0) return;
  
  const supabase = createServerSupabaseClient();
  
  await (supabase as any)
    .from('sync_logs')
    .update({
      checkpoint_batch: batchIndex,
      total_batches: totalBatches,
    })
    .eq('id', logId);
}

async function getSyncCheckpoint(logId: number): Promise<{ batchIndex: number; totalBatches: number } | null> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await (supabase as any)
    .from('sync_logs')
    .select('checkpoint_batch, total_batches, status')
    .eq('id', logId)
    .single();
  
  if (error || !data) {
    console.error('[Sync] Failed to get checkpoint:', error);
    return null;
  }
  
  // Only allow resume for incomplete syncs
  if (data.status === 'completed') {
    console.log('[Sync] Sync already completed, starting fresh');
    return null;
  }
  
  return {
    batchIndex: data.checkpoint_batch || 0,
    totalBatches: data.total_batches || 0,
  };
}

// ============================================================================
// POPULAR PRODUCTS LOOKUP
// ============================================================================

// Build a map for quick lookup of popular product info
const popularProductMap = new Map<string, PopularProduct>();

function normalizeStyleNumber(style: string): string {
  return style.toUpperCase().replace(/[-\s]/g, '');
}

function normalizeBrandName(brand: string): string {
  return brand.toUpperCase().trim().replace(/[+]/g, ' ').replace(/\s+/g, ' ');
}

// Initialize the map
POPULAR_PRODUCTS.forEach(p => {
  const key = `${normalizeBrandName(p.brand)}:${normalizeStyleNumber(p.styleNumber)}`;
  popularProductMap.set(key, p);
  
  // Also add variations
  const keyNoSpaces = `${normalizeBrandName(p.brand).replace(/ /g, '')}:${normalizeStyleNumber(p.styleNumber)}`;
  popularProductMap.set(keyNoSpaces, p);
});

function findPopularProduct(brandName: string, styleName: string): PopularProduct | null {
  const key = `${normalizeBrandName(brandName)}:${normalizeStyleNumber(styleName)}`;
  return popularProductMap.get(key) || null;
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

function buildImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  // Normalize existing URLs to use CDN (www redirects to cdn)
  if (imagePath.startsWith('http')) {
    return imagePath.replace('www.ssactivewear.com', 'cdn.ssactivewear.com');
  }
  const cleanPath = imagePath.replace(/^\/+/, '');
  if (cleanPath.startsWith('cdn.') || cleanPath.startsWith('cdnm.')) {
    return `https://${cleanPath}`;
  }
  // Use CDN directly to avoid redirects
  return `https://cdn.ssactivewear.com/${cleanPath}`;
}

function determineGender(category?: ProductCategory, attributes?: string[]): string {
  if (attributes?.includes('womens') || category === 'womens') return 'Female';
  if (attributes?.includes('mens')) return 'Male';
  return 'Unisex';
}

function determineAgeGroup(category?: ProductCategory): string {
  if (category === 'youth') return 'Kids';
  return 'Adult';
}

// ============================================================================
// SYNC FUNCTIONS
// ============================================================================

/**
 * Sync popular products only (335 curated products)
 * Faster for initial setup and testing
 */
export async function syncPopularProducts(): Promise<SyncResult> {
  const startTime = Date.now();
  const logId = await logSyncStart('popular');
  const errors: string[] = [];
  
  let productsProcessed = 0;
  let colorsProcessed = 0;
  let skusProcessed = 0;
  
  console.log('[Sync] Starting popular products sync...');
  
  try {
    const supabase = createServerSupabaseClient();
    
    // Get all styles to match against our popular products
    const allStyles = await fetchAllStyles();
    
    // Find matching styles
    const matchedStyles: Array<{ style: SSProduct; popular: PopularProduct }> = [];
    
    for (const style of allStyles) {
      const popular = findPopularProduct(style.brandName, style.styleName);
      if (popular) {
        matchedStyles.push({ style, popular });
      }
    }
    
    console.log(`[Sync] Found ${matchedStyles.length} popular products in SS catalog`);
    
    // Process in batches
    const batches: Array<Array<{ style: SSProduct; popular: PopularProduct }>> = [];
    for (let i = 0; i < matchedStyles.length; i += BATCH_SIZE) {
      batches.push(matchedStyles.slice(i, i + BATCH_SIZE));
    }
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += MAX_PARALLEL_BATCHES) {
      const batchGroup = batches.slice(batchIndex, batchIndex + MAX_PARALLEL_BATCHES);
      
      // Collect all data for batch upserts
      const allProducts: any[] = [];
      const allColors: any[] = [];
      const allSkus: any[] = [];
      
      await Promise.all(batchGroup.map(async (batch) => {
        const styleIds = batch.map(b => b.style.styleID);
        
        try {
          // Fetch SKU data for this batch
          const skuData = await fetchSkuData(styleIds);
          
          // Group SKUs by style
          const skusByStyle = new Map<number, SSProductSku[]>();
          for (const sku of skuData) {
            if (!skusByStyle.has(sku.styleID)) {
              skusByStyle.set(sku.styleID, []);
            }
            skusByStyle.get(sku.styleID)!.push(sku);
          }
          
          // Process each style - collect data for batch upsert
          for (const { style, popular } of batch) {
            const skus = skusByStyle.get(style.styleID) || [];
            
            if (skus.length === 0) {
              console.warn(`[Sync] No SKUs found for style ${style.styleID}`);
              continue;
            }
            
            // Get Google category info
            const googleCategory = GOOGLE_CATEGORY_MAP[popular.category] || GOOGLE_CATEGORY_MAP['t-shirts'];
            const productType = PRODUCT_TYPE_MAP[popular.category] || 'T-Shirts > Core T-Shirts';
            
            // Calculate min prices from all SKUs for catalog display
            // Apply MARKET_MARKUP to piecePrice and salePrice to match competitor pricing
            const skuPrices = skus.map(s => {
              const basePiece = s.piecePrice || Math.round((s.customerPrice || 0) * RETAIL_MARKUP * 100) / 100;
              const retailPrice = Math.round(basePiece * MARKET_MARKUP * 100) / 100;
              const salePrice = (s.salePrice && s.salePrice > 0 && s.salePrice < s.piecePrice) 
                ? Math.round(s.salePrice * MARKET_MARKUP * 100) / 100 
                : null;
              return { retailPrice, salePrice };
            });
            
            const retailPrices = skuPrices.map(p => p.retailPrice).filter(p => p > 0);
            const salePrices = skuPrices.map(p => p.salePrice).filter((p): p is number => p !== null && p > 0);
            
            const minRetailPrice = retailPrices.length > 0 ? Math.min(...retailPrices) : null;
            const minSalePrice = salePrices.length > 0 ? Math.min(...salePrices) : null;
            const isOnSale = minSalePrice !== null && minSalePrice < (minRetailPrice || Infinity);
            
            // Legacy base price calculation (keeping for backward compatibility)
            const minCogs = Math.min(...skus.map(s => s.customerPrice || s.piecePrice || 0).filter(p => p > 0));
            const baseRetailPrice = Math.round(minCogs * RETAIL_MARKUP * 100) / 100;
            
            // Collect product data
            allProducts.push({
              style_id: style.styleID,
              style_name: style.styleName,
              slug: generateSlug(style.brandName, style.styleName),
              brand_id: style.brandID || parseInt(skus[0]?.brandID) || 0,
              brand_name: style.brandName,
              title_raw: style.title || style.styleName,
              description_raw: style.description || '',
              base_category: style.baseCategory || '',
              product_type: productType,
              google_category_id: googleCategory.id,
              google_category_name: googleCategory.name,
              primary_image_url: buildImageUrl(style.styleImage),
              material: '',
              gender: determineGender(popular.category, popular.attributes),
              age_group: determineAgeGroup(popular.category),
              is_sustainable: style.sustainableStyle || false,
              is_new: style.newStyle || false,
              is_popular: true,
              popular_tier: popular.tier,
              is_active: true,
              color_count: new Set(skus.map(s => s.colorCode)).size,
              base_price: baseRetailPrice,
              min_retail_price: minRetailPrice,
              min_sale_price: minSalePrice,
              is_on_sale: isOnSale,
              last_full_sync: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            
            // Group SKUs by color
            const colorMap = new Map<string, SSProductSku[]>();
            for (const sku of skus) {
              if (!colorMap.has(sku.colorCode)) {
                colorMap.set(sku.colorCode, []);
              }
              colorMap.get(sku.colorCode)!.push(sku);
            }
            
            // Collect colors and SKUs
            for (const [colorCode, colorSkus] of colorMap) {
              const firstSku = colorSkus[0];
              const colorId = `${style.styleID}-${colorCode}`;
              const hasStock = colorSkus.some(s => (s.qty || 0) > 0);
              
              allColors.push({
                id: colorId,
                style_id: style.styleID,
                color_name: firstSku.colorName,
                color_code: colorCode,
                color_family: firstSku.colorFamily || '',
                swatch_image: buildImageUrl(firstSku.colorSwatchImage),
                front_image: buildImageUrl(firstSku.colorFrontImage),
                back_image: buildImageUrl(firstSku.colorBackImage),
                side_image: buildImageUrl(firstSku.colorSideImage || firstSku.colorDirectSideImage),
                on_model_front: buildImageUrl(firstSku.colorOnModelFrontImage),
                on_model_back: buildImageUrl(firstSku.colorOnModelBackImage),
                on_model_side: buildImageUrl(firstSku.colorOnModelSideImage),
                availability: hasStock ? 'in_stock' : 'out_of_stock',
              });
              
              // Collect SKUs
              for (const sku of colorSkus) {
                // COGS = your wholesale cost (for margin tracking / Google Merchant)
                const cogs = sku.customerPrice || sku.piecePrice || 0;
                
                // Retail price = SS piecePrice with MARKET_MARKUP to match competitor pricing
                const basePiece = sku.piecePrice || Math.round(cogs * RETAIL_MARKUP * 100) / 100;
                const retailPrice = Math.round(basePiece * MARKET_MARKUP * 100) / 100;
                
                // Sale price = SS salePrice with MARKET_MARKUP (when item is on sale)
                let salePrice: number | null = null;
                if (sku.salePrice && sku.salePrice > 0 && sku.salePrice < sku.piecePrice) {
                  salePrice = Math.round(sku.salePrice * MARKET_MARKUP * 100) / 100;
                }
                
                // Auto-min price for Google auto-pricing (floor based on your cost)
                const autoMinPrice = Math.round(cogs * AUTO_MIN_MARKUP * 100) / 100;
                
                allSkus.push({
                  sku: sku.sku,
                  style_id: style.styleID,
                  color_id: colorId,
                  color_name: sku.colorName,
                  color_code: sku.colorCode,
                  size_name: sku.sizeName,
                  size_code: sku.sizeCode,
                  size_order: sku.sizeOrder,
                  cogs: cogs,
                  retail_price: retailPrice,
                  sale_price: salePrice,
                  auto_min_price: autoMinPrice,
                  gtin: sku.gtin || '',
                  piece_weight: sku.unitWeight || 0,
                  qty: sku.qty || 0,
                  availability: (sku.qty || 0) > 0 ? 'in_stock' : 'out_of_stock',
                  last_inventory_sync: new Date().toISOString(),
                });
              }
            }
          }
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Batch error: ${errMsg}`);
          console.error(`[Sync] Batch error:`, error);
        }
      }));
      
      // Batch upsert all collected data (much faster!)
      try {
        if (allProducts.length > 0) {
          await (supabase as any).from('products').upsert(allProducts, { onConflict: 'style_id' });
          productsProcessed += allProducts.length;
        }
        if (allColors.length > 0) {
          await (supabase as any).from('product_colors').upsert(allColors, { onConflict: 'id' });
          colorsProcessed += allColors.length;
        }
        if (allSkus.length > 0) {
          // Batch SKUs in chunks of 1000 to avoid payload size limits
          const SKU_BATCH_SIZE = 1000;
          for (let i = 0; i < allSkus.length; i += SKU_BATCH_SIZE) {
            const skuBatch = allSkus.slice(i, i + SKU_BATCH_SIZE);
            await (supabase as any).from('product_skus').upsert(skuBatch, { onConflict: 'sku' });
          }
          skusProcessed += allSkus.length;
        }
      } catch (upsertError) {
        const errMsg = upsertError instanceof Error ? upsertError.message : 'Unknown error';
        errors.push(`Batch upsert error: ${errMsg}`);
        console.error(`[Sync] Batch upsert error:`, upsertError);
      }
      
      console.log(`[Sync] Progress: ${Math.min((batchIndex + MAX_PARALLEL_BATCHES) * BATCH_SIZE, matchedStyles.length)}/${matchedStyles.length} styles`);
    }
    
    await logSyncComplete(logId, { products: productsProcessed, colors: colorsProcessed, skus: skusProcessed });
    
    const duration = Date.now() - startTime;
    console.log(`[Sync] Popular products sync complete in ${Math.round(duration / 1000)}s`);
    console.log(`[Sync] Products: ${productsProcessed}, Colors: ${colorsProcessed}, SKUs: ${skusProcessed}`);
    
    return {
      success: errors.length === 0,
      syncType: 'popular',
      productsProcessed,
      colorsProcessed,
      skusProcessed,
      categoriesLinked: 0, // Popular sync doesn't link categories yet
      errors,
      duration,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    await logSyncFailed(logId, errMsg);
    
    return {
      success: false,
      syncType: 'popular',
      productsProcessed,
      colorsProcessed,
      skusProcessed,
      categoriesLinked: 0,
      errors: [errMsg],
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Get total count of active products (for batch orchestration)
 */
export async function getActiveProductCount(): Promise<number> {
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (error) throw new Error(`Failed to count active products: ${error.message}`);
  return count || 0;
}

/**
 * Sync inventory only (qty and availability)
 * Supports offset/limit for chunked processing within serverless time limits.
 * When called without offset/limit, processes all products (for environments with longer timeouts).
 */
export async function syncInventoryOnly(offset?: number, limit?: number): Promise<SyncResult & { totalProducts: number }> {
  const startTime = Date.now();
  const isChunked = offset !== undefined && limit !== undefined;
  const logId = isChunked ? -1 : await logSyncStart('inventory');
  const errors: string[] = [];
  
  let skusProcessed = 0;
  
  console.log(`[Sync] Starting inventory sync${isChunked ? ` (offset=${offset}, limit=${limit})` : ''}...`);
  
  try {
    const supabase = createServerSupabaseClient();
    
    let query = supabase
      .from('products')
      .select('style_id')
      .eq('is_active', true)
      .order('style_id', { ascending: true });
    
    if (isChunked) {
      query = query.range(offset!, offset! + limit! - 1);
    }
    
    const { data: activeProducts, error: fetchError } = await query;
    
    if (fetchError) {
      throw new Error(`Failed to fetch active products: ${fetchError.message}`);
    }
    
    const products = activeProducts as Array<{ style_id: number }> | null;
    const totalProducts = isChunked ? await getActiveProductCount() : (products?.length || 0);
    
    if (!products || products.length === 0) {
      console.log('[Sync] No products in this batch');
      return {
        success: true,
        syncType: 'inventory',
        productsProcessed: 0,
        colorsProcessed: 0,
        skusProcessed: 0,
        categoriesLinked: 0,
        errors: [],
        duration: Date.now() - startTime,
        totalProducts,
      };
    }
    
    const styleIds = products.map(p => p.style_id);
    console.log(`[Sync] Syncing inventory for ${styleIds.length} products`);
    
    // Fetch all SKU data from SS API
    const batches: number[][] = [];
    for (let i = 0; i < styleIds.length; i += BATCH_SIZE) {
      batches.push(styleIds.slice(i, i + BATCH_SIZE));
    }
    
    const allSkuUpdates: { sku: string; qty: number; availability: string }[] = [];
    const colorAvailability = new Map<string, boolean>();

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += MAX_PARALLEL_BATCHES) {
      const batchGroup = batches.slice(batchIndex, batchIndex + MAX_PARALLEL_BATCHES);
      
      await Promise.all(batchGroup.map(async (batch) => {
        try {
          const skuData = await fetchSkuData(batch);
          
          for (const sku of skuData) {
            allSkuUpdates.push({
              sku: sku.sku,
              qty: sku.qty || 0,
              availability: (sku.qty || 0) > 0 ? 'in_stock' : 'out_of_stock',
            });
            
            const colorId = `${sku.styleID}-${sku.colorCode}`;
            if (!colorAvailability.has(colorId)) {
              colorAvailability.set(colorId, false);
            }
            if ((sku.qty || 0) > 0) {
              colorAvailability.set(colorId, true);
            }
          }
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Inventory batch error: ${errMsg}`);
          console.error(`[Sync] Inventory batch error:`, error);
        }
      }));
    }

    // Batch update Supabase in parallel chunks
    console.log(`[Sync] Updating ${allSkuUpdates.length} SKUs and ${colorAvailability.size} colors...`);
    const now = new Date().toISOString();
    const PARALLEL_CHUNK = 100;

    for (let i = 0; i < allSkuUpdates.length; i += PARALLEL_CHUNK) {
      const chunk = allSkuUpdates.slice(i, i + PARALLEL_CHUNK);
      await Promise.all(chunk.map(update =>
        (supabase as any)
          .from('product_skus')
          .update({
            qty: update.qty,
            availability: update.availability,
            last_inventory_sync: now,
          })
          .eq('sku', update.sku)
      ));
      skusProcessed += chunk.length;
    }

    const colorEntries = Array.from(colorAvailability.entries());
    for (let i = 0; i < colorEntries.length; i += PARALLEL_CHUNK) {
      const chunk = colorEntries.slice(i, i + PARALLEL_CHUNK);
      await Promise.all(chunk.map(([colorId, hasStock]) =>
        (supabase as any)
          .from('product_colors')
          .update({
            availability: hasStock ? 'in_stock' : 'out_of_stock',
          })
          .eq('id', colorId)
      ));
    }
    
    if (!isChunked) {
      await logSyncComplete(logId, { products: 0, colors: 0, skus: skusProcessed });
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Sync] Inventory sync complete in ${Math.round(duration / 1000)}s — ${skusProcessed} SKUs updated`);
    
    return {
      success: errors.length === 0,
      syncType: 'inventory',
      productsProcessed: styleIds.length,
      colorsProcessed: colorEntries.length,
      skusProcessed,
      categoriesLinked: 0,
      errors,
      duration,
      totalProducts,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    if (!isChunked) {
      await logSyncFailed(logId, errMsg);
    }
    
    return {
      success: false,
      syncType: 'inventory',
      productsProcessed: 0,
      colorsProcessed: 0,
      skusProcessed,
      categoriesLinked: 0,
      errors: [errMsg],
      duration: Date.now() - startTime,
      totalProducts: 0,
    };
  }
}

/**
 * Full catalog sync
 * Syncs all ~5,000 products from SS Activewear
 * Run weekly to catch new products and updates
 * 
 * @param resumeFromLogId - Optional: Resume from a previous interrupted sync using its log ID
 */
export async function syncFullCatalog(resumeFromLogId?: number): Promise<SyncResult & { logId: number }> {
  const startTime = Date.now();
  
  // Handle resume: use existing log ID or create new one
  let logId: number;
  let startBatchIndex = 0;
  
  if (resumeFromLogId) {
    const checkpoint = await getSyncCheckpoint(resumeFromLogId);
    if (checkpoint) {
      logId = resumeFromLogId;
      startBatchIndex = checkpoint.batchIndex;
      console.log(`[Sync] Resuming full catalog sync from batch ${startBatchIndex}...`);
    } else {
      // Checkpoint not found or sync already completed, start fresh
      logId = await logSyncStart('full');
      console.log('[Sync] Starting fresh full catalog sync (resume ID invalid)...');
    }
  } else {
    logId = await logSyncStart('full');
    console.log('[Sync] Starting full catalog sync...');
  }
  
  const errors: string[] = [];
  
  let productsProcessed = 0;
  let colorsProcessed = 0;
  let skusProcessed = 0;
  let categoriesLinked = 0;
  
  try {
    const supabase = createServerSupabaseClient();
    
    // Fetch all styles
    const allStyles = await fetchAllStyles();
    console.log(`[Sync] Processing ${allStyles.length} styles`);
    
    // Track synced style IDs to mark discontinued products later
    const syncedStyleIds = new Set<number>();
    
    // Process in batches
    const batches: SSProduct[][] = [];
    for (let i = 0; i < allStyles.length; i += BATCH_SIZE) {
      batches.push(allStyles.slice(i, i + BATCH_SIZE));
    }
    
    const totalBatches = batches.length;
    
    // Start from checkpoint if resuming
    for (let batchIndex = startBatchIndex; batchIndex < batches.length; batchIndex += MAX_PARALLEL_BATCHES) {
      const batchGroup = batches.slice(batchIndex, batchIndex + MAX_PARALLEL_BATCHES);
      
      // Collect all data for batch upserts
      const allProducts: any[] = [];
      const allColors: any[] = [];
      const allSkus: any[] = [];
      const allProductCategories: { style_id: number; category_id: number }[] = [];
      
      await Promise.all(batchGroup.map(async (batch) => {
        const styleIds = batch.map(s => s.styleID);
        
        try {
          const skuData = await fetchSkuData(styleIds);
          
          // Group SKUs by style
          const skusByStyle = new Map<number, SSProductSku[]>();
          for (const sku of skuData) {
            if (!skusByStyle.has(sku.styleID)) {
              skusByStyle.set(sku.styleID, []);
            }
            skusByStyle.get(sku.styleID)!.push(sku);
          }
          
          // Process each style - collect data for batch upsert
          for (const style of batch) {
            const skus = skusByStyle.get(style.styleID) || [];
            
            if (skus.length === 0) {
              continue;
            }
            
            syncedStyleIds.add(style.styleID);
            
            // Parse and collect category IDs for product_categories junction table
            if (style.categories) {
              const categoryIds = style.categories
                .split(',')
                .map(id => parseInt(id.trim(), 10))
                .filter(id => !isNaN(id) && id > 0);
              
              for (const categoryId of categoryIds) {
                allProductCategories.push({
                  style_id: style.styleID,
                  category_id: categoryId,
                });
              }
            }
            
            // Check if this is a popular product
            const popular = findPopularProduct(style.brandName, style.styleName);
            
            // Determine Google category
            let googleCategory = { id: 212, name: 'Apparel & Accessories > Clothing > Shirts & Tops' };
            let productType = 'T-Shirts > Core T-Shirts';
            
            if (popular) {
              googleCategory = GOOGLE_CATEGORY_MAP[popular.category] || googleCategory;
              productType = PRODUCT_TYPE_MAP[popular.category] || productType;
            }
            
            // Calculate min prices from all SKUs for catalog display
            // Apply MARKET_MARKUP to piecePrice and salePrice to match competitor pricing
            const skuPrices = skus.map(s => {
              const basePiece = s.piecePrice || Math.round((s.customerPrice || 0) * RETAIL_MARKUP * 100) / 100;
              const retailPrice = Math.round(basePiece * MARKET_MARKUP * 100) / 100;
              const salePrice = (s.salePrice && s.salePrice > 0 && s.salePrice < s.piecePrice) 
                ? Math.round(s.salePrice * MARKET_MARKUP * 100) / 100 
                : null;
              return { retailPrice, salePrice };
            });
            
            const retailPrices = skuPrices.map(p => p.retailPrice).filter(p => p > 0);
            const salePrices = skuPrices.map(p => p.salePrice).filter((p): p is number => p !== null && p > 0);
            
            const minRetailPrice = retailPrices.length > 0 ? Math.min(...retailPrices) : null;
            const minSalePrice = salePrices.length > 0 ? Math.min(...salePrices) : null;
            const isOnSale = minSalePrice !== null && minSalePrice < (minRetailPrice || Infinity);
            
            // Legacy base price calculation (keeping for backward compatibility)
            const minCogs = Math.min(...skus.map(s => s.customerPrice || s.piecePrice || 0).filter(p => p > 0));
            const baseRetailPrice = Math.round(minCogs * RETAIL_MARKUP * 100) / 100;
            
            // Collect product data
            allProducts.push({
              style_id: style.styleID,
              style_name: style.styleName,
              slug: generateSlug(style.brandName, style.styleName),
              brand_id: style.brandID || parseInt(skus[0]?.brandID) || 0,
              brand_name: style.brandName,
              title_raw: style.title || style.styleName,
              description_raw: style.description || '',
              base_category: style.baseCategory || '',
              product_type: productType,
              google_category_id: googleCategory.id,
              google_category_name: googleCategory.name,
              primary_image_url: buildImageUrl(style.styleImage),
              material: '',
              gender: popular ? determineGender(popular.category, popular.attributes) : 'Unisex',
              age_group: popular ? determineAgeGroup(popular.category) : 'Adult',
              is_sustainable: style.sustainableStyle || false,
              is_new: style.newStyle || false,
              is_popular: !!popular,
              popular_tier: popular?.tier || null,
              is_active: true,
              color_count: new Set(skus.map(s => s.colorCode)).size,
              base_price: baseRetailPrice,
              min_retail_price: minRetailPrice,
              min_sale_price: minSalePrice,
              is_on_sale: isOnSale,
              last_full_sync: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            
            // Group SKUs by color
            const colorMap = new Map<string, SSProductSku[]>();
            for (const sku of skus) {
              if (!colorMap.has(sku.colorCode)) {
                colorMap.set(sku.colorCode, []);
              }
              colorMap.get(sku.colorCode)!.push(sku);
            }
            
            // Collect colors and SKUs
            for (const [colorCode, colorSkus] of colorMap) {
              const firstSku = colorSkus[0];
              const colorId = `${style.styleID}-${colorCode}`;
              const hasStock = colorSkus.some(s => (s.qty || 0) > 0);
              
              allColors.push({
                id: colorId,
                style_id: style.styleID,
                color_name: firstSku.colorName,
                color_code: colorCode,
                color_family: firstSku.colorFamily || '',
                swatch_image: buildImageUrl(firstSku.colorSwatchImage),
                front_image: buildImageUrl(firstSku.colorFrontImage),
                back_image: buildImageUrl(firstSku.colorBackImage),
                side_image: buildImageUrl(firstSku.colorSideImage || firstSku.colorDirectSideImage),
                on_model_front: buildImageUrl(firstSku.colorOnModelFrontImage),
                on_model_back: buildImageUrl(firstSku.colorOnModelBackImage),
                on_model_side: buildImageUrl(firstSku.colorOnModelSideImage),
                availability: hasStock ? 'in_stock' : 'out_of_stock',
              });
              
              for (const sku of colorSkus) {
                // COGS = your wholesale cost (for margin tracking / Google Merchant)
                const cogs = sku.customerPrice || sku.piecePrice || 0;
                
                // Retail price = SS piecePrice with MARKET_MARKUP to match competitor pricing
                const basePiece = sku.piecePrice || Math.round(cogs * RETAIL_MARKUP * 100) / 100;
                const retailPrice = Math.round(basePiece * MARKET_MARKUP * 100) / 100;
                
                // Sale price = SS salePrice with MARKET_MARKUP (when item is on sale)
                let salePrice: number | null = null;
                if (sku.salePrice && sku.salePrice > 0 && sku.salePrice < sku.piecePrice) {
                  salePrice = Math.round(sku.salePrice * MARKET_MARKUP * 100) / 100;
                }
                
                // Auto-min price for Google auto-pricing (floor based on your cost)
                const autoMinPrice = Math.round(cogs * AUTO_MIN_MARKUP * 100) / 100;
                
                allSkus.push({
                  sku: sku.sku,
                  style_id: style.styleID,
                  color_id: colorId,
                  color_name: sku.colorName,
                  color_code: sku.colorCode,
                  size_name: sku.sizeName,
                  size_code: sku.sizeCode,
                  size_order: sku.sizeOrder,
                  cogs: cogs,
                  retail_price: retailPrice,
                  sale_price: salePrice,
                  auto_min_price: autoMinPrice,
                  gtin: sku.gtin || '',
                  piece_weight: sku.unitWeight || 0,
                  qty: sku.qty || 0,
                  availability: (sku.qty || 0) > 0 ? 'in_stock' : 'out_of_stock',
                  last_inventory_sync: new Date().toISOString(),
                });
              }
            }
          }
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Batch error: ${errMsg}`);
          console.error(`[Sync] Batch error:`, error);
        }
      }));
      
      // Batch upsert all collected data (much faster!)
      try {
        if (allProducts.length > 0) {
          await (supabase as any).from('products').upsert(allProducts, { onConflict: 'style_id' });
          productsProcessed += allProducts.length;
        }
        if (allColors.length > 0) {
          await (supabase as any).from('product_colors').upsert(allColors, { onConflict: 'id' });
          colorsProcessed += allColors.length;
        }
        if (allSkus.length > 0) {
          // Batch SKUs in chunks of 1000 to avoid payload size limits
          const SKU_BATCH_SIZE = 1000;
          for (let i = 0; i < allSkus.length; i += SKU_BATCH_SIZE) {
            const skuBatch = allSkus.slice(i, i + SKU_BATCH_SIZE);
            await (supabase as any).from('product_skus').upsert(skuBatch, { onConflict: 'sku' });
          }
          skusProcessed += allSkus.length;
        }
        
        // Upsert product_categories junction table
        if (allProductCategories.length > 0) {
          const CATEGORY_BATCH_SIZE = 1000;
          for (let i = 0; i < allProductCategories.length; i += CATEGORY_BATCH_SIZE) {
            const categoryBatch = allProductCategories.slice(i, i + CATEGORY_BATCH_SIZE);
            const { error: catError } = await (supabase as any)
              .from('product_categories')
              .upsert(categoryBatch, { onConflict: 'style_id,category_id' });
            
            if (catError) {
              // Some category IDs might not exist in categories table, log but continue
              console.warn(`[Sync] Some product_categories failed:`, catError.message);
            }
          }
          categoriesLinked += allProductCategories.length;
        }
      } catch (upsertError) {
        const errMsg = upsertError instanceof Error ? upsertError.message : 'Unknown error';
        errors.push(`Batch upsert error: ${errMsg}`);
        console.error(`[Sync] Batch upsert error:`, upsertError);
      }
      
      const progress = Math.min((batchIndex + MAX_PARALLEL_BATCHES) * BATCH_SIZE, allStyles.length);
      console.log(`[Sync] Progress: ${progress}/${allStyles.length} styles (${productsProcessed} products, ${categoriesLinked} category links)`);
      
      // Save checkpoint for resume capability
      await updateSyncCheckpoint(logId, batchIndex + MAX_PARALLEL_BATCHES, totalBatches);
    }
    
    // Mark discontinued products (products in DB but not in SS API)
    console.log('[Sync] Marking discontinued products...');
    const { data: existingProducts } = await supabase
      .from('products')
      .select('style_id')
      .eq('is_active', true);
    
    const existingList = existingProducts as Array<{ style_id: number }> | null;
    if (existingList) {
      for (const product of existingList) {
        if (!syncedStyleIds.has(product.style_id)) {
          await (supabase as any)
            .from('products')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('style_id', product.style_id);
          console.log(`[Sync] Marked style ${product.style_id} as discontinued`);
        }
      }
    }
    
    await logSyncComplete(logId, { products: productsProcessed, colors: colorsProcessed, skus: skusProcessed });
    
    const duration = Date.now() - startTime;
    console.log(`[Sync] Full catalog sync complete in ${Math.round(duration / 1000)}s`);
    console.log(`[Sync] Products: ${productsProcessed}, Colors: ${colorsProcessed}, SKUs: ${skusProcessed}, Category Links: ${categoriesLinked}`);
    
    return {
      success: errors.length === 0,
      syncType: 'full',
      productsProcessed,
      colorsProcessed,
      skusProcessed,
      categoriesLinked,
      errors,
      duration,
      logId,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    await logSyncFailed(logId, errMsg);
    
    return {
      success: false,
      syncType: 'full',
      productsProcessed,
      colorsProcessed,
      skusProcessed,
      categoriesLinked: 0,
      errors: [errMsg],
      duration: Date.now() - startTime,
      logId,
    };
  }
}

/**
 * Category-only sync
 * Re-links all products to categories without fetching SKU data
 * Fast operation (~2-3 min) for when you restructure categories
 */
export async function syncCategoriesOnly(): Promise<SyncResult> {
  const startTime = Date.now();
  const logId = await logSyncStart('categories');
  const errors: string[] = [];
  
  let productsProcessed = 0;
  let categoriesLinked = 0;
  
  console.log('[Sync] Starting category-only sync...');
  
  try {
    const supabase = createServerSupabaseClient();
    
    // Fetch all styles (lightweight - no SKU data needed)
    const allStyles = await fetchAllStyles();
    console.log(`[Sync] Processing categories for ${allStyles.length} styles`);
    
    // Process in batches
    const CATEGORY_BATCH_SIZE = 100; // Larger batches since no SKU fetching
    const batches: SSProduct[][] = [];
    for (let i = 0; i < allStyles.length; i += CATEGORY_BATCH_SIZE) {
      batches.push(allStyles.slice(i, i + CATEGORY_BATCH_SIZE));
    }
    
    for (const batch of batches) {
      const allProductCategories: { style_id: number; category_id: number }[] = [];
      
      for (const style of batch) {
        // Parse category IDs from comma-separated string
        if (style.categories) {
          const categoryIds = style.categories
            .split(',')
            .map(id => parseInt(id.trim(), 10))
            .filter(id => !isNaN(id) && id > 0);
          
          for (const categoryId of categoryIds) {
            allProductCategories.push({
              style_id: style.styleID,
              category_id: categoryId,
            });
          }
        }
        productsProcessed++;
      }
      
      // Batch upsert to product_categories junction table
      if (allProductCategories.length > 0) {
        const { error: catError } = await (supabase as any)
          .from('product_categories')
          .upsert(allProductCategories, { onConflict: 'style_id,category_id' });
        
        if (catError) {
          console.warn(`[Sync] Some product_categories failed:`, catError.message);
        }
        categoriesLinked += allProductCategories.length;
      }
      
      console.log(`[Sync] Category progress: ${productsProcessed}/${allStyles.length} styles`);
    }
    
    await logSyncComplete(logId, { products: productsProcessed, colors: 0, skus: 0 });
    
    const duration = Date.now() - startTime;
    console.log(`[Sync] Category-only sync complete in ${Math.round(duration / 1000)}s`);
    console.log(`[Sync] Products: ${productsProcessed}, Category Links: ${categoriesLinked}`);
    
    return {
      success: errors.length === 0,
      syncType: 'full', // Using 'full' since SyncResult type expects specific values
      productsProcessed,
      colorsProcessed: 0,
      skusProcessed: 0,
      categoriesLinked,
      errors,
      duration,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    await logSyncFailed(logId, errMsg);
    
    return {
      success: false,
      syncType: 'full',
      productsProcessed,
      colorsProcessed: 0,
      skusProcessed: 0,
      categoriesLinked: 0,
      errors: [errMsg],
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Get latest sync status
 */
export async function getLatestSyncStatus(): Promise<{
  lastSync: SyncLog | null;
  inventorySync: SyncLog | null;
  fullSync: SyncLog | null;
}> {
  const supabase = createServerSupabaseClient();
  
  const { data: lastSync } = await supabase
    .from('sync_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
  
  const { data: inventorySync } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('sync_type', 'inventory')
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
  
  const { data: fullSync } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('sync_type', 'full')
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
  
  return {
    lastSync: lastSync || null,
    inventorySync: inventorySync || null,
    fullSync: fullSync || null,
  };
}
