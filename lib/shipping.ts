/**
 * Centralized shipping configuration and warehouse utilities.
 * Single source of truth for all shipping rates, thresholds, and warehouse detection.
 */

import type { CartItem } from './database.types';

// ── Types ──────────────────────────────────────────────────────────────────

export type Warehouse = 'ss_activewear' | 'los_angeles_apparel' | 'as_colour';
export type ShippingMethod = 'economy' | 'same_day';

export interface WarehouseConfig {
  label: string;
  shortLabel: string;
  economy: { price: number; days: [number, number] };
  express: { price: number; days: [number, number] };
}

export interface ShipmentGroup {
  warehouse: Warehouse;
  items: CartItem[];
  isPrimary: boolean;
  itemCount: number;
  subtotal: number;
}

export interface ShipmentShippingCost {
  warehouse: Warehouse;
  method: ShippingMethod;
  cost: number;
  isFree: boolean;
}

export interface ShippingBreakdown {
  shipments: ShipmentShippingCost[];
  totalShippingCost: number;
}

export interface LiveShippingRate {
  method: 'standard' | 'express';
  price: number;
  estimatedDays: [number, number];
  carrier: string | null;
  isLive: boolean;
}

export interface WarehouseLiveRates {
  warehouse: Warehouse;
  label: string;
  rates: LiveShippingRate[];
}

