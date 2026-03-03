'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

export interface OrderRefundItem {
  index: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OrderRefundUIProps {
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  paymentStatus: string;
  items: OrderRefundItem[];
  totalRefunded: number;
  hasStripeCharge: boolean;
}

export function OrderRefundUI({
  orderId,
  orderNumber,
  orderTotal,
  paymentStatus,
  items,
  totalRefunded,
  hasStripeCharge,
}: OrderRefundUIProps) {
  const router = useRouter();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'partial' | null>(null);
  const [reason, setReason] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxRefundable = Math.round((orderTotal - totalRefunded) * 100) / 100;
  const isFullyRefunded = paymentStatus === 'refunded' || maxRefundable <= 0;

  const toggleItem = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const openFullRefundModal = () => {
    setRefundType('full');
    setError(null);
    setModalOpen(true);
  };

  const openPartialRefundModal = () => {
    if (selectedIndices.size === 0) {
      setError('Select at least one item to refund.');
      return;
    }
    setRefundType('partial');
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setRefundType(null);
    setReason('');
    setInternalNote('');
    setError(null);
  };

  const handleConfirmRefund = async () => {
    if (!refundType) return;
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        reason: reason.trim() || undefined,
        internalNote: internalNote.trim() || undefined,
      };
      if (refundType === 'full') {
        body.fullRefund = true;
      } else {
        body.lineItemIndices = Array.from(selectedIndices).sort((a, b) => a - b);
      }
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Refund failed (${res.status})`);
      }
      closeModal();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refund failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasStripeCharge) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
        <strong>Refunds:</strong> This order has no Stripe charge (e.g. $0 order). Refunds cannot be processed via this tool.
      </div>
    );
  }

  if (isFullyRefunded) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-slate-600">
        This order has been fully refunded.
      </div>
    );
  }

  const partialAmount = Array.from(selectedIndices).reduce(
    (sum, i) => sum + (items.find((it) => it.index === i)?.total ?? 0),
    0
  );

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-navy-800 mb-4">Refund</h2>
      {totalRefunded > 0 && (
        <p className="text-sm text-slate-600 mb-4">
          Already refunded: {formatPrice(totalRefunded)}. Max refundable: {formatPrice(maxRefundable)}.
        </p>
      )}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={openFullRefundModal} variant="primary" size="sm" className="bg-navy-700 hover:bg-navy-800 text-white">
            <RefreshCw className="h-4 w-4 mr-1.5 shrink-0" />
            Refund full order
          </Button>
          <Button
            onClick={openPartialRefundModal}
            variant="secondary"
            size="sm"
            disabled={selectedIndices.size === 0}
          >
            Refund selected items
          </Button>
        </div>
        <div className="overflow-x-auto border border-stone-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left text-slate-500">
                <th className="py-2 pl-4 pr-2 font-medium w-12">Refund</th>
                <th className="py-2 px-2 font-medium">Product</th>
                <th className="py-2 px-2 font-medium text-right">Qty</th>
                <th className="py-2 px-2 font-medium text-right">Price</th>
                <th className="py-2 pr-4 pl-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.index} className="border-b border-stone-100 last:border-b-0">
                  <td className="py-3 pl-4 pr-2 align-middle">
                    <input
                      type="checkbox"
                      checked={selectedIndices.has(item.index)}
                      onChange={() => toggleItem(item.index)}
                      className="h-4 w-4 rounded border-stone-300 text-navy-600 focus:ring-navy-500"
                    />
                  </td>
                  <td className="py-3 px-2 font-medium text-slate-900">{item.name}</td>
                  <td className="py-3 px-2 text-right text-slate-700">{item.quantity}</td>
                  <td className="py-3 px-2 text-right text-slate-700">{formatPrice(item.unitPrice)}</td>
                  <td className="py-3 pr-4 pl-2 text-right font-medium text-slate-900">{formatPrice(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && refundType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-navy-800">
              {refundType === 'full' ? 'Refund full order?' : 'Refund selected items?'}
            </h3>
            <p className="text-sm text-slate-600">
              {refundType === 'full'
                ? `Refund ${formatPrice(maxRefundable)} to the customer. They will receive a confirmation email.`
                : `Refund ${formatPrice(partialAmount)} for the selected items. The customer will receive a confirmation email.`}
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Reason (optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Customer request"
                className="w-full rounded border border-stone-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Internal note (optional)</label>
              <input
                type="text"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Not sent to customer"
                className="w-full rounded border border-stone-200 px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={closeModal} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleConfirmRefund} disabled={submitting}>
                {submitting ? 'Processing…' : 'Confirm refund'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
