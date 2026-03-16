/**
 * Product-level tiered pricing configuration.
 *
 * Quantity thresholds are based on total units of the SAME STYLE in the cart
 * (all colors/sizes pool together). The sync in product-sync.ts skips
 * retail_price updates for any styleId listed here so the DB always holds the
 * correct tier-1 base price.
 */

// ---------------------------------------------------------------------------
// Size-group helpers
// ---------------------------------------------------------------------------

type SizeGroup = 'standard' | '2xl' | '3xl' | '4xl';

function classifySize(sizeName: string): SizeGroup {
  const upper = sizeName.toUpperCase().trim();
  if (upper.includes('4X') || upper.includes('5X')) return '4xl';
  if (upper.includes('3X')) return '3xl';
  if (upper.includes('2X')) return '2xl';
  return 'standard';
}

// ---------------------------------------------------------------------------
// Tier rule types
// ---------------------------------------------------------------------------

interface PriceTier {
  minQty: number;
  maxQty: number;
  label: string;
  prices: Record<SizeGroup, number>;
}

interface TieredPricingRule {
  styleId: number;
  styleName: string;
  tiers: PriceTier[];
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

const TIERED_PRICING_RULES: TieredPricingRule[] = [
  {
    styleId: 9001801,
    styleName: '1801GD',
    tiers: [
      { minQty: 1,  maxQty: 5,        label: '1–5 pcs',   prices: { standard: 12.49, '2xl': 14.49, '3xl': 16.99, '4xl': 18.99 } },
      { minQty: 6,  maxQty: 23,       label: '6–23 pcs',  prices: { standard: 11.49, '2xl': 13.49, '3xl': 15.99, '4xl': 17.99 } },
      { minQty: 24, maxQty: 71,       label: '24–71 pcs', prices: { standard: 10.49, '2xl': 12.49, '3xl': 14.99, '4xl': 16.99 } },
      { minQty: 72, maxQty: Infinity, label: '72+ pcs',   prices: { standard: 9.85,  '2xl': 11.49, '3xl': 13.49, '4xl': 14.99 } },
    ],
  },
];

const rulesByStyleId = new Map(TIERED_PRICING_RULES.map((r) => [r.styleId, r]));

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Set of styleIds that have tiered pricing (used by product-sync to skip price updates). */
export function getTieredStyleIds(): Set<number> {
  return new Set(TIERED_PRICING_RULES.map((r) => r.styleId));
}

/** Check whether a product has tiered pricing. */
export function hasTieredPricing(styleId: number): boolean {
  return rulesByStyleId.has(styleId);
}

/** Resolve the tier a given total quantity falls into (or null). */
function resolveTier(styleId: number, totalQty: number): PriceTier | null {
  const rule = rulesByStyleId.get(styleId);
  if (!rule) return null;
  return rule.tiers.find((t) => totalQty >= t.minQty && totalQty <= t.maxQty) ?? null;
}

/**
 * Return the effective unit price for a specific size at a given cart quantity.
 * Falls back to `fallbackPrice` when the product has no tiered pricing.
 */
export function getTieredPrice(
  styleId: number,
  sizeName: string,
  totalQty: number,
  fallbackPrice: number,
): number {
  const tier = resolveTier(styleId, Math.max(totalQty, 1));
  if (!tier) return fallbackPrice;
  return tier.prices[classifySize(sizeName)];
}

/**
 * Resolve the best price for a cart item: the lower of the tiered volume
 * price and the Google automated discount price (if present). Non-tiered
 * products just return discountedPrice ?? unitPrice as before.
 */
export function getEffectiveItemPrice(
  item: { styleId: number; sizeName: string; unitPrice: number; discountedPrice?: number },
  totalStyleQty: number,
): number {
  if (!hasTieredPricing(item.styleId)) {
    return item.discountedPrice ?? item.unitPrice;
  }
  const tieredPrice = getTieredPrice(item.styleId, item.sizeName, totalStyleQty, item.unitPrice);
  const googlePrice = item.discountedPrice ?? Infinity;
  return Math.min(tieredPrice, googlePrice);
}

/**
 * Return the tier-1 (base) price for a size — the price shown on the product
 * page and stored in the DB / GMC feed.
 */
export function getBaseTierPrice(styleId: number, sizeName: string): number | null {
  const rule = rulesByStyleId.get(styleId);
  if (!rule) return null;
  return rule.tiers[0].prices[classifySize(sizeName)];
}

/** Full tier table for displaying on the product page. */
export function getTierTable(styleId: number) {
  const rule = rulesByStyleId.get(styleId);
  if (!rule) return null;
  return {
    styleName: rule.styleName,
    sizeGroups: ['S–XL', '2XL', '3XL', '4XL+'] as const,
    tiers: rule.tiers.map((t) => ({
      label: t.label,
      minQty: t.minQty,
      maxQty: t.maxQty,
      prices: [t.prices.standard, t.prices['2xl'], t.prices['3xl'], t.prices['4xl']],
    })),
  };
}

/** Info about the next tier (for upsell nudges in cart). */
export function getNextTierInfo(styleId: number, currentQty: number) {
  const rule = rulesByStyleId.get(styleId);
  if (!rule) return null;

  const currentTierIdx = rule.tiers.findIndex(
    (t) => currentQty >= t.minQty && currentQty <= t.maxQty,
  );
  if (currentTierIdx < 0 || currentTierIdx >= rule.tiers.length - 1) return null;

  const nextTier = rule.tiers[currentTierIdx + 1];
  const unitsNeeded = nextTier.minQty - currentQty;
  const currentPrice = rule.tiers[currentTierIdx].prices.standard;
  const nextPrice = nextTier.prices.standard;
  const savingsPerUnit = currentPrice - nextPrice;

  return {
    unitsNeeded,
    nextLabel: nextTier.label,
    nextPrice,
    savingsPerUnit,
    savingsPercent: Math.round((savingsPerUnit / currentPrice) * 100),
  };
}

/**
 * Enhanced next-tier info with total dollar savings for upsell messaging.
 * Shows what the user would save on their entire order by reaching the next tier.
 */
export function getNextTierSavings(styleId: number, currentQty: number) {
  const rule = rulesByStyleId.get(styleId);
  if (!rule || currentQty <= 0) return null;

  const currentTierIdx = rule.tiers.findIndex(
    (t) => currentQty >= t.minQty && currentQty <= t.maxQty,
  );
  if (currentTierIdx < 0 || currentTierIdx >= rule.tiers.length - 1) return null;

  const currentTier = rule.tiers[currentTierIdx];
  const nextTier = rule.tiers[currentTierIdx + 1];
  const unitsNeeded = nextTier.minQty - currentQty;
  const nextQty = currentQty + unitsNeeded;
  const savingsPerUnit = currentTier.prices.standard - nextTier.prices.standard;
  const totalSavings = Math.round(savingsPerUnit * nextQty * 100) / 100;

  return {
    unitsNeeded,
    nextLabel: nextTier.label,
    nextPrice: nextTier.prices.standard,
    savingsPerUnit,
    savingsPercent: Math.round((savingsPerUnit / currentTier.prices.standard) * 100),
    totalSavings,
  };
}

/**
 * Progress toward the next tier (for progress bar).
 * Returns null when at the highest tier or no tiered pricing.
 */
export function getTierProgress(styleId: number, currentQty: number) {
  const rule = rulesByStyleId.get(styleId);
  if (!rule) return null;

  const currentTierIdx = rule.tiers.findIndex(
    (t) => currentQty >= t.minQty && currentQty <= t.maxQty,
  );
  if (currentTierIdx < 0) {
    return { percent: 0, currentQty, nextMin: rule.tiers[0].minQty, nextLabel: rule.tiers[0].label, atMaxTier: false };
  }
  if (currentTierIdx >= rule.tiers.length - 1) {
    return { percent: 100, currentQty, nextMin: rule.tiers[currentTierIdx].minQty, nextLabel: rule.tiers[currentTierIdx].label, atMaxTier: true };
  }

  const nextTier = rule.tiers[currentTierIdx + 1];
  const currentTier = rule.tiers[currentTierIdx];
  const rangeStart = currentTier.minQty;
  const rangeEnd = nextTier.minQty;
  const percent = Math.min(100, Math.round(((currentQty - rangeStart) / (rangeEnd - rangeStart)) * 100));

  return {
    percent,
    currentQty,
    nextMin: nextTier.minQty,
    nextLabel: nextTier.label,
    atMaxTier: false,
  };
}

/**
 * Current tier savings vs tier-1 base price (for "you're saving" messaging).
 * Returns null when at tier-1 or no tiered pricing.
 */
export function getCurrentTierSavings(styleId: number, currentQty: number) {
  const rule = rulesByStyleId.get(styleId);
  if (!rule || currentQty <= 0) return null;

  const tier1Price = rule.tiers[0].prices.standard;
  const currentTierIdx = rule.tiers.findIndex(
    (t) => currentQty >= t.minQty && currentQty <= t.maxQty,
  );
  if (currentTierIdx <= 0) return null;

  const currentPrice = rule.tiers[currentTierIdx].prices.standard;
  const savingsPerUnit = Math.round((tier1Price - currentPrice) * 100) / 100;
  if (savingsPerUnit <= 0) return null;

  const totalSavings = Math.round(savingsPerUnit * currentQty * 100) / 100;

  return {
    savingsPerUnit,
    totalSavings,
    savingsPercent: Math.round((savingsPerUnit / tier1Price) * 100),
    tierLabel: rule.tiers[currentTierIdx].label,
  };
}

/**
 * Check whether a cart item is receiving a volume discount (below tier-1).
 * Used for "Volume Price" badge in cart/checkout.
 */
export function isVolumePriced(styleId: number, sizeName: string, totalStyleQty: number): boolean {
  const rule = rulesByStyleId.get(styleId);
  if (!rule || totalStyleQty <= 0) return false;
  const tier1Price = rule.tiers[0].prices[classifySize(sizeName)];
  const currentPrice = getTieredPrice(styleId, sizeName, totalStyleQty, tier1Price);
  return currentPrice < tier1Price;
}

/**
 * Calculate total volume savings across a set of cart items (for checkout summary).
 * Returns the difference between what the user would pay at tier-1 vs what they actually pay.
 */
export function calculateVolumeSavings(
  items: Array<{ styleId: number; sizeName: string; quantity: number; unitPrice: number; discountedPrice?: number }>,
): number {
  let totalSavings = 0;

  const styleQtys = new Map<number, number>();
  for (const item of items) {
    if (hasTieredPricing(item.styleId)) {
      styleQtys.set(item.styleId, (styleQtys.get(item.styleId) || 0) + item.quantity);
    }
  }

  for (const item of items) {
    if (!hasTieredPricing(item.styleId)) continue;
    const totalStyleQty = styleQtys.get(item.styleId) ?? 0;
    const tier1Price = getBaseTierPrice(item.styleId, item.sizeName) ?? item.unitPrice;
    const effectivePrice = getEffectiveItemPrice(item, totalStyleQty);
    const diff = tier1Price - effectivePrice;
    if (diff > 0) {
      totalSavings += diff * item.quantity;
    }
  }

  return Math.round(totalSavings * 100) / 100;
}