export interface LiveRatesResponse {
  rates: LiveShippingRate[];
  warehouseRates: WarehouseLiveRates[];
  fallback: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const FREE_ECONOMY_THRESHOLD = 500;
export const TAX_RATE = 0.0825;
export const SHIPPING_MARKUP = 8;
export const MIN_RATE_FLOOR = 10;

export interface OriginAddress {
  zip: string;
  city: string;
  state: string;
}

export const WAREHOUSE_ORIGIN: Record<Warehouse, OriginAddress> = {
  ss_activewear: { zip: '89506', city: 'Reno', state: 'NV' },
  los_angeles_apparel: { zip: '90001', city: 'Los Angeles', state: 'CA' },
  as_colour: { zip: '90001', city: 'Los Angeles', state: 'CA' },
};

export const GARMENT_DECOR_ORIGIN: OriginAddress = { zip: '91762', city: 'Montclair', state: 'CA' };

export const WAREHOUSE_ORIGIN_ZIP: Record<Warehouse, string> = {
  ss_activewear: '89506',
  los_angeles_apparel: '90001',
  as_colour: '90001',
};
export const GARMENT_DECOR_ZIP = '91762';

export const FLAT_RATE_FALLBACK: LiveShippingRate[] = [
  { method: 'standard', price: 15, estimatedDays: [3, 7], carrier: null, isLive: false },
  { method: 'express', price: 25, estimatedDays: [1, 3], carrier: null, isLive: false },
];

export const WAREHOUSE_CONFIG: Record<Warehouse, WarehouseConfig> = {
  ss_activewear: {
    label: 'SS Activewear Warehouse',
    shortLabel: 'SS Activewear',
    economy: { price: 15, days: [3, 5] },
    express: { price: 25, days: [1, 2] },
  },
  los_angeles_apparel: {
    label: 'Los Angeles Apparel',
    shortLabel: 'LA Apparel',
    economy: { price: 15, days: [5, 7] },
    express: { price: 25, days: [3, 5] },
  },
  as_colour: {
    label: 'AS Colour',
    shortLabel: 'AS Colour',
    economy: { price: 15, days: [5, 7] },
    express: { price: 25, days: [3, 5] },
  },
};

// Primary shipment uses standard rates; secondary shipments use their warehouse config
const PRIMARY_SHIPPING: Pick<WarehouseConfig, 'economy' | 'express'> = {
  economy: { price: 15, days: [3, 5] },
  express: { price: 25, days: [1, 2] },
};

// ── Warehouse Detection ────────────────────────────────────────────────────

const LA_APPAREL_STYLE_MIN = 9001000;
const LA_APPAREL_STYLE_MAX = 9010000;

export function getItemWarehouse(styleId: number, supplier?: string): Warehouse {
  if (supplier === 'los_angeles_apparel') return 'los_angeles_apparel';
  if (supplier === 'as_colour') return 'as_colour';
  if (styleId >= LA_APPAREL_STYLE_MIN && styleId < LA_APPAREL_STYLE_MAX) {
    return 'los_angeles_apparel';
  }
  return 'ss_activewear';
}

// ── Cart Grouping ──────────────────────────────────────────────────────────

export function groupCartByWarehouse(items: CartItem[]): ShipmentGroup[] {
  const warehouseMap = new Map<Warehouse, CartItem[]>();

  for (const item of items) {
    const wh = item.warehouse ?? getItemWarehouse(item.styleId);
    const existing = warehouseMap.get(wh) || [];
    existing.push(item);
    warehouseMap.set(wh, existing);
  }

  const groups: ShipmentGroup[] = Array.from(warehouseMap.entries()).map(
    ([warehouse, warehouseItems]) => ({
      warehouse,
      items: warehouseItems,
      isPrimary: false,
      itemCount: warehouseItems.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: warehouseItems.reduce(
        (sum, i) => sum + (i.discountedPrice ?? i.unitPrice) * i.quantity,
        0
      ),
    })
  );

  // Sort by subtotal descending — highest value shipment is primary
  groups.sort((a, b) => b.subtotal - a.subtotal);
  if (groups.length > 0) {
    groups[0].isPrimary = true;
  }

  return groups;
}

export function isMultiWarehouseCart(items: CartItem[]): boolean {
  const warehouses = new Set<Warehouse>();
  for (const item of items) {
    warehouses.add(item.warehouse ?? getItemWarehouse(item.styleId));
    if (warehouses.size > 1) return true;
  }
  return false;
}

// ── Shipping Cost Calculation ──────────────────────────────────────────────

export function getShipmentCost(
  shipment: ShipmentGroup,
  method: ShippingMethod,
): { price: number; days: [number, number] } {
  if (shipment.isPrimary) {
    return method === 'same_day' ? PRIMARY_SHIPPING.express : PRIMARY_SHIPPING.economy;
  }
  const config = WAREHOUSE_CONFIG[shipment.warehouse];
  return method === 'same_day' ? config.express : config.economy;
}

export function calculateShippingBreakdown(
  shipments: ShipmentGroup[],
  primaryMethod: ShippingMethod,
  orderSubtotal: number,
  couponFreeShipping: boolean = false,
): ShippingBreakdown {
  const result: ShipmentShippingCost[] = [];

  for (const shipment of shipments) {
    const method = shipment.isPrimary ? primaryMethod : 'economy';
    const { price } = getShipmentCost(shipment, method);

    const isFreeByThreshold = method === 'economy' && orderSubtotal >= FREE_ECONOMY_THRESHOLD;
    const isFreeByCoupon = couponFreeShipping && method === 'economy';
    const isFree = isFreeByThreshold || isFreeByCoupon;

    result.push({
      warehouse: shipment.warehouse,
      method,
      cost: isFree ? 0 : price,
      isFree,
    });
  }

  return {
    shipments: result,
    totalShippingCost: Math.round(result.reduce((sum, s) => sum + s.cost, 0) * 100) / 100,
  };
}

// ── Customer-Facing Labels ─────────────────────────────────────────────────

/**
 * Build a customer-facing label for a shipment using brand names from items.
 * e.g. "Gildan, Next Level + 2 more" or "LA Apparel 1801GD"
 */
export function getShipmentBrandLabel(group: ShipmentGroup, maxBrands = 2): string {
  const brands = [...new Set(group.items.map(i => i.brandName))];
  if (brands.length === 0) return 'Items';
  if (brands.length <= maxBrands) return brands.join(', ');
  const shown = brands.slice(0, maxBrands).join(', ');
  return `${shown} + ${brands.length - maxBrands} more`;
}

// ── Delivery Estimates ─────────────────────────────────────────────────────

export function getShipmentDeliveryEstimate(
  shipment: ShipmentGroup,
  method: ShippingMethod,
): { min: Date; max: Date } {
  const { days } = getShipmentCost(shipment, method);
  const now = new Date();
  const min = new Date(now);
  const max = new Date(now);
  min.setDate(min.getDate() + days[0]);
  max.setDate(max.getDate() + days[1]);
  return { min, max };
}
