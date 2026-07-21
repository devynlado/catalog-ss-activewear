'use client';

import { useState } from 'react';
import { RotateCcw, Loader2, Truck } from 'lucide-react';

type OrderItem = {
  type?: string;
  sku?: string;
  styleName?: string;
  brandName?: string;
  colorName?: string;
  sizeName?: string;
  quantity?: number;
  unitPrice?: number;
  discountedPrice?: number;
  // Package-order fields (written by /api/packages/checkout). Present only when
  // type === 'package'. Kept optional so we don't have to widen the type at
  // every call site — the branch on `type === 'package'` in the render/helpers
  // is what actually gates access.
  productName?: string;
  packageType?: string;
  totalQuantity?: number;
  pricePerHat?: number;
  subtotal?: number;
};

type Props = {
  orderId: string;
  orderNumber: string;
  total: number;
  totalRefunded: number;
  shippingCost: number;
  items: OrderItem[];
  paymentStatus: string;
  stripeChargeId: string | null;
};

// Human-readable labels for the packageType union in /api/packages/checkout.
// Duplicated (intentionally) with the map in app/admin/orders/[id]/page.tsx —
// keeping this component self-contained; if we grow more package types we'll
// pull this into a shared helper.
const PACKAGE_TYPE_LABELS: Record<string, string> = {
  'embroidered-caps': 'Embroidered Caps',
  'trucker-caps': 'Trucker Caps',
  'snapback-caps': 'Snapback Caps',
  'dad-caps': 'Dad Caps',
  beanies: 'Beanies',
  'printed-tees-gildan': 'Printed Tees (Gildan)',
  'printed-tees-comfort-colors': 'Printed Tees (Comfort Colors)',
  'printed-totes-isabella': 'Printed Tote Bags',
};

