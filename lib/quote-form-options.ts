/**
 * Shared UI options for the /quote form and /pricing calculator.
 *
 * Both pages must present the same option lists (tier keys, stitch counts,
 * locations, finishing services, decoration methods) or the sales team will
 * receive quote requests using keys the pricing tables don't understand.
 * Consolidating them here means adding a new tier or renaming an option is
 * a single-file change.
 *
 * Pricing math still lives in `lib/pricing-utils.ts`. This file is UI-only.
 */

import type { PrintLocation, StitchCount } from './pricing-utils';

// ---------------------------------------------------------------------------
// Quantity tier keys
// ---------------------------------------------------------------------------
// These strings are used as keys in `screenPrintPricing`, `jumboPricing`,
// `digitalPricing`, and `embroideryPricing` in pricing-utils.ts. Keeping the
// arrays here and the tables there means adding a tier requires touching
// both files (intentional — pricing changes should be reviewed).

export const QUANTITY_TIERS = [
  '50-74',
  '75-99',
  '100-249',
  '250-499',
  '500-999',
  '1000-2499',
  '2500-5000',
] as const;

export type QuantityTier = (typeof QUANTITY_TIERS)[number];

// Embroidery uses a slightly different low-end bucket ("50-99") because
// setup cost dominates at very low volumes and the price table collapses
// the two lowest screen-print tiers into one.
export const EMBROIDERY_QUANTITY_TIERS = [
  '50-99',
  '100-249',
  '250-499',
  '500-999',
  '1000-2499',
  '2500-5000',
] as const;

export type EmbroideryQuantityTier = (typeof EMBROIDERY_QUANTITY_TIERS)[number];

// ---------------------------------------------------------------------------
// Color count (screen + jumbo)
// ---------------------------------------------------------------------------
export const COLOR_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

// ---------------------------------------------------------------------------
// Print / embroidery locations
// ---------------------------------------------------------------------------
export const LOCATION_OPTIONS: { id: PrintLocation; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left-sleeve', label: 'Left Sleeve' },
  { id: 'right-sleeve', label: 'Right Sleeve' },
];

// ---------------------------------------------------------------------------
// Embroidery stitch count
// ---------------------------------------------------------------------------
// `value` is the numeric index used by `embroideryPricing` (0..3). `id`
// mirrors the string form used by /quote's decoration state.
export interface StitchCountOption {
  id: StitchCount;
  value: number;
  label: string;
  desc: string;
}

export const STITCH_COUNT_OPTIONS: StitchCountOption[] = [
  { id: 'under5k',   value: 0, label: 'Under 5,000 stitches',    desc: 'Small logo (2-3")' },
  { id: '5k-7.5k',   value: 1, label: '5,000 - 7,500 stitches',  desc: 'Medium logo (3-4")' },
  { id: '7.5k-10k',  value: 2, label: '7,500 - 10,000 stitches', desc: 'Large logo (4-5")' },
  { id: 'over10k',   value: 3, label: 'Over 10,000 stitches',    desc: 'XL logo (5"+)' },
];

// ---------------------------------------------------------------------------
// Finishing services
// ---------------------------------------------------------------------------
export interface FinishingOption {
  id: string;
  label: string;
  priceLabel: string;
}

export const FINISHING_OPTIONS: FinishingOption[] = [
  { id: 'fold-bag-shirts',     label: 'Fold & Bag (Shirts)',    priceLabel: '$0.85-1.00' },
  { id: 'fold-bag-fleece',     label: 'Fold & Bag (Fleece)',    priceLabel: '$1.35-1.50' },
  { id: 'hang-tags',           label: 'Hang Tags',              priceLabel: '$0.35-0.50' },
  { id: 'barcode',             label: 'Barcode / UPC',          priceLabel: '$0.19-0.25' },
  { id: 'sewing-woven-labels', label: 'Sewn Woven Labels',      priceLabel: '$1.80-2.00' },
];

