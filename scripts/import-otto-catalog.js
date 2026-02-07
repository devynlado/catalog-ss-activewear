/**
 * Otto Cap Catalog Import Script
 * 
 * Imports products from Otto Cap Excel files into the Supabase database.
 * 
 * Run with: node scripts/import-otto-catalog.js
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

// Helper to clean Otto Cap titles (remove redundant brand prefix)
function cleanOttoTitle(title) {
  if (!title) return '';
  return title.replace(/^OTTO CAP®\s*/i, '').trim();
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
 */
function detectCategories(name) {
  const lowerName = (name || '').toLowerCase();
  const categories = [HEADWEAR_CATEGORY_ID]; // Always include Headwear
  
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
function deriveColorFamily(colorName) {
  const lowerName = (colorName || '').toLowerCase();
  
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
 */
function parseColor(colorField) {
  if (!colorField) {
    return { code: 'UNK', name: 'Unknown' };
  }
  
  const parts = String(colorField).split(' - ');
  if (parts.length >= 2) {
    return {
      code: parts[0].trim(),
      name: parts.slice(1).join(' - ').trim(),
    };
  }
  
  return { code: String(colorField), name: String(colorField) };
}

/**
 * Determine age group from size field
 */
function determineAgeGroup(size) {
  if (!size) return 'Adult';
  const lowerSize = String(size).toLowerCase();
  if (lowerSize.includes('youth') || lowerSize.includes('young adult')) {
    return 'Kids';
  }
  return 'Adult';
}

// ============================================================================
// DATA LOADING
// ============================================================================

function loadExcelFile(filePath) {
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
  const catalogData = loadExcelFile(CATALOG_FILE);
  const inventoryData = loadExcelFile(INVENTORY_FILE);
  
  // Build inventory lookup map
  const inventoryMap = new Map();
  inventoryData.forEach(row => {
    if (row.sku_no) {
      inventoryMap.set(row.sku_no, row);
    }
  });
  console.log(`  Built inventory map with ${inventoryMap.size} entries\n`);
  
  // Filter to hats only
  console.log('Step 2: Filtering to hats only...\n');
  const hats = catalogData.filter(row => {
    const isHatType = row.type === 'Hats';
    const name = (row.name || '').toLowerCase();
    const hasCapInName = name.includes('cap') || 
                         name.includes('hat') ||
                         name.includes('beanie') ||
                         name.includes('visor');
    return isHatType || hasCapInName;
  });
  console.log(`  Found ${hats.length} hat SKUs\n`);
  
  // Group by style (sku_parent)
  console.log('Step 3: Grouping by style...\n');
  const styleGroups = new Map();
  hats.forEach(row => {
    if (!row.sku_parent) return;
    
    const existing = styleGroups.get(row.sku_parent) || [];
    existing.push(row);
    styleGroups.set(row.sku_parent, existing);
  });
  console.log(`  Found ${styleGroups.size} unique styles\n`);
  
  // Start style_id at 1000000 for Otto Cap
  console.log('Step 4: Starting style_id at 1000000...\n');
  let styleId = 1000000;
  
  // Process each style
  console.log('Step 5: Processing styles...\n');
  
  const products = [];
  const colors = [];
  const skus = [];
  const categoryLinks = [];
  
  let processedCount = 0;
  
  for (const [styleNumber, styleRows] of styleGroups) {
    const firstRow = styleRows[0];
    
    if (!firstRow.name) continue;
    
    // Detect categories from product name
    const detectedCategories = detectCategories(firstRow.name);
    
    // Get all unique colors for this style
    // ALWAYS read from the 'color' column directly (e.g., "501650 - Pnk/Wht/Pnk")
    const colorMap = new Map();
    styleRows.forEach(row => {
      // Skip parent rows (where sku_no equals sku_parent or has no parent)
      if (!row.sku_no || String(row.sku_no) === String(row.sku_parent) || !row.sku_parent) return;
      
      // Read color directly from the color column
      const colorValue = row.color ? String(row.color).trim() : 'Unknown';
      
      // Only store first row for each unique color value
      if (!colorMap.has(colorValue)) {
        colorMap.set(colorValue, row);
      }
    });
    
    // Find lowest price and best row for product-level image
    let basePrice = Infinity;
    let bestImageRow = firstRow;
    
    styleRows.forEach(row => {
      const price = row['1+'];
      if (price && price < basePrice) {
        basePrice = price;
      }
      // Find a row with a valid image URL (prefer image_1)
      if (!bestImageRow.image_1 || !String(bestImageRow.image_1).startsWith('http')) {
        if (row.image_1 && String(row.image_1).startsWith('http')) {
          bestImageRow = row;
        }
      }
    });
    if (basePrice === Infinity) basePrice = 0;
    
    // Get primary image from best available row
    const primaryImageUrl = (bestImageRow.image_1 && String(bestImageRow.image_1).startsWith('http'))
      ? bestImageRow.image_1
      : ((bestImageRow.image_main && String(bestImageRow.image_main).startsWith('http')) ? bestImageRow.image_main : '');
    
    // Create product record with slug
    const product = {
      style_id: styleId,
      style_name: String(styleNumber),
      slug: `otto-${String(styleNumber).toLowerCase()}`,
      brand_id: null,
      brand_name: firstRow.brand || 'OTTO',
      title_raw: cleanOttoTitle(firstRow.name),
      description_raw: firstRow.plain_description || '',
      base_category: 'Headwear',
      product_type: 'Headwear > Caps',
      google_category_id: GOOGLE_CATEGORY_ID,
      google_category_name: GOOGLE_CATEGORY_NAME,
      primary_image_url: primaryImageUrl,
      material: firstRow.material_content || '',
      gender: 'Unisex',
      age_group: determineAgeGroup(firstRow.size),
      is_active: firstRow.status === 'Enable',
      color_count: colorMap.size,
      base_price: basePrice,
      min_retail_price: Math.round(basePrice * RETAIL_MARKUP * 100) / 100,
      supplier: 'otto_cap',
      supplier_style_id: String(styleNumber),
    };
    products.push(product);
    
    // Add category links
    detectedCategories.forEach(catId => {
      categoryLinks.push({ style_id: styleId, category_id: catId });
    });
    
    // Helper to check if value is a valid URL
    const isUrl = (val) => val && String(val).startsWith('http');
    
    // Create color records - parse color value directly from the column
    for (const [colorValue, colorRow] of colorMap) {
      // Parse "501650 - Pnk/Wht/Pnk" format from the color column
      const colorParts = colorValue.split(' - ');
      const colorCode = colorParts[0].trim();
      const colorName = colorParts.length >= 2 
        ? colorParts.slice(1).join(' - ').trim() 
        : colorCode;
      
      const colorId = `${styleId}-${colorCode}`;
      
      // Collect additional images (image_4 through image_10)
      const additionalImages = [];
      [colorRow.image_4, colorRow.image_5, colorRow.image_6, colorRow.image_7, 
       colorRow.image_8, colorRow.image_9, colorRow.image_10]
        .filter(img => isUrl(img))
        .forEach(img => additionalImages.push(img));
      
      const color = {
        id: colorId,
        style_id: styleId,
        color_name: colorName,
        color_code: colorCode,
        color_family: deriveColorFamily(colorName),
        // Use image_1 for swatch/front
        swatch_image: isUrl(colorRow.image_1) ? colorRow.image_1 : '',
        front_image: isUrl(colorRow.image_1) ? colorRow.image_1 : '',
        back_image: isUrl(colorRow.image_2) ? colorRow.image_2 : null,
        side_image: isUrl(colorRow.image_3) ? colorRow.image_3 : null,
        additional_images: additionalImages,
        supplier: 'otto_cap',
      };
      colors.push(color);
    }
    
    // Build a map from color value to parsed code for SKU creation
    const colorValueToCode = new Map();
    for (const [colorValue] of colorMap) {
      const colorParts = colorValue.split(' - ');
      const colorCode = colorParts[0].trim();
      const colorName = colorParts.length >= 2 
        ? colorParts.slice(1).join(' - ').trim() 
        : colorCode;
      colorValueToCode.set(colorValue, { code: colorCode, name: colorName });
    }
    
    // Create SKU records
    styleRows.forEach(row => {
      if (!row.sku_no) return;
      
      // Skip parent-level rows (sku_no equals sku_parent or no parent)
      if (String(row.sku_no) === String(row.sku_parent) || !row.sku_parent) return;
      
      // Get color info from the color column
      const colorValue = row.color ? String(row.color).trim() : 'Unknown';
      const colorInfo = colorValueToCode.get(colorValue) || { code: 'UNK', name: colorValue };
      const colorId = `${styleId}-${colorInfo.code}`;
      
      // Get inventory from inventory file if available
      const inv = inventoryMap.get(String(row.sku_no));
      const qty = Number(inv?.instock) || Number(row.instock) || Number(row.qty) || 0;
      
      // Parse wholesale price - could be string or number
      let wholesalePrice = 0;
      if (row['1+']) {
        wholesalePrice = parseFloat(row['1+']) || 0;
      }
      
      // Parse weight
      let weight = 0;
      if (row.weight) {
        weight = parseFloat(row.weight) || 0;
      }
      
      // Size info is in the 'size' column, e.g., "OSFM - Adult" or "L/XL"
      const sizeRaw = row.size || 'OSFM';
      const sizeParts = String(sizeRaw).split(' - ');
      const sizeName = sizeParts[0].trim() || 'OSFM';
      
      const sku = {
        sku: String(row.sku_no),
        style_id: styleId,
        color_id: colorId,
        color_name: colorInfo.name,
        color_code: colorInfo.code,
        size_name: sizeName,
        cogs: wholesalePrice,
        retail_price: Math.round(wholesalePrice * RETAIL_MARKUP * 100) / 100,
        gtin: row.UPC ? String(row.UPC) : '',
        piece_weight: weight,
        qty: qty,
        availability: qty > 0 ? 'in_stock' : 'out_of_stock',
        supplier: 'otto_cap',
        supplier_sku: String(row.sku_no),
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
  
  // Insert SKUs (in batches)
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
  const catCounts = new Map();
  categoryLinks.forEach(link => {
    catCounts.set(link.category_id, (catCounts.get(link.category_id) || 0) + 1);
  });
  
  const catNames = {
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

// Run
importOttoCatalog().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
