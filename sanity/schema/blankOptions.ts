/**
 * Blank (garment) category options for portfolio gallery items.
 * Slug is stored; kept in sync with catalog MAIN_CATEGORIES so filters
 * stay consistent with the rest of the site.
 */
export const BLANK_OPTIONS = [
  { title: 'T-Shirts', value: 't-shirts' },
  { title: 'Sweatshirts', value: 'sweatshirts' },
  { title: 'Polos', value: 'polos' },
  { title: 'Jackets', value: 'jackets' },
  { title: 'Headwear', value: 'headwear' },
  { title: 'Bottoms', value: 'bottoms' },
  { title: 'Bags', value: 'bags' },
  { title: 'Accessories', value: 'accessories' },
  { title: 'Womens', value: 'womens' },
  { title: 'Workwear', value: 'workwear' },
] as const;

export type BlankSlug = (typeof BLANK_OPTIONS)[number]['value'];

export function getBlankTitle(slug: string | null | undefined): string {
  if (!slug) return '';
  const found = BLANK_OPTIONS.find((o) => o.value === slug);
  return found?.title ?? slug;
}
