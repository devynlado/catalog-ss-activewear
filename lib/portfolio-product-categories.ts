/**
 * Product categories for portfolio archive filter.
 * Uses MAIN_CATEGORIES (catalog) and POPULAR_PRODUCTS to map project "product used"
 * strings (e.g. "1801GD Los Angeles Apparel") to catalog categories (e.g. T-Shirts).
 */

import { MAIN_CATEGORIES } from './category-taxonomy';
import { POPULAR_PRODUCTS } from './popular-products';
import type { ProductCategory } from './popular-products';

/** Main category slug (catalog) for archive filter */
export type ArchiveProductCategorySlug =
  | 't-shirts'
  | 'sweatshirts'
  | 'polos'
  | 'jackets'
  | 'headwear'
  | 'bottoms'
  | 'bags'
  | 'accessories'
  | 'womens'
  | 'workwear';

/** Map popular-products category to main catalog slug */
const POPULAR_TO_MAIN: Record<ProductCategory, ArchiveProductCategorySlug> = {
  't-shirts': 't-shirts',
  'long-sleeve': 't-shirts',
  'tank-tops': 't-shirts',
  crewneck: 'sweatshirts',
  hoodies: 'sweatshirts',
  'zip-hoodies': 'sweatshirts',
  'quarter-zip': 'sweatshirts',
  polos: 'polos',
  performance: 't-shirts',
  headwear: 'headwear',
  outerwear: 'jackets',
  youth: 't-shirts',
  womens: 'womens',
};

export interface ArchiveProductCategory {
  slug: ArchiveProductCategorySlug;
  name: string;
}

/**
 * Categories to show in the archive "Product used" filter (from catalog MAIN_CATEGORIES).
 */
export function getArchiveProductCategories(): ArchiveProductCategory[] {
  return Object.entries(MAIN_CATEGORIES)
    .map(([_, { name, slug, order }]) => ({ slug: slug as ArchiveProductCategorySlug, name, order }))
    .sort((a, b) => a.order - b.order)
    .map(({ slug, name }) => ({ slug, name }));
}

/** Style numbers and brand names per main category for matching project.product */
let _identifiersBySlug: Record<string, string[]> | null = null;

function buildIdentifiersBySlug(): Record<string, string[]> {
  if (_identifiersBySlug) return _identifiersBySlug;
  const map: Record<string, Set<string>> = {};
  for (const main of Object.values(MAIN_CATEGORIES)) {
    map[main.slug] = new Set();
  }
  for (const p of POPULAR_PRODUCTS) {
    const mainSlug = POPULAR_TO_MAIN[p.category];
    if (!mainSlug || !map[mainSlug]) continue;
    map[mainSlug].add(p.styleNumber);
    map[mainSlug].add(p.brand);
  }
  _identifiersBySlug = {};
  for (const [slug, set] of Object.entries(map)) {
    _identifiersBySlug[slug] = Array.from(set).filter(Boolean);
  }
  return _identifiersBySlug;
}

/**
 * Returns product identifiers (style numbers, brand names) for the given main category slug.
 * Used to match project.product (e.g. "1801GD Los Angeles Apparel") to a category.
 */
export function getProductIdentifiersForCategory(slug: string): string[] {
  return buildIdentifiersBySlug()[slug] ?? [];
}

/**
 * Returns true if projectProduct (e.g. "1801GD Los Angeles Apparel") belongs to
 * any of the given main category slugs (e.g. ["t-shirts"]).
 */
export function projectProductMatchesCategories(
  projectProduct: string | null | undefined,
  categorySlugs: string[]
): boolean {
  if (!projectProduct?.trim() || categorySlugs.length === 0) return false;
  const lower = projectProduct.toLowerCase();
  for (const slug of categorySlugs) {
    const ids = getProductIdentifiersForCategory(slug);
    for (const id of ids) {
      if (id && lower.includes(id.toLowerCase())) return true;
    }
  }
  return false;
}
