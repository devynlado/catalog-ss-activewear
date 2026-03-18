/**
 * Decoration (service) options for projects. Slug is stored; URL = /services/{slug}
 */
export const DECORATION_OPTIONS = [
  { title: 'Screen Printing', value: 'screen-printing' },
  { title: 'Embroidery', value: 'embroidery' },
  { title: 'Digital Screen Printing', value: 'digital-screen-printing' },
  { title: 'Puff Screen Printing', value: 'puff-screen-printing' },
  { title: 'Jumbo Screen Printing', value: 'jumbo-screen-printing' },
  { title: 'Simulated Process', value: 'simulated-process' },
  { title: 'Retail Finishing', value: 'retail-finishing' },
  { title: 'Rush Services', value: 'rush' },
  { title: 'Live Screen Printing', value: 'live-screen-printing' },
  { title: 'Large Orders', value: 'large-orders' },
] as const;

export type DecorationSlug = (typeof DECORATION_OPTIONS)[number]['value'];

/**
 * Normalize a decoration value that may be a legacy string or a new array
 * into a consistent string[]. Handles backward compat with old Sanity docs.
 */
export function normalizeDecorations(val: string | string[] | null | undefined): string[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export function getServiceUrl(slug: string): string {
  return `/services/${slug}`;
}

export function getDecorationTitle(slug: string): string {
  const found = DECORATION_OPTIONS.find((o) => o.value === slug);
  return found?.title ?? slug;
}

export function getDecorationTitles(slugs: string | string[] | null | undefined): string {
  return normalizeDecorations(slugs).map(getDecorationTitle).join(', ');
}
