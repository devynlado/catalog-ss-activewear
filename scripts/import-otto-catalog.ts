/**
 * Otto Cap Catalog Import Script
 * 
 * Imports products from Otto Cap Excel files into the Supabase database.
 * 
 * Data sources:
 * - otto_catalog.xlsx: Product details, descriptions, images, pricing
 * - otto_inventory.xlsx: Real-time stock by warehouse
 * 
 * Run with: npx ts-node scripts/import-otto-catalog.ts
 */

const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================================================
// CONFIGURATION
// ============================================================================

const CATALOG_FILE = path.resolve(process.env.HOME || '', 'Downloads/otto_catalog.xlsx');
const INVENTORY_FILE = path.resolve(process.env.HOME || '', 'Downloads/otto_inventory.xlsx');

// Pricing markup (40% on wholesale)
const RETAIL_MARKUP = 1.40;

// Category IDs
const HEADWEAR_CATEGORY_ID = 11;
const BASEBALL_CAPS_ID = 2000;
const TRUCKER_HATS_ID = 147;
const DAD_CAPS_ID = 796;
const SNAPBACKS_ID = 363;
const BEANIES_ID = 120;
const VISORS_ID = 241;
const BUCKET_HATS_ID = 242;
const FIVE_PANEL_ID = 238;
const SIX_PANEL_ID = 239;

// Google category for hats
const GOOGLE_CATEGORY_ID = 173;
const GOOGLE_CATEGORY_NAME = 'Apparel & Accessories > Clothing Accessories > Hats';

// ============================================================================
// TYPES
// ============================================================================

interface OttoCatalogRow {
  sku_no: string;
  sku_parent: string;
  UPC: string;
  brand: string;
  name: string;
  description_short: string;
  description: string;
  plain_description: string;
  material_content: string;
  url: string;
  '1+': number;
  '144+': number;
  '288+': number;
  '576+': number;
  '1296+': number;
  image_1: string;
  image_2: string;
  image_3: string;
  image_4: string;
  image_5: string;
  image_6: string;
  image_7: string;
  image_8: string;
  image_9: string;
  image_10: string;
  image_main: string;
  color: string;
  size: string;
  type: string;
  weight: number;
  instock: number;
  qty: number;
  status: string;
}

interface OttoInventoryRow {
  sku_no: string;
  sku_parent: string;
  brand: string;
  name: string;
  color: string;
  size: string;
  instock: number;
  CA: number;
  TX: number;
  GA: number;
}

interface ProductData {
  style_id: number;
  style_name: string;
  brand_id: number | null;
  brand_name: string;
  title_raw: string;
  description_raw: string;
  base_category: string;
  product_type: string;
  google_category_id: number;
  google_category_name: string;
  primary_image_url: string;
  material: string;
  gender: string;
  age_group: string;
  is_active: boolean;
  color_count: number;
  base_price: number;
  supplier: string;
  supplier_style_id: string;
}

interface ColorData {
  id: string;
  style_id: number;
  color_name: string;
  color_code: string;
  color_family: string | null;
  swatch_image: string;
  front_image: string;
  back_image: string | null;
  additional_images: string[];
  supplier: string;
}

