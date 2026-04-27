/**
 * Catalog Routes Configuration
 * 
 * Maps SEO-friendly slugs to SS Activewear category IDs
 * Enables URLs like /catalog/t-shirts/hoodies instead of /catalog?category=21,36
 */

import { MAIN_CATEGORIES, SUB_CATEGORIES } from './category-taxonomy';

// ============================================
// TYPES
// ============================================
export interface CatalogRoute {
  slug: string;           // URL segment (e.g., "hoodies")
  name: string;           // Display name (e.g., "Hoodies")
  categoryIds: number[];  // SS Activewear category IDs [21, 36]
  parentSlug?: string;    // Parent route slug (e.g., "sweatshirts")
  isProductType: boolean; // true = standalone title, false = needs parent context
}

// ============================================
// CATALOG ROUTES
// Key format: "parent/child" for sub-routes, "parent" for main routes
// ============================================
export const CATALOG_ROUTES: Record<string, CatalogRoute> = {
  // ============================================
  // MAIN CATEGORY ROUTES
  // ============================================
  't-shirts': { 
    slug: 't-shirts', 
    name: 'T-Shirts', 
    categoryIds: [21], 
    isProductType: true 
  },
  'sweatshirts': { 
    slug: 'sweatshirts', 
    name: 'Sweatshirts', 
    categoryIds: [9], 
    isProductType: true 
  },
  'polos': { 
    slug: 'polos', 
    name: 'Polos', 
    categoryIds: [52], 
    isProductType: true 
  },
  'jackets': { 
    slug: 'jackets', 
    name: 'Jackets', 
    categoryIds: [15], 
    isProductType: true 
  },
  'headwear': { 
    slug: 'headwear', 
    name: 'Headwear', 
    categoryIds: [11], 
    isProductType: true 
  },
  'bottoms': { 
    slug: 'bottoms', 
    name: 'Bottoms', 
    categoryIds: [384], 
    isProductType: true 
  },
  'bags': { 
    slug: 'bags', 
    name: 'Bags', 
    categoryIds: [102], 
    isProductType: true 
  },
  'accessories': { 
    slug: 'accessories', 
    name: 'Accessories', 
    categoryIds: [53], 
    isProductType: true 
  },
  'womens': { 
    slug: 'womens', 
    name: 'Womens', 
    categoryIds: [13], 
    isProductType: true 
  },
  'workwear': { 
    slug: 'workwear', 
    name: 'Workwear', 
    categoryIds: [49], 
    isProductType: true 
  },

  // ============================================
  // T-SHIRTS SUB-ROUTES
  // ============================================
  // Product types (standalone titles)
  't-shirts/core-tshirts': { 
    slug: 'core-tshirts', 
    name: 'Core T-Shirts', 
    categoryIds: [21, 863], 
    parentSlug: 't-shirts', 
    isProductType: true 
  },
  't-shirts/fashion-tshirts': { 
    slug: 'fashion-tshirts', 
    name: 'Fashion T-Shirts', 
    categoryIds: [21, 864], 
    parentSlug: 't-shirts', 
    isProductType: true 
  },
  't-shirts/tank-tops': { 
    slug: 'tank-tops', 
    name: 'Tank Tops', 
    categoryIds: [21, 64], 
    parentSlug: 't-shirts', 
    isProductType: true 
  },
  // Attributes (need parent context: "Long Sleeve T-Shirts")
  't-shirts/short-sleeve': { 
    slug: 'short-sleeve', 
    name: 'Short Sleeve', 
    categoryIds: [21, 57], 
    parentSlug: 't-shirts', 
    isProductType: false 
  },
  't-shirts/long-sleeve': { 
    slug: 'long-sleeve', 
    name: 'Long Sleeve', 
    categoryIds: [21, 56], 
    parentSlug: 't-shirts', 
    isProductType: false 
  },
  't-shirts/sleeveless': { 
    slug: 'sleeveless', 
    name: 'Sleeveless', 
    categoryIds: [21, 63], 
    parentSlug: 't-shirts', 
    isProductType: false 
  },
  't-shirts/3-4-sleeve': { 
    slug: '3-4-sleeve', 
    name: '3/4 Sleeve', 
    categoryIds: [21, 81], 
    parentSlug: 't-shirts', 
    isProductType: false 
  },
  't-shirts/crewneck': { 
    slug: 'crewneck', 
    name: 'Crewneck', 
    categoryIds: [21, 8], 
    parentSlug: 't-shirts', 
    isProductType: false 
  },
  't-shirts/v-neck': { 
    slug: 'v-neck', 
    name: 'V-Neck', 
    categoryIds: [21, 66], 
    parentSlug: 't-shirts', 
    isProductType: false 
  },
  't-shirts/cotton': { 
    slug: 'cotton', 
    name: '100% Cotton', 
    categoryIds: [21, 71], 
    parentSlug: 't-shirts', 
    isProductType: false 
  },
  't-shirts/polyester': { 
    slug: 'polyester', 
    name: 'Polyester', 
    categoryIds: [21, 85], 
    parentSlug: 't-shirts', 
    isProductType: false 
  },
  't-shirts/tri-blend': { 
    slug: 'tri-blend', 
    name: 'Tri-Blend', 
    categoryIds: [21, 95], 
    parentSlug: 't-shirts', 
    isProductType: false 
  },
  't-shirts/performance': { 
    slug: 'performance', 
    name: 'Performance', 
    categoryIds: [21, 16], 
    parentSlug: 't-shirts', 
    isProductType: false 
  },

  // ============================================
  // SWEATSHIRTS SUB-ROUTES
  // ============================================
  // Product types (standalone titles)
  'sweatshirts/hoodies': { 
    slug: 'hoodies', 
    name: 'Hoodies', 
    categoryIds: [9, 36], 
    parentSlug: 'sweatshirts', 
    isProductType: true 
  },
  'sweatshirts/crewneck-sweatshirts': { 
    slug: 'crewneck-sweatshirts', 
    name: 'Crewneck Sweatshirts', 
    categoryIds: [9, 59], 
    parentSlug: 'sweatshirts', 
    isProductType: true 
  },
  'sweatshirts/pullover': { 
    slug: 'pullover', 
    name: 'Pullover Sweatshirts', 
    categoryIds: [9, 142], 
    parentSlug: 'sweatshirts', 
    isProductType: true 
  },
  // Attributes (need parent context)
  'sweatshirts/full-zip': { 
    slug: 'full-zip', 
    name: 'Full-Zip', 
    categoryIds: [9, 38], 
    parentSlug: 'sweatshirts', 
    isProductType: false 
  },
  'sweatshirts/quarter-zip': { 
    slug: 'quarter-zip', 
    name: 'Quarter-Zip', 
    categoryIds: [9, 48], 
    parentSlug: 'sweatshirts', 
    isProductType: false 
  },
  'sweatshirts/lightweight': { 
    slug: 'lightweight', 
    name: 'Lightweight', 
    categoryIds: [9, 181], 
    parentSlug: 'sweatshirts', 
    isProductType: false 
  },
  'sweatshirts/midweight': { 
    slug: 'midweight', 
    name: 'Midweight', 
    categoryIds: [9, 180], 
    parentSlug: 'sweatshirts', 
    isProductType: false 
  },
  'sweatshirts/heavyweight': { 
    slug: 'heavyweight', 
    name: 'Heavyweight', 
    categoryIds: [9, 179], 
    parentSlug: 'sweatshirts', 
    isProductType: false 
  },

  // ============================================
  // POLOS SUB-ROUTES
  // ============================================
  'polos/short-sleeve': { 
    slug: 'short-sleeve', 
    name: 'Short Sleeve', 
    categoryIds: [52, 57], 
    parentSlug: 'polos', 
    isProductType: false 
  },
  'polos/long-sleeve': { 
    slug: 'long-sleeve', 
    name: 'Long Sleeve', 
    categoryIds: [52, 56], 
    parentSlug: 'polos', 
    isProductType: false 
  },
  'polos/cotton': { 
    slug: 'cotton', 
    name: 'Cotton', 
    categoryIds: [52, 71], 
    parentSlug: 'polos', 
    isProductType: false 
  },
  'polos/performance': { 
    slug: 'performance', 
    name: 'Performance', 
    categoryIds: [52, 16], 
    parentSlug: 'polos', 
    isProductType: false 
  },
  'polos/pique': { 
    slug: 'pique', 
    name: 'Pique', 
    categoryIds: [52, 219], 
    parentSlug: 'polos', 
    isProductType: false 
  },

  // ============================================
  // JACKETS SUB-ROUTES
  // ============================================
  // Product types (standalone titles)
  'jackets/lightweight': { 
    slug: 'lightweight', 
    name: 'Lightweight Jackets', 
    categoryIds: [15, 665], 
    parentSlug: 'jackets', 
    isProductType: true 
  },
  'jackets/vests': { 
    slug: 'vests', 
    name: 'Vests', 
    categoryIds: [15, 62], 
    parentSlug: 'jackets', 
    isProductType: true 
  },
  'jackets/windbreakers': { 
    slug: 'windbreakers', 
    name: 'Windbreakers', 
    categoryIds: [15, 380], 
    parentSlug: 'jackets', 
    isProductType: true 
  },
  'jackets/soft-shell': { 
    slug: 'soft-shell', 
    name: 'Soft Shell Jackets', 
    categoryIds: [15, 403], 
    parentSlug: 'jackets', 
    isProductType: true 
  },
  'jackets/rain-coats': { 
    slug: 'rain-coats', 
    name: 'Rain Coats', 
    categoryIds: [15, 401], 
    parentSlug: 'jackets', 
    isProductType: true 
  },
  'jackets/puffer': { 
    slug: 'puffer', 
    name: 'Puffer Jackets', 
    categoryIds: [15, 141], 
    parentSlug: 'jackets', 
    isProductType: true 
  },
  'jackets/fleece': { 
    slug: 'fleece', 
    name: 'Fleece Jackets', 
    categoryIds: [15, 9], 
    parentSlug: 'jackets', 
    isProductType: true 
  },
  // Attributes
  'jackets/full-zip': { 
    slug: 'full-zip', 
    name: 'Full-Zip', 
    categoryIds: [15, 38], 
    parentSlug: 'jackets', 
    isProductType: false 
  },
  'jackets/quarter-zip': { 
    slug: 'quarter-zip', 
    name: 'Quarter-Zip', 
    categoryIds: [15, 48], 
    parentSlug: 'jackets', 
    isProductType: false 
  },
  'jackets/hooded': { 
    slug: 'hooded', 
    name: 'Hooded', 
    categoryIds: [15, 36], 
    parentSlug: 'jackets', 
    isProductType: false 
  },

  // ============================================
  // HEADWEAR SUB-ROUTES
  // ============================================
  // Product types (standalone titles)
  'headwear/trucker-hats': { 
    slug: 'trucker-hats', 
    name: 'Trucker Hats', 
    categoryIds: [11, 147], 
    parentSlug: 'headwear', 
    isProductType: true 
  },
  'headwear/dad-caps': { 
    slug: 'dad-caps', 
    name: 'Dad Caps', 
    categoryIds: [11, 796], 
    parentSlug: 'headwear', 
    isProductType: true 
  },
  'headwear/snapbacks': { 
    slug: 'snapbacks', 
    name: 'Snapbacks', 
    categoryIds: [11, 363], 
    parentSlug: 'headwear', 
    isProductType: true 
  },
  'headwear/fitted-caps': { 
    slug: 'fitted-caps', 
    name: 'Fitted Caps', 
    categoryIds: [11, 150], 
    parentSlug: 'headwear', 
    isProductType: true 
  },
  'headwear/bucket-hats': { 
    slug: 'bucket-hats', 
    name: 'Bucket Hats', 
    categoryIds: [11, 242], 
    parentSlug: 'headwear', 
    isProductType: true 
  },
  'headwear/beanies': { 
    slug: 'beanies', 
    name: 'Beanies', 
    categoryIds: [11, 120], 
    parentSlug: 'headwear', 
    isProductType: true 
  },
  'headwear/visors': { 
    slug: 'visors', 
    name: 'Visors', 
    categoryIds: [11, 241], 
    parentSlug: 'headwear', 
    isProductType: true 
  },
  'headwear/flat-bills': { 
    slug: 'flat-bills', 
    name: 'Flat Bills', 
    categoryIds: [11, 130], 
    parentSlug: 'headwear', 
    isProductType: true 
  },
  // Attributes (need parent context)
  'headwear/structured': { 
    slug: 'structured', 
    name: 'Structured', 
    categoryIds: [11, 244], 
    parentSlug: 'headwear', 
    isProductType: false 
  },
  'headwear/unstructured': { 
    slug: 'unstructured', 
    name: 'Unstructured', 
    categoryIds: [11, 245], 
    parentSlug: 'headwear', 
    isProductType: false 
  },
  'headwear/soft-structured': { 
    slug: 'soft-structured', 
    name: 'Soft-Structured', 
    categoryIds: [11, 658], 
    parentSlug: 'headwear', 
    isProductType: false 
  },
  'headwear/5-panel': { 
    slug: '5-panel', 
    name: '5-Panel', 
    categoryIds: [11, 238], 
    parentSlug: 'headwear', 
    isProductType: false 
  },
  'headwear/6-panel': { 
    slug: '6-panel', 
    name: '6-Panel', 
    categoryIds: [11, 239], 
    parentSlug: 'headwear', 
    isProductType: false 
  },
  'headwear/adjustable': { 
    slug: 'adjustable', 
    name: 'Adjustable', 
    categoryIds: [11, 118], 
    parentSlug: 'headwear', 
    isProductType: false 
  },
  'headwear/hook-and-loop': { 
    slug: 'hook-and-loop', 
    name: 'Hook and Loop', 
    categoryIds: [11, 360], 
    parentSlug: 'headwear', 
    isProductType: false 
  },

  // ============================================
  // BOTTOMS SUB-ROUTES
  // ============================================
  // Product types (standalone titles)
  'bottoms/shorts': { 
    slug: 'shorts', 
    name: 'Shorts', 
    categoryIds: [384, 43], 
    parentSlug: 'bottoms', 
    isProductType: true 
  },
  'bottoms/sweatpants': { 
    slug: 'sweatpants', 
    name: 'Sweatpants', 
    categoryIds: [384, 106], 
    parentSlug: 'bottoms', 
    isProductType: true 
  },
  'bottoms/leggings': { 
    slug: 'leggings', 
    name: 'Leggings', 
    categoryIds: [384, 133], 
    parentSlug: 'bottoms', 
    isProductType: true 
  },
  'bottoms/pants': { 
    slug: 'pants', 
    name: 'Pants', 
    categoryIds: [384, 37], 
    parentSlug: 'bottoms', 
    isProductType: true 
  },
  // Attributes (need parent context)
  'bottoms/mens-unisex': { 
    slug: 'mens-unisex', 
    name: 'Mens & Unisex', 
    categoryIds: [384, 87], 
    parentSlug: 'bottoms', 
    isProductType: false 
  },
  'bottoms/womens': { 
    slug: 'womens', 
    name: 'Womens', 
    categoryIds: [384, 13], 
    parentSlug: 'bottoms', 
    isProductType: false 
  },
  'bottoms/youth': { 
    slug: 'youth', 
    name: 'Youth', 
    categoryIds: [384, 28], 
    parentSlug: 'bottoms', 
    isProductType: false 
  },

  // ============================================
  // BAGS SUB-ROUTES
  // ============================================
  // All product types (standalone titles)
  'bags/backpacks': { 
    slug: 'backpacks', 
    name: 'Backpacks', 
    categoryIds: [102, 111], 
    parentSlug: 'bags', 
    isProductType: true 
  },
  'bags/tote-bags': { 
    slug: 'tote-bags', 
    name: 'Tote Bags', 
    categoryIds: [102, 186], 
    parentSlug: 'bags', 
    isProductType: true 
  },
  'bags/duffel-bags': { 
    slug: 'duffel-bags', 
    name: 'Duffel Bags', 
    categoryIds: [102, 129], 
    parentSlug: 'bags', 
    isProductType: true 
  },
  'bags/cooler-bags': { 
    slug: 'cooler-bags', 
    name: 'Cooler Bags', 
    categoryIds: [102, 125], 
    parentSlug: 'bags', 
    isProductType: true 
  },
  'bags/drawstring-bags': { 
    slug: 'drawstring-bags', 
    name: 'Drawstring Bags', 
    categoryIds: [102, 128], 
    parentSlug: 'bags', 
    isProductType: true 
  },
  'bags/messenger-bags': { 
    slug: 'messenger-bags', 
    name: 'Messenger Bags', 
    categoryIds: [102, 134], 
    parentSlug: 'bags', 
    isProductType: true 
  },

  // ============================================
  // ACCESSORIES SUB-ROUTES
  // ============================================
  // All product types (standalone titles)
  'accessories/scarves': { 
    slug: 'scarves', 
    name: 'Scarves', 
    categoryIds: [53, 144], 
    parentSlug: 'accessories', 
    isProductType: true 
  },
  'accessories/blankets': { 
    slug: 'blankets', 
    name: 'Blankets', 
    categoryIds: [53, 3], 
    parentSlug: 'accessories', 
    isProductType: true 
  },
  'accessories/towels': { 
    slug: 'towels', 
    name: 'Towels', 
    categoryIds: [53, 24], 
    parentSlug: 'accessories', 
    isProductType: true 
  },
  'accessories/aprons': { 
    slug: 'aprons', 
    name: 'Aprons', 
    categoryIds: [53, 1], 
    parentSlug: 'accessories', 
    isProductType: true 
  },
  'accessories/bandanas': { 
    slug: 'bandanas', 
    name: 'Bandanas', 
    categoryIds: [53, 398], 
    parentSlug: 'accessories', 
    isProductType: true 
  },
  'accessories/gloves': { 
    slug: 'gloves', 
    name: 'Gloves', 
    categoryIds: [53, 91], 
    parentSlug: 'accessories', 
    isProductType: true 
  },
  'accessories/socks': { 
    slug: 'socks', 
    name: 'Socks', 
    categoryIds: [53, 82], 
    parentSlug: 'accessories', 
    isProductType: true 
  },

  // ============================================
  // WOMENS SUB-ROUTES
  // ============================================
  'womens/t-shirts': { 
    slug: 't-shirts', 
    name: 'T-Shirts', 
    categoryIds: [13, 21], 
    parentSlug: 'womens', 
    isProductType: false 
  },
  'womens/tank-tops': { 
    slug: 'tank-tops', 
    name: 'Tank Tops', 
    categoryIds: [13, 64], 
    parentSlug: 'womens', 
    isProductType: true 
  },
  'womens/sweatshirts': { 
    slug: 'sweatshirts', 
    name: 'Sweatshirts', 
    categoryIds: [13, 9], 
    parentSlug: 'womens', 
    isProductType: false 
  },
  'womens/polos': { 
    slug: 'polos', 
    name: 'Polos', 
    categoryIds: [13, 52], 
    parentSlug: 'womens', 
    isProductType: false 
  },
  'womens/bottoms': { 
    slug: 'bottoms', 
    name: 'Bottoms', 
    categoryIds: [13, 384], 
    parentSlug: 'womens', 
    isProductType: false 
  },
  // Fit attributes
  'womens/fitted': { 
    slug: 'fitted', 
    name: 'Fitted', 
    categoryIds: [13, 150], 
    parentSlug: 'womens', 
    isProductType: false 
  },
  'womens/relaxed': { 
    slug: 'relaxed', 
    name: 'Relaxed', 
    categoryIds: [13, 157], 
    parentSlug: 'womens', 
    isProductType: false 
  },
  'womens/cropped': { 
    slug: 'cropped', 
    name: 'Cropped', 
    categoryIds: [13, 149], 
    parentSlug: 'womens', 
    isProductType: false 
  },
  'womens/flowy': { 
    slug: 'flowy', 
    name: 'Flowy', 
    categoryIds: [13, 98], 
    parentSlug: 'womens', 
    isProductType: false 
  },

  // ============================================
  // WORKWEAR SUB-ROUTES
  // ============================================
  // Product types (standalone titles)
  'workwear/safety-vests': { 
    slug: 'safety-vests', 
    name: 'Safety Vests', 
    categoryIds: [49, 62], 
    parentSlug: 'workwear', 
    isProductType: true 
  },
  'workwear/hi-vis': { 
    slug: 'hi-vis', 
    name: 'High Visibility', 
    categoryIds: [49, 107], 
    parentSlug: 'workwear', 
    isProductType: true 
  },
  'workwear/work-jackets': { 
    slug: 'work-jackets', 
    name: 'Work Jackets', 
    categoryIds: [49, 47], 
    parentSlug: 'workwear', 
    isProductType: true 
  },
  'workwear/work-pants': { 
    slug: 'work-pants', 
    name: 'Work Pants', 
    categoryIds: [49, 37], 
    parentSlug: 'workwear', 
    isProductType: true 
  },
  // Attributes
  'workwear/ansi-class-2': { 
    slug: 'ansi-class-2', 
    name: 'ANSI Class 2', 
    categoryIds: [49, 255], 
    parentSlug: 'workwear', 
    isProductType: false 
  },
  'workwear/ansi-class-3': { 
    slug: 'ansi-class-3', 
    name: 'ANSI Class 3', 
    categoryIds: [49, 256], 
    parentSlug: 'workwear', 
    isProductType: false 
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Resolve a slug path (e.g., ["t-shirts", "hoodies"]) to a CatalogRoute
 */
export function resolveSlugPath(slugs: string[]): CatalogRoute | null {
  if (!slugs || slugs.length === 0) {
    return null;
  }
  
  // Build the full path key
  const pathKey = slugs.join('/');
  
  // Try exact match first
  if (CATALOG_ROUTES[pathKey]) {
    return CATALOG_ROUTES[pathKey];
  }
  
  // Try just the first slug (main category)
  if (slugs.length === 1 && CATALOG_ROUTES[slugs[0]]) {
    return CATALOG_ROUTES[slugs[0]];
  }
  
  return null;
}

/**
 * Get the display title for a route using smart context logic
 * - Product types: Just the route name (e.g., "Hoodies")
 * - Attributes: "Attribute Parent" (e.g., "Cotton T-Shirts")
 */
export function getRouteTitle(route: CatalogRoute): string {
  if (route.isProductType || !route.parentSlug) {
    return route.name;
  }
  
  // Get parent route for context
  const parentRoute = CATALOG_ROUTES[route.parentSlug];
  if (parentRoute) {
    return `${route.name} ${parentRoute.name}`;
  }
  
  return route.name;
}

/**
 * Generate a catalog URL path from category IDs
 * Used for creating links from category ID filters
 */
export function getCatalogPath(categoryIds: number[]): string {
  if (!categoryIds || categoryIds.length === 0) {
    return '/catalog';
  }
  
  // Find a matching route by category IDs
  for (const [path, route] of Object.entries(CATALOG_ROUTES)) {
    // Check if category IDs match (order matters for exact match)
    if (
      route.categoryIds.length === categoryIds.length &&
      route.categoryIds.every((id, i) => id === categoryIds[i])
    ) {
      return `/catalog/${path}`;
    }
  }
  
  // No matching route - fall back to query params
  return `/catalog?category=${categoryIds.join(',')}`;
}

/**
 * Convert category ID string (e.g., "21,36") to catalog path
 */
export function categoryIdToPath(categoryParam: string | null): string {
  if (!categoryParam) {
    return '/catalog';
  }
  
  const ids = categoryParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
  return getCatalogPath(ids);
}

/**
 * Build a reverse lookup map from category IDs to route paths
 */
const categoryIdToRouteMap = new Map<string, string>();
for (const [path, route] of Object.entries(CATALOG_ROUTES)) {
  const key = route.categoryIds.join(',');
  categoryIdToRouteMap.set(key, path);
}

/**
 * Quick lookup: get route path from category ID string
 */
export function getRoutePathFromCategoryIds(categoryIds: string): string | null {
  return categoryIdToRouteMap.get(categoryIds) || null;
}

/**
 * Get all sub-routes for a parent category slug
 */
export function getSubRoutes(parentSlug: string): CatalogRoute[] {
  return Object.values(CATALOG_ROUTES).filter(route => route.parentSlug === parentSlug);
}

/**
 * Check if a path is a valid catalog route
 */
export function isValidCatalogRoute(slugs: string[]): boolean {
  return resolveSlugPath(slugs) !== null;
}
