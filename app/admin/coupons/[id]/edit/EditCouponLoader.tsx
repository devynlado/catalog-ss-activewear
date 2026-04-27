'use client';

import { useEffect, useState } from 'react';
import { CouponForm } from '../../CouponForm';
import type { CouponRecord } from '../../CouponsClient';

export function EditCouponLoader({ couponId }: { couponId: string }) {
  const [coupon, setCoupon] = useState<CouponRecord | null | 'loading'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/coupons/${couponId}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setCoupon(data);
      })
      .catch(() => {
        if (!cancelled) setCoupon(null);
      });
    return () => {
      cancelled = true;
    };
  }, [couponId]);

  if (coupon === 'loading') {
    return <div className="text-slate-500">Loading…</div>;
  }
  if (coupon === null) {
    return <div className="text-red-600">Coupon not found.</div>;
  }
  return <CouponForm initial={coupon} isNew={false} />;
}
