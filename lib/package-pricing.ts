/**
 * Package pricing calculations
 * Server-side price verification for package deals
 */

// Embroidered baseball caps pricing tiers
export const EMBROIDERED_CAPS_TIERS = [
  { min: 50, max: 74, price: 15.95, label: '50-74 hats' },
  { min: 75, max: 99, price: 14.95, label: '75-99 hats' },
  { min: 100, max: 249, price: 13.95, label: '100-249 hats' },
  { min: 250, max: 499, price: 12.95, label: '250-499 hats' },
  { min: 500, max: Infinity, price: 12.45, label: '500+ hats' },
];

// Embroidered trucker caps pricing tiers ($2 less than baseball caps)
export const TRUCKER_CAPS_TIERS = [
  { min: 50, max: 74, price: 13.95, label: '50-74 hats' },
  { min: 75, max: 99, price: 12.95, label: '75-99 hats' },
  { min: 100, max: 249, price: 11.95, label: '100-249 hats' },
  { min: 250, max: 499, price: 10.95, label: '250-499 hats' },
  { min: 500, max: Infinity, price: 10.45, label: '500+ hats' },
];

// Embroidered snapback caps pricing tiers ($2 more than baseball caps)
export const SNAPBACK_CAPS_TIERS = [
  { min: 50, max: 74, price: 17.95, label: '50-74 hats' },
  { min: 75, max: 99, price: 16.95, label: '75-99 hats' },
  { min: 100, max: 249, price: 15.95, label: '100-249 hats' },
  { min: 250, max: 499, price: 14.95, label: '250-499 hats' },
  { min: 500, max: Infinity, price: 14.45, label: '500+ hats' },
];

// Embroidered dad caps pricing tiers ($1 less than baseball caps)
export const DAD_CAPS_TIERS = [
  { min: 50, max: 74, price: 14.95, label: '50-74 hats' },
  { min: 75, max: 99, price: 13.95, label: '75-99 hats' },
  { min: 100, max: 249, price: 12.95, label: '100-249 hats' },
  { min: 250, max: 499, price: 11.95, label: '250-499 hats' },
  { min: 500, max: Infinity, price: 11.45, label: '500+ hats' },
];

// Embroidered beanies pricing tiers (same as trucker caps)
export const BEANIE_TIERS = [
  { min: 50, max: 74, price: 13.95, label: '50-74 beanies' },
  { min: 75, max: 99, price: 12.95, label: '75-99 beanies' },
  { min: 100, max: 249, price: 11.95, label: '100-249 beanies' },
  { min: 250, max: 499, price: 10.95, label: '250-499 beanies' },
  { min: 500, max: Infinity, price: 10.45, label: '500+ beanies' },
];

// Add-on pricing
export const EMBROIDERY_ADDONS = {
  side: { price: 5.00, label: 'Side Embroidery' },
  back: { price: 5.00, label: 'Back Embroidery' },
  puff: { price: 3.00, label: '3D Puff Embroidery' },
};

// Tax rate (California estimate - should use Stripe Tax in production)
const TAX_RATE = 0.0825;

// Free shipping threshold
const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 15.00;

export interface PackagePricingInput {
  packageType: 'embroidered-caps' | 'trucker-caps' | 'snapback-caps' | 'dad-caps' | 'beanies';
  totalQuantity: number;
  embroideryLocations: string[]; // ['front', 'side', 'back']
  has3DPuff: boolean;
}

export interface PackagePricingResult {
  basePrice: number;
  addonPrice: number;
  pricePerHat: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  tierLabel: string;
}

/**
 * Calculate package pricing with server-side verification
 */
export function calculatePackagePrice(input: PackagePricingInput): PackagePricingResult {
  const { packageType, totalQuantity, embroideryLocations, has3DPuff } = input;
  
  // Select pricing tiers based on package type
  let pricingTiers;
  switch (packageType) {
    case 'trucker-caps':
      pricingTiers = TRUCKER_CAPS_TIERS;
      break;
    case 'snapback-caps':
      pricingTiers = SNAPBACK_CAPS_TIERS;
      break;
    case 'dad-caps':
      pricingTiers = DAD_CAPS_TIERS;
      break;
    case 'beanies':
      pricingTiers = BEANIE_TIERS;
      break;
    default:
      pricingTiers = EMBROIDERED_CAPS_TIERS;
  }
  
  // Find applicable tier
  const tier = pricingTiers.find(t => 
    totalQuantity >= t.min && totalQuantity <= t.max
  ) || pricingTiers[0]; // Default to first tier if below minimum
  
  const basePrice = tier.price;
  
  // Calculate addon price
  let addonPrice = 0;
  if (embroideryLocations.includes('side')) {
    addonPrice += EMBROIDERY_ADDONS.side.price;
  }
  if (embroideryLocations.includes('back')) {
    addonPrice += EMBROIDERY_ADDONS.back.price;
  }
  if (has3DPuff) {
    addonPrice += EMBROIDERY_ADDONS.puff.price;
  }
  
  const pricePerHat = basePrice + addonPrice;
  const subtotal = totalQuantity * pricePerHat;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = Math.round((subtotal + tax + shipping) * 100) / 100;
  
  return {
    basePrice,
    addonPrice,
    pricePerHat,
    subtotal: Math.round(subtotal * 100) / 100,
    tax,
    shipping,
    total,
    tierLabel: tier.label,
  };
}

