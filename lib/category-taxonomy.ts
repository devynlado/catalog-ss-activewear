/**
 * Category Taxonomy System
 * 
 * SS Activewear returns 767+ "categories" that are actually a mix of:
 * - True product categories (T-Shirts, Headwear, Accessories)
 * - Product types/styles (Beanies, Bandanas, Polos)
 * - Attributes (Weight, Fit, Collar, Material)
 * - Marketing guides (2025 Fleece Guide, Lifestyle Guide)
 * 
 * This module classifies them for proper navigation and filtering.
 */

import { Category } from './types';

// Category types for classification
export type CategoryType = 'main' | 'subcategory' | 'attribute' | 'guide' | 'unknown';
export type AttributeGroup = 
  | 'weight' | 'fit' | 'sleeve' | 'collar' | 'material' 
  | 'gender' | 'feature' | 'tag' | 'ply'
  // New attribute groups from enhanced filtering plan:
  | 'treatment' | 'structure' | 'panel' | 'closure' 
  | 'pattern' | 'zipper' | 'sustainable' | 'style';

export interface ClassifiedCategory extends Category {
  type: CategoryType;
  attributeGroup?: AttributeGroup;
  parentId?: number;
}

// ============================================
// MAIN NAVIGATION CATEGORIES
// These are the top-level categories shown in header nav
// Updated per enhanced filtering plan:
// - Renamed "Fleece" to "Sweatshirts" (more user-friendly)
// - Renamed "Outerwear" to "Jackets" (more intuitive)
// - Added "Womens" as dedicated section
// - Added "Workwear" for safety vests, hi-vis, work jackets
// ============================================
export const MAIN_CATEGORIES: Record<number, { name: string; slug: string; order: number }> = {
  // Core apparel categories - IDs verified from SS Activewear API /categories/ endpoint
  21: { name: 'T-Shirts', slug: 't-shirts', order: 1 },
  9: { name: 'Sweatshirts', slug: 'sweatshirts', order: 2 },  // Renamed from Fleece (SS ID: 9 = Fleece)
  52: { name: 'Polos', slug: 'polos', order: 3 },
  15: { name: 'Jackets', slug: 'jackets', order: 4 },  // SS ID: 15 = Outerwear
  11: { name: 'Headwear', slug: 'headwear', order: 5 },
  384: { name: 'Bottoms', slug: 'bottoms', order: 6 },
  102: { name: 'Bags', slug: 'bags', order: 7 },
  53: { name: 'Accessories', slug: 'accessories', order: 8 },
  13: { name: 'Womens', slug: 'womens', order: 9 },  // SS ID: 13 = Womens
  49: { name: 'Workwear', slug: 'workwear', order: 10 },  // SS ID: 49 = Workwear
};

// ============================================
// SUB-CATEGORY NAMES
// Maps sub-category IDs to display names for page titles
// Used when URL has multiple category IDs (e.g., "11,150" = "Fitted Caps")
// 
// isProductType: true = standalone title (e.g., "Hoodies")
// isProductType: false = needs parent context (e.g., "Cotton T-Shirts")
// ============================================
export interface SubCategoryInfo {
  name: string;
  slug: string;
  parentId: number;
  isProductType: boolean; // true = "Hoodies", false = "Cotton T-Shirts"
}

