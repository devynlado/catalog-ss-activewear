/**
 * Typesense Client and Schema Configuration
 * 
 * Provides instant faceted search for the product catalog with:
 * - Sub-50ms search responses
 * - Real-time facet counts
 * - Typo tolerance and relevance ranking
 */

import Typesense from 'typesense';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

// ============================================================================
// CLIENT CONFIGURATION
// ============================================================================

const TYPESENSE_HOST = process.env.TYPESENSE_HOST || '';
const TYPESENSE_PORT = parseInt(process.env.TYPESENSE_PORT || '443', 10);
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https';
const TYPESENSE_ADMIN_API_KEY = process.env.TYPESENSE_ADMIN_API_KEY || '';
const TYPESENSE_SEARCH_API_KEY = process.env.TYPESENSE_SEARCH_API_KEY || '';
const COLLECTION_PREFIX = process.env.TYPESENSE_COLLECTION_PREFIX || 'dev';

// Collection name with environment prefix
export const PRODUCTS_COLLECTION = `${COLLECTION_PREFIX}_products`;

// Admin client (for indexing/syncing)
let adminClient: Typesense.Client | null = null;

export function getTypesenseAdminClient(): Typesense.Client {
  if (!adminClient) {
    if (!TYPESENSE_HOST || !TYPESENSE_ADMIN_API_KEY) {
      throw new Error('Typesense admin credentials not configured');
    }
    
    adminClient = new Typesense.Client({
      nodes: [{
        host: TYPESENSE_HOST,
        port: TYPESENSE_PORT,
        protocol: TYPESENSE_PROTOCOL,
      }],
      apiKey: TYPESENSE_ADMIN_API_KEY,
      connectionTimeoutSeconds: 10,
      retryIntervalSeconds: 0.1,
      numRetries: 3,
    });
  }
  return adminClient;
}

// Search client (for querying - uses search-only API key)
let searchClient: Typesense.Client | null = null;

export function getTypesenseSearchClient(): Typesense.Client {
  if (!searchClient) {
    if (!TYPESENSE_HOST || !TYPESENSE_SEARCH_API_KEY) {
      throw new Error('Typesense search credentials not configured');
    }
    
    searchClient = new Typesense.Client({
      nodes: [{
        host: TYPESENSE_HOST,
        port: TYPESENSE_PORT,
        protocol: TYPESENSE_PROTOCOL,
      }],
      apiKey: TYPESENSE_SEARCH_API_KEY,
      connectionTimeoutSeconds: 5,
      retryIntervalSeconds: 0.1,
      numRetries: 2,
    });
  }
  return searchClient;
}

// Check if Typesense is configured
export function isTypesenseConfigured(): boolean {
  return !!(TYPESENSE_HOST && TYPESENSE_ADMIN_API_KEY && TYPESENSE_SEARCH_API_KEY);
}

// ============================================================================
// PRODUCT SCHEMA
// ============================================================================

/**
 * Product document structure for Typesense
 * Flattened from Supabase with extracted attributes
 */
export interface TypesenseProduct {
  id: string;                    // Primary key (style_id as string)
  style_id: number;              // SS Activewear style ID
  style_name: string;            // Style name (e.g., "5000")
  
  // Searchable text fields
  title: string;                 // Product title
  brand_name: string;            // Brand name (e.g., "Gildan")
  description: string;           // Product description
  
  // IDs for linking back to Supabase
  brand_id: number;              // Brand ID
  category_ids: number[];        // All category IDs (main + attributes)
  
  // Facetable fields
  base_category: string;         // Main category (T-Shirts, Hoodies, etc.)
  category_names: string[];      // All category names for display
  color_families: string[];      // Color families (Black, White, Red, etc.)
  materials: string[];           // Materials (Cotton, Polyester, etc.)
  weight_range: string;          // Weight bucket (Lightweight, Midweight, etc.)
  gender: string;                // Gender/Age (Unisex, Mens, Womens, Youth)
  sleeve_length: string;         // Sleeve length (Short, Long, Sleeveless)
  fit: string;                   // Fit type (Regular, Fitted, Relaxed)
  collar_style: string;          // Collar type (Crewneck, V-Neck, etc.)
  
