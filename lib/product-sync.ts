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
const RETAIL_MARKUP = 1.40;      // 40% markup for retail price
const AUTO_MIN_MARKUP = 1.12;   // 12% markup for auto-pricing floor

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
  
  const { data, error } = await supabase
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
  
  return data.id;
}

async function logSyncComplete(
  logId: number,
  stats: { products: number; colors: number; skus: number }
): Promise<void> {
  if (logId < 0) return;
  
  const supabase = createServerSupabaseClient();
  
  await supabase
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
  
  await supabase
    .from('sync_logs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);
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
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.replace(/^\/+/, '');
  if (cleanPath.startsWith('cdn.') || cleanPath.startsWith('cdnm.')) {
    return `https://${cleanPath}`;
  }
  return `https://www.ssactivewear.com/${cleanPath}`;
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
            
            // Get min COGS from SKUs, then calculate retail price for display
            const minCogs = Math.min(...skus.map(s => s.customerPrice || s.piecePrice || 0).filter(p => p > 0));
            const baseRetailPrice = Math.round(minCogs * RETAIL_MARKUP * 100) / 100;
            
            // Collect product data
            allProducts.push({
              style_id: style.styleID,
              style_name: style.styleName,
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
                const cogs = sku.customerPrice || sku.piecePrice || 0;
                const retailPrice = Math.round(cogs * RETAIL_MARKUP * 100) / 100;
                
                let salePrice: number | null = null;
                let autoMinPrice = Math.round(cogs * AUTO_MIN_MARKUP * 100) / 100;
                
                if (sku.salePrice && sku.salePrice > 0 && sku.salePrice < cogs) {
                  salePrice = Math.round(sku.salePrice * RETAIL_MARKUP * 100) / 100;
                  autoMinPrice = Math.round(sku.salePrice * AUTO_MIN_MARKUP * 100) / 100;
                }
                
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
          await supabase.from('products').upsert(allProducts, { onConflict: 'style_id' });
          productsProcessed += allProducts.length;
        }
        if (allColors.length > 0) {
          await supabase.from('product_colors').upsert(allColors, { onConflict: 'id' });
          colorsProcessed += allColors.length;
        }
        if (allSkus.length > 0) {
          // Batch SKUs in chunks of 1000 to avoid payload size limits
          const SKU_BATCH_SIZE = 1000;
          for (let i = 0; i < allSkus.length; i += SKU_BATCH_SIZE) {
            const skuBatch = allSkus.slice(i, i + SKU_BATCH_SIZE);
            await supabase.from('product_skus').upsert(skuBatch, { onConflict: 'sku' });
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
      errors: [errMsg],
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Sync inventory only (qty and availability)
 * Faster daily sync - only updates inventory columns
 */
export async function syncInventoryOnly(): Promise<SyncResult> {
  const startTime = Date.now();
  const logId = await logSyncStart('inventory');
  const errors: string[] = [];
  
  let skusProcessed = 0;
  
  console.log('[Sync] Starting inventory-only sync...');
  
  try {
    const supabase = createServerSupabaseClient();
    
    // Get all active style IDs from our cache
    const { data: activeProducts, error: fetchError } = await supabase
      .from('products')
      .select('style_id')
      .eq('is_active', true);
    
    if (fetchError) {
      throw new Error(`Failed to fetch active products: ${fetchError.message}`);
    }
    
    if (!activeProducts || activeProducts.length === 0) {
      console.log('[Sync] No active products to sync inventory for');
      return {
        success: true,
        syncType: 'inventory',
        productsProcessed: 0,
        colorsProcessed: 0,
        skusProcessed: 0,
        errors: [],
        duration: Date.now() - startTime,
      };
    }
    
    const styleIds = activeProducts.map(p => p.style_id);
    console.log(`[Sync] Syncing inventory for ${styleIds.length} products`);
    
    // Process in batches
    const batches: number[][] = [];
    for (let i = 0; i < styleIds.length; i += BATCH_SIZE) {
      batches.push(styleIds.slice(i, i + BATCH_SIZE));
    }
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += MAX_PARALLEL_BATCHES) {
      const batchGroup = batches.slice(batchIndex, batchIndex + MAX_PARALLEL_BATCHES);
      
      await Promise.all(batchGroup.map(async (batch) => {
        try {
          const skuData = await fetchSkuData(batch);
          
          // Batch update inventory
          for (const sku of skuData) {
            const { error } = await supabase
              .from('product_skus')
              .update({
                qty: sku.qty || 0,
                availability: (sku.qty || 0) > 0 ? 'in_stock' : 'out_of_stock',
                last_inventory_sync: new Date().toISOString(),
              })
              .eq('sku', sku.sku);
            
            if (!error) {
              skusProcessed++;
            }
          }
          
          // Also update color-level availability
          const colorAvailability = new Map<string, boolean>();
          for (const sku of skuData) {
            const colorId = `${sku.styleID}-${sku.colorCode}`;
            if (!colorAvailability.has(colorId)) {
              colorAvailability.set(colorId, false);
            }
            if ((sku.qty || 0) > 0) {
              colorAvailability.set(colorId, true);
            }
          }
          
          for (const [colorId, hasStock] of colorAvailability) {
            await supabase
              .from('product_colors')
              .update({
                availability: hasStock ? 'in_stock' : 'out_of_stock',
              })
              .eq('id', colorId);
          }
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Inventory batch error: ${errMsg}`);
          console.error(`[Sync] Inventory batch error:`, error);
        }
      }));
      
      const progress = Math.min((batchIndex + MAX_PARALLEL_BATCHES) * BATCH_SIZE, styleIds.length);
      console.log(`[Sync] Inventory progress: ${progress}/${styleIds.length} styles`);
    }
    
    await logSyncComplete(logId, { products: 0, colors: 0, skus: skusProcessed });
    
    const duration = Date.now() - startTime;
    console.log(`[Sync] Inventory sync complete in ${Math.round(duration / 1000)}s`);
    console.log(`[Sync] SKUs updated: ${skusProcessed}`);
    
    return {
      success: errors.length === 0,
      syncType: 'inventory',
      productsProcessed: 0,
      colorsProcessed: 0,
      skusProcessed,
      errors,
      duration,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    await logSyncFailed(logId, errMsg);
    
    return {
      success: false,
      syncType: 'inventory',
      productsProcessed: 0,
      colorsProcessed: 0,
      skusProcessed,
      errors: [errMsg],
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Full catalog sync
 * Syncs all ~5,000 products from SS Activewear
 * Run weekly to catch new products and updates
 */
export async function syncFullCatalog(): Promise<SyncResult> {
  const startTime = Date.now();
  const logId = await logSyncStart('full');
  const errors: string[] = [];
  
  let productsProcessed = 0;
  let colorsProcessed = 0;
  let skusProcessed = 0;
  
  console.log('[Sync] Starting full catalog sync...');
  
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
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += MAX_PARALLEL_BATCHES) {
      const batchGroup = batches.slice(batchIndex, batchIndex + MAX_PARALLEL_BATCHES);
      
      // Collect all data for batch upserts
      const allProducts: any[] = [];
      const allColors: any[] = [];
      const allSkus: any[] = [];
      
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
            
            // Check if this is a popular product
            const popular = findPopularProduct(style.brandName, style.styleName);
            
            // Determine Google category
            let googleCategory = { id: 212, name: 'Apparel & Accessories > Clothing > Shirts & Tops' };
            let productType = 'T-Shirts > Core T-Shirts';
            
            if (popular) {
              googleCategory = GOOGLE_CATEGORY_MAP[popular.category] || googleCategory;
              productType = PRODUCT_TYPE_MAP[popular.category] || productType;
            }
            
            // Get min COGS from SKUs, then calculate retail price for display
            const minCogs = Math.min(...skus.map(s => s.customerPrice || s.piecePrice || 0).filter(p => p > 0));
            const baseRetailPrice = Math.round(minCogs * RETAIL_MARKUP * 100) / 100;
            
            // Collect product data
            allProducts.push({
              style_id: style.styleID,
              style_name: style.styleName,
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
                const cogs = sku.customerPrice || sku.piecePrice || 0;
                const retailPrice = Math.round(cogs * RETAIL_MARKUP * 100) / 100;
                
                let salePrice: number | null = null;
                let autoMinPrice = Math.round(cogs * AUTO_MIN_MARKUP * 100) / 100;
                
                if (sku.salePrice && sku.salePrice > 0 && sku.salePrice < cogs) {
                  salePrice = Math.round(sku.salePrice * RETAIL_MARKUP * 100) / 100;
                  autoMinPrice = Math.round(sku.salePrice * AUTO_MIN_MARKUP * 100) / 100;
                }
                
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
          await supabase.from('products').upsert(allProducts, { onConflict: 'style_id' });
          productsProcessed += allProducts.length;
        }
        if (allColors.length > 0) {
          await supabase.from('product_colors').upsert(allColors, { onConflict: 'id' });
          colorsProcessed += allColors.length;
        }
        if (allSkus.length > 0) {
          // Batch SKUs in chunks of 1000 to avoid payload size limits
          const SKU_BATCH_SIZE = 1000;
          for (let i = 0; i < allSkus.length; i += SKU_BATCH_SIZE) {
            const skuBatch = allSkus.slice(i, i + SKU_BATCH_SIZE);
            await supabase.from('product_skus').upsert(skuBatch, { onConflict: 'sku' });
          }
          skusProcessed += allSkus.length;
        }
      } catch (upsertError) {
        const errMsg = upsertError instanceof Error ? upsertError.message : 'Unknown error';
        errors.push(`Batch upsert error: ${errMsg}`);
        console.error(`[Sync] Batch upsert error:`, upsertError);
      }
      
      const progress = Math.min((batchIndex + MAX_PARALLEL_BATCHES) * BATCH_SIZE, allStyles.length);
      console.log(`[Sync] Progress: ${progress}/${allStyles.length} styles (${productsProcessed} products, ${skusProcessed} SKUs)`);
    }
    
    // Mark discontinued products (products in DB but not in SS API)
    console.log('[Sync] Marking discontinued products...');
    const { data: existingProducts } = await supabase
      .from('products')
      .select('style_id')
      .eq('is_active', true);
    
    if (existingProducts) {
      for (const product of existingProducts) {
        if (!syncedStyleIds.has(product.style_id)) {
          await supabase
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
    console.log(`[Sync] Products: ${productsProcessed}, Colors: ${colorsProcessed}, SKUs: ${skusProcessed}`);
    
    return {
      success: errors.length === 0,
      syncType: 'full',
      productsProcessed,
      colorsProcessed,
      skusProcessed,
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
      colorsProcessed,
      skusProcessed,
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