export const SUB_CATEGORIES: Record<number, SubCategoryInfo> = {
  // ============================================
  // T-SHIRT SUB-CATEGORIES (parentId: 21)
  // ============================================
  // Product types (standalone titles)
  863: { name: 'Core T-Shirts', slug: 'core-tshirts', parentId: 21, isProductType: true },
  864: { name: 'Fashion T-Shirts', slug: 'fashion-tshirts', parentId: 21, isProductType: true },
  64: { name: 'Tank Tops', slug: 'tank-tops', parentId: 21, isProductType: true },
  // Attributes (need parent context)
  57: { name: 'Short Sleeve', slug: 'short-sleeve', parentId: 21, isProductType: false },
  56: { name: 'Long Sleeve', slug: 'long-sleeve', parentId: 21, isProductType: false },
  63: { name: 'Sleeveless', slug: 'sleeveless', parentId: 21, isProductType: false },
  81: { name: '3/4 Sleeve', slug: '3-4-sleeve', parentId: 21, isProductType: false },
  8: { name: 'Crewneck', slug: 'crewneck', parentId: 21, isProductType: false },
  66: { name: 'V-Neck', slug: 'v-neck', parentId: 21, isProductType: false },
  71: { name: '100% Cotton', slug: 'cotton', parentId: 21, isProductType: false },
  85: { name: 'Polyester', slug: 'polyester', parentId: 21, isProductType: false },
  95: { name: 'Tri-Blend', slug: 'tri-blend', parentId: 21, isProductType: false },
  16: { name: 'Performance', slug: 'performance', parentId: 21, isProductType: false },
  
  // ============================================
  // SWEATSHIRT/FLEECE SUB-CATEGORIES (parentId: 9)
  // ============================================
  // Product types (standalone titles)
  36: { name: 'Hoodies', slug: 'hoodies', parentId: 9, isProductType: true },
  59: { name: 'Crewneck Sweatshirts', slug: 'crewneck-sweatshirts', parentId: 9, isProductType: true },
  142: { name: 'Pullover Sweatshirts', slug: 'pullover', parentId: 9, isProductType: true },
  // Attributes (need parent context)
  38: { name: 'Full-Zip', slug: 'full-zip', parentId: 9, isProductType: false },
  48: { name: 'Quarter-Zip', slug: 'quarter-zip', parentId: 9, isProductType: false },
  
  // ============================================
  // JACKET/OUTERWEAR SUB-CATEGORIES (parentId: 15)
  // ============================================
  // Product types (standalone titles)
  665: { name: 'Lightweight Jackets', slug: 'lightweight', parentId: 15, isProductType: true },
  62: { name: 'Vests', slug: 'vests', parentId: 15, isProductType: true },
  380: { name: 'Windbreakers', slug: 'windbreakers', parentId: 15, isProductType: true },
  403: { name: 'Soft Shell Jackets', slug: 'soft-shell', parentId: 15, isProductType: true },
  401: { name: 'Rain Coats', slug: 'rain-coats', parentId: 15, isProductType: true },
  141: { name: 'Puffer Jackets', slug: 'puffer', parentId: 15, isProductType: true },
  47: { name: 'Jackets', slug: 'jackets-sub', parentId: 15, isProductType: true },
  
  // ============================================
  // HEADWEAR SUB-CATEGORIES (parentId: 11)
  // ============================================
  // Product types (standalone titles)
  147: { name: 'Trucker Hats', slug: 'trucker-hats', parentId: 11, isProductType: true },
  796: { name: 'Dad Caps', slug: 'dad-caps', parentId: 11, isProductType: true },
  363: { name: 'Snapbacks', slug: 'snapbacks', parentId: 11, isProductType: true },
  150: { name: 'Fitted Caps', slug: 'fitted-caps', parentId: 11, isProductType: true },
  242: { name: 'Bucket Hats', slug: 'bucket-hats', parentId: 11, isProductType: true },
  120: { name: 'Beanies', slug: 'beanies', parentId: 11, isProductType: true },
  241: { name: 'Visors', slug: 'visors', parentId: 11, isProductType: true },
  130: { name: 'Flat Bills', slug: 'flat-bills', parentId: 11, isProductType: true },
  // Attributes (need parent context)
  244: { name: 'Structured', slug: 'structured', parentId: 11, isProductType: false },
  245: { name: 'Unstructured', slug: 'unstructured', parentId: 11, isProductType: false },
  658: { name: 'Soft-Structured', slug: 'soft-structured', parentId: 11, isProductType: false },
  238: { name: '5-Panel', slug: '5-panel', parentId: 11, isProductType: false },
  239: { name: '6-Panel', slug: '6-panel', parentId: 11, isProductType: false },
  118: { name: 'Adjustable', slug: 'adjustable', parentId: 11, isProductType: false },
  360: { name: 'Hook and Loop', slug: 'hook-and-loop', parentId: 11, isProductType: false },
  
  // ============================================
  // BOTTOMS SUB-CATEGORIES (parentId: 384)
  // ============================================
  // Product types (standalone titles)
  43: { name: 'Shorts', slug: 'shorts', parentId: 384, isProductType: true },
  106: { name: 'Sweatpants', slug: 'sweatpants', parentId: 384, isProductType: true },
  133: { name: 'Leggings', slug: 'leggings', parentId: 384, isProductType: true },
  37: { name: 'Pants', slug: 'pants', parentId: 384, isProductType: true },
  
  // ============================================
  // BAGS SUB-CATEGORIES (parentId: 102)
  // ============================================
  // All product types (standalone titles)
  111: { name: 'Backpacks', slug: 'backpacks', parentId: 102, isProductType: true },
  186: { name: 'Tote Bags', slug: 'tote-bags', parentId: 102, isProductType: true },
  129: { name: 'Duffel Bags', slug: 'duffel-bags', parentId: 102, isProductType: true },
  128: { name: 'Drawstring Bags', slug: 'drawstring-bags', parentId: 102, isProductType: true },
  125: { name: 'Cooler Bags', slug: 'cooler-bags', parentId: 102, isProductType: true },
  134: { name: 'Messenger Bags', slug: 'messenger-bags', parentId: 102, isProductType: true },
  
  // ============================================
  // ACCESSORIES SUB-CATEGORIES (parentId: 53)
  // ============================================
  // All product types (standalone titles)
  144: { name: 'Scarves', slug: 'scarves', parentId: 53, isProductType: true },
  3: { name: 'Blankets', slug: 'blankets', parentId: 53, isProductType: true },
  24: { name: 'Towels', slug: 'towels', parentId: 53, isProductType: true },
  1: { name: 'Aprons', slug: 'aprons', parentId: 53, isProductType: true },
  398: { name: 'Bandanas', slug: 'bandanas', parentId: 53, isProductType: true },
  91: { name: 'Gloves', slug: 'gloves', parentId: 53, isProductType: true },
  82: { name: 'Socks', slug: 'socks', parentId: 53, isProductType: true },
  
  // ============================================
  // POLO SUB-CATEGORIES (parentId: 52)
  // ============================================
  219: { name: 'Pique', slug: 'pique', parentId: 52, isProductType: false },
  
  // ============================================
  // WOMENS SUB-CATEGORIES (parentId: 13)
  // ============================================
  // Attributes (need parent context)
  149: { name: 'Cropped', slug: 'cropped', parentId: 13, isProductType: false },
  98: { name: 'Flowy', slug: 'flowy', parentId: 13, isProductType: false },
  157: { name: 'Relaxed', slug: 'relaxed', parentId: 13, isProductType: false },
  
  // ============================================
  // WORKWEAR SUB-CATEGORIES (parentId: 49)
  // ============================================
  // Product types (standalone titles)
  107: { name: 'High Visibility', slug: 'hi-vis', parentId: 49, isProductType: true },
  // Attributes (need parent context)
  255: { name: 'ANSI Class 2', slug: 'ansi-class-2', parentId: 49, isProductType: false },
  256: { name: 'ANSI Class 3', slug: 'ansi-class-3', parentId: 49, isProductType: false },
  
  // ============================================
  // CROSS-CATEGORY ATTRIBUTES (parentId: 0 = applies to multiple)
  // ============================================
  // Weight attributes
  179: { name: 'Heavyweight', slug: 'heavyweight', parentId: 0, isProductType: false },
  180: { name: 'Midweight', slug: 'midweight', parentId: 0, isProductType: false },
  181: { name: 'Lightweight', slug: 'lightweight-weight', parentId: 0, isProductType: false },
  
  // Gender/Age attributes
  87: { name: 'Mens & Unisex', slug: 'mens-unisex', parentId: 0, isProductType: false },
  28: { name: 'Youth', slug: 'youth', parentId: 0, isProductType: false },
  148: { name: 'Adult', slug: 'adult', parentId: 0, isProductType: false },
  12: { name: 'Infants & Toddlers', slug: 'infants-toddlers', parentId: 0, isProductType: false },
  
  // Fit attributes
  688: { name: 'Oversized', slug: 'oversized', parentId: 0, isProductType: false },
  
  // Treatment attributes
  166: { name: 'Garment Dyed', slug: 'garment-dyed', parentId: 0, isProductType: false },
  17: { name: 'Pigment Dyed', slug: 'pigment-dyed', parentId: 0, isProductType: false },
  23: { name: 'Tie Dyed', slug: 'tie-dyed', parentId: 0, isProductType: false },
  161: { name: 'Acid Washed', slug: 'acid-washed', parentId: 0, isProductType: false },
  174: { name: 'Vintage Wash', slug: 'vintage-wash', parentId: 0, isProductType: false },
  
  // Material attributes
  96: { name: 'Ringspun', slug: 'ringspun', parentId: 0, isProductType: false },
  211: { name: 'French Terry', slug: 'french-terry', parentId: 0, isProductType: false },
  
  // Sustainable attributes
  218: { name: 'Organic', slug: 'organic', parentId: 0, isProductType: false },
  206: { name: 'Recycled', slug: 'recycled', parentId: 0, isProductType: false },
  364: { name: 'Sustainable Styles', slug: 'sustainable', parentId: 0, isProductType: false },
  41: { name: 'Eco-Friendly', slug: 'eco-friendly', parentId: 0, isProductType: false },
  
  // Feature attributes
  61: { name: 'Pockets', slug: 'pockets', parentId: 0, isProductType: false },
  146: { name: 'Thumbholes', slug: 'thumbholes', parentId: 0, isProductType: false },
  167: { name: 'Moisture-Management', slug: 'moisture-wicking', parentId: 0, isProductType: false },
  40: { name: 'Safety', slug: 'safety', parentId: 49, isProductType: false },
  42: { name: 'USA Made', slug: 'usa-made', parentId: 0, isProductType: false },
};

