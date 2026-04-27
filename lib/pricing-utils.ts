/**
 * Pricing utilities for quote estimates
 * 
 * Data extracted from PricingCalculator.tsx
 * These are estimate ranges - final quotes provided by sales team
 */

// ============ PRICING DATA ============

// Screen Printing: Standard (15" x 19") - price per piece by quantity tier and color count
// Index: [1 color, 2 colors, 3 colors, 4 colors, 5 colors, 6 colors, 7 colors, 8 colors]
export const screenPrintPricing: Record<string, number[]> = {
  '50-74':     [3.95, 4.45, 4.95, 5.45, 5.95, 6.45, 6.95, 7.45],
  '75-99':     [2.95, 3.45, 3.95, 4.45, 4.95, 5.45, 5.95, 6.45],
  '100-249':   [2.45, 2.95, 3.35, 3.75, 4.25, 4.65, 5.05, 5.45],
  '250-499':   [1.65, 1.95, 2.25, 2.55, 2.85, 3.05, 3.35, 3.65],
  '500-999':   [1.20, 1.45, 1.70, 1.95, 2.20, 2.45, 2.70, 2.90],
  '1000-2499': [0.90, 1.10, 1.30, 1.50, 1.70, 1.90, 2.10, 2.30],
  '2500-5000': [0.75, 0.90, 1.05, 1.20, 1.35, 1.50, 1.65, 1.80],
};

// Jumbo Screen Printing (17" x 23")
export const jumboPricing: Record<string, number[]> = {
  '50-74':     [4.95, 5.75, 6.50, 7.25, 8.00, 8.75, 9.50, 10.25],
  '75-99':     [4.20, 4.90, 5.60, 6.30, 6.95, 7.75, 8.50, 9.25],
  '100-249':   [3.75, 4.25, 4.75, 5.25, 5.75, 6.25, 6.75, 8.25],
  '250-499':   [2.45, 2.95, 3.45, 3.85, 4.05, 4.55, 5.05, 5.65],
  '500-999':   [1.95, 2.25, 2.45, 2.65, 2.85, 3.05, 3.25, 3.45],
  '1000-2499': [1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25],
  '2500-5000': [1.20, 1.45, 1.70, 1.95, 2.20, 2.45, 2.65, 2.90],
};

// Digital Screen Printing (Full Color) - single price per tier
export const digitalPricing: Record<string, number> = {
  '50-74':     8.00,
  '75-99':     6.50,
  '100-249':   5.50,
  '250-499':   4.50,
  '500-999':   3.95,
  '1000-2499': 3.25,
  '2500-5000': 2.75,
};

// Embroidery - price by quantity tier and stitch count
// Index: [Under 5K, 5K-7.5K, 7.5K-10K, Over 10K]
export const embroideryPricing: Record<string, number[]> = {
  '50-99':     [4.95, 5.45, 5.95, 6.45],
  '100-249':   [4.25, 4.50, 4.75, 5.00],
  '250-499':   [3.75, 4.00, 4.25, 4.50],
  '500-999':   [3.25, 3.50, 3.75, 4.00],
  '1000-2499': [3.00, 3.25, 3.50, 3.75],
  '2500-5000': [2.75, 3.00, 3.25, 3.50],
};

// Finishing Services - price per piece by quantity
export const finishingPricing: Record<string, Record<string, number>> = {
  'fold-bag':     { '50': 1.00, '100': 1.00, '250': 1.00, '500': 0.95, '1000': 0.85 },
  'printed-tags': { '50': 0.50, '100': 0.50, '250': 0.50, '500': 0.45, '1000': 0.35 },
  'hang-tags':    { '50': 0.50, '100': 0.50, '250': 0.50, '500': 0.45, '1000': 0.35 },
  'sewn-tags':    { '50': 3.00, '100': 2.00, '250': 1.95, '500': 1.90, '1000': 1.80 },
};

// Setup fees (not included in per-piece estimates, shown separately)
export const setupFees = {
  screenPrint: 30,  // per color
  jumbo: 50,        // per color
  digital: 100,     // flat
  embroidery: 0,    // typically included
};

// ============ TYPES ============

export interface PriceRange {
  perPieceMin: number;
  perPieceMax: number;
  totalMin: number;       // Includes setup fee baked in
  totalMax: number;       // Includes setup fee baked in
  setupFee?: number;      // For reference only, already included in totals
}

