'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, X, CheckCircle, Info } from 'lucide-react';
import { OrderCard, type Order } from './OrderCard';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  awaiting_purchasing: 'Awaiting Purchasing',
  ordered: 'Ordered',
  in_production: 'In Production',
  partially_shipped: 'Partially Shipped',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  awaiting_purchasing: 1,
  ordered: 2,
  in_production: 3,
  partially_shipped: 3.5,
  shipped: 4,
  delivered: 5,
  cancelled: 99,
};

// Targets exposed by the bulk action bar. Mirrors BULK_TARGET_STATUSES on the
// server (shipped/delivered intentionally excluded).
const BULK_TARGET_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'ordered', label: 'Ordered' },
  { id: 'in_production', label: 'In Production' },
  { id: 'cancelled', label: 'Cancelled' },
];

type OrderResult = {
  id: string;
  order_number: string | null;
  outcome: 'updated' | 'skipped';
  reason?: string;
};

type BulkResponse = {
  results: OrderResult[];
  summary: { updated: number; skipped: number };
  paidCancelledOrders: Array<{ id: string; order_number: string | null }>;
};

function willSkip(order: Order, target: string): string | null {
  if (order.status === target) return `Already ${STATUS_LABELS[target] ?? target}`;
  if (target === 'cancelled') {
    if (order.status === 'shipped' || order.status === 'delivered') {
      return `Cannot cancel a ${STATUS_LABELS[order.status] ?? order.status} order`;
    }
    return null;
  }
  const currentRank = STATUS_ORDER[order.status] ?? 0;
  const targetRank = STATUS_ORDER[target] ?? 0;
  if (targetRank <= currentRank) {
    return `Cannot move ${STATUS_LABELS[order.status] ?? order.status} to ${STATUS_LABELS[target] ?? target}`;
  }
  return null;
}

