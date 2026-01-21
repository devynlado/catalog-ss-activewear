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
export type AttributeGroup = 'weight' | 'fit' | 'sleeve' | 'collar' | 'material' | 'gender' | 'feature' | 'tag' | 'ply';

export interface ClassifiedCategory extends Category {
  type: CategoryType;
  attributeGroup?: AttributeGroup;
  parentId?: number;
}

// ============================================
// MAIN NAVIGATION CATEGORIES
// These are the top-level categories shown in header nav
// ============================================
export const MAIN_CATEGORIES: Record<number, { name: string; slug: string; order: number }> = {
  // Core apparel categories - IDs verified from SS Activewear API /categories/ endpoint
  21: { name: 'T-Shirts', slug: 't-shirts', order: 1 },  // Was incorrectly 1, fixed to 21
  9: { name: 'Fleece', slug: 'fleece', order: 2 },
  52: { name: 'Polos', slug: 'polos', order: 3 },
  15: { name: 'Outerwear', slug: 'outerwear', order: 4 },
  11: { name: 'Headwear', slug: 'headwear', order: 5 },
  384: { name: 'Bottoms', slug: 'bottoms', order: 6 },
  102: { name: 'Bags', slug: 'bags', order: 7 },
  53: { name: 'Accessories', slug: 'accessories', order: 8 },
};

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
  { pattern: /^(Hooded|Pockets?|Full-Zip|Half-Zip|Quarter-Zip|Pullover)$/i, type: 'attribute', attributeGroup: 'feature' },
  { pattern: /^(Tagless|Tear Away|Moisture.?Wicking|Anti-?Microbial|UV Protection)$/i, type: 'attribute', attributeGroup: 'tag' },
  
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
  };
  return names[group] || group;
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
