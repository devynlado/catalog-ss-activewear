/**
 * Typesense Sync Script
 * 
 * Syncs product data from Supabase to Typesense for instant faceted search.
 * 
 * Usage:
 *   npx tsx scripts/sync-typesense.ts --full      # Full sync (recreate collection)
 *   npx tsx scripts/sync-typesense.ts             # Incremental sync (upsert only)
 */

// Load environment variables FIRST, before any other imports
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Now safe to import modules that read env vars
import { createClient } from '@supabase/supabase-js';
import Typesense from 'typesense';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BATCH_SIZE = 250; // Documents per batch
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Category attribute group mappings
const WEIGHT_RANGES: Record<string, string> = {
  '1-1.9 oz': 'Ultralight',
  '2-2.9 oz': 'Lightweight',
  '3-3.9 oz': 'Lightweight',
  '4-4.9 oz': 'Midweight',
  '5-5.9 oz': 'Midweight',
  '6-6.9 oz': 'Heavyweight',
  '7-7.9 oz': 'Heavyweight',
  '8-8.9 oz': 'Heavyweight',
  '9-9.9 oz': 'Super Heavy',
  '10-10.9 oz': 'Super Heavy',
  '11-11.9 oz': 'Super Heavy',
  '12-12.9 oz': 'Super Heavy',
  '13-13.9 oz': 'Super Heavy',
  '14 oz and over': 'Super Heavy',
};

const MATERIAL_KEYWORDS = [
  'Cotton', '100% Cotton', 'Polyester', 'Tri-Blend', 'CVC', 'Ringspun',
  'Organic', 'French Terry', 'Fleece', 'Jersey', 'Pique', 'Mesh',
  'Nylon', 'Spandex', 'Rayon', 'Modal', 'Bamboo',
];

const FIT_KEYWORDS = [
  'Fitted', 'Relaxed', 'Slim Fit', 'Regular Fit', 'Athletic Fit',
  'Flowy', 'Cropped', 'Oversized', 'Boxy', 'Tailored',
];

const SLEEVE_KEYWORDS = [
  'Short Sleeve', 'Long Sleeve', 'Sleeveless', '3/4 Sleeve', 'Cap Sleeve',
  'Short Sleeves', 'Long Sleeves', '3/4 Sleeves',
];

const COLLAR_KEYWORDS = [
  'Crewneck', 'V-Neck', 'Henley', 'Scoop Neck', 'Mock Neck',
  'Turtleneck', 'Polo Collar', 'Crew Neck',
];

const GENDER_KEYWORDS = [
  'Mens', 'Womens', 'Unisex', 'Youth', 'Kids', 'Infants', 'Toddler',
  'Girls', 'Boys', 'Men', 'Women',
];

// Main category ID to name mapping
const MAIN_CATEGORIES: Record<number, string> = {
  21: 'T-Shirts',
  9: 'Sweatshirts',
  52: 'Polos',
  15: 'Jackets',
  11: 'Headwear',
  384: 'Bottoms',
  102: 'Bags',
  53: 'Accessories',
  13: 'Womens',
  49: 'Workwear',
};

// ============================================================================
// TYPESENSE CONFIGURATION
// ============================================================================

const TYPESENSE_HOST = process.env.TYPESENSE_HOST || '';
const TYPESENSE_PORT = parseInt(process.env.TYPESENSE_PORT || '443', 10);
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https';
const TYPESENSE_ADMIN_API_KEY = process.env.TYPESENSE_ADMIN_API_KEY || '';
const COLLECTION_PREFIX = process.env.TYPESENSE_COLLECTION_PREFIX || 'dev';

const PRODUCTS_COLLECTION = `${COLLECTION_PREFIX}_products`;

// Schema for products collection
const productsSchema: CollectionCreateSchema = {
  name: PRODUCTS_COLLECTION,
  fields: [
    { name: 'id', type: 'string' },
    { name: 'style_id', type: 'int32' },
    { name: 'style_name', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'brand_name', type: 'string', facet: true },
    { name: 'description', type: 'string' },
    { name: 'brand_id', type: 'int32', facet: true },
    { name: 'category_ids', type: 'int32[]', facet: true },
    { name: 'base_category', type: 'string', facet: true },
    { name: 'category_names', type: 'string[]', facet: true },
    { name: 'color_families', type: 'string[]', facet: true },
    { name: 'materials', type: 'string[]', facet: true },
    { name: 'weight_range', type: 'string', facet: true },
    { name: 'gender', type: 'string', facet: true },
    { name: 'sleeve_length', type: 'string', facet: true },
    { name: 'fit', type: 'string', facet: true },
    { name: 'collar_style', type: 'string', facet: true },
    { name: 'base_price', type: 'float', facet: true },
    { name: 'color_count', type: 'int32' },
    { name: 'is_popular', type: 'bool', facet: true },
    { name: 'is_sustainable', type: 'bool', facet: true },
    { name: 'is_new', type: 'bool', facet: true },
    { name: 'availability', type: 'string', facet: true },
    { name: 'popular_tier', type: 'string', facet: true },
    { name: 'popularity_score', type: 'int32' },
    { name: 'image_url', type: 'string' },
  ],
  default_sorting_field: 'popularity_score',
  enable_nested_fields: false,
};

