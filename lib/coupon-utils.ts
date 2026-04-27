/**
 * Coupon validation and discount calculation (server-side only).
 * Used by /api/coupons/validate and checkout create-session.
 */

import type { ShippingMethod } from './stripe';

export type CouponDiscountType = 'percent_cart' | 'fixed_cart' | 'free_shipping';
export type CouponAppliesTo = 'cart_and_packages' | 'products_only';

export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: CouponDiscountType;
  amount: number;
  free_shipping: boolean;
  min_cart_amount: number | null;
  max_discount_amount: number | null;
  applies_to: CouponAppliesTo;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  usage_limit_per_customer: number | null;
  created_at: string;
  updated_at: string;
}

export type ValidateContext = 'cart' | 'packages';

export interface ValidateCouponResult {
  valid: true;
  coupon: CouponRow;
  discountAmount: number;
  freeShipping: boolean;
  message?: string;
}

export interface ValidateCouponInvalid {
  valid: false;
  message: string;
}

export type ValidateCouponResponse = ValidateCouponResult | ValidateCouponInvalid;

/** Normalize code for lookup (uppercase, trim) */
export function normalizeCouponCode(code: string): string {
  return code.replace(/\s+/g, ' ').trim().toUpperCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

/**
 * Validate a coupon for the given context and cart.
 * Returns valid + discount details or invalid with generic message (no enumeration).
 */
export async function validateCoupon(
  supabase: SupabaseClient,
  params: {
    code: string;
    subtotal: number;
    context: ValidateContext;
    customerEmail?: string | null;
    customerId?: string | null;
  }
): Promise<ValidateCouponResponse> {
  const { code, subtotal, context, customerEmail, customerId } = params;
  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    return { valid: false, message: 'Invalid or expired code.' };
  }

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', normalized)
    .single();

  if (error || !coupon) {
    return { valid: false, message: 'Invalid or expired code.' };
  }

  const now = new Date();

  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { valid: false, message: 'Invalid or expired code.' };
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { valid: false, message: 'Invalid or expired code.' };
  }

  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, message: 'Invalid or expired code.' };
  }

  if (coupon.applies_to === 'products_only' && context === 'packages') {
    return { valid: false, message: 'This code does not apply to this order.' };
  }

  if (coupon.min_cart_amount != null && subtotal < Number(coupon.min_cart_amount)) {
    return { valid: false, message: 'This code does not apply to your current cart.' };
  }

  if (coupon.usage_limit_per_customer != null && (customerId || customerEmail)) {
    let countQuery = supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id);
    if (customerId) {
      countQuery = countQuery.eq('customer_id', customerId);
    } else {
      countQuery = countQuery.ilike('customer_email', customerEmail!.trim());
    }
    const { count } = await countQuery;
    const usedByCustomer = count ?? 0;
    if (usedByCustomer >= coupon.usage_limit_per_customer) {
      return { valid: false, message: 'Invalid or expired code.' };
    }
  }

  let discountAmount = 0;
  if (coupon.discount_type === 'percent_cart') {
    discountAmount = (subtotal * Number(coupon.amount)) / 100;
    if (coupon.max_discount_amount != null) {
      discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
    }
  } else if (coupon.discount_type === 'fixed_cart') {
    discountAmount = Math.min(Number(coupon.amount), subtotal);
  }
  discountAmount = Math.round(discountAmount * 100) / 100;

  const freeShipping = coupon.free_shipping === true;

  return {
    valid: true,
    coupon: coupon as CouponRow,
    discountAmount,
    freeShipping,
  };
}

export interface OrderTotalsWithCoupon {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  shippingBreakdown: import('./shipping').ShippingBreakdown;
  taxAmount: number;
  total: number;
}

import {
  TAX_RATE,
  FREE_ECONOMY_THRESHOLD,
  groupCartByWarehouse,
  calculateShippingBreakdown,
  type ShipmentGroup,
  type ShippingBreakdown,
} from './shipping';
import type { CartItem } from './database.types';

/**
 * Compute order totals with coupon + multi-warehouse shipping.
 * - Tax is applied to (subtotal - discountAmount).
 * - Free shipping (coupon or threshold): covers economy on all shipments.
 * - Express only applies to primary shipment; secondary is always economy.
 */
export function calculateOrderTotalsWithCoupon(
  subtotal: number,
  shippingMethod: ShippingMethod,
  couponResult: { discountAmount: number; freeShipping: boolean } | null,
  items?: CartItem[],
): OrderTotalsWithCoupon {
  const discountAmount = couponResult?.discountAmount ?? 0;
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxable * TAX_RATE * 100) / 100;

  const shipments = items ? groupCartByWarehouse(items) : [];
  const couponFreeShipping = couponResult?.freeShipping ?? false;

  let shippingBreakdown: ShippingBreakdown;
  if (shipments.length > 0) {
    shippingBreakdown = calculateShippingBreakdown(
      shipments,
      shippingMethod,
      subtotal,
      couponFreeShipping,
    );
  } else {
    // Fallback for calls without items (legacy compat) — single-shipment behavior
    let cost = shippingMethod === 'same_day' ? 25 : 15;
    if (shippingMethod === 'economy' && subtotal >= FREE_ECONOMY_THRESHOLD) cost = 0;
    if (couponFreeShipping && shippingMethod === 'economy') cost = 0;
    shippingBreakdown = {
      shipments: [{ warehouse: 'ss_activewear' as const, method: shippingMethod, cost, isFree: cost === 0 }],
      totalShippingCost: cost,
    };
  }

  const shippingCost = shippingBreakdown.totalShippingCost;
  const total = Math.round((subtotal - discountAmount + shippingCost + taxAmount) * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    shippingCost,
    shippingBreakdown,
    taxAmount,
    total,
  };
}
