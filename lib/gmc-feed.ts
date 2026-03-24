/**
 * Google Merchant Center Feed Generator
 * 
 * Generates a CSV feed for Google Merchant Center / Performance Max.
 * Titles: {Brand} {Model} {ProductName} | {Color} | Size {Size}
 * Descriptions: Value-focused (lowest prices, fast shipping, social proof)
 * Pricing: customerPrice * 1.40 (40% markup), auto_pricing_min at 12% markup
 */

import { POPULAR_PRODUCTS, ProductCategory } from './popular-products';

// Google Product Category mappings
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

// Product type mappings
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

// Gender mapping based on category/attributes
function determineGender(category: ProductCategory, attributes?: string[]): string {
  if (attributes?.includes('womens') || category === 'womens') return 'Female';
  if (attributes?.includes('mens')) return 'Male';
  return 'Unisex';
}

// Age group mapping
function determineAgeGroup(category: ProductCategory): string {
  if (category === 'youth') return 'Kids';
  return 'Adult';
}

// Generate variant-level title matching the website's SEO title format
// Format: "{Brand} {StyleNumber} {ProductName} - {Gender} | {Color} | {Size}"
function generateOptimizedTitle(
  brand: string,
  productName: string,
  color: string,
  size: string,
  styleNumber?: string,
  gender?: string,
): string {
  const nameIncludesModel = styleNumber && productName.toLowerCase().includes(styleNumber.toLowerCase());
  const productPart = nameIncludesModel
    ? `${brand} ${productName}`
    : styleNumber
      ? `${brand} ${styleNumber} ${productName}`
      : `${brand} ${productName}`;

  const genderLabel = gender || 'Unisex';

  return `${productPart} - ${genderLabel} | ${color} | ${size}`;
}

// Generate value-focused description (no decoration/printing language)
function generateDescription(
  brand: string,
  productName: string,
  color: string,
  styleNumber?: string,
  material?: string,
  weight?: string,
): string {
  const fullName = styleNumber ? `${brand} ${styleNumber} ${productName}` : `${brand} ${productName}`;
  let desc = `Shop the ${fullName} in ${color}.`;

  if (material && weight) {
    desc += ` ${material} at ${weight} for comfort and durability.`;
  } else if (material) {
    desc += ` Made from ${material.toLowerCase()} for comfort and durability.`;
  } else if (weight) {
    desc += ` ${weight} fabric for the perfect balance of quality and value.`;
  }

  desc += ' Lowest prices on name-brand blank apparel. Free shipping on orders over $500. In stock, ships same day. Trusted by 5,000+ businesses.';

  return desc;
}

// Determine price bucket for custom_label_2 (PMax bid segmentation)
function getPriceBucket(retailPrice: number): string {
  if (retailPrice < 5) return 'under-5';
  if (retailPrice < 10) return '5-to-10';
  if (retailPrice < 25) return '10-to-25';
  return '25-plus';
}

// Escape CSV field
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Validate GTIN format (8, 12, 13, or 14 digits, numeric only)
export function isValidGtin(gtin: string | undefined | null): boolean {
  if (!gtin || gtin.trim() === '') return false;
  const cleaned = gtin.trim();
  // Must be numeric and valid length (8, 12, 13, or 14 digits)
  return /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(cleaned);
}

// CSV header row
// GTIN included when valid; identifier_exists=false when GTIN is missing/invalid
export const GMC_CSV_HEADERS = [
  'id',
  'title',
  'description',
  'link',
  'image_link',
  'price',
  'condition',
  'availability',
  'quantity',
  'brand',
  'gender',
  'age_group',
  'color',
  'item_group_id',
  'gtin',
  'identifier_exists',
  'mpn',
  'product_type',
  'additional_image_link',
  'sale_price',
  'size',
  'material',
  'pattern',
  'shipping_weight',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'size_system',
  'cost_of_goods_sold',
  'auto_pricing_min_price',
  'google_product_category',
];

export interface ProductVariant {
  sku: string;
  styleId: number;
  styleName: string;
  styleNumber?: string;  // Model/style number (e.g., "5000", "3001")
  brandName: string;
  colorName: string;
  colorCode?: string;
  sizeName: string;
  customerPrice: number;
  gtin?: string;
  qty?: number;  // Inventory quantity from Supabase
  pieceWeight?: number;
  material?: string;
  colorSwatchImage?: string;
  styleImage?: string;
  gender?: string;  // Gender from Supabase (e.g., "Unisex", "Men", "Women")
  slug?: string;  // SEO-friendly URL slug (e.g., "bella-canvas-3413")
  descriptionOverride?: string;  // Product description from Supabase (description_raw)
}