// ---------------------------------------------------------------------------
// Decoration methods (the top-level chooser)
// ---------------------------------------------------------------------------
// `id` doubles as the tab key used by `PricingCalculator` and as the
// serialized `decorationType` shipped to /api/quote/submit. Renaming an id
// here is a coordinated change across both callers plus the admin renderer.
export type QuoteDecorationMethod =
  | 'screen-printing'
  | 'embroidery'
  | 'digital'
  | 'jumbo'
  | 'finishing';

export interface DecorationMethodOption {
  id: QuoteDecorationMethod;
  name: string;
  shortName: string;
  description: string;
}

export const DECORATION_METHOD_OPTIONS: DecorationMethodOption[] = [
  {
    id: 'screen-printing',
    name: 'Screen Printing',
    shortName: 'Screen Print',
    description: 'Standard prints, 1-8 spot colors',
  },
  {
    id: 'embroidery',
    name: 'Embroidery',
    shortName: 'Embroidery',
    description: 'Professional stitched logos',
  },
  {
    id: 'digital',
    name: 'Digital Screen Printing',
    shortName: 'Digital',
    description: 'Full color, photo-quality',
  },
  {
    id: 'jumbo',
    name: 'Jumbo Print',
    shortName: 'Jumbo',
    description: 'Oversized prints up to 17" x 23"',
  },
  {
    id: 'finishing',
    name: 'Finishing',
    shortName: 'Finishing',
    description: 'Fold & bag, tags, labels',
  },
];

// ---------------------------------------------------------------------------
// Blank product source (the two-way branch at the top of each project block)
// ---------------------------------------------------------------------------
export type BlankSource = 'own' | 'catalog';

export const BLANK_SOURCE_OPTIONS: {
  id: BlankSource;
  label: string;
  description: string;
}[] = [
  {
    id: 'own',
    label: 'I already have blanks',
    description: "You'll supply the garments — we just decorate them",
  },
  {
    id: 'catalog',
    label: 'Choose from Garment Decor catalog',
    description: 'Pick a category or search a specific style',
  },
];

// ---------------------------------------------------------------------------
// Catalog category chips (for the "choose from catalog" branch)
// ---------------------------------------------------------------------------
// Slugs match live routes under /catalog/[slug]. If a slug is renamed in
// `lib/category-taxonomy.ts` it needs updating here too — no automated link.
export interface CatalogCategoryChip {
  id: string;
  label: string;
  slug: string;
}

export const CATALOG_CATEGORY_CHIPS: CatalogCategoryChip[] = [
  { id: 'tshirts',     label: 'T-Shirts',    slug: 't-shirts' },
  { id: 'sweatshirts', label: 'Sweatshirts', slug: 'sweatshirts' },
  { id: 'polos',       label: 'Polos',       slug: 'polos' },
  { id: 'headwear',    label: 'Headwear',    slug: 'headwear' },
  { id: 'jackets',     label: 'Jackets',     slug: 'jackets' },
  { id: 'bags',        label: 'Bags',        slug: 'bags' },
  { id: 'accessories', label: 'Accessories', slug: 'accessories' },
  { id: 'unsure',      label: 'Not sure — recommend one', slug: '' },
];

// ---------------------------------------------------------------------------
// Query-string ?service=… → decoration method
// ---------------------------------------------------------------------------
// Mirrors the mapping in /pricing/page.tsx so LP and marketing links
// (/quote?service=puff-screen-printing, etc.) preselect the right tab.
export const SERVICE_QUERY_MAPPING: Record<string, QuoteDecorationMethod> = {
  'screen-printing':         'screen-printing',
  'embroidery':              'embroidery',
  'digital-screen-printing': 'digital',
  'digital':                 'digital',
  'jumbo-screen-printing':   'jumbo',
  'jumbo':                   'jumbo',
  'puff-screen-printing':    'screen-printing',
  'simulated-process':       'screen-printing',
  'retail-finishing':        'finishing',
  'finishing':               'finishing',
};

// ---------------------------------------------------------------------------
// Max simultaneous projects a single quote submission can contain
// ---------------------------------------------------------------------------
// Enforced client-side to disable the "add another project" button, and
// server-side in /api/quote/submit to reject hostile large payloads.
export const MAX_PROJECTS_PER_QUOTE = 5;
