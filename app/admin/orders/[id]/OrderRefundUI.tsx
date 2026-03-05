'use client';

import { useState } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';

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
};

type Props = {
  orderId: string;
  orderNumber: string;
  total: number;
  totalRefunded: number;
  items: OrderItem[];
  paymentStatus: string;
  stripeChargeId: string | null;
};

function lineTotal(item: OrderItem): number {
  const price = item.discountedPrice ?? item.unitPrice ?? 0;
  const qty = item.quantity ?? 1;
  return price * qty;
}

export function OrderRefundUI({
  orderId,
  orderNumber,
  total,
  totalRefunded,
  items,
  paymentStatus,
  stripeChargeId,
}: Props) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [refundMode, setRefundMode] = useState<'full' | 'partial' | null>(null);
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
                      {item.brandName} {item.styleName}
                      {(item.colorName || item.sizeName) && (
                        <span className="text-stone-500">
                          {' '}
                          · {[item.colorName, item.sizeName].filter(Boolean).join(' / ')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-700">
                      {item.quantity ?? 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-700">
                      $
                      {(
                        (item.discountedPrice ?? item.unitPrice ?? 0)
                      ).toFixed(2)}
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
                  : partialAmount.toFixed(2)}
              </strong>{' '}
              for order <strong>{orderNumber}</strong>. The customer will receive an email
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