interface SkuData {
  sku: string;
  style_id: number;
  color_id: string;
  color_name: string;
  color_code: string;
  size_name: string;
  cogs: number;
  retail_price: number;
  gtin: string;
  piece_weight: number;
  qty: number;
  availability: string;
  supplier: string;
  supplier_sku: string;
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in .env.local');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// ============================================================================
// CATEGORY DETECTION
// ============================================================================

/**
 * Detect categories from Otto Cap product name
 * Returns array of category IDs to assign
 */
function detectCategories(name: string): number[] {
  const lowerName = name.toLowerCase();
  const categories: number[] = [HEADWEAR_CATEGORY_ID]; // Always include Headwear
  
  // Product type subcategories (priority order - first match wins for type)
  if (lowerName.includes('baseball')) {
    categories.push(BASEBALL_CAPS_ID);
  } else if (lowerName.includes('trucker')) {
    categories.push(TRUCKER_HATS_ID);
  } else if (/dad cap|dad hat/.test(lowerName)) {
    categories.push(DAD_CAPS_ID);
  } else if (lowerName.includes('snapback')) {
    categories.push(SNAPBACKS_ID);
  } else if (/beanie|knit cap|cuff.*cap|watch.*cap/.test(lowerName)) {
    categories.push(BEANIES_ID);
  } else if (lowerName.includes('visor')) {
    categories.push(VISORS_ID);
  } else if (lowerName.includes('bucket')) {
    categories.push(BUCKET_HATS_ID);
  }
  
  // Panel attributes (can combine with product type)
  if (/5.?panel/.test(lowerName)) {
    categories.push(FIVE_PANEL_ID);
  }
  if (/6.?panel/.test(lowerName)) {
    categories.push(SIX_PANEL_ID);
  }
  
  return categories;
}

/**
 * Derive color family from color name
 */
function deriveColorFamily(colorName: string): string | null {
  const lowerName = colorName.toLowerCase();
  
  if (/black|blk|charcoal/.test(lowerName)) return 'Black';
  if (/white|wht/.test(lowerName)) return 'White';
  if (/navy|nvy/.test(lowerName)) return 'Navy';
  if (/red|cardinal|maroon|burgundy/.test(lowerName)) return 'Red';
  if (/royal|blue|columbia/.test(lowerName)) return 'Blue';
  if (/green|forest|kelly|olive|hunter/.test(lowerName)) return 'Green';
  if (/gray|grey|heather/.test(lowerName)) return 'Grey';
  if (/orange|org/.test(lowerName)) return 'Orange';
  if (/yellow|gold/.test(lowerName)) return 'Yellow';
  if (/purple|violet/.test(lowerName)) return 'Purple';
  if (/pink|rose/.test(lowerName)) return 'Pink';
  if (/brown|tan|khaki|beige/.test(lowerName)) return 'Brown';
  if (/camo|camouflage/.test(lowerName)) return 'Camo';
  
  return null;
}

/**
 * Parse color field to extract code and name
 * Format: "001 - Royal" or "001 - Blk/Wht"
 */
function parseColor(colorField: string): { code: string; name: string } {
  if (!colorField) {
    return { code: 'UNK', name: 'Unknown' };
  }
  
  const parts = colorField.split(' - ');
  if (parts.length >= 2) {
    return {
      code: parts[0].trim(),
      name: parts.slice(1).join(' - ').trim(),
    };
  }
  
  // Fallback: use as-is
  return { code: colorField, name: colorField };
}

/**
 * Determine age group from size field
 */
function determineAgeGroup(size: string): string {
  if (!size) return 'Adult';
  const lowerSize = size.toLowerCase();
  if (lowerSize.includes('youth') || lowerSize.includes('young adult')) {
    return 'Kids';
  }
  return 'Adult';
}

// ============================================================================
// DATA LOADING
// ============================================================================

function loadExcelFile(filePath: string): any[] {
  console.log(`Loading: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  console.log(`  Loaded ${data.length} rows`);
  return data;
}

// ============================================================================
// MAIN IMPORT LOGIC
// ============================================================================

async function importOttoCatalog() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('           OTTO CAP CATALOG IMPORT');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const supabase = createSupabaseClient();
  
  // Load Excel files
  console.log('Step 1: Loading Excel files...\n');
  const catalogData = loadExcelFile(CATALOG_FILE) as OttoCatalogRow[];
  const inventoryData = loadExcelFile(INVENTORY_FILE) as OttoInventoryRow[];
  
  // Build inventory lookup map
  const inventoryMap = new Map<string, OttoInventoryRow>();
  inventoryData.forEach(row => {
    if (row.sku_no) {
      inventoryMap.set(row.sku_no, row);
    }
  });
  console.log(`  Built inventory map with ${inventoryMap.size} entries\n`);
  
  // Filter to hats only
  console.log('Step 2: Filtering to hats only...\n');
  const hats = catalogData.filter(row => {
    // Include items with type "Hats" or where name suggests it's a hat
    const isHatType = row.type === 'Hats';
    const hasCapInName = row.name?.toLowerCase().includes('cap') || 
                         row.name?.toLowerCase().includes('hat') ||
                         row.name?.toLowerCase().includes('beanie') ||
                         row.name?.toLowerCase().includes('visor');
    return isHatType || hasCapInName;
  });
  console.log(`  Found ${hats.length} hat SKUs\n`);
  
  // Group by style (sku_parent)
  console.log('Step 3: Grouping by style...\n');
  const styleGroups = new Map<string, OttoCatalogRow[]>();
  hats.forEach(row => {
    if (!row.sku_parent) return;
    
    const existing = styleGroups.get(row.sku_parent) || [];
    existing.push(row);
    styleGroups.set(row.sku_parent, existing);
  });
  console.log(`  Found ${styleGroups.size} unique styles\n`);
  
  // Get next style_id from sequence
  console.log('Step 4: Getting starting style_id...\n');
  const { data: seqData, error: seqError } = await supabase.rpc('nextval', { 
    seq_name: 'otto_style_id_seq' 
  });
  
  // If sequence doesn't exist yet, start at 1000000
  let nextStyleId = 1000000;
  if (!seqError && seqData) {
    nextStyleId = seqData;
  }
  console.log(`  Starting style_id: ${nextStyleId}\n`);
  
  // Process each style
  console.log('Step 5: Processing styles...\n');
  
  const products: ProductData[] = [];
  const colors: ColorData[] = [];
  const skus: SkuData[] = [];
  const categoryLinks: { style_id: number; category_id: number }[] = [];
  
  let styleId = nextStyleId;
  let processedCount = 0;
  
  for (const [styleNumber, styleRows] of styleGroups) {
    // Use first row for product-level data
    const firstRow = styleRows[0];
    
    // Skip if no valid data
    if (!firstRow.name) continue;
    
    // Detect categories from product name
    const detectedCategories = detectCategories(firstRow.name);
    
    // Get all unique colors for this style
    const colorMap = new Map<string, OttoCatalogRow>();
    styleRows.forEach(row => {
      if (row.color && !colorMap.has(row.color)) {
        colorMap.set(row.color, row);
      }
    });
    
    // Find lowest price
    let basePrice = Infinity;
    styleRows.forEach(row => {
      const price = row['1+'];
      if (price && price < basePrice) {
        basePrice = price;
      }
    });
    if (basePrice === Infinity) basePrice = 0;
    
    // Create product record
    const product: ProductData = {
      style_id: styleId,
      style_name: styleNumber,
      brand_id: null,
      brand_name: firstRow.brand || 'OTTO',
      title_raw: firstRow.name,
      description_raw: firstRow.plain_description || '',
      base_category: 'Headwear',
      product_type: 'Headwear > Caps',
      google_category_id: GOOGLE_CATEGORY_ID,
      google_category_name: GOOGLE_CATEGORY_NAME,
      primary_image_url: firstRow.image_main || firstRow.image_1 || '',
      material: firstRow.material_content || '',
      gender: 'Unisex',
      age_group: determineAgeGroup(firstRow.size),
      is_active: firstRow.status === 'Enable',
      color_count: colorMap.size,
      base_price: basePrice,
      supplier: 'otto_cap',
      supplier_style_id: styleNumber,
    };
    products.push(product);
    
    // Add category links
    detectedCategories.forEach(catId => {
      categoryLinks.push({ style_id: styleId, category_id: catId });
    });
    
    // Create color records
    for (const [colorField, colorRow] of colorMap) {
      const { code, name } = parseColor(colorField);
      const colorId = `${styleId}-${code}`;
      
      // Collect additional images
      const additionalImages: string[] = [];
      [colorRow.image_2, colorRow.image_3, colorRow.image_4, colorRow.image_5,
       colorRow.image_6, colorRow.image_7, colorRow.image_8, colorRow.image_9, colorRow.image_10]
        .filter(Boolean)
        .forEach(img => additionalImages.push(img));
      
      const color: ColorData = {
        id: colorId,
        style_id: styleId,
        color_name: name,
        color_code: code,
        color_family: deriveColorFamily(name),
        swatch_image: colorRow.image_main || colorRow.image_1 || '',
        front_image: colorRow.image_1 || colorRow.image_main || '',
        back_image: colorRow.image_2 || null,
        additional_images: additionalImages,
        supplier: 'otto_cap',
      };
      colors.push(color);
    }
    
    // Create SKU records
    styleRows.forEach(row => {
      if (!row.sku_no) return;
      
      const { code, name } = parseColor(row.color);
      const colorId = `${styleId}-${code}`;
      
      // Get inventory from inventory file if available
      const inv = inventoryMap.get(row.sku_no);
      const qty = inv?.instock || row.instock || row.qty || 0;
      
      const wholesalePrice = row['1+'] || 0;
      
      const sku: SkuData = {
        sku: row.sku_no,
        style_id: styleId,
        color_id: colorId,
        color_name: name,
        color_code: code,
        size_name: row.size || 'OSFM',
        cogs: wholesalePrice,
        retail_price: Math.round(wholesalePrice * RETAIL_MARKUP * 100) / 100,
        gtin: row.UPC || '',
        piece_weight: row.weight || 0,
        qty: qty,
        availability: qty > 0 ? 'in_stock' : 'out_of_stock',
        supplier: 'otto_cap',
        supplier_sku: row.sku_no,
      };
      skus.push(sku);
    });
    
    styleId++;
    processedCount++;
    
    if (processedCount % 50 === 0) {
      console.log(`  Processed ${processedCount} / ${styleGroups.size} styles...`);
    }
  }
  
  console.log(`\n  Total: ${products.length} products, ${colors.length} colors, ${skus.length} SKUs\n`);
  
  // Insert data into database
  console.log('Step 6: Inserting into database...\n');
  
  // Insert products
  console.log('  Inserting products...');
  const { error: productsError } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'style_id' });
  
  if (productsError) {
    console.error('  ERROR inserting products:', productsError);
    throw productsError;
  }
  console.log(`  ✓ Inserted ${products.length} products`);
  
  // Insert colors
  console.log('  Inserting colors...');
  const { error: colorsError } = await supabase
    .from('product_colors')
    .upsert(colors, { onConflict: 'id' });
  
  if (colorsError) {
    console.error('  ERROR inserting colors:', colorsError);
    throw colorsError;
  }
  console.log(`  ✓ Inserted ${colors.length} colors`);
  
  // Insert SKUs (in batches to avoid payload size limits)
  console.log('  Inserting SKUs (in batches)...');
  const BATCH_SIZE = 500;
  for (let i = 0; i < skus.length; i += BATCH_SIZE) {
    const batch = skus.slice(i, i + BATCH_SIZE);
    const { error: skusError } = await supabase
      .from('product_skus')
      .upsert(batch, { onConflict: 'sku' });
    
    if (skusError) {
      console.error(`  ERROR inserting SKUs batch ${i / BATCH_SIZE + 1}:`, skusError);
      throw skusError;
    }
    console.log(`  ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(skus.length / BATCH_SIZE)}`);
  }
  console.log(`  ✓ Inserted ${skus.length} SKUs total`);
  
  // Insert category links
  console.log('  Inserting category links...');
  const { error: catsError } = await supabase
    .from('product_categories')
    .upsert(categoryLinks, { onConflict: 'style_id,category_id' });
  
  if (catsError) {
    console.error('  ERROR inserting category links:', catsError);
    throw catsError;
  }
  console.log(`  ✓ Inserted ${categoryLinks.length} category links`);
  
  // Print category summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('Category distribution:');
  const catCounts = new Map<number, number>();
  categoryLinks.forEach(link => {
    catCounts.set(link.category_id, (catCounts.get(link.category_id) || 0) + 1);
  });
  
  const catNames: Record<number, string> = {
    [HEADWEAR_CATEGORY_ID]: 'Headwear',
    [BASEBALL_CAPS_ID]: 'Baseball Caps',
    [TRUCKER_HATS_ID]: 'Trucker Hats',
    [DAD_CAPS_ID]: 'Dad Caps',
    [SNAPBACKS_ID]: 'Snapbacks',
    [BEANIES_ID]: 'Beanies',
    [VISORS_ID]: 'Visors',
    [BUCKET_HATS_ID]: 'Bucket Hats',
    [FIVE_PANEL_ID]: '5-Panel',
    [SIX_PANEL_ID]: '6-Panel',
  };
  
  for (const [catId, count] of catCounts) {
    console.log(`  ${catNames[catId] || catId}: ${count} products`);
  }
  
  console.log('\nDone!');
}

// ============================================================================
// RUN
// ============================================================================

importOttoCatalog().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