/**
 * Generate a slug from brand and style name
 * Used as fallback if slug is not provided
 */
function generateSlug(brandName: string, styleName: string): string {
  return `${brandName}-${styleName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface GMCFeedRow {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  price: string;
  condition: string;
  availability: string;
  quantity: string;  // Inventory quantity (999 for in-stock wholesale, 0 for out-of-stock)
  brand: string;
  gender: string;
  age_group: string;
  color: string;
  item_group_id: string;
  gtin: string;
  identifier_exists: string;  // 'true' when GTIN is valid, 'false' otherwise
  mpn: string;
  product_type: string;
  additional_image_link: string;
  sale_price: string;
  size: string;
  material: string;
  pattern: string;
  shipping_weight: string;
  custom_label_0: string;
  custom_label_1: string;
  custom_label_2: string;
  size_system: string;
  cost_of_goods_sold: string;
  auto_pricing_min_price: string;
  google_product_category: string;
}

// Generate a feed row from a product variant
export function generateFeedRow(
  variant: ProductVariant,
  category: ProductCategory,
  tier: string,
  baseUrl: string
): GMCFeedRow {
  const googleCategory = GOOGLE_CATEGORY_MAP[category] || GOOGLE_CATEGORY_MAP['t-shirts'];
  const productType = PRODUCT_TYPE_MAP[category] || 'T-Shirts > Core T-Shirts';
  
  // Calculate prices
  // - cost_of_goods_sold: wholesale cost from SS Activewear
  // - price: 40% markup (retail price)
  // - auto_pricing_min_price: 12% markup (floor for Google's automated discounts)
  const costPrice = variant.customerPrice;
  const salePrice = Math.round(costPrice * 1.40 * 100) / 100;
  const minPrice = Math.round(costPrice * 1.12 * 100) / 100;
  
  const title = generateOptimizedTitle(
    variant.brandName,
    variant.styleName,
    variant.colorName,
    variant.sizeName,
    variant.styleNumber,
    variant.gender,
  );
  
  const description = variant.descriptionOverride || generateDescription(
    variant.brandName,
    variant.styleName,
    variant.colorName,
    variant.styleNumber,
    variant.material,
    variant.pieceWeight ? `${variant.pieceWeight} oz` : undefined,
  );
  
  // Check if GTIN is valid - if so, include it; otherwise use identifier_exists=false
  const hasValidGtin = isValidGtin(variant.gtin);
  
  // Use SEO-friendly slug URL (generate from brand/style if not provided)
  const productSlug = variant.slug || generateSlug(variant.brandName, variant.styleName);
  
  return {
    id: variant.sku,
    title,
    description,
    link: `${baseUrl}/product/${productSlug}?color=${encodeURIComponent(variant.colorName)}&size=${encodeURIComponent(variant.sizeName)}`,
    image_link: variant.styleImage || '',
    price: `${salePrice.toFixed(2)} USD`,
    condition: 'new',
    availability: 'in_stock',
    quantity: String(variant.qty || 999),  // Use actual qty or 999 for wholesale
    brand: variant.brandName,
    gender: determineGender(category),
    age_group: determineAgeGroup(category),
    color: variant.colorName,
    item_group_id: String(variant.styleId),
    gtin: hasValidGtin ? variant.gtin! : '',
    identifier_exists: hasValidGtin ? 'true' : 'false',
    mpn: variant.sku,
    product_type: productType,
    additional_image_link: '',
    sale_price: '',
    size: variant.sizeName,
    material: variant.material || '',
    pattern: '',
    shipping_weight: variant.pieceWeight ? `${variant.pieceWeight} lb` : '',
    custom_label_0: tier,  // bestseller, staff-pick, value, streetwear
    custom_label_1: category,
    custom_label_2: getPriceBucket(salePrice),  // under-5, 5-to-10, 10-to-25, 25-plus
    size_system: 'US',
    cost_of_goods_sold: `${costPrice.toFixed(2)} USD`,
    auto_pricing_min_price: `${minPrice.toFixed(2)} USD`,
    google_product_category: String(googleCategory.id),
  };
}

// Convert feed rows to CSV string
export function generateCSV(rows: GMCFeedRow[]): string {
  const headerRow = GMC_CSV_HEADERS.join(',');
  
  const dataRows = rows.map(row => {
    return GMC_CSV_HEADERS.map(header => {
      const key = header as keyof GMCFeedRow;
      return escapeCSV(row[key]);
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

// Get popular products config for feed generation
export function getPopularProductsConfig() {
  return POPULAR_PRODUCTS.map(p => ({
    styleNumber: p.styleNumber,
    brand: p.brand,
    name: p.name,
    tier: p.tier,
    category: p.category,
    attributes: p.attributes,
  }));
}