// Search synonyms
const searchSynonyms = [
  { id: 'tshirt', synonyms: ['tee', 't-shirt', 'tshirt', 't shirt'] },
  { id: 'hoodie', synonyms: ['hoodie', 'hoody', 'sweatshirt', 'pullover'] },
  { id: 'crewneck', synonyms: ['crewneck', 'crew neck', 'crew-neck'] },
  { id: 'vneck', synonyms: ['vneck', 'v-neck', 'v neck'] },
  { id: 'longsleeve', synonyms: ['long sleeve', 'longsleeve', 'long-sleeve', 'ls'] },
  { id: 'shortsleeve', synonyms: ['short sleeve', 'shortsleeve', 'short-sleeve', 'ss'] },
  { id: 'polyester', synonyms: ['poly', 'polyester'] },
];

// Product document interface
interface TypesenseProduct {
  id: string;
  style_id: number;
  style_name: string;
  title: string;
  brand_name: string;
  description: string;
  brand_id: number;
  category_ids: number[];
  base_category: string;
  category_names: string[];
  color_families: string[];
  materials: string[];
  weight_range: string;
  gender: string;
  sleeve_length: string;
  fit: string;
  collar_style: string;
  base_price: number;
  color_count: number;
  is_popular: boolean;
  is_sustainable: boolean;
  is_new: boolean;
  availability: string;
  popular_tier: string;
  popularity_score: number;
  image_url: string;
}

// Create Typesense client
function getTypesenseClient(): Typesense.Client {
  if (!TYPESENSE_HOST || !TYPESENSE_ADMIN_API_KEY) {
    throw new Error(`Typesense not configured. HOST=${TYPESENSE_HOST}, KEY=${TYPESENSE_ADMIN_API_KEY ? '[set]' : '[not set]'}`);
  }
  
  return new Typesense.Client({
    nodes: [{
      host: TYPESENSE_HOST,
      port: TYPESENSE_PORT,
      protocol: TYPESENSE_PROTOCOL,
    }],
    apiKey: TYPESENSE_ADMIN_API_KEY,
    connectionTimeoutSeconds: 30,
    retryIntervalSeconds: 0.5,
    numRetries: 3,
  });
}

