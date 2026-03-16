// Stripe utility functions that can be used on both client and server

import { hasTieredPricing, getEffectiveItemPrice } from './tiered-pricing';
import {
  FREE_ECONOMY_THRESHOLD,
  TAX_RATE,
  groupCartByWarehouse,
  calculateShippingBreakdown,
  type ShippingMethod,
  type ShippingBreakdown,
} from './shipping';
import type { CartItem } from './database.types';

export type { ShippingMethod };

// Generate a unique order number
// Format: ORD-YYMMDD-XXXX (e.g., ORD-260129-A7B3)
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${year}${month}${day}-${random}`;
}

// Calculate subtotal with tiered pricing
function computeSubtotal(
  items: Array<{ unitPrice: number; quantity: number; discountedPrice?: number; styleId?: number; sizeName?: string }>
): number {
  const styleQtys = new Map<number, number>();
  for (const item of items) {
    if (item.styleId && hasTieredPricing(item.styleId)) {
      styleQtys.set(item.styleId, (styleQtys.get(item.styleId) || 0) + item.quantity);
    }
  }
  return items.reduce((sum, item) => {
    if (item.styleId && item.sizeName) {
      const totalStyleQty = styleQtys.get(item.styleId) ?? 0;
      return sum + getEffectiveItemPrice(
        { styleId: item.styleId, sizeName: item.sizeName, unitPrice: item.unitPrice, discountedPrice: item.discountedPrice },
        totalStyleQty,
      ) * item.quantity;
    }
    return sum + (item.discountedPrice ?? item.unitPrice) * item.quantity;
  }, 0);
}

// Calculate order totals with multi-warehouse shipping support
export function calculateOrderTotals(
  items: Array<{ unitPrice: number; quantity: number; discountedPrice?: number; styleId?: number; sizeName?: string; warehouse?: string }>,
  shippingMethod: ShippingMethod = 'economy'
) {
  const subtotal = computeSubtotal(items);
  const taxAmount = subtotal * TAX_RATE;

  const shipments = groupCartByWarehouse(items as CartItem[]);
  const { totalShippingCost } = calculateShippingBreakdown(shipments, shippingMethod, subtotal);

  const total = subtotal + taxAmount + totalShippingCost;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    shippingCost: Math.round(totalShippingCost * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// Convert amount to Stripe cents
export function toStripeCents(amount: number): number {
  return Math.round(amount * 100);
}

// Convert Stripe cents to dollars
export function fromStripeCents(cents: number): number {
  return cents / 100;
}
