'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Package, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface Shipment {
  id: string;
  shipment_index: number;
  warehouse: string;
  shipping_method: string | null;
  shipping_cost: number;
  actual_shipping_cost: number | null;
  carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  items: unknown;
}

interface ShippingFormProps {
  orderId: string;
  shipments?: Shipment[];
}

interface EmailStatus {
  sent: boolean;
  error?: string;
  skippedReason?: string;
}

const carriers = [
  { id: 'ups', label: 'UPS' },
  { id: 'fedex', label: 'FedEx' },
  { id: 'usps', label: 'USPS' },
  { id: 'dhl', label: 'DHL' },
  { id: 'other', label: 'Other' },
];

const WAREHOUSE_LABELS: Record<string, string> = {
  ss_activewear: 'SS Activewear',
  los_angeles_apparel: 'LA Apparel',
  as_colour: 'AS Colour',
};

function EmailStatusBanner({ emailStatus }: { emailStatus: EmailStatus }) {
  if (emailStatus.sent) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
        <p className="text-xs text-green-700">Shipping confirmation email sent to customer.</p>
      </div>
    );
  }

  if (emailStatus.skippedReason) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">Email not sent: {emailStatus.skippedReason}</p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
      <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
      <p className="text-xs text-red-700">
        Email failed to send{emailStatus.error ? `: ${emailStatus.error}` : ''}. 
        Use the &quot;Resend Email&quot; button to retry.
      </p>
    </div>
  );
}

function SingleShipmentForm({ orderId, shipmentId, warehouseLabel }: {
  orderId: string;
  shipmentId?: string;
  warehouseLabel?: string;
}) {
  const router = useRouter();
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [actualShippingCost, setActualShippingCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!carrier || !trackingNumber.trim()) {
      setError('Both carrier and tracking number are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setEmailStatus(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier,
          tracking_number: trackingNumber.trim(),
          status: 'shipped',
          ...(actualShippingCost ? { actual_shipping_cost: actualShippingCost } : {}),
          ...(shipmentId ? { shipment_id: shipmentId } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tracking');
      }

      if (data.emailStatus) {
        setEmailStatus(data.emailStatus);
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
        <span>
          {warehouseLabel ? `Add tracking for ${warehouseLabel}` : 'No tracking info yet'}
        </span>
      </div>

      <div>
        <label htmlFor={`carrier-${shipmentId || 'single'}`} className="mb-1 block text-xs font-medium text-slate-600">
          Carrier
        </label>
        <select
          id={`carrier-${shipmentId || 'single'}`}
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
        <label htmlFor={`tracking-${shipmentId || 'single'}`} className="mb-1 block text-xs font-medium text-slate-600">
          Tracking Number
        </label>
        <input
          id={`tracking-${shipmentId || 'single'}`}
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="1Z999AA10123456784"
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div>
        <label htmlFor={`cost-${shipmentId || 'single'}`} className="mb-1 block text-xs font-medium text-slate-600">
          Actual Shipping Cost <span className="text-slate-400">(optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
          <input
            id={`cost-${shipmentId || 'single'}`}
            type="number"
            step="0.01"
            min="0"
            value={actualShippingCost}
            onChange={(e) => setActualShippingCost(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-7 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <p className="mt-0.5 text-[11px] text-slate-400">What you paid the carrier</p>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {emailStatus && <EmailStatusBanner emailStatus={emailStatus} />}

      <button
        type="submit"
        disabled={isSubmitting || !carrier || !trackingNumber.trim()}
        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save & Mark Shipped'}
      </button>

      <p className="text-xs text-slate-400">
        This will mark the {warehouseLabel ? 'shipment' : 'order'} as shipped and send a tracking email.
      </p>
    </form>
  );
}

export function ShippingForm({ orderId, shipments }: ShippingFormProps) {
  if (!shipments || shipments.length <= 1) {
    return <SingleShipmentForm orderId={orderId} />;
  }

  const unshippedShipments = shipments.filter(s => !s.tracking_number);

  if (unshippedShipments.length === 0) {
    return (
      <div className="text-sm text-green-600 font-medium flex items-center gap-2">
        <Package className="h-4 w-4" />
        All shipments have tracking
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unshippedShipments.map((shipment) => (
        <div key={shipment.id} className="border-b border-stone-100 pb-4 last:border-0 last:pb-0">
          <SingleShipmentForm
            orderId={orderId}
            shipmentId={shipment.id}
            warehouseLabel={WAREHOUSE_LABELS[shipment.warehouse] || shipment.warehouse}
          />
        </div>
      ))}
    </div>
  );
}
