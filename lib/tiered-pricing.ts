/**
 * Optional product-level tiered (volume) pricing.
 *
 * When a styleId is listed here, quantity thresholds are based on total units
 * of that style in the cart (all colors/sizes). product-sync skips
 * retail_price updates for those styleIds so the DB can hold a stable tier-1
 * base when tiers are in use.
 *
 * Currently empty: all styles (including 9001801 / 1801GD) use standard
 * SKU/DB pricing only.
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
// Rules (empty = no volume tiers; add TieredPricingRule entries to enable)
// ---------------------------------------------------------------------------

const TIERED_PRICING_RULES: TieredPricingRule[] = [];

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
 * List price used as the base for Google discount % (tier-1 for volume-priced
 * styles, otherwise SKU list / sale price from the cart line).
 */
export function getListPriceForCartItem(item: {
  styleId: number;
  sizeName: string;
  unitPrice: number;
}): number {
  if (hasTieredPricing(item.styleId)) {
    return getBaseTierPrice(item.styleId, item.sizeName) ?? item.unitPrice;
  }
  return item.unitPrice;
}

function resolveGoogleDiscountFraction(item: {
  googleDiscountPercent?: number;
  discountedPrice?: number;
  unitPrice: number;
}): number | undefined {
  if (
    item.googleDiscountPercent != null &&
    item.googleDiscountPercent > 0 &&
    item.googleDiscountPercent < 1
  ) {
    return item.googleDiscountPercent;
  }
  if (
    item.unitPrice > 0 &&
    item.discountedPrice != null &&
    item.discountedPrice > 0 &&
    item.discountedPrice < item.unitPrice
  ) {
    const inferred = 1 - item.discountedPrice / item.unitPrice;
    if (inferred > 0 && inferred < 1) return inferred;
  }
  return undefined;
}

function googleDiscountedUnitPrice(item: {
  styleId: number;
  sizeName: string;
  unitPrice: number;
  discountedPrice?: number;
  googleDiscountPercent?: number;
}): number | undefined {
  const frac = resolveGoogleDiscountFraction(item);
  if (frac == null) return undefined;
  const list = getListPriceForCartItem(item);
  if (!(list > 0)) return undefined;
  return Math.round(list * (1 - frac) * 100) / 100;
}

/**
 * Resolve the best price for a cart item: the lower of the tiered volume
 * price and the Google automated discount price (if present). Non-tiered
 * products use list price with the same Google rule.
 *
 * Google discounts are applied as a fraction of the **current** list price so
 * stale `discountedPrice` snapshots from an old cart cannot undercut updated
 * catalog or tier prices.
 */
export function getEffectiveItemPrice(
  item: {
    styleId: number;
    sizeName: string;
    unitPrice: number;
    discountedPrice?: number;
    overrideUnitPrice?: number;
    googleDiscountPercent?: number;
  },
  totalStyleQty: number,
): number {
  if (item.overrideUnitPrice != null && item.overrideUnitPrice > 0) {
    return item.overrideUnitPrice;
  }

  const googlePrice = googleDiscountedUnitPrice(item);
  const listBase = getListPriceForCartItem(item);

  if (!hasTieredPricing(item.styleId)) {
    const shelf = item.unitPrice;
    if (googlePrice != null && googlePrice < shelf) return googlePrice;
    return shelf;
  }

  const tieredPrice = getTieredPrice(item.styleId, item.sizeName, totalStyleQty, listBase);
  if (googlePrice != null) {
    return Math.min(tieredPrice, googlePrice);
  }
  return tieredPrice;
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
  items: Array<{
    styleId: number;
    sizeName: string;
    quantity: number;
    unitPrice: number;
    discountedPrice?: number;
    overrideUnitPrice?: number;
  }>,
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
    if (item.overrideUnitPrice != null && item.overrideUnitPrice > 0) continue;
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
