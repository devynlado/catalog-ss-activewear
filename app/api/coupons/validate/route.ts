import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { validateCoupon } from '@/lib/coupon-utils';
import type { ValidateContext } from '@/lib/coupon-utils';
import type { CartItem } from '@/lib/database.types';
import { prepareCartItemsForPricing } from '@/lib/cart-pricing-server';
import { getEffectiveItemPrice, hasTieredPricing } from '@/lib/tiered-pricing';

/** Minimal cart item shape for subtotal calculation (legacy clients) */
interface ValidateBodyItem {
  unitPrice: number;
  quantity: number;
  discountedPrice?: number;
}

interface ValidateBody {
  code: string;
  items: ValidateBodyItem[] | CartItem[];
  context?: ValidateContext;
}

function isFullCartItem(x: unknown): x is CartItem {
  return (
    typeof x === 'object' &&
    x !== null &&
    'styleId' in x &&
    'sizeName' in x &&
    'sku' in x &&
    typeof (x as CartItem).styleId === 'number'
  );
}

function subtotalFromPreparedCart(items: CartItem[]): number {
  const styleQtyMap = new Map<number, number>();
  for (const item of items) {
    if (hasTieredPricing(item.styleId)) {
      styleQtyMap.set(item.styleId, (styleQtyMap.get(item.styleId) || 0) + item.quantity);
    }
  }
  return items.reduce((sum, item) => {
    const tq = styleQtyMap.get(item.styleId) ?? 0;
    return sum + getEffectiveItemPrice(item, tq) * (item.quantity || 0);
  }, 0);
}

/**
 * POST /api/coupons/validate
 * Public, rate-limit in production (e.g. Vercel edge or middleware).
 * Returns generic message on invalid to avoid enumeration.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ValidateBody = await request.json();
    const { code, items = [], context = 'cart' } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, message: 'Invalid or expired code.' },
        { status: 400 }
      );
    }

    let subtotal = 0;
    if (Array.isArray(items) && items.length > 0 && isFullCartItem(items[0])) {
      const prepared = await prepareCartItemsForPricing(items as CartItem[]);
      subtotal = subtotalFromPreparedCart(prepared);
    } else {
      subtotal = (items as ValidateBodyItem[]).reduce(
        (sum, item) =>
          sum + (item.discountedPrice ?? item.unitPrice) * (item.quantity || 0),
        0,
      );
    }

    const supabase = createServerSupabaseClient();
    let customerId: string | null = null;
    let customerEmail: string | null = null;
    try {
      const authClient = await createSupabaseServerClient();
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        customerId = user.id;
        customerEmail = user.email ?? null;
      }
    } catch {
      // Proceed without customer for per-user limit
    }

    const result = await validateCoupon(supabase, {
      code,
      subtotal,
      context,
      customerId: customerId ?? undefined,
      customerEmail: customerEmail ?? undefined,
    });

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, message: result.message },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: result.coupon.code,
      couponId: result.coupon.id,
      discountAmount: result.discountAmount,
      freeShipping: result.freeShipping,
      message: result.message,
    });
  } catch {
    return NextResponse.json(
      { valid: false, message: 'Invalid or expired code.' },
      { status: 200 }
    );
  }
}
