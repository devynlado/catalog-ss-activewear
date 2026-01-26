/**
 * Google Merchant Center Feed Generator
 * 
 * Generates a CSV feed matching the structure from your existing Datafeed Watch feed.
 * Uses AI-style optimized titles (clean, keyword-rich, no pipe separators).
 * 
 * Pricing: customerPrice * 1.40 (40% markup)
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

// Generate AI-style optimized title
// Format: "Bulk {Brand} {ProductName}, {Color}, {Material}, {Size}"
function generateOptimizedTitle(
  brand: string,
  productName: string,
  color: string,
  size: string,
  material?: string
): string {
  const parts = ['Bulk', brand, productName];
  if (color) parts.push(color);
  if (material) parts.push(material);
  if (size) parts.push(size);
  
  return parts.join(', ').replace(/,\s*,/g, ',').replace(/,\s*$/, '');
}

// Generate clean description (prose style, not HTML)
function generateDescription(
  brand: string,
  productName: string,
  material?: string,
  weight?: string
): string {
  let desc = `The ${brand} ${productName} is a premium blank apparel option perfect for screen printing and embroidery.`;
  
  if (material) {
    desc += ` Made from ${material.toLowerCase()}, it offers excellent comfort and durability.`;
  }
  
  if (weight) {
    desc += ` At ${weight}, it provides the perfect balance of quality and value.`;
  }
  
  desc += ' Ideal for custom apparel projects, promotional wear, and branded merchandise.';
  
  return desc;
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

// CSV header row
export const GMC_CSV_HEADERS = [
  'id',
  'title',
  'description',
  'link',
  'image_link',
  'price',
  'condition',
  'availability',
  'brand',
  'gender',
  'age_group',
  'color',
  'item_group_id',
  'gtin',
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
  'google_product_category (name)',
];

export interface ProductVariant {
  sku: string;
  styleId: number;
  styleName: string;
  brandName: string;
  colorName: string;
  colorCode?: string;
  sizeName: string;
  customerPrice: number;
  gtin?: string;
  pieceWeight?: number;
  material?: string;
  colorSwatchImage?: string;
  styleImage?: string;
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
  brand: string;
  gender: string;
  age_group: string;
  color: string;
  item_group_id: string;
  gtin: string;
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
  'google_product_category (name)': string;
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
  
  // Generate optimized title
  const title = generateOptimizedTitle(
    variant.brandName,
    variant.styleName,
    variant.colorName,
    variant.sizeName,
    variant.material
  );
  
  // Generate description
  const description = generateDescription(
    variant.brandName,
    variant.styleName,
    variant.material,
    variant.pieceWeight ? `${variant.pieceWeight} oz` : undefined
  );
  
  return {
    id: variant.sku,
    title,
    description,
    link: `${baseUrl}/product/${variant.styleId}?color=${encodeURIComponent(variant.colorName)}&size=${encodeURIComponent(variant.sizeName)}`,
    image_link: variant.styleImage || '',
    price: `${salePrice.toFixed(2)} USD`,
    condition: 'new',
    availability: 'in_stock',
    brand: variant.brandName,
    gender: determineGender(category),
    age_group: determineAgeGroup(category),
    color: variant.colorName,
    item_group_id: String(variant.styleId),
    gtin: variant.gtin || '',
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
    custom_label_2: '',
    size_system: 'US',
    cost_of_goods_sold: `${costPrice.toFixed(2)} USD`,
    auto_pricing_min_price: `${minPrice.toFixed(2)} USD`,
    google_product_category: String(googleCategory.id),
    'google_product_category (name)': googleCategory.name,
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