export type DecorationType = 'screen' | 'jumbo' | 'embroidery' | 'digital' | 'none';
export type StitchCount = 'under5k' | '5k-7.5k' | '7.5k-10k' | 'over10k';
export type PrintLocation = 'front' | 'back' | 'left-sleeve' | 'right-sleeve';

// ============ HELPER FUNCTIONS ============

function getQuantityTier(qty: number, tiers: string[]): string {
  for (const tier of tiers) {
    const [min, max] = tier.split('-').map(Number);
    if (qty >= min && qty <= max) return tier;
  }
  // Return highest tier if above all
  return tiers[tiers.length - 1];
}

function getFinishingTier(qty: number): string {
  if (qty >= 1000) return '1000';
  if (qty >= 500) return '500';
  if (qty >= 250) return '250';
  if (qty >= 100) return '100';
  return '50';
}

function getStitchIndex(stitchCount: StitchCount): number {
  switch (stitchCount) {
    case 'under5k': return 0;
    case '5k-7.5k': return 1;
    case '7.5k-10k': return 2;
    case 'over10k': return 3;
    default: return 1; // Default to medium
  }
}

// ============ ESTIMATE FUNCTIONS ============

/**
 * Get screen printing estimate
 * @param qty Total quantity
 * @param colors Number of colors (1-8)
 * @param locations Number of print locations (1-4)
 */
export function getScreenPrintEstimate(
  qty: number,
  colors: number = 1,
  locations: number = 1
): PriceRange | null {
  if (qty < 50) return null;
  
  const tiers = Object.keys(screenPrintPricing);
  const tier = getQuantityTier(qty, tiers);
  const prices = screenPrintPricing[tier];
  
  if (!prices) return null;
  
  // Clamp colors to 1-8
  const colorIndex = Math.min(Math.max(colors, 1), 8) - 1;
  const basePrice = prices[colorIndex];
  
  // Multiple locations multiply the price (simplified)
  const perPiece = basePrice * locations;
  
  // Add variance for estimate range (+/- 15%)
  const perPieceMin = perPiece * 0.85;
  const perPieceMax = perPiece * 1.15;
  const setup = setupFees.screenPrint * colors * locations;
  
  return {
    perPieceMin: Math.round(perPieceMin * 100) / 100,
    perPieceMax: Math.round(perPieceMax * 100) / 100,
    totalMin: Math.round(perPieceMin * qty) + setup,
    totalMax: Math.round(perPieceMax * qty) + setup,
    setupFee: setup,
  };
}

/**
 * Get jumbo screen printing estimate
 */
export function getJumboEstimate(
  qty: number,
  colors: number = 1,
  locations: number = 1
): PriceRange | null {
  if (qty < 50) return null;
  
  const tiers = Object.keys(jumboPricing);
  const tier = getQuantityTier(qty, tiers);
  const prices = jumboPricing[tier];
  
  if (!prices) return null;
  
  const colorIndex = Math.min(Math.max(colors, 1), 8) - 1;
  const basePrice = prices[colorIndex];
  const perPiece = basePrice * locations;
  
  const perPieceMin = perPiece * 0.85;
  const perPieceMax = perPiece * 1.15;
  const setup = setupFees.jumbo * colors * locations;
  
  return {
    perPieceMin: Math.round(perPieceMin * 100) / 100,
    perPieceMax: Math.round(perPieceMax * 100) / 100,
    totalMin: Math.round(perPieceMin * qty) + setup,
    totalMax: Math.round(perPieceMax * qty) + setup,
    setupFee: setup,
  };
}

/**
 * Get embroidery estimate
 */
export function getEmbroideryEstimate(
  qty: number,
  stitchCount: StitchCount = '5k-7.5k',
  locations: number = 1
): PriceRange | null {
  if (qty < 50) return null;
  
  const tiers = Object.keys(embroideryPricing);
  const tier = getQuantityTier(qty, tiers);
  const prices = embroideryPricing[tier];
  
  if (!prices) return null;
  
  const stitchIndex = getStitchIndex(stitchCount);
  const basePrice = prices[stitchIndex];
  const perPiece = basePrice * locations;
  
  const perPieceMin = perPiece * 0.90;
  const perPieceMax = perPiece * 1.10;
  
  return {
    perPieceMin: Math.round(perPieceMin * 100) / 100,
    perPieceMax: Math.round(perPieceMax * 100) / 100,
    totalMin: Math.round(perPieceMin * qty),
    totalMax: Math.round(perPieceMax * qty),
  };
}

/**
 * Get digital screen printing estimate
 */
