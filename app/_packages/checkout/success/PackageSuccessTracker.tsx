'use client';

import { useEffect } from 'react';
import { trackPurchase } from '@/lib/analytics';

interface PackageSuccessTrackerProps {
  orderNumber: string;
}

export function PackageSuccessTracker({ orderNumber }: PackageSuccessTrackerProps) {
  useEffect(() => {
    if (!orderNumber) return;

    const fetchAndTrack = async () => {
      try {
        const res = await fetch(`/api/checkout/order?order=${orderNumber}`);
        const data = await res.json();

        if (!data.orderNumber) return;

        const purchaseValue = (data.total || 0) / 100;

        await trackPurchase({
          transactionId: data.orderNumber,
          items: (data.lineItems || []).map((item: { item_id: string; item_name: string; price: number; quantity: number }) => ({
            sku: item.item_id,
            styleId: 0,
            styleName: '',
            productTitle: item.item_name,
            brandName: '',
            colorName: '',
            colorCode: '',
            sizeName: '',
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          value: purchaseValue,
          shipping: data.shippingCost || 0,
        });
      } catch (err) {
        console.error('[Package Success] Failed to track purchase:', err);
      }
    };

    fetchAndTrack();
  }, [orderNumber]);

  return null;
}
