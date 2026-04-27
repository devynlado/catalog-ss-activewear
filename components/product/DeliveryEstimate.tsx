'use client';

import { useState, useCallback } from 'react';
import { Truck, Clock } from 'lucide-react';

interface Estimate {
  warehouseAbbr: string;
  daysInTransit: number;
  cutoffTime: string;
  estimatedDeliveryDate: string;
  orderByCutoff: boolean;
}

interface DeliveryEstimateProps {
  className?: string;
}

export function DeliveryEstimate({ className = '' }: DeliveryEstimateProps) {
  const [zip, setZip] = useState('');
  const [fastest, setFastest] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const checkDelivery = useCallback(async () => {
    if (zip.length < 5) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/delivery-estimate?zip=${zip.substring(0, 5)}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setFastest(data.fastest || null);
      setChecked(true);
    } catch {
      setFastest(null);
      setChecked(true);
    } finally {
      setLoading(false);
    }
  }, [zip]);

  const deliveryDate = fastest
    ? new Date(fastest.estimatedDeliveryDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Truck className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Delivery Estimate</span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={zip}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').substring(0, 5);
            setZip(val);
            if (val.length < 5) setChecked(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && checkDelivery()}
          placeholder="Enter ZIP code"
          maxLength={5}
          className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          onClick={checkDelivery}
          disabled={zip.length < 5 || loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Checking…' : 'Check'}
        </button>
      </div>

      {checked && fastest && deliveryDate && (
        <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3">
          <p className="text-sm font-medium text-green-800">
            Get it by {deliveryDate}
          </p>
          {fastest.orderByCutoff && (
            <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Order before {fastest.cutoffTime} to ship today
            </p>
          )}
          {!fastest.orderByCutoff && (
            <p className="text-xs text-green-600 mt-0.5">
              Ships next business day ({fastest.daysInTransit} day{fastest.daysInTransit !== 1 ? 's' : ''} in transit)
            </p>
          )}
        </div>
      )}

      {checked && !fastest && (
        <p className="mt-2 text-xs text-slate-500">
          Delivery estimate unavailable for this ZIP code. Standard delivery: 3-5 business days.
        </p>
      )}
    </div>
  );
}
