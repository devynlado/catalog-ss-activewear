/**
 * Catalog + PDP sample price for LA Apparel 1801GD (style 9001801).
 * Keeps listing cards, quick view, and product page aligned.
 */
export const LA_1801GD_PRODUCT_SLUG = 'los-angeles-apparel-1801gd' as const;
export const LA_1801GD_STYLE_ID = 9001801 as const;
export const LA_1801GD_SAMPLE_PRICE_USD = 26 as const;

export function isLa1801gdSamplePriceProduct(product: {
  slug: string;
  styleId: number;
}): boolean {
  return (
    product.slug === LA_1801GD_PRODUCT_SLUG ||
    product.styleId === LA_1801GD_STYLE_ID
  );
}
