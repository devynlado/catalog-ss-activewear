// Embroidery Package Configurations
// Each product type has its own pricing tiers, add-ons, and display settings

export interface PricingTier {
  min: number;
  max: number;
  price: number;
  label: string;
}

export interface AddonConfig {
  id: string;
  label: string;
  price: number;
  description: string;
}

export interface PuffAddonConfig {
  id: 'puff';
  label: string;
  price: number;
  description: string;
}

export interface EmbroideryPackageConfig {
  // Identification
  packageType: 'embroidered-caps' | 'trucker-caps' | 'snapback-caps' | 'dad-caps' | 'beanies';
  storageKey: string;
  
  // Display
  unitSingular: string;  // "hat" or "beanie"
  unitPlural: string;    // "hats" or "beanies"
  
  // Pricing
  pricingTiers: PricingTier[];
  minimumQuantity: number;
  
  // Add-ons
  includedLocation: {
    label: string;
    description: string;
  };
  addons: AddonConfig[];
  puffAddon: PuffAddonConfig | null;
  
  // Trust signals
  turnaroundDays: string;
}

// Base cap add-ons (side and back embroidery)
const CAP_ADDONS: AddonConfig[] = [
  { id: 'side', label: 'Side Embroidery', price: 5.00, description: 'Add your logo to the side of the cap' },
  { id: 'back', label: 'Back Embroidery', price: 5.00, description: 'Add your logo to the back of the cap' },
];

// 3D Puff option for caps
const PUFF_ADDON: PuffAddonConfig = {
  id: 'puff',
  label: '3D Puff Embroidery',
  price: 3.00,
  description: 'Raised, dimensional look for your front logo',
};

// ============================================
// EMBROIDERED BASEBALL CAPS (Richardson 112)
// ============================================
export const embroideredCapsConfig: EmbroideryPackageConfig = {
  packageType: 'embroidered-caps',
  storageKey: 'packageBuilder_embroideredCaps',
  unitSingular: 'hat',
  unitPlural: 'hats',
  minimumQuantity: 50,
  pricingTiers: [
    { min: 50, max: 74, price: 15.95, label: '50 hats' },
    { min: 75, max: 99, price: 14.95, label: '75 hats' },
    { min: 100, max: 249, price: 13.95, label: '100 hats' },
    { min: 250, max: 499, price: 12.95, label: '250 hats' },
    { min: 500, max: Infinity, price: 12.45, label: '500 hats' },
  ],
  includedLocation: {
    label: 'Front Embroidery',
    description: 'Up to 10,000 stitches',
  },
  addons: CAP_ADDONS,
  puffAddon: PUFF_ADDON,
  turnaroundDays: '10-12',
};

// ============================================
// TRUCKER CAPS (Richardson 112)
// ============================================
export const truckerCapsConfig: EmbroideryPackageConfig = {
  packageType: 'trucker-caps',
  storageKey: 'packageBuilder_truckerCaps',
  unitSingular: 'hat',
  unitPlural: 'hats',
  minimumQuantity: 50,
  pricingTiers: [
    { min: 50, max: 74, price: 13.95, label: '50 hats' },
    { min: 75, max: 99, price: 12.95, label: '75 hats' },
    { min: 100, max: 249, price: 11.95, label: '100 hats' },
    { min: 250, max: 499, price: 10.95, label: '250 hats' },
    { min: 500, max: Infinity, price: 10.45, label: '500 hats' },
  ],
  includedLocation: {
    label: 'Front Embroidery',
    description: 'Up to 10,000 stitches',
  },
  addons: CAP_ADDONS,
  puffAddon: PUFF_ADDON,
  turnaroundDays: '10-12',
};

// ============================================
// SNAPBACK CAPS (Otto Cap 125-978)
// ============================================
export const snapbackCapsConfig: EmbroideryPackageConfig = {
  packageType: 'snapback-caps',
  storageKey: 'packageBuilder_snapbackCaps',
  unitSingular: 'hat',
  unitPlural: 'hats',
  minimumQuantity: 50,
  pricingTiers: [
    { min: 50, max: 74, price: 17.95, label: '50 hats' },
    { min: 75, max: 99, price: 16.95, label: '75 hats' },
    { min: 100, max: 249, price: 15.95, label: '100 hats' },
    { min: 250, max: 499, price: 14.95, label: '250 hats' },
    { min: 500, max: Infinity, price: 14.45, label: '500 hats' },
  ],
  includedLocation: {
    label: 'Front Embroidery',
    description: 'Up to 10,000 stitches',
  },
  addons: CAP_ADDONS,
  puffAddon: PUFF_ADDON,
  turnaroundDays: '10-12',
};

// ============================================
// DAD CAPS (Richardson 320)
// ============================================
export const dadCapsConfig: EmbroideryPackageConfig = {
  packageType: 'dad-caps',
  storageKey: 'packageBuilder_dadCaps',
  unitSingular: 'hat',
  unitPlural: 'hats',
  minimumQuantity: 50,
  pricingTiers: [
    { min: 50, max: 74, price: 14.95, label: '50 hats' },
    { min: 75, max: 99, price: 13.95, label: '75 hats' },
    { min: 100, max: 249, price: 12.95, label: '100 hats' },
    { min: 250, max: 499, price: 11.95, label: '250 hats' },
    { min: 500, max: Infinity, price: 11.45, label: '500 hats' },
  ],
  includedLocation: {
    label: 'Front Embroidery',
    description: 'Up to 10,000 stitches',
  },
  addons: CAP_ADDONS,
  puffAddon: PUFF_ADDON,
  turnaroundDays: '10-12',
};

// ============================================
// BEANIES (Yupoong 1501KC)
// ============================================
export const beaniesConfig: EmbroideryPackageConfig = {
  packageType: 'beanies',
  storageKey: 'packageBuilder_beanies',
  unitSingular: 'beanie',
  unitPlural: 'beanies',
  minimumQuantity: 50,
  pricingTiers: [
    { min: 50, max: 74, price: 13.95, label: '50 beanies' },
    { min: 75, max: 99, price: 12.95, label: '75 beanies' },
    { min: 100, max: 249, price: 11.95, label: '100 beanies' },
    { min: 250, max: 499, price: 10.95, label: '250 beanies' },
    { min: 500, max: Infinity, price: 10.45, label: '500 beanies' },
  ],
  includedLocation: {
    label: 'Front Embroidery',
    description: 'Up to 10,000 stitches',
  },
  addons: [
    { id: 'back', label: 'Back Embroidery', price: 5.00, description: 'Add your logo to the back of the beanie' },
  ],
  puffAddon: null, // No 3D puff for beanies
  turnaroundDays: '10-12',
};

// Export all configs
export const embroideryConfigs = {
  'embroidered-caps': embroideredCapsConfig,
  'trucker-caps': truckerCapsConfig,
  'snapback-caps': snapbackCapsConfig,
  'dad-caps': dadCapsConfig,
  'beanies': beaniesConfig,
} as const;

export type EmbroideryPackageType = keyof typeof embroideryConfigs;