/**
 * Get the display name for a category URL parameter
 * Handles both single category IDs and comma-separated IDs
 * Returns the most specific category name available
 * 
 * Smart Context Logic:
 * - Product types (Hoodies, Tank Tops): Show name only
 * - Attributes (Cotton, Heavyweight): Show "Attribute Parent" (e.g., "Cotton T-Shirts")
 */
export function getCategoryDisplayName(categoryParam: string | null | undefined): { 
  name: string; 
  slug: string;
  isSubCategory: boolean;
} | null {
  if (!categoryParam) return null;
  
  // Parse all category IDs from the parameter
  const categoryIds = categoryParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
  
  if (categoryIds.length === 0) return null;
  
  // Find the main category (first ID or the one matching MAIN_CATEGORIES)
  let mainCategoryId: number | null = null;
  let subCategoryId: number | null = null;
  
  for (const id of categoryIds) {
    if (MAIN_CATEGORIES[id]) {
      mainCategoryId = id;
    } else if (SUB_CATEGORIES[id]) {
      subCategoryId = id;
    }
  }
  
  // If we have a sub-category, apply smart context logic
  if (subCategoryId !== null) {
    const subCat = SUB_CATEGORIES[subCategoryId];
    
    // If it's a product type, just show the sub-category name
    if (subCat.isProductType) {
      return {
        name: subCat.name,
        slug: subCat.slug,
        isSubCategory: true,
      };
    }
    
    // For attributes, combine with parent category name
    // Try to find parent from URL or from sub-category's parentId
    const parentId = mainCategoryId || subCat.parentId;
    if (parentId && MAIN_CATEGORIES[parentId]) {
      return {
        name: `${subCat.name} ${MAIN_CATEGORIES[parentId].name}`,
        slug: subCat.slug,
        isSubCategory: true,
      };
    }
    
    // Fallback: just show sub-category name
    return {
      name: subCat.name,
      slug: subCat.slug,
      isSubCategory: true,
    };
  }
  
  // Fall back to main category
  if (mainCategoryId && MAIN_CATEGORIES[mainCategoryId]) {
    return {
      name: MAIN_CATEGORIES[mainCategoryId].name,
      slug: MAIN_CATEGORIES[mainCategoryId].slug,
      isSubCategory: false,
    };
  }
  
  // Try the first ID as main category
  const firstId = categoryIds[0];
  if (MAIN_CATEGORIES[firstId]) {
    return {
      name: MAIN_CATEGORIES[firstId].name,
      slug: MAIN_CATEGORIES[firstId].slug,
      isSubCategory: false,
    };
  }
  
  return null;
}