  // Numeric fields
  base_price: number;            // Starting price
  color_count: number;           // Number of colors available
  
  // Boolean flags
  is_popular: boolean;           // Popular/featured product
  is_sustainable: boolean;       // Eco-friendly
  is_new: boolean;               // New arrival
  availability: string;          // Stock status (in_stock, low_stock, out_of_stock)
  
  // Ranking fields
  popular_tier: string;          // bestseller, staff-pick, streetwear, value, or empty
  popularity_score: number;      // Computed score for ranking
  
  // Display fields
  image_url: string;             // Primary product image
}

/**
 * Collection schema for products
 * Defines fields, facets, and default sorting
 */
export const productsSchema: CollectionCreateSchema = {
  name: PRODUCTS_COLLECTION,
  fields: [
    // Primary key
    { name: 'id', type: 'string' },
    { name: 'style_id', type: 'int32' },
    { name: 'style_name', type: 'string' },
    
    // Searchable text fields (with weights)
    { name: 'title', type: 'string' },
    { name: 'brand_name', type: 'string', facet: true },
    { name: 'description', type: 'string' },
    
    // IDs
    { name: 'brand_id', type: 'int32', facet: true },
    { name: 'category_ids', type: 'int32[]', facet: true },
    
    // Facetable string fields
    { name: 'base_category', type: 'string', facet: true },
    { name: 'category_names', type: 'string[]', facet: true },
    { name: 'color_families', type: 'string[]', facet: true },
    { name: 'materials', type: 'string[]', facet: true },
    { name: 'weight_range', type: 'string', facet: true },
    { name: 'gender', type: 'string', facet: true },
    { name: 'sleeve_length', type: 'string', facet: true },
    { name: 'fit', type: 'string', facet: true },
    { name: 'collar_style', type: 'string', facet: true },
    
    // Numeric fields
    { name: 'base_price', type: 'float', facet: true },
    { name: 'color_count', type: 'int32' },
    
    // Boolean flags
    { name: 'is_popular', type: 'bool', facet: true },
    { name: 'is_sustainable', type: 'bool', facet: true },
    { name: 'is_new', type: 'bool', facet: true },
    { name: 'availability', type: 'string', facet: true },
    
    // Ranking fields
    { name: 'popular_tier', type: 'string', facet: true },
    { name: 'popularity_score', type: 'int32' },
    
    // Display
    { name: 'image_url', type: 'string' },
  ],
  
  // Default sort by popularity score (higher = better)
  default_sorting_field: 'popularity_score',
  
  // Enable typo tolerance
  enable_nested_fields: false,
};

// ============================================================================
// SEARCH SYNONYMS
// ============================================================================

export const searchSynonyms = [
  { id: 'tshirt', synonyms: ['tee', 't-shirt', 'tshirt', 't shirt'] },
  { id: 'hoodie', synonyms: ['hoodie', 'hoody', 'sweatshirt', 'pullover'] },
  { id: 'crewneck', synonyms: ['crewneck', 'crew neck', 'crew-neck'] },
  { id: 'vneck', synonyms: ['vneck', 'v-neck', 'v neck'] },
  { id: 'longsleeve', synonyms: ['long sleeve', 'longsleeve', 'long-sleeve', 'ls'] },
  { id: 'shortsleeve', synonyms: ['short sleeve', 'shortsleeve', 'short-sleeve', 'ss'] },
  { id: 'polyester', synonyms: ['poly', 'polyester'] },
  { id: 'cotton', synonyms: ['cotton', '100% cotton', 'all cotton'] },
  { id: 'heavyweight', synonyms: ['heavyweight', 'heavy weight', 'heavy'] },
  { id: 'lightweight', synonyms: ['lightweight', 'light weight', 'light'] },
];

// ============================================================================
// FACET CONFIGURATION
// ============================================================================

