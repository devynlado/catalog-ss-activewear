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
