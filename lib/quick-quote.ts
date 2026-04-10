import {
  SCREEN_PRINT_PRICING,
  EMBROIDERY_PRICING,
  SETUP_FEES,
  getScreenPrintTier,
  getEmbroideryTier,
} from './decoration-pricing';

// ============ TYPES ============

export type DecorationMode = 'screen' | 'embroidery' | 'both';

export interface QuickQuoteCustomizations {
  screenPrintColors: number;       // 1-8, default 2
  screenPrintLocations: string[];  // default ['front']
  embroideryStitchIndex: number;   // 0-4, default 0 (Under 5K). 4 = custom
  embroideryCustomStitchCount?: number;
  embroideryLocations: number;     // 1-4, default 1
  isFleece: boolean;
  isDarkGarment: boolean;
  advancedMode: boolean;
  screenPrintColorsPerLocation?: Record<string, number>;
  embroideryStitchPerLocation?: number[];  // stitch index per location
}

export interface TierRow {
  quantity: number;
  garmentPrice: number;
  screenPrintPerPiece: number;
  embroideryPerPiece: number;
  allInScreen: number;
  allInEmbroidery: number;
  savingsScreen: number;
  savingsEmbroidery: number;
  isCustomQuantity: boolean;
  isBestValue: boolean;
}

export interface QuickQuotePricing {
  rows: TierRow[];
  screenPrintSetupFee: number;
  embroiderySetupFee: number;
  screenPrintSetupBreakdown: string;
}

export const DEFAULT_CUSTOMIZATIONS: QuickQuoteCustomizations = {
  screenPrintColors: 2,
  screenPrintLocations: ['front'],
  embroideryStitchIndex: 0,
  embroideryLocations: 1,
  isFleece: false,
  isDarkGarment: false,
  advancedMode: false,
};

export const STANDARD_TIERS = [50, 100, 250, 500, 1000];

export const STITCH_LABELS = [
  'Under 5K stitches',
  '5K–7.5K stitches',
  '7.5K–10K stitches',
  'Over 10K stitches',
  'Custom',
];

export const HIGH_STITCH_RATE_PER_1K = 0.50;

export const LOCATION_LABELS: Record<string, string> = {
  front: 'Front',
  back: 'Back',
  'left-sleeve': 'Left Sleeve',
  'right-sleeve': 'Right Sleeve',
};

// ============ HELPERS ============

function getEffectiveColors(customizations: QuickQuoteCustomizations): number {
  const base = customizations.screenPrintColors;
  return customizations.isDarkGarment ? base + 1 : base;
}

function getScreenPrintPerPiece(
  quantity: number,
  customizations: QuickQuoteCustomizations
): number {
  const tier = getScreenPrintTier(quantity);
  if (!tier) return 0;

  const fleeceSurcharge = customizations.isFleece ? 1.0 : 0;

  if (customizations.advancedMode && customizations.screenPrintColorsPerLocation) {
    let total = 0;
    for (const loc of customizations.screenPrintLocations) {
      const colors = customizations.screenPrintColorsPerLocation[loc] ?? customizations.screenPrintColors;
      const effective = customizations.isDarkGarment ? colors + 1 : colors;
      const colorIndex = Math.min(effective, 8) - 1;
      const perLoc = SCREEN_PRINT_PRICING[tier]?.[colorIndex] ?? 0;
      total += perLoc + fleeceSurcharge;
    }
    return total;
  }

  const colorIndex = Math.min(getEffectiveColors(customizations), 8) - 1;
  const perLocation = SCREEN_PRINT_PRICING[tier]?.[colorIndex] ?? 0;

  return (perLocation + fleeceSurcharge) * customizations.screenPrintLocations.length;
}

function getEmbroideryPriceForStitchIndex(
  tier: string,
  stitchIndex: number,
  customStitchCount?: number,
): number {
  if (stitchIndex === 4 && customStitchCount && customStitchCount > 10000) {
    const base10k = EMBROIDERY_PRICING[tier]?.[3] ?? 0;
    const extraThousands = Math.ceil((customStitchCount - 10000) / 1000);
    return base10k + extraThousands * HIGH_STITCH_RATE_PER_1K;
  }
  const idx = Math.min(stitchIndex, 3);
  return EMBROIDERY_PRICING[tier]?.[idx] ?? 0;
}

function getEmbroideryPerPiece(
  quantity: number,
  customizations: QuickQuoteCustomizations
): number {
  const tier = getEmbroideryTier(quantity);
  if (!tier) return 0;

  if (customizations.advancedMode && customizations.embroideryStitchPerLocation) {
    let total = 0;
    const locCount = customizations.embroideryLocations;
    for (let i = 0; i < locCount; i++) {
      const stitchIdx = customizations.embroideryStitchPerLocation[i] ?? customizations.embroideryStitchIndex;
      total += getEmbroideryPriceForStitchIndex(tier, stitchIdx, customizations.embroideryCustomStitchCount);
    }
    return total;
  }

  const perLocation = getEmbroideryPriceForStitchIndex(
    tier, customizations.embroideryStitchIndex, customizations.embroideryCustomStitchCount
  );
  return perLocation * customizations.embroideryLocations;
}

// ============ MAIN CALCULATION ============