// Calculate popularity score
function calculatePopularityScore(product: {
  is_popular?: boolean;
  popular_tier?: string;
  is_new?: boolean;
  color_count?: number;
  base_price?: number;
}): number {
  let score = 0;
  
  if (product.is_popular) {
    score += 10000;
    switch (product.popular_tier) {
      case 'bestseller': score += 4000; break;
      case 'staff-pick': score += 3000; break;
      case 'streetwear': score += 2000; break;
      case 'value': score += 1000; break;
    }
  }
  
  if (product.is_new) score += 500;
  score += Math.min((product.color_count || 0) * 10, 500);
  
  const price = product.base_price || 0;
  if (price >= 8 && price <= 18) score += 200;
  else if (price >= 5 && price <= 25) score += 100;
  
  return score;
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// ATTRIBUTE EXTRACTION
// ============================================================================

function extractAttribute(
  categoryNames: string[],
  keywords: string[],
  defaultValue: string = ''
): string {
  for (const name of categoryNames) {
    for (const keyword of keywords) {
      if (name.toLowerCase().includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
  }
  return defaultValue;
}

function extractMaterials(categoryNames: string[]): string[] {
  const materials: string[] = [];
  for (const name of categoryNames) {
    for (const keyword of MATERIAL_KEYWORDS) {
      if (name.toLowerCase().includes(keyword.toLowerCase()) && !materials.includes(keyword)) {
        materials.push(keyword);
      }
    }
  }
  return materials;
}

function extractWeightRange(categoryNames: string[]): string {
  for (const name of categoryNames) {
    // Check for oz patterns
    const ozMatch = name.match(/(\d+-?\d*\.?\d*\s*oz)/i);
    if (ozMatch) {
      const ozValue = ozMatch[1];
      return WEIGHT_RANGES[ozValue] || 'Midweight';
    }
    
    // Check for weight keywords
    if (name.toLowerCase().includes('heavyweight')) return 'Heavyweight';
    if (name.toLowerCase().includes('midweight')) return 'Midweight';
    if (name.toLowerCase().includes('lightweight')) return 'Lightweight';
  }
  return '';
}

function extractBaseCategory(categoryIds: number[]): string {
  for (const id of categoryIds) {
    if (MAIN_CATEGORIES[id]) {
      return MAIN_CATEGORIES[id];
    }
  }
  return 'Other';
}

function getAvailability(colorCount: number, hasColors: boolean): string {
  if (!hasColors || colorCount === 0) return 'out_of_stock';
  // For now, assume in_stock if we have colors
  // In a full implementation, we'd check actual inventory
  return 'in_stock';
}

// ============================================================================
// DATA FETCHING
// ============================================================================

interface ProductRow {
  style_id: number;
  style_name: string;
  brand_id: number;
  brand_name: string;
  title_raw: string;
  description_raw: string;
  base_price: number;
  color_count: number;
  is_popular: boolean;
  is_sustainable: boolean;
  is_new: boolean;
  popular_tier: string | null;
  primary_image_url: string;
  product_colors: Array<{
    color_family: string | null;
  }>;
}

interface CategoryRow {
  style_id: number;
  category: {
    id: number;
    name: string;
  };
}

async function fetchAllProducts(): Promise<ProductRow[]> {
  console.log('Fetching products from Supabase...');
  
  const allProducts: ProductRow[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        style_id,
        style_name,
        brand_id,
        brand_name,
        title_raw,
        description_raw,
        base_price,
        color_count,
        is_popular,
        is_sustainable,
        is_new,
        popular_tier,
        primary_image_url,
        product_colors (
          color_family
        )
      `)
      .eq('is_active', true)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
    
    if (!data || data.length === 0) break;
    
    allProducts.push(...(data as ProductRow[]));
    console.log(`  Fetched ${allProducts.length} products...`);
    
    if (data.length < pageSize) break;
    page++;
  }
  
  console.log(`  Total: ${allProducts.length} products`);
  return allProducts;
}

async function fetchProductCategories(): Promise<Map<number, CategoryRow['category'][]>> {
  console.log('Fetching product categories...');
  
  const categoryMap = new Map<number, CategoryRow['category'][]>();
  let page = 0;
  const pageSize = 5000;
  
  while (true) {
    const { data, error } = await supabase
      .from('product_categories')
      .select(`
        style_id,
        category:categories (
          id,
          name
        )
      `)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
    
    if (!data || data.length === 0) break;
    
    for (const row of data as unknown as CategoryRow[]) {
      if (!categoryMap.has(row.style_id)) {
        categoryMap.set(row.style_id, []);
      }
      if (row.category) {
        categoryMap.get(row.style_id)!.push(row.category);
      }
    }
    
    console.log(`  Processed ${(page + 1) * pageSize} category links...`);
    
    if (data.length < pageSize) break;
    page++;
  }
  
  console.log(`  Categories loaded for ${categoryMap.size} products`);
  return categoryMap;
}

// ============================================================================
// TRANSFORMATION
// ============================================================================

function transformProduct(
  product: ProductRow,
  categories: CategoryRow['category'][]
): TypesenseProduct {
  const categoryIds = categories.map(c => c.id);
  const categoryNames = categories.map(c => c.name);
  
  // Extract color families from product_colors
  const colorFamilies = [...new Set(
    (product.product_colors || [])
      .map(c => c.color_family)
      .filter((f): f is string => !!f)
  )];
  
  // Extract attributes from category names
  const materials = extractMaterials(categoryNames);
  const weightRange = extractWeightRange(categoryNames);
  const gender = extractAttribute(categoryNames, GENDER_KEYWORDS, 'Unisex');
  const sleeveLength = extractAttribute(categoryNames, SLEEVE_KEYWORDS, '');
  const fit = extractAttribute(categoryNames, FIT_KEYWORDS, '');
  const collarStyle = extractAttribute(categoryNames, COLLAR_KEYWORDS, '');
  
  // Get base category
  const baseCategory = extractBaseCategory(categoryIds);
  
  // Build the document
  const doc: TypesenseProduct = {
    id: String(product.style_id),
    style_id: product.style_id,
    style_name: product.style_name || '',
    
    title: product.title_raw || `${product.brand_name} ${product.style_name}`,
    brand_name: product.brand_name || '',
    description: product.description_raw || '',
    
    brand_id: product.brand_id || 0,
    category_ids: categoryIds,
    
    base_category: baseCategory,
    category_names: categoryNames,
    color_families: colorFamilies,
    materials: materials,
    weight_range: weightRange,
    gender: gender,
    sleeve_length: sleeveLength,
    fit: fit,
    collar_style: collarStyle,
    
    base_price: product.base_price || 0,
    color_count: product.color_count || 0,
    
    is_popular: product.is_popular || false,
    is_sustainable: product.is_sustainable || false,
    is_new: product.is_new || false,
    availability: getAvailability(product.color_count, colorFamilies.length > 0),
    
    popular_tier: product.popular_tier || '',
    popularity_score: calculatePopularityScore({
      is_popular: product.is_popular,
      popular_tier: product.popular_tier || undefined,
      is_new: product.is_new,
      color_count: product.color_count,
      base_price: product.base_price,
    }),
    
    image_url: product.primary_image_url || '',
  };
  
  return doc;
}

// ============================================================================
// TYPESENSE OPERATIONS
// ============================================================================

async function createCollection(client: ReturnType<typeof getTypesenseClient>) {
  console.log(`Creating collection: ${PRODUCTS_COLLECTION}`);
  
  // Delete existing collection if it exists
  try {
    await client.collections(PRODUCTS_COLLECTION).delete();
    console.log('  Deleted existing collection');
  } catch {
    console.log('  No existing collection to delete');
  }
  
  // Create new collection
  await client.collections().create(productsSchema);
  console.log('  Collection created');
  
  // Add synonyms
  console.log('  Adding search synonyms...');
  for (const synonym of searchSynonyms) {
    try {
      await client
        .collections(PRODUCTS_COLLECTION)
        .synonyms()
        .upsert(synonym.id, { synonyms: synonym.synonyms });
    } catch (err) {
      console.warn(`  Warning: Failed to add synonym ${synonym.id}:`, err);
    }
  }
  console.log('  Synonyms added');
}

async function indexProducts(
  client: ReturnType<typeof getTypesenseClient>,
  documents: TypesenseProduct[]
) {
  console.log(`Indexing ${documents.length} products...`);
  
  let indexed = 0;
  let errors = 0;
  
  // Process in batches
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    
    try {
      const results = await client
        .collections(PRODUCTS_COLLECTION)
        .documents()
        .import(batch, { action: 'upsert' });
      
      // Count successes and failures
      for (const result of results) {
        if (result.success) {
          indexed++;
        } else {
          errors++;
          if (errors <= 5) {
            console.error(`  Error indexing document:`, result.error);
          }
        }
      }
      
      console.log(`  Indexed ${indexed}/${documents.length} (${errors} errors)`);
    } catch (err) {
      console.error(`  Batch error:`, err);
      errors += batch.length;
    }
  }
  
  console.log(`\nIndexing complete: ${indexed} succeeded, ${errors} failed`);
  return { indexed, errors };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const fullSync = args.includes('--full');
  
  console.log('='.repeat(60));
  console.log('Typesense Product Sync');
  console.log('='.repeat(60));
  console.log(`Mode: ${fullSync ? 'Full sync (recreate collection)' : 'Incremental sync (upsert)'}`);
  console.log(`Collection: ${PRODUCTS_COLLECTION}`);
  console.log('');
  
  // Get Typesense client
  const client = getTypesenseClient();
  
  // Test connection
  console.log('Testing Typesense connection...');
  try {
    const health = await client.health.retrieve();
    console.log(`  Connected: ${health.ok ? 'OK' : 'Not OK'}`);
  } catch (err) {
    console.error('Failed to connect to Typesense:', err);
    process.exit(1);
  }
  
  // Create collection if full sync
  if (fullSync) {
    await createCollection(client);
  }
  
  // Fetch data from Supabase
  const products = await fetchAllProducts();
  const categoryMap = await fetchProductCategories();
  
  // Transform products
  console.log('\nTransforming products...');
  const documents: TypesenseProduct[] = [];
  
  for (const product of products) {
    const categories = categoryMap.get(product.style_id) || [];
    const doc = transformProduct(product, categories);
    documents.push(doc);
  }
  
  console.log(`  Transformed ${documents.length} products`);
  
  // Index to Typesense
  const { indexed, errors } = await indexProducts(client, documents);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Sync Complete');
  console.log('='.repeat(60));
  console.log(`Products synced: ${indexed}`);
  console.log(`Errors: ${errors}`);
  console.log(`Collection: ${PRODUCTS_COLLECTION}`);
  
  // Verify with a test search
  console.log('\nVerifying with test search...');
  try {
    const testResult = await client
      .collections(PRODUCTS_COLLECTION)
      .documents()
      .search({
        q: '*',
        query_by: 'title,brand_name',
        per_page: 1,
        facet_by: 'brand_name,base_category,color_families',
      });
    
    console.log(`  Total documents: ${testResult.found}`);
    console.log(`  Facets returned: ${testResult.facet_counts?.length || 0}`);
    
    if (testResult.facet_counts) {
      for (const facet of testResult.facet_counts) {
        console.log(`    ${facet.field_name}: ${facet.counts.length} values`);
      }
    }
  } catch (err) {
    console.error('Test search failed:', err);
  }
}

main().catch(console.error);