/**
 * Validate package order meets minimum requirements
 */
export function validatePackageOrder(input: PackagePricingInput): { valid: boolean; error?: string } {
  if (input.totalQuantity < 50) {
    return { valid: false, error: 'Minimum order quantity is 50 hats' };
  }
  
  if (!input.embroideryLocations.includes('front')) {
    return { valid: false, error: 'Front embroidery is required' };
  }
  
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Screen-printing packages (t-shirts + tote bags)
// ---------------------------------------------------------------------------
// These mirror the client-side constants in ScreenPrintPackageBuilder.tsx and
// ToteBagPackageBuilder.tsx so server-side verification produces the exact same
// price the customer saw. Keep them in sync if the builder pricing changes.

export type PrintPackageType =
  | 'printed-tees-gildan'
  | 'printed-tees-comfort-colors'
  | 'printed-totes-isabella';

export const PRINT_PACKAGE_TYPES: readonly PrintPackageType[] = [
  'printed-tees-gildan',
  'printed-tees-comfort-colors',
  'printed-totes-isabella',
];

export function isPrintPackageType(pkg: string): pkg is PrintPackageType {
  return (PRINT_PACKAGE_TYPES as readonly string[]).includes(pkg);
}

type PrintTier = 50 | 75 | 100 | 250 | 500;

// Print cost per unit (base includes 2 colors, +perExtraColor for 3rd/4th)
const TEES_PRINT_PRICING: Record<PrintTier, { base: number; perExtraColor: number }> = {
  50: { base: 4.75, perExtraColor: 0.75 },
  75: { base: 3.70, perExtraColor: 0.75 },
  100: { base: 3.00, perExtraColor: 0.75 },
  250: { base: 2.10, perExtraColor: 0.75 },
  500: { base: 1.80, perExtraColor: 0.75 },
};
const TEES_BLANK_COST: Record<PrintTier, number> = {
  50: 3.25, 75: 3.10, 100: 2.95, 250: 2.75, 500: 2.60,
};

const TOTES_PRINT_PRICING: Record<PrintTier, { base: number; perExtraColor: number }> = {
  50: { base: 3.50, perExtraColor: 0.75 },
  75: { base: 2.80, perExtraColor: 0.75 },
  100: { base: 2.25, perExtraColor: 0.75 },
  250: { base: 1.75, perExtraColor: 0.75 },
  500: { base: 1.45, perExtraColor: 0.75 },
};
const TOTES_BLANK_COST: Record<PrintTier, number> = {
  50: 5.25, 75: 4.95, 100: 4.75, 250: 4.50, 500: 4.50,
};

const PRINT_TIER_LABELS: Record<PrintTier, string> = {
  50: '50-74',
  75: '75-99',
  100: '100-249',
  250: '250-499',
  500: '500+',
};

function getPrintTier(qty: number): PrintTier {
  if (qty >= 500) return 500;
  if (qty >= 250) return 250;
  if (qty >= 100) return 100;
  if (qty >= 75) return 75;
  return 50;
}

export interface PrintPackagePricingInput {
  packageType: PrintPackageType;
  totalQuantity: number;
  printColors: number; // 1-4
  printLocations: string[]; // ['front'] or ['front', 'back']
}

export interface PrintPackagePricingResult {
  blankCost: number;
  printCost: number;
  pricePerUnit: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  tierLabel: string;
}

export function calculatePrintPackagePrice(input: PrintPackagePricingInput): PrintPackagePricingResult {
  const { packageType, totalQuantity, printColors, printLocations } = input;
  const isTote = packageType === 'printed-totes-isabella';
  const printPricing = isTote ? TOTES_PRINT_PRICING : TEES_PRINT_PRICING;
  const blankPricing = isTote ? TOTES_BLANK_COST : TEES_BLANK_COST;

  const tier = getPrintTier(totalQuantity);
  const safeColors = Math.min(4, Math.max(1, Math.round(printColors) || 1));
  const extraColors = Math.max(0, safeColors - 2);
  const perLocationPrintCost = printPricing[tier].base + extraColors * printPricing[tier].perExtraColor;

  const hasSecondLocation = printLocations.some((l) => l !== 'front');
  const printCost = perLocationPrintCost + (hasSecondLocation ? perLocationPrintCost : 0);
  const blankCost = blankPricing[tier];
  const pricePerUnit = Math.round((blankCost + printCost) * 100) / 100;

  const subtotal = Math.round(totalQuantity * pricePerUnit * 100) / 100;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = Math.round((subtotal + tax + shipping) * 100) / 100;

  return {
    blankCost,
    printCost,
    pricePerUnit,
    subtotal,
    tax,
    shipping,
    total,
    tierLabel: PRINT_TIER_LABELS[tier],
  };
}

export function validatePrintPackageOrder(input: PrintPackagePricingInput): { valid: boolean; error?: string } {
  const unit = input.packageType === 'printed-totes-isabella' ? 'bags' : 'shirts';
  if (input.totalQuantity < 50) {
    return { valid: false, error: `Minimum order quantity is 50 ${unit}` };
  }
  if (!input.printLocations || !input.printLocations.includes('front')) {
    return { valid: false, error: 'Front print is required' };
  }
  if (!input.printColors || input.printColors < 1 || input.printColors > 4) {
    return { valid: false, error: 'Select between 1 and 4 print colors' };
  }
  return { valid: true };
}