export function OrdersListClient({
  orders,
  chatUnreadMap,
}: {
  orders: Order[];
  chatUnreadMap: Record<string, number>;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetStatus, setTargetStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkResponse | null>(null);
  const lastIndexRef = useRef<number | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const orderIndex = useMemo(() => {
    const m = new Map<string, number>();
    orders.forEach((o, i) => m.set(o.id, i));
    return m;
  }, [orders]);

  const toggleSelect = (id: string, event: React.MouseEvent) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const idx = orderIndex.get(id) ?? -1;

      // Shift-click selects the contiguous range from the last clicked row.
      if (event.shiftKey && lastIndexRef.current !== null && idx >= 0) {
        const [start, end] = [lastIndexRef.current, idx].sort((a, b) => a - b);
        const shouldSelect = !next.has(id);
        for (let i = start; i <= end; i++) {
          const rowId = orders[i]?.id;
          if (!rowId) continue;
          if (shouldSelect) next.add(rowId);
          else next.delete(rowId);
        }
      } else {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      lastIndexRef.current = idx;
      return next;
    });
  };

  const allSelected = orders.length > 0 && selectedIds.size === orders.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Keep the header checkbox's indeterminate state in sync.
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === orders.length) return new Set();
      return new Set(orders.map((o) => o.id));
    });
    lastIndexRef.current = null;
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    lastIndexRef.current = null;
  };

  const selectedOrders = useMemo(
    () => orders.filter((o) => selectedIds.has(o.id)),
    [orders, selectedIds]
  );

  // Preview breakdown for the confirmation modal.
  const preview = useMemo(() => {
    const skipped: Array<{ order: Order; reason: string }> = [];
    const willApply: Order[] = [];
    for (const o of selectedOrders) {
      const reason = willSkip(o, targetStatus);
      if (reason) skipped.push({ order: o, reason });
      else willApply.push(o);
    }
    const paidToCancel =
      targetStatus === 'cancelled'
        ? willApply.filter((o) => o.payment_status === 'paid')
        : [];
    return { skipped, willApply, paidToCancel };
  }, [selectedOrders, targetStatus]);

  const openConfirm = () => {
    if (!targetStatus || selectedIds.size === 0) return;
    setError(null);
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/orders/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: Array.from(selectedIds),
          status: targetStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bulk update failed');
      }
      setResult(data as BulkResponse);
      setModalOpen(false);
      setSelectedIds(new Set());
      setTargetStatus('');
      lastIndexRef.current = null;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isCancel = targetStatus === 'cancelled';

  return (
    <div>
      {/* Result banner (persists after action until dismissed) */}
      {result && (
        <div className="mb-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <div className="text-sm text-slate-700">
                <p className="font-medium text-navy-800">
                  {result.summary.updated} order{result.summary.updated !== 1 ? 's' : ''} updated
                  {result.summary.skipped > 0 && (
                    <span className="text-slate-500">
                      {' '}· {result.summary.skipped} skipped
                    </span>
                  )}
                </p>
                {result.summary.skipped > 0 && (
                  <ul className="mt-1 list-inside list-disc text-xs text-slate-500">
                    {result.results
                      .filter((r) => r.outcome === 'skipped')
                      .slice(0, 8)
                      .map((r) => (
                        <li key={r.id}>
                          {r.order_number || r.id.slice(0, 8)} — {r.reason}
                        </li>
                      ))}
                  </ul>
                )}
                {result.paidCancelledOrders.length > 0 && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Manual refund required
                    </div>
                    <p className="mt-1">
                      These cancelled orders were already paid — process their refunds
                      manually, one by one:
                    </p>
                    <p className="mt-1 font-medium">
                      {result.paidCancelledOrders
                        .map((o) => o.order_number || o.id.slice(0, 8))
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setResult(null)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Selection toolbar */}
      <div className="mb-3 flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="h-4 w-4 cursor-pointer rounded border-stone-300 text-brand-600 focus:ring-brand-500/30"
          />
          Select all on page
        </label>
        {selectedIds.size > 0 && (
          <span className="text-xs text-slate-400">{selectedIds.size} selected</span>
        )}
      </div>

      {/* Order list */}
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            unreadChatCount={chatUnreadMap[order.id] || 0}
            selectable
            selected={selectedIds.has(order.id)}
            onToggleSelect={toggleSelect}
          />
        ))}
      </div>

      {/* Sticky bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-30 mt-4">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
            <span className="text-sm font-medium text-navy-800">
              {selectedIds.size} selected
            </span>
            <div className="flex flex-1 items-center gap-2">
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Change status to…</option>
                {BULK_TARGET_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={openConfirm}
                disabled={!targetStatus}
                className="rounded-lg bg-navy-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
            <button
              onClick={clearSelection}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-stone-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !submitting && setModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 p-4">
              <h3 className="text-lg font-semibold text-navy-800">
                {isCancel ? 'Cancel orders' : `Mark as ${STATUS_LABELS[targetStatus] ?? targetStatus}`}
              </h3>
              <button
                onClick={() => !submitting && setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
              <p className="text-sm text-slate-600">
                {preview.willApply.length > 0 ? (
                  <>
                    You are about to change{' '}
                    <span className="font-semibold text-navy-800">
                      {preview.willApply.length} order
                      {preview.willApply.length !== 1 ? 's' : ''}
                    </span>{' '}
                    to{' '}
                    <span className="font-semibold text-navy-800">
                      {STATUS_LABELS[targetStatus] ?? targetStatus}
                    </span>
                    .
                  </>
                ) : (
                  <span className="text-slate-500">
                    None of the selected orders can be changed to{' '}
                    {STATUS_LABELS[targetStatus] ?? targetStatus}.
                  </span>
                )}
              </p>

              {isCancel && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  Cancelling here does not cancel any supplier (SS Activewear) purchase
                  orders — handle those manually if needed.
                </p>
              )}

              {/* Orders that will be changed */}
              {preview.willApply.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Will be {isCancel ? 'cancelled' : 'updated'} ({preview.willApply.length})
                  </p>
                  <div className="rounded-lg border border-stone-200">
                    {preview.willApply.map((o) => {
                      const isPaid = o.payment_status === 'paid';
                      return (
                        <div
                          key={o.id}
                          className="flex items-center justify-between gap-2 border-b border-stone-100 px-3 py-2 text-sm last:border-b-0"
                        >
                          <span className="font-medium text-slate-700">{o.order_number}</span>
                          <span className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{STATUS_LABELS[o.status] ?? o.status}</span>
                            {isCancel && isPaid && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                                Paid · refund manually
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Manual-refund warning */}
              {isCancel && preview.paidToCancel.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {preview.paidToCancel.length} paid order
                    {preview.paidToCancel.length !== 1 ? 's' : ''} — refund manually
                  </div>
                  <p className="mt-1">
                    Cancelling does not issue any refund. Process refunds for these orders
                    manually, one by one:
                  </p>
                  <p className="mt-1 font-medium">
                    {preview.paidToCancel.map((o) => o.order_number).join(', ')}
                  </p>
                </div>
              )}

              {/* Orders that will be skipped */}
              {preview.skipped.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Will be skipped ({preview.skipped.length})
                  </p>
                  <div className="rounded-lg border border-stone-200 bg-stone-50">
                    {preview.skipped.map(({ order: o, reason }) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between gap-2 border-b border-stone-100 px-3 py-2 text-sm last:border-b-0"
                      >
                        <span className="font-medium text-slate-500">{o.order_number}</span>
                        <span className="text-xs text-slate-400">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-stone-100 p-4">
              <button
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-stone-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting || preview.willApply.length === 0}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  isCancel ? 'bg-red-600 hover:bg-red-700' : 'bg-navy-800 hover:bg-navy-900'
                }`}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isCancel
                  ? `Cancel ${preview.willApply.length} order${preview.willApply.length !== 1 ? 's' : ''}`
                  : `Update ${preview.willApply.length} order${preview.willApply.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
