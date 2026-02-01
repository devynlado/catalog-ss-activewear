// ============ DECORATION PRICING ============
// Centralized pricing data for decoration packages
// Source: components/tools/PricingCalculator.tsx

// Screen Printing: Standard (15" x 19")
// Array index = number of colors - 1 (index 0 = 1 color, index 1 = 2 colors, etc.)
export const SCREEN_PRINT_PRICING: Record<string, number[]> = {
  '50-74':     [3.95, 4.45, 4.95, 5.45, 5.95, 6.45, 6.95, 7.45],
  '75-99':     [2.95, 3.45, 3.95, 4.45, 4.95, 5.45, 5.95, 6.45],
  '100-249':   [2.45, 2.95, 3.35, 3.75, 4.25, 4.65, 5.05, 5.45],
  '250-499':   [1.65, 1.95, 2.25, 2.55, 2.85, 3.05, 3.35, 3.65],
  '500-999':   [1.20, 1.45, 1.70, 1.95, 2.20, 2.45, 2.70, 2.90],
  '1000-2499': [0.90, 1.10, 1.30, 1.50, 1.70, 1.90, 2.10, 2.30],
  '2500-5000': [0.75, 0.90, 1.05, 1.20, 1.35, 1.50, 1.65, 1.80],
};

// Embroidery (per stitch count)
// Array index: 0=2500, 1=5000, 2=7500, 3=10000 stitches
export const EMBROIDERY_PRICING: Record<string, number[]> = {
  '50-99':     [4.95, 5.45, 5.95, 6.45],
  '100-249':   [4.25, 4.50, 4.75, 5.00],
  '250-499':   [3.75, 4.00, 4.25, 4.50],
  '500-999':   [3.25, 3.50, 3.75, 4.00],
  '1000-2499': [3.00, 3.25, 3.50, 3.75],
  '2500-5000': [2.75, 3.00, 3.25, 3.50],
};

// Setup fees
export const SETUP_FEES = {
  screenPrint: 30, // per color
  embroidery: 0,   // included in pricing
};

// ============ QUANTITY TIER HELPERS ============

const SCREEN_PRINT_TIERS = ['50-74', '75-99', '100-249', '250-499', '500-999', '1000-2499', '2500-5000'];
const EMBROIDERY_TIERS = ['50-99', '100-249', '250-499', '500-999', '1000-2499', '2500-5000'];

export function getScreenPrintTier(quantity: number): string | null {
  if (quantity < 50) return null;
  for (const tier of SCREEN_PRINT_TIERS) {
    const [min, max] = tier.split('-').map(Number);
    if (quantity >= min && quantity <= max) return tier;
  }
  return '2500-5000'; // Cap at highest tier
}

export function getEmbroideryTier(quantity: number): string | null {
  if (quantity < 50) return null;
  for (const tier of EMBROIDERY_TIERS) {
    const [min, max] = tier.split('-').map(Number);
    if (quantity >= min && quantity <= max) return tier;
  }
  return '2500-5000'; // Cap at highest tier
}

// ============ PACKAGE DEFINITIONS ============

export type DecorationType = 'screen-print' | 'embroidery';

export interface DecorationPackage {
  id: string;
  type: DecorationType;
  name: string;
  description: string;
  locations: number;
  colors?: number;      // For screen print
  stitches?: number;    // For embroidery (index into pricing array)
  isCustom: boolean;
}

// Screen Print packages - Front + Back is recommended (first)
export const SCREEN_PRINT_PACKAGES: DecorationPackage[] = [
  {
    id: 'sp-front-back',
    type: 'screen-print',
    name: 'Front + Back',
    description: 'Two print locations for maximum visibility.',
    locations: 2,
    colors: 2,
    isCustom: false,
  },
  {
    id: 'sp-simple-logo',
    type: 'screen-print',
    name: 'Simple Logo',
    description: 'One logo, front or chest.',
    locations: 1,
    colors: 2, // Use 2-color pricing (index 1)
    isCustom: false,
  },
  {
    id: 'sp-custom',
    type: 'screen-print',
    name: 'Custom Design',
    description: 'Need something specific? We\'ll send a quick quote.',
    locations: 1,
    isCustom: true,
  },
];

// Embroidery packages - Left Chest is recommended (first)
export const EMBROIDERY_PACKAGES: DecorationPackage[] = [
  {
    id: 'emb-left-chest',
    type: 'embroidery',
    name: 'Left Chest Logo',
    description: 'Classic placement for professional branding.',
    locations: 1,
    stitches: 1, // 5000 stitches (index 1)
    isCustom: false,
  },
  {
    id: 'emb-cap-front',
    type: 'embroidery',
    name: 'Cap Front',
    description: 'Perfect for hats and caps.',
    locations: 1,
    stitches: 1, // 5000 stitches
    isCustom: false,
  },
  {
    id: 'emb-custom',
    type: 'embroidery',
    name: 'Custom Design',
    description: 'Need something specific? We\'ll send a quick quote.',
    locations: 1,
    isCustom: true,
  },
];

