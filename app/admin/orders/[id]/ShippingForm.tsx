'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck } from 'lucide-react';

interface ShippingFormProps {
  orderId: string;
}

const carriers = [
  { id: 'ups', label: 'UPS' },
  { id: 'fedex', label: 'FedEx' },
  { id: 'usps', label: 'USPS' },
  { id: 'dhl', label: 'DHL' },
  { id: 'other', label: 'Other' },
];

export function ShippingForm({ orderId }: ShippingFormProps) {
  const router = useRouter();
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!carrier || !trackingNumber.trim()) {
      setError('Both carrier and tracking number are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier,
          tracking_number: trackingNumber.trim(),
          status: 'shipped',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update tracking');
      }

      router.refresh();
    } catch (err) {
      console.error('Tracking update failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Truck className="h-4 w-4" />
        <span>No tracking info yet</span>
      </div>

      <div>
        <label htmlFor="carrier" className="mb-1 block text-xs font-medium text-slate-600">
          Carrier
        </label>
        <select
          id="carrier"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">Select carrier...</option>
          {carriers.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tracking" className="mb-1 block text-xs font-medium text-slate-600">
          Tracking Number
        </label>
        <input
          id="tracking"
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="1Z999AA10123456784"
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !carrier || !trackingNumber.trim()}
        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save & Mark Shipped'}
      </button>

      <p className="text-xs text-slate-400">
        This will mark the order as shipped and send a tracking email to the customer.
      </p>
    </form>
  );
}