function formatPackageTypeLabel(pkg: string | undefined | null): string {
  if (!pkg) return 'Custom Package';
  return (
    PACKAGE_TYPE_LABELS[pkg] ||
    pkg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function lineTotal(item: OrderItem): number {
  // Package items don't carry `unitPrice`/`quantity` — they store the whole-order
  // number as `subtotal` (or you can compute it as pricePerHat * totalQuantity).
  // Falling through to the old regex would return $0 for these lines, which is
  // the exact bug that made partial refunds unusable for package orders.
  if (item.type === 'package') {
    if (typeof item.subtotal === 'number') return item.subtotal;
    const pph = Number(item.pricePerHat) || 0;
    const tq = Number(item.totalQuantity) || 0;
    return pph * tq;
  }
  const price = item.discountedPrice ?? item.unitPrice ?? 0;
  const qty = item.quantity ?? 1;
  return price * qty;
}

export function OrderRefundUI({
  orderId,
  orderNumber,
  total,
  totalRefunded,
  shippingCost,
  items,
  paymentStatus,
  stripeChargeId,
}: Props) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [refundMode, setRefundMode] = useState<'full' | 'partial' | 'custom' | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const maxRefundable = total - totalRefunded;
  const canRefundFull = stripeChargeId && paymentStatus !== 'refunded' && maxRefundable > 0;
  const partialAmount = Array.from(selectedIndices).reduce(
    (sum, i) => sum + lineTotal(items[i]),
    0
  );
  const canRefundPartial =
    stripeChargeId &&
    paymentStatus !== 'refunded' &&
    selectedIndices.size > 0 &&
    partialAmount > 0 &&
    partialAmount <= maxRefundable;

  const parsedCustom = parseFloat(customAmount);
  const canRefundCustom =
    stripeChargeId &&
    paymentStatus !== 'refunded' &&
    !isNaN(parsedCustom) &&
    parsedCustom > 0 &&
    parsedCustom <= maxRefundable;

  const toggleLine = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const openFullModal = () => {
    setRefundMode('full');
    setModalOpen(true);
    setError(null);
  };

  const openPartialModal = () => {
    setRefundMode('partial');
    setModalOpen(true);
    setError(null);
  };

  const openCustomModal = () => {
    setRefundMode('custom');
    setModalOpen(true);
    setError(null);
  };

  const prefillShipping = () => {
    const amount = Math.min(shippingCost, maxRefundable);
    setCustomAmount(amount.toFixed(2));
  };

  const closeModal = () => {
    setModalOpen(false);
    setRefundMode(null);
    setReason('');
    setNote('');
    setError(null);
  };

  const confirmRefund = async () => {
    if (!refundMode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullOrder: refundMode === 'full',
          lineIndices: refundMode === 'partial' ? Array.from(selectedIndices) : undefined,
          customAmount: refundMode === 'custom' ? parsedCustom : undefined,
          reason: reason || undefined,
          note: note || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Refund failed');
        return;
      }
      setSuccess(true);
      closeModal();
      setSelectedIndices(new Set());
      window.location.reload();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!stripeChargeId || paymentStatus === 'refunded') {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        {paymentStatus === 'refunded'
          ? 'This order is fully refunded.'
          : 'This order cannot be refunded (no charge on file).'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openFullModal}
          disabled={!canRefundFull}
          className="inline-flex items-center gap-2 rounded-lg bg-navy-700 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="h-4 w-4" />
          Refund full order
        </button>
        {items.length > 0 && (
          <button
            type="button"
            onClick={openPartialModal}
            disabled={!canRefundPartial}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refund selected items
          </button>
        )}
      </div>

      {/* Shipping / Custom Amount Refund */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Shipping / Custom Refund
        </p>
        <div className="flex flex-wrap items-end gap-3">
          {shippingCost > 0 && (
            <button
              type="button"
              onClick={() => { prefillShipping(); }}
              disabled={maxRefundable <= 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Truck className="h-4 w-4" />
              Refund shipping (${Math.min(shippingCost, maxRefundable).toFixed(2)})
            </button>
          )}
          <div className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Custom amount
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxRefundable}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-32 rounded-lg border border-stone-200 bg-white py-2 pl-6 pr-2.5 text-sm text-slate-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={openCustomModal}
              disabled={!canRefundCustom}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy-700 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refund
            </button>
          </div>
          {maxRefundable > 0 && (
            <span className="text-xs text-slate-400 self-end pb-2">
              Max: ${maxRefundable.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="w-10 px-4 py-2 text-left text-xs font-medium text-stone-500">
                  Refund
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-stone-600">Product</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-stone-600">Qty</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-stone-600">Price</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-stone-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {items.map((item, index) => {
                const totalLine = lineTotal(item);
                const isPackage = item.type === 'package';
                const displayQty = isPackage
                  ? Number(item.totalQuantity) || 0
                  : item.quantity ?? 1;
                const displayUnitPrice = isPackage
                  ? Number(item.pricePerHat) || 0
                  : item.discountedPrice ?? item.unitPrice ?? 0;

                return (
                  <tr key={index} className="hover:bg-stone-50/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(index)}
                        onChange={() => toggleLine(index)}
                        className="h-4 w-4 rounded border-stone-300 text-navy-600 focus:ring-navy-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      {isPackage ? (
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {item.productName || 'Custom Package'}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                            {formatPackageTypeLabel(item.packageType)}
                          </span>
                        </span>
                      ) : (
                        <>
                          {item.brandName} {item.styleName}
                          {(item.colorName || item.sizeName) && (
                            <span className="text-stone-500">
                              {' '}
                              · {[item.colorName, item.sizeName].filter(Boolean).join(' / ')}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-700">
                      {displayQty}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-700">
                      ${displayUnitPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right text-slate-800">
                      ${totalLine.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-navy-800">Confirm refund</h3>
            <p className="mt-2 text-sm text-slate-600">
              You are about to refund{' '}
              <strong>
                $
                {refundMode === 'full'
                  ? maxRefundable.toFixed(2)
                  : refundMode === 'custom'
                    ? parsedCustom.toFixed(2)
                    : partialAmount.toFixed(2)}
              </strong>
              {refundMode === 'custom' && parsedCustom === shippingCost && (
                <span className="text-brand-600"> (shipping cost)</span>
              )}
              {' '}for order <strong>{orderNumber}</strong>. The customer will receive an email
              confirmation.
            </p>
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Reason (optional)
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-slate-800"
              >
                <option value="">Select...</option>
                <option value="customer_request">Customer request</option>
                <option value="shipping_refund">Shipping cost refund</option>
                <option value="defective">Defective / Wrong item</option>
                <option value="duplicate">Duplicate order</option>
                <option value="other">Other</option>
              </select>
              <label className="block text-sm font-medium text-slate-700">
                Internal note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Customer called 2/27"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-slate-800 placeholder:text-stone-400"
              />
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRefund}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-navy-700 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  'Confirm refund'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Refund processed. The page will refresh to show the updated amount.
        </div>
      )}
    </div>
  );
}