// ============================================
// SMART DETECTION PATTERNS
// Used to auto-classify categories based on naming patterns
// ============================================
const DETECTION_PATTERNS: { pattern: RegExp; type: CategoryType; attributeGroup?: AttributeGroup }[] = [
  // Weight/thickness attributes (e.g., "10-10.9 oz", "14 oz and over")
  { pattern: /^\d+-?\d*\.?\d*\s*oz/i, type: 'attribute', attributeGroup: 'weight' },
  { pattern: /oz and over$/i, type: 'attribute', attributeGroup: 'weight' },
  
  // Ply attributes (e.g., "1-Ply", "2-Ply")
  { pattern: /^\d+-Ply$/i, type: 'attribute', attributeGroup: 'ply' },
  
  // Fit attributes (e.g., "Fitted", "Relaxed", "Slim Fit")
  { pattern: /^(Fitted|Relaxed|Slim Fit|Regular Fit|Athletic Fit|Flowy|Cropped|Oversized)$/i, type: 'attribute', attributeGroup: 'fit' },
  
  // Collar attributes (e.g., "Crewneck", "V-Neck", "Henley")
  { pattern: /^(Crewneck|V-Neck|Henley|Scoop Neck|Mock Neck|Turtleneck|Polo Collar)$/i, type: 'attribute', attributeGroup: 'collar' },
  
  // Sleeve attributes (e.g., "Short Sleeves", "Long Sleeves", "Sleeveless")
  { pattern: /^(Short Sleeves?|Long Sleeves?|Sleeveless|3\/4 Sleeves?|Cap Sleeves?)$/i, type: 'attribute', attributeGroup: 'sleeve' },
  
  // Material attributes (e.g., "100% Cotton", "Polyester", "Tri-Blend")
  { pattern: /^100% Cotton/i, type: 'attribute', attributeGroup: 'material' },
  { pattern: /^(Cotton|Polyester|Tri-Blend|CVC|Ringspun|Organic)/i, type: 'attribute', attributeGroup: 'material' },
  
  // Gender/age attributes
  { pattern: /^(Mens?|Womens?|Unisex|Youth|Kids?|Infants?|Toddler|Girls?|Boys?)$/i, type: 'attribute', attributeGroup: 'gender' },
  { pattern: /^(Mens? & Unisex|Infants? & Toddlers?)$/i, type: 'attribute', attributeGroup: 'gender' },
  
  // Feature attributes
  { pattern: /^(Hooded|Pockets?|Pullover|Thumbholes?)$/i, type: 'attribute', attributeGroup: 'feature' },
  { pattern: /^(Tagless|Tear Away|Moisture.?Wicking|Anti-?Microbial|UV Protection)$/i, type: 'attribute', attributeGroup: 'tag' },
  
  // ============================================
  // NEW ATTRIBUTE GROUPS (Enhanced Filtering Plan)
  // ============================================
  
  // Treatment attributes (Garment Dyed, Pigment Dyed, Acid Washed, etc.)
  { pattern: /^(Garment Dyed|Pigment Dyed|Acid Wash(ed)?|Tie Dye(d)?|Vintage Wash|Stone Wash(ed)?|Mineral Wash)$/i, type: 'attribute', attributeGroup: 'treatment' },
  
  // Structure (headwear) - Structured, Unstructured, Soft-Structured
  { pattern: /^(Structured|Unstructured|Soft[- ]?Structured|Low Profile|Mid Profile|High Profile)$/i, type: 'attribute', attributeGroup: 'structure' },
  
  // Panel count (headwear) - 5-Panel, 6-Panel
  { pattern: /^(Five[- ]?Panel|Six[- ]?Panel|5[- ]?Panel|6[- ]?Panel|7[- ]?Panel)$/i, type: 'attribute', attributeGroup: 'panel' },
  
  // Closure type (headwear) - Snapback, Adjustable, Fitted, Flexfit, Hook And Loop
  { pattern: /^(Snapback|Adjustable|Fitted|Flexfit|Hook And Loop|Velcro|Buckle|Strapback)$/i, type: 'attribute', attributeGroup: 'closure' },
  
  // Zipper styles - Full-Zip, Quarter-Zip, Half-Zip
  { pattern: /^(Full[- ]?Zips?|Quarter[- ]?Zips?|Half[- ]?Zips?|1\/4[- ]?Zips?)$/i, type: 'attribute', attributeGroup: 'zipper' },
  
  // Pattern/Print - Camouflage, Plaid, Stripes, Heather, etc.
  { pattern: /^(Camouflage|Camo|Plaid|Stripe[sd]?|Heather(ed)?|Textured|Burnout|Tie[- ]?Dye|Ombre|Leopard|Animal Print)$/i, type: 'attribute', attributeGroup: 'pattern' },
  { pattern: /^(Solid|Marled?|Speckled|Vintage|Mineral)$/i, type: 'attribute', attributeGroup: 'pattern' },
  
  // Sustainable/Eco-Friendly
  { pattern: /^(Organic|Recycled|Sustainable|Eco[- ]?Friendly|Eco)$/i, type: 'attribute', attributeGroup: 'sustainable' },
  { pattern: /Organic Cotton/i, type: 'attribute', attributeGroup: 'sustainable' },
  { pattern: /Recycled (Polyester|Materials?)/i, type: 'attribute', attributeGroup: 'sustainable' },
  
  // Style categories (Activewear, Workwear, Safety, etc.)
  { pattern: /^(Activewear|Athletic|Performance|Workwear|Safety|Hi[- ]?Vis|High Visibility|Industrial)$/i, type: 'attribute', attributeGroup: 'style' },
  { pattern: /^(Casual|Fashion|Streetwear|Vintage|Retro|Modern|Classic)$/i, type: 'attribute', attributeGroup: 'style' },
  
  // Marketing guides (hide these from main navigation)
  { pattern: /Guide/i, type: 'guide' },
  { pattern: /Playbook/i, type: 'guide' },
  { pattern: /^20\d{2}\s/i, type: 'guide' }, // Year-prefixed (e.g., "2025 Fleece")
  { pattern: /Lifestyle.*Market/i, type: 'guide' },
  { pattern: /What's New/i, type: 'guide' },
  { pattern: /^Sale\s?-/i, type: 'guide' },
  { pattern: /Silo\s/i, type: 'guide' }, // Silo categories are internal
];

// ============================================
// CONFIG OVERRIDES
// Manual overrides for categories that don't match patterns well
// Add entries here to force-classify specific category IDs
// ============================================
const CONFIG_OVERRIDES: Record<number, { type: CategoryType; attributeGroup?: AttributeGroup }> = {
  // Example overrides - add as needed
  // 123: { type: 'attribute', attributeGroup: 'material' },
};

/**
 * Classify a single category using smart detection + config overrides
 */
export function classifyCategory(category: Category): ClassifiedCategory {
  // Check config overrides first
  if (CONFIG_OVERRIDES[category.id]) {
    return {
      ...category,
      type: CONFIG_OVERRIDES[category.id].type,
      attributeGroup: CONFIG_OVERRIDES[category.id].attributeGroup,
    };
  }

  // Check if it's a main navigation category
  if (MAIN_CATEGORIES[category.id]) {
    return {
      ...category,
      name: MAIN_CATEGORIES[category.id].name, // Use our preferred name
      type: 'main',
    };
  }

  // Apply smart detection patterns
  for (const { pattern, type, attributeGroup } of DETECTION_PATTERNS) {
    if (pattern.test(category.name)) {
      return {
        ...category,
        type,
        attributeGroup,
      };
    }
  }

  // Default: treat as subcategory (can be used for filtering)
  return {
    ...category,
    type: 'subcategory',
  };
}

/**
 * Classify all categories and group them by type
 */
export function classifyAllCategories(categories: Category[]): {
  main: ClassifiedCategory[];
  subcategories: ClassifiedCategory[];
  attributes: Map<AttributeGroup, ClassifiedCategory[]>;
  guides: ClassifiedCategory[];
} {
  const main: ClassifiedCategory[] = [];
  const subcategories: ClassifiedCategory[] = [];
  const attributes = new Map<AttributeGroup, ClassifiedCategory[]>();
  const guides: ClassifiedCategory[] = [];

  for (const category of categories) {
    const classified = classifyCategory(category);

    switch (classified.type) {
      case 'main':
        main.push(classified);
        break;
      case 'subcategory':
        subcategories.push(classified);
        break;
      case 'attribute':
        if (classified.attributeGroup) {
          if (!attributes.has(classified.attributeGroup)) {
            attributes.set(classified.attributeGroup, []);
          }
          attributes.get(classified.attributeGroup)!.push(classified);
        }
        break;
      case 'guide':
        guides.push(classified);
        break;
    }
  }

  // Sort main categories by order
  main.sort((a, b) => {
    const orderA = MAIN_CATEGORIES[a.id]?.order ?? 999;
    const orderB = MAIN_CATEGORIES[b.id]?.order ?? 999;
    return orderA - orderB;
  });

  // Sort subcategories and attributes alphabetically
  subcategories.sort((a, b) => a.name.localeCompare(b.name));
  attributes.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));

  return { main, subcategories, attributes, guides };
}