/**
 * Facet field configuration
 * Defines which fields to return facet counts for and how to display them
 */
export const facetConfig = {
  // Main facets always shown
  brand_name: { label: 'Brand', multiSelect: true },
  base_category: { label: 'Category', multiSelect: false },
  color_families: { label: 'Color', multiSelect: true },
  
  // Attribute facets (shown based on category)
  materials: { label: 'Material', multiSelect: true },
  weight_range: { label: 'Weight', multiSelect: false },
  gender: { label: 'Gender/Age', multiSelect: false },
  sleeve_length: { label: 'Sleeve Length', multiSelect: false },
  fit: { label: 'Fit', multiSelect: false },
  collar_style: { label: 'Collar Style', multiSelect: false },
  
  // Boolean facets
  is_popular: { label: 'Featured', multiSelect: false },
  is_sustainable: { label: 'Sustainable', multiSelect: false },
  is_new: { label: 'New Arrivals', multiSelect: false },
  availability: { label: 'Availability', multiSelect: false },
};

// All facet fields to request
export const allFacetFields = Object.keys(facetConfig);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build filter string for Typesense query
 * Handles both single and multi-select filters
 */
export function buildFilterString(filters: Record<string, string | string[] | boolean | number>): string {
  const filterParts: string[] = [];
  
  for (const [field, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    
    if (typeof value === 'boolean') {
      filterParts.push(`${field}:=${value}`);
    } else if (typeof value === 'number') {
      filterParts.push(`${field}:=${value}`);
    } else if (Array.isArray(value) && value.length > 0) {
      // Multi-select: OR within the field
      const escaped = value.map(v => `\`${v}\``).join(',');
      filterParts.push(`${field}:[${escaped}]`);
    } else if (typeof value === 'string' && value) {
      filterParts.push(`${field}:=\`${value}\``);
    }
  }
  
  // AND between different fields
  return filterParts.join(' && ');
}

/**
 * Build price range filter
 */
export function buildPriceFilter(minPrice?: number, maxPrice?: number): string {
  if (minPrice !== undefined && maxPrice !== undefined) {
    return `base_price:[${minPrice}..${maxPrice}]`;
  } else if (minPrice !== undefined) {
    return `base_price:>=${minPrice}`;
  } else if (maxPrice !== undefined) {
    return `base_price:<=${maxPrice}`;
  }
  return '';
}

/**
 * Calculate popularity score for ranking
 * Higher score = ranked higher in results
 */
export function calculatePopularityScore(product: {
  is_popular?: boolean;
  popular_tier?: string;
  is_new?: boolean;
  color_count?: number;
  base_price?: number;
}): number {
  let score = 0;
  
  // Popular tier bonus (biggest impact)
  if (product.is_popular) {
    score += 10000;
    
    switch (product.popular_tier) {
      case 'bestseller': score += 4000; break;
      case 'staff-pick': score += 3000; break;
      case 'streetwear': score += 2000; break;
      case 'value': score += 1000; break;
    }
  }
  
  // New products get a boost
  if (product.is_new) {
    score += 500;
  }
  
  // More colors = more popular (capped at 500)
  score += Math.min((product.color_count || 0) * 10, 500);
  
  // Mid-range prices preferred (avoid very cheap or very expensive)
  const price = product.base_price || 0;
  if (price >= 8 && price <= 18) {
    score += 200; // Sweet spot
  } else if (price >= 5 && price <= 25) {
    score += 100; // Acceptable range
  }
  
  return score;
}

/**
 * Parse facet counts from Typesense response
 */
export interface FacetCount {
  value: string;
  count: number;
}

export interface FacetCounts {
  [field: string]: FacetCount[];
}

export function parseFacetCounts(facetCounts: Array<{
  field_name: string;
  counts: Array<{ value: string; count: number }>;
}>): FacetCounts {
  const result: FacetCounts = {};
  
  for (const facet of facetCounts) {
    result[facet.field_name] = facet.counts.map(c => ({
      value: c.value,
      count: c.count,
    }));
  }
  
  return result;
}