export function getDigitalEstimate(
  qty: number,
  locations: number = 1
): PriceRange | null {
  if (qty < 50) return null;
  
  const tiers = Object.keys(digitalPricing);
  const tier = getQuantityTier(qty, tiers);
  const basePrice = digitalPricing[tier];
  
  if (!basePrice) return null;
  
  const perPiece = basePrice * locations;
  
  const perPieceMin = perPiece * 0.90;
  const perPieceMax = perPiece * 1.10;
  const setup = setupFees.digital;
  
  return {
    perPieceMin: Math.round(perPieceMin * 100) / 100,
    perPieceMax: Math.round(perPieceMax * 100) / 100,
    totalMin: Math.round(perPieceMin * qty) + setup,
    totalMax: Math.round(perPieceMax * qty) + setup,
    setupFee: setup,
  };
}

/**
 * Get finishing services estimate
 */
export function getFinishingEstimate(
  qty: number,
  services: string[]
): PriceRange | null {
  if (qty < 50 || services.length === 0) return null;
  
  const tier = getFinishingTier(qty);
  let totalPerPiece = 0;
  
  for (const service of services) {
    const servicePricing = finishingPricing[service];
    if (servicePricing && servicePricing[tier]) {
      totalPerPiece += servicePricing[tier];
    }
  }
  
  if (totalPerPiece === 0) return null;
  
  return {
    perPieceMin: totalPerPiece,
    perPieceMax: totalPerPiece,
    totalMin: Math.round(totalPerPiece * qty),
    totalMax: Math.round(totalPerPiece * qty),
  };
}

/**
 * Get combined estimate for decoration + finishing
 */
export function getCombinedEstimate(
  qty: number,
  decorationType: DecorationType,
  options: {
    colors?: number;
    locations?: PrintLocation[];
    stitchCount?: StitchCount;
  },
  finishingServices: string[]
): PriceRange | null {
  if (qty < 50) return null;
  
  const locationCount = options.locations?.length || 1;
  
  let decorationEstimate: PriceRange | null = null;
  
  switch (decorationType) {
    case 'screen':
      decorationEstimate = getScreenPrintEstimate(qty, options.colors || 1, locationCount);
      break;
    case 'jumbo':
      decorationEstimate = getJumboEstimate(qty, options.colors || 1, locationCount);
      break;
    case 'embroidery':
      decorationEstimate = getEmbroideryEstimate(qty, options.stitchCount || '5k-7.5k', locationCount);
      break;
    case 'digital':
      decorationEstimate = getDigitalEstimate(qty, locationCount);
      break;
    case 'none':
      // No decoration cost
      break;
  }
  
  const finishingEstimate = getFinishingEstimate(qty, finishingServices);
  
  // Combine estimates
  if (!decorationEstimate && !finishingEstimate) return null;
  
  const perPieceMin = (decorationEstimate?.perPieceMin || 0) + (finishingEstimate?.perPieceMin || 0);
  const perPieceMax = (decorationEstimate?.perPieceMax || 0) + (finishingEstimate?.perPieceMax || 0);
  
  return {
    perPieceMin: Math.round(perPieceMin * 100) / 100,
    perPieceMax: Math.round(perPieceMax * 100) / 100,
    totalMin: Math.round(perPieceMin * qty),
    totalMax: Math.round(perPieceMax * qty),
    setupFee: decorationEstimate?.setupFee,
  };
}

// ============ DISPLAY HELPERS ============

export const MINIMUM_ORDER_QTY = 50;

export function formatPriceRange(range: PriceRange): string {
  if (range.perPieceMin === range.perPieceMax) {
    return `$${range.perPieceMin.toFixed(2)}/pc`;
  }
  return `$${range.perPieceMin.toFixed(2)} - $${range.perPieceMax.toFixed(2)}/pc`;
}

export function formatTotalRange(range: PriceRange): string {
  if (range.totalMin === range.totalMax) {
    return `$${range.totalMin.toLocaleString()}`;
  }
  return `$${range.totalMin.toLocaleString()} - $${range.totalMax.toLocaleString()}`;
}

export const stitchCountLabels: Record<StitchCount, string> = {
  'under5k': 'Under 5,000',
  '5k-7.5k': '5,000 - 7,500',
  '7.5k-10k': '7,500 - 10,000',
  'over10k': 'Over 10,000',
};

export const locationLabels: Record<PrintLocation, string> = {
  'front': 'Front',
  'back': 'Back',
  'left-sleeve': 'Left Sleeve',
  'right-sleeve': 'Right Sleeve',
};
