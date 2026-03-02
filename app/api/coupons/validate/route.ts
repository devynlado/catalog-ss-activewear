import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { validateCoupon } from '@/lib/coupon-utils';
import type { ValidateContext } from '@/lib/coupon-utils';

/** Minimal cart item shape for subtotal calculation */
interface ValidateBodyItem {
  unitPrice: number;
  quantity: number;
  discountedPrice?: number;
}

interface ValidateBody {
  code: string;
  items: ValidateBodyItem[];
  context?: ValidateContext;
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

    const subtotal = items.reduce(
      (sum, item) =>
        sum + (item.discountedPrice ?? item.unitPrice) * (item.quantity || 0),
      0
    );

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