// ============ PRICING FUNCTIONS ============

export interface PackagePricing {
  pricePerPiece: number;
  setupFee: number;
  totalPrice: number;
  tier: string;
}

export function getScreenPrintPrice(
  packageDef: DecorationPackage,
  quantity: number
): PackagePricing | null {
  const tier = getScreenPrintTier(quantity);
  if (!tier || packageDef.isCustom) return null;

  const colorIndex = (packageDef.colors ?? 2) - 1; // Default to 2 colors
  const pricePerLocation = SCREEN_PRINT_PRICING[tier]?.[colorIndex] ?? 0;
  const pricePerPiece = pricePerLocation * packageDef.locations;
  const setupFee = SETUP_FEES.screenPrint * (packageDef.colors ?? 2) * packageDef.locations;
  const totalPrice = (pricePerPiece * quantity) + setupFee;

  return {
    pricePerPiece,
    setupFee,
    totalPrice,
    tier,
  };
}

export function getEmbroideryPrice(
  packageDef: DecorationPackage,
  quantity: number
): PackagePricing | null {
  const tier = getEmbroideryTier(quantity);
  if (!tier || packageDef.isCustom) return null;

  const stitchIndex = packageDef.stitches ?? 1; // Default to 5000 stitches
  const pricePerLocation = EMBROIDERY_PRICING[tier]?.[stitchIndex] ?? 0;
  const pricePerPiece = pricePerLocation * packageDef.locations;
  const totalPrice = pricePerPiece * quantity; // No setup fee for embroidery

  return {
    pricePerPiece,
    setupFee: 0,
    totalPrice,
    tier,
  };
}

export function getPackagePrice(
  packageDef: DecorationPackage,
  quantity: number
): PackagePricing | null {
  if (packageDef.type === 'screen-print') {
    return getScreenPrintPrice(packageDef, quantity);
  } else {
    return getEmbroideryPrice(packageDef, quantity);
  }
}

// All-in pricing (setup fee distributed across pieces)
export interface AllInPricing {
  allInPricePerPiece: number;
  totalPrice: number;
  quantity: number;
  tier: string;
}

export function getAllInPrice(
  packageDef: DecorationPackage,
  quantity: number
): AllInPricing | null {
  const pricing = getPackagePrice(packageDef, quantity);
  if (!pricing) return null;

  // All-in price = (base price * quantity + setup) / quantity
  const allInPricePerPiece = pricing.totalPrice / quantity;

  return {
    allInPricePerPiece,
    totalPrice: pricing.totalPrice,
    quantity,
    tier: pricing.tier,
  };
}

// ============ PRICE BREAK HELPERS ============

export interface NextPriceBreak {
  threshold: number;
  unitsNeeded: number;
  currentPrice: number;
  newPrice: number;
  savingsPerPiece: number;
}

export function getNextScreenPrintBreak(
  quantity: number,
  colorIndex: number = 1
): NextPriceBreak | null {
  const thresholds = [50, 75, 100, 250, 500, 1000, 2500];
  const currentTier = getScreenPrintTier(quantity);
  
  for (const threshold of thresholds) {
    if (quantity < threshold) {
      const currentPrice = currentTier ? SCREEN_PRINT_PRICING[currentTier]?.[colorIndex] ?? 0 : 0;
      const newTier = getScreenPrintTier(threshold);
      const newPrice = newTier ? SCREEN_PRINT_PRICING[newTier]?.[colorIndex] ?? 0 : 0;
      
      if (newPrice < currentPrice) {
        return {
          threshold,
          unitsNeeded: threshold - quantity,
          currentPrice,
          newPrice,
          savingsPerPiece: currentPrice - newPrice,
        };
      }
    }
  }
  return null;
}

export function getNextEmbroideryBreak(
  quantity: number,
  stitchIndex: number = 1
): NextPriceBreak | null {
  const thresholds = [50, 100, 250, 500, 1000, 2500];
  const currentTier = getEmbroideryTier(quantity);
  
  for (const threshold of thresholds) {
    if (quantity < threshold) {
      const currentPrice = currentTier ? EMBROIDERY_PRICING[currentTier]?.[stitchIndex] ?? 0 : 0;
      const newTier = getEmbroideryTier(threshold);
      const newPrice = newTier ? EMBROIDERY_PRICING[newTier]?.[stitchIndex] ?? 0 : 0;
      
      if (newPrice < currentPrice) {
        return {
          threshold,
          unitsNeeded: threshold - quantity,
          currentPrice,
          newPrice,
          savingsPerPiece: currentPrice - newPrice,
        };
      }
    }
  }
  return null;
}

// ============ DECORATION SELECTION TYPE ============

export interface DecorationSelection {
  type: DecorationType;
  packageId: string;
  packageName: string;
  pricePerPiece: number;
  setupFee: number;
  totalPrice: number;
  quantity: number;
  artworkFileName?: string;
  artworkUrl?: string;
}