/**
 * Get main navigation categories (for header)
 */
export function getMainCategories(): { id: number; name: string; slug: string; order: number }[] {
  return Object.entries(MAIN_CATEGORIES)
    .map(([id, data]) => ({
      id: parseInt(id, 10),
      ...data,
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Get display name for an attribute group
 */
export function getAttributeGroupName(group: AttributeGroup): string {
  const names: Record<AttributeGroup, string> = {
    weight: 'Weight',
    fit: 'Fit',
    sleeve: 'Sleeve Length',
    collar: 'Collar Style',
    material: 'Material',
    gender: 'Gender/Age',
    feature: 'Features',
    tag: 'Tags',
    ply: 'Ply',
    // New attribute groups (Enhanced Filtering Plan)
    treatment: 'Treatment',
    structure: 'Structure',
    panel: 'Panel Count',
    closure: 'Closure Type',
    pattern: 'Pattern',
    zipper: 'Zipper Style',
    sustainable: 'Sustainable',
    style: 'Style',
  };
  return names[group] || group;
}

/**
 * Get attribute groups that are specific to headwear categories
 * These should only be shown when Headwear is selected
 */
export function getHeadwearOnlyGroups(): AttributeGroup[] {
  return ['structure', 'panel', 'closure'];
}

/**
 * Get attribute groups that are specific to apparel (not headwear/accessories)
 * These should be hidden when Headwear, Bags, or Accessories are selected
 */
export function getApparelOnlyGroups(): AttributeGroup[] {
  return ['sleeve', 'collar', 'fit'];
}

/**
 * Check if an attribute group should be shown for a given category
 * @param group - The attribute group to check
 * @param categoryId - The selected category ID (or null for all products)
 */
export function shouldShowAttributeGroup(group: AttributeGroup, categoryId: number | null): boolean {
  const headwearOnlyGroups = getHeadwearOnlyGroups();
  const apparelOnlyGroups = getApparelOnlyGroups();
  
  // Headwear category ID
  const HEADWEAR_ID = 11;
  // Non-apparel category IDs (Bags, Accessories)
  const NON_APPAREL_IDS = [102, 53];
  
  // If no category selected, show all except headwear-specific groups
  if (categoryId === null) {
    return !headwearOnlyGroups.includes(group);
  }
  
  // Headwear-specific groups only shown for headwear
  if (headwearOnlyGroups.includes(group)) {
    return categoryId === HEADWEAR_ID;
  }
  
  // Apparel-specific groups hidden for headwear/bags/accessories
  if (apparelOnlyGroups.includes(group)) {
    return categoryId !== HEADWEAR_ID && !NON_APPAREL_IDS.includes(categoryId);
  }
  
  // All other groups shown for all categories
  return true;
}

/**
 * Find a category by ID from a list
 */
export function findCategoryById(categories: Category[], id: number): Category | undefined {
  return categories.find((c) => c.id === id);
}

/**
 * Find a category by ID and return its display name
 */
export function getCategoryName(categories: Category[], id: number): string {
  const category = findCategoryById(categories, id);
  if (!category) return `Category ${id}`;
  
  // Use our preferred name for main categories
  if (MAIN_CATEGORIES[id]) {
    return MAIN_CATEGORIES[id].name;
  }
  
  return category.name;
}

// ============================================
// SLUG <-> ID CONVERSION UTILITIES
// For URL handling: /catalog?category=t-shirts+cotton+short-sleeve
// ============================================

// Build slug-to-ID lookup map (computed once at module load)
const SLUG_TO_ID_MAP = new Map<string, number>();
const ID_TO_SLUG_MAP = new Map<number, string>();

// Populate from MAIN_CATEGORIES
for (const [idStr, data] of Object.entries(MAIN_CATEGORIES)) {
  const id = parseInt(idStr, 10);
  SLUG_TO_ID_MAP.set(data.slug, id);
  ID_TO_SLUG_MAP.set(id, data.slug);
}

// Populate from SUB_CATEGORIES
for (const [idStr, data] of Object.entries(SUB_CATEGORIES)) {
  const id = parseInt(idStr, 10);
  SLUG_TO_ID_MAP.set(data.slug, id);
  ID_TO_SLUG_MAP.set(id, data.slug);
}

/**
 * Convert a slug to category ID
 * @param slug - URL-friendly category name (e.g., "t-shirts", "short-sleeve", "cotton")
 * @returns Category ID or null if not found
 */
export function slugToId(slug: string): number | null {
  const normalized = slug.toLowerCase().trim();
  return SLUG_TO_ID_MAP.get(normalized) ?? null;
}

/**
 * Convert a category ID to slug
 * @param id - Category ID
 * @returns URL-friendly slug or null if not found
 */
export function idToSlug(id: number): string | null {
  return ID_TO_SLUG_MAP.get(id) ?? null;
}

/**
 * Convert array of slugs to array of IDs
 * Filters out any slugs that don't map to valid IDs
 */
export function slugsToIds(slugs: string[]): number[] {
  return slugs
    .map(slug => slugToId(slug))
    .filter((id): id is number => id !== null);
}

/**
 * Convert array of IDs to array of slugs
 * Filters out any IDs that don't map to valid slugs
 */
export function idsToSlugs(ids: number[]): string[] {
  return ids
    .map(id => idToSlug(id))
    .filter((slug): slug is string => slug !== null);
}

/**
 * Parse a category URL parameter into category IDs
 * Handles the format: "t-shirts+cotton+short-sleeve"
 * 
 * @param param - Category parameter string (e.g., "t-shirts+cotton+short-sleeve")
 * @returns Array of category IDs
 * 
 * @example
 * parseCategoryParam("t-shirts+cotton+short-sleeve")
 * // Returns [21, 71, 57]
 */
export function parseCategoryParam(param: string | null | undefined): number[] {
  if (!param) return [];
  
  // Split by + and convert each slug to ID
  const slugs = param.split('+').map(s => s.trim().toLowerCase()).filter(Boolean);
  return slugsToIds(slugs);
}

/**
 * Build a category URL parameter from category IDs
 * @param ids - Array of category IDs
 * @returns URL parameter string (e.g., "t-shirts+cotton+short-sleeve")
 * 
 * @example
 * buildCategoryParam([21, 71, 57])
 * // Returns "t-shirts+cotton+short-sleeve"
 */
export function buildCategoryParam(ids: number[]): string {
  return idsToSlugs(ids).join('+');
}

/**
 * Add a category to an existing URL parameter
 * Returns the new parameter string with the category added
 */
export function addCategoryToParam(currentParam: string | null, categoryId: number): string {
  const currentIds = parseCategoryParam(currentParam);
  if (!currentIds.includes(categoryId)) {
    currentIds.push(categoryId);
  }
  return buildCategoryParam(currentIds);
}

/**
 * Remove a category from an existing URL parameter
 * Returns the new parameter string with the category removed
 */
export function removeCategoryFromParam(currentParam: string | null, categoryId: number): string {
  const currentIds = parseCategoryParam(currentParam);
  const filteredIds = currentIds.filter(id => id !== categoryId);
  return buildCategoryParam(filteredIds);
}

/**
 * Toggle a category in an existing URL parameter
 * Adds if not present, removes if present
 */
export function toggleCategoryInParam(currentParam: string | null, categoryId: number): string {
  const currentIds = parseCategoryParam(currentParam);
  if (currentIds.includes(categoryId)) {
    return buildCategoryParam(currentIds.filter(id => id !== categoryId));
  } else {
    return buildCategoryParam([...currentIds, categoryId]);
  }
}

/**
 * Get the display name for a category param (for page titles, breadcrumbs)
 * Returns a formatted string like "Cotton Short Sleeve T-Shirts"
 */
export function getCategoryParamDisplayName(param: string | null | undefined): string {
  if (!param) return 'All Products';
  
  const ids = parseCategoryParam(param);
  if (ids.length === 0) return 'All Products';
  
  // Find main category and attributes
  let mainCategoryName: string | null = null;
  const attributeNames: string[] = [];
  
  for (const id of ids) {
    if (MAIN_CATEGORIES[id]) {
      mainCategoryName = MAIN_CATEGORIES[id].name;
    } else if (SUB_CATEGORIES[id]) {
      const sub = SUB_CATEGORIES[id];
      attributeNames.push(sub.name);
    }
  }
  
  // Build display name: "Cotton Short Sleeve T-Shirts"
  if (mainCategoryName) {
    if (attributeNames.length > 0) {
      return `${attributeNames.join(' ')} ${mainCategoryName}`;
    }
    return mainCategoryName;
  }
  
  // No main category, just attributes
  return attributeNames.join(' ') || 'Products';
}
