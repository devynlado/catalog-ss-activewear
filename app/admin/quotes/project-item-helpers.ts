/**
 * Shared helpers for rendering project-shape quote items on /admin/quotes
 * (both the list card and the detail page).
 *
 * Kept intentionally free of JSX so it's cheap to import from either
 * server or client components.
 *
 * The `SerializedProject` shape mirrors the payload written by
 * `serializeProject()` in /api/quote/submit. If that changes, this file
 * needs to change too — there is no automated schema binding.
 */

// -----------------------------------------------------------------------------
// Item shapes
// -----------------------------------------------------------------------------
export interface LegacyQuoteLineItem {
  type?: 'line' | undefined; // legacy items don't set `type`
  id?: string;
  styleName?: string;
  brandName?: string;
  colorName?: string;
  sizeName?: string;
  quantity?: number;
  unitPrice?: number;
  imageUrl?: string;
}

export interface QuoteProjectItem {
  type: 'project';
  index: number;
  blankSource: 'own' | 'catalog';
  blankOwnDescription: string | null;
  catalogCategory: string | null;
  catalogProduct: {
    styleId: number;
    styleName: string;
    brandName: string;
    slug: string;
    imageUrl?: string;
  } | null;
  decorationMethod: string;
  decorationLabel: string;
  quantityTier: string | null;
  estimatedQuantity: number;
  colors: number | null;
  locations: string[] | null;
  isDark: boolean;
  isFleece: boolean;
  stitchCount: string | null;
  numLocations: number | null;
  finishingQuantity: number | null;
  finishingServices: string[] | null;
  designNotes: string | null;
}

export type AnyQuoteItem = LegacyQuoteLineItem | QuoteProjectItem;

export function isProjectItem(item: AnyQuoteItem): item is QuoteProjectItem {
  return (item as QuoteProjectItem)?.type === 'project';
}

// A quote is a "project quote" iff every item in its `items` array is a
// project item. Mixed quotes should not normally happen (each row is
// created by exactly one flow), but if they do we treat them as legacy so
// the old renderer runs.
export function isProjectQuote(items: AnyQuoteItem[]): boolean {
  return items.length > 0 && items.every(isProjectItem);
}

// -----------------------------------------------------------------------------
// Human-readable label maps
// -----------------------------------------------------------------------------
export const LOCATION_LABELS: Record<string, string> = {
  front: 'Front',
  back: 'Back',
  'left-sleeve': 'Left Sleeve',
  'right-sleeve': 'Right Sleeve',
};

export const STITCH_LABELS: Record<string, string> = {
  under5k: 'Under 5,000 stitches',
  '5k-7.5k': '5,000 - 7,500 stitches',
  '7.5k-10k': '7,500 - 10,000 stitches',
  over10k: 'Over 10,000 stitches',
};

export const FINISHING_LABELS: Record<string, string> = {
  'fold-bag-shirts': 'Fold & Bag (Shirts)',
  'fold-bag-fleece': 'Fold & Bag (Fleece)',
  'hang-tags': 'Hang Tags',
  barcode: 'Barcode / UPC',
  'sewing-woven-labels': 'Sewn Woven Labels',
};

export const CATEGORY_LABELS: Record<string, string> = {
  tshirts: 'T-Shirts',
  sweatshirts: 'Sweatshirts',
  polos: 'Polos',
  headwear: 'Headwear',
  jackets: 'Jackets',
  bags: 'Bags',
  accessories: 'Accessories',
  unsure: 'Recommendation requested',
};

// -----------------------------------------------------------------------------
// Blank source summary — one-line, safe to render inline
// -----------------------------------------------------------------------------
export function blankSummary(p: QuoteProjectItem): string {
  if (p.blankSource === 'own') {
    return p.blankOwnDescription
      ? `Own blanks — ${p.blankOwnDescription}`
      : 'Customer supplies blanks';
  }
  if (p.catalogProduct) {
    return `Catalog: ${p.catalogProduct.brandName} ${p.catalogProduct.styleName}`;
  }
  if (p.catalogCategory) {
    return `Catalog category: ${CATEGORY_LABELS[p.catalogCategory] ?? p.catalogCategory}`;
  }
  return 'Catalog';
}

// -----------------------------------------------------------------------------
// Method-specific fact rows — same data used by the email templates so the
// admin UI and email stay in agreement.
// -----------------------------------------------------------------------------
export function projectFacts(p: QuoteProjectItem): Array<[string, string]> {
  const facts: Array<[string, string]> = [];

  if (p.decorationMethod === 'finishing') {
    facts.push(['Quantity', `${p.finishingQuantity ?? 0} pieces`]);
    facts.push([
      'Services',
      p.finishingServices?.length
        ? p.finishingServices.map((s) => FINISHING_LABELS[s] ?? s).join(', ')
        : '—',
    ]);
  } else {
    facts.push(['Quantity', p.quantityTier ? `${p.quantityTier} pieces` : '—']);
  }

  if (
    p.decorationMethod === 'screen-printing' ||
    p.decorationMethod === 'jumbo'
  ) {
    facts.push(['# Colors', String(p.colors ?? '—')]);
    facts.push([
      'Locations',
      p.locations?.length
        ? p.locations.map((l) => LOCATION_LABELS[l] ?? l).join(', ')
        : '—',
    ]);
    const flags: string[] = [];
    if (p.isDark) flags.push('Dark garment');
    if (p.isFleece) flags.push('Fleece');
    if (flags.length) facts.push(['Notes', flags.join(', ')]);
  } else if (p.decorationMethod === 'digital') {
    facts.push([
      'Locations',
      p.locations?.length
        ? p.locations.map((l) => LOCATION_LABELS[l] ?? l).join(', ')
        : '—',
    ]);
    if (p.isFleece) facts.push(['Notes', 'Fleece']);
  } else if (p.decorationMethod === 'embroidery') {
    facts.push([
      'Stitch count',
      STITCH_LABELS[p.stitchCount ?? ''] ?? p.stitchCount ?? '—',
    ]);
    facts.push(['# Locations', String(p.numLocations ?? '—')]);
  }

  return facts;
}

// -----------------------------------------------------------------------------
// Roll-up: sum of estimatedQuantity across projects (low-bound estimate
// suitable for a headline number).
// -----------------------------------------------------------------------------
export function totalEstimatedPieces(items: AnyQuoteItem[]): number {
  return items.reduce((sum, it) => {
    if (isProjectItem(it)) return sum + it.estimatedQuantity;
    return sum + ((it as LegacyQuoteLineItem).quantity ?? 0);
  }, 0);
}

// -----------------------------------------------------------------------------
// Compact "decoration methods summary" for the collapsed list row.
// -----------------------------------------------------------------------------
export function decorationMethodsSummary(items: QuoteProjectItem[]): string {
  const labels = Array.from(new Set(items.map((p) => p.decorationLabel)));
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} + ${labels[1]}`;
  return `${labels[0]} + ${labels.length - 1} more`;
}