export function calculateQuotePricing(
  garmentPrice: number,
  customizations: QuickQuoteCustomizations = DEFAULT_CUSTOMIZATIONS,
  customQuantity?: number,
): QuickQuotePricing {
  const quantities = [...STANDARD_TIERS];

  if (customQuantity && customQuantity >= 50 && !quantities.includes(customQuantity)) {
    quantities.push(customQuantity);
    quantities.sort((a, b) => a - b);
  }

  const locationCount = customizations.screenPrintLocations.length;
  let screenPrintSetupFee: number;
  let screenPrintSetupBreakdown: string;

  if (customizations.advancedMode && customizations.screenPrintColorsPerLocation) {
    let totalColors = 0;
    const parts: string[] = [];
    for (const loc of customizations.screenPrintLocations) {
      const colors = customizations.screenPrintColorsPerLocation[loc] ?? customizations.screenPrintColors;
      const effective = customizations.isDarkGarment ? colors + 1 : colors;
      totalColors += effective;
      parts.push(`${LOCATION_LABELS[loc] || loc}: ${effective}c`);
    }
    screenPrintSetupFee = SETUP_FEES.screenPrint * totalColors;
    screenPrintSetupBreakdown = `$${SETUP_FEES.screenPrint}/color × (${parts.join(' + ')}) = $${screenPrintSetupFee} one-time`;
  } else {
    const effectiveColors = getEffectiveColors(customizations);
    screenPrintSetupFee = SETUP_FEES.screenPrint * effectiveColors * locationCount;
    const colorLabel = `${effectiveColors} color${effectiveColors !== 1 ? 's' : ''}`;
    const locLabel = `${locationCount} location${locationCount !== 1 ? 's' : ''}`;
    screenPrintSetupBreakdown = `$${SETUP_FEES.screenPrint}/color × ${colorLabel} × ${locLabel} = $${screenPrintSetupFee} one-time`;
  }

  const rows: TierRow[] = quantities.map((qty) => {
    const sp = getScreenPrintPerPiece(qty, customizations);
    const emb = getEmbroideryPerPiece(qty, customizations);

    return {
      quantity: qty,
      garmentPrice,
      screenPrintPerPiece: sp,
      embroideryPerPiece: emb,
      allInScreen: garmentPrice + sp,
      allInEmbroidery: garmentPrice + emb,
      savingsScreen: 0,
      savingsEmbroidery: 0,
      isCustomQuantity: customQuantity === qty && !STANDARD_TIERS.includes(qty),
      isBestValue: false,
    };
  });

  // Calculate savings vs the 50-piece row
  const baseRow = rows.find((r) => r.quantity === 50);
  if (baseRow) {
    for (const row of rows) {
      row.savingsScreen = baseRow.allInScreen - row.allInScreen;
      row.savingsEmbroidery = baseRow.allInEmbroidery - row.allInEmbroidery;
    }
  }

  // Mark best value (highest screen print savings, excluding the 50 row)
  let bestIdx = -1;
  let bestSaving = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].quantity === 50) continue;
    const avg = (rows[i].savingsScreen + rows[i].savingsEmbroidery) / 2;
    if (avg > bestSaving) {
      bestSaving = avg;
      bestIdx = i;
    }
  }
  if (bestIdx >= 0) rows[bestIdx].isBestValue = true;

  return {
    rows,
    screenPrintSetupFee,
    embroiderySetupFee: 0,
    screenPrintSetupBreakdown,
  };
}

// ============ MARKUP + ROUNDING ============

export function applyMarkupAndRound(
  price: number,
  markup: number,
  beautify: boolean,
): number {
  let result = price + markup;
  if (beautify) {
    result = Math.ceil(result * 4) / 4;
  }
  return result;
}

// ============ ASSUMPTIONS LABEL ============

export function buildAssumptionsLabel(c: QuickQuoteCustomizations, mode: DecorationMode = 'both'): string {
  const parts: string[] = [];

  if (mode !== 'embroidery') {
    if (c.advancedMode && c.screenPrintColorsPerLocation) {
      const locParts = c.screenPrintLocations.map(loc => {
        const colors = c.screenPrintColorsPerLocation![loc] ?? c.screenPrintColors;
        const effective = c.isDarkGarment ? colors + 1 : colors;
        return `${LOCATION_LABELS[loc] || loc} ${effective}c`;
      });
      parts.push(`Screen print (${locParts.join(', ')})`);
    } else {
      const effectiveColors = getEffectiveColors(c);
      const locationNames = c.screenPrintLocations.map((l) => LOCATION_LABELS[l] || l);
      parts.push(`${effectiveColors}-color screen print (${locationNames.join(' + ')})`);
    }
  }

  if (mode !== 'screen') {
    if (c.embroideryStitchIndex === 4 && c.embroideryCustomStitchCount) {
      parts.push(`${(c.embroideryCustomStitchCount / 1000).toFixed(0)}K stitch embroidery (${c.embroideryLocations} loc${c.embroideryLocations !== 1 ? 's' : ''})`);
    } else {
      parts.push(`${STITCH_LABELS[c.embroideryStitchIndex]} embroidery (${c.embroideryLocations} location${c.embroideryLocations !== 1 ? 's' : ''})`);
    }
  }

  if (c.isFleece) parts.push('fleece surcharge');
  if (c.isDarkGarment && mode !== 'embroidery') parts.push('dark garment +1 color');

  return parts.join(' · ');
}
