'use client';

import { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  RefreshCw,
  XCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  FileText,
  Timer,
} from 'lucide-react';

interface SSOrder {
  id: string;
  ss_order_number: string;
  ss_invoice_number: string | null;
  ss_guid: string;
  ss_warehouse: string | null;
  ss_order_status: string | null;
  ss_delivery_status: string | null;
  ss_expected_delivery_date: string | null;
  ss_ship_date: string | null;
  ss_tracking_number: string | null;
  ss_carrier: string | null;
  ss_subtotal: number | null;
  ss_shipping: number | null;
  ss_total: number | null;
  ss_total_weight: number | null;
  ss_total_boxes: number | null;
  line_errors: Array<{ sku: string; error: string }> | null;
  placed_at: string;
  last_polled_at: string | null;
}

/** After payment, wait this long before offering manual "Place SS order" (avoids racing the Stripe webhook auto-place). */
const STALE_AWAITING_MS = 3 * 60 * 1000;

interface SSActivewearSectionProps {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  paidAt: string | null;
  ssAutoOrderFailed: boolean;
  ssAutoOrderError: string | null;
  ssOrders: SSOrder[];
}

const SS_STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  'In Progress': { color: 'text-blue-600 bg-blue-50', icon: <Clock className="h-3.5 w-3.5" /> },
  'InProgress': { color: 'text-blue-600 bg-blue-50', icon: <Clock className="h-3.5 w-3.5" /> },
  Shipped: { color: 'text-green-600 bg-green-50', icon: <Truck className="h-3.5 w-3.5" /> },
  Completed: { color: 'text-emerald-600 bg-emerald-50', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  Cancelled: { color: 'text-red-600 bg-red-50', icon: <XCircle className="h-3.5 w-3.5" /> },
};

const WAREHOUSE_NAMES: Record<string, string> = {
  IL: 'Lockport, IL',
  NV: 'Reno, NV',
  NJ: 'Robbinsville, NJ',
  KS: 'Olathe, KS',
  GA: 'McDonough, GA',
  TX: 'Fort Worth, TX',
  FL: 'Pompano Beach, FL',
  OH: 'West Chester, OH',
  DS: 'Dropship',
};

export function SSActivewearSection({
  orderId,
  orderStatus,
  paymentStatus,
  paidAt,
  ssAutoOrderFailed,
  ssAutoOrderError,
  ssOrders: initialSSOrders,
}: SSActivewearSectionProps) {
  const [ssOrders, setSSOrders] = useState<SSOrder[]>(initialSSOrders);
  const [isRetrying, setIsRetrying] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasOrders = ssOrders.length > 0;
  // Re-render periodically so "Place SS order" appears after the stale window without a full page refresh.
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const paidAtMs = paidAt ? new Date(paidAt).getTime() : 0;
  const isStaleAwaiting =
    paymentStatus === 'paid' &&
    orderStatus === 'awaiting_purchasing' &&
    !hasOrders &&
    paidAtMs > 0 &&
    clock - paidAtMs > STALE_AWAITING_MS;

  // Retry/place: explicit failure, or paid + still no ss_orders after webhook window (covers old "silent skip" rows).
  const canRetry =
    orderStatus === 'awaiting_purchasing' &&
    paymentStatus === 'paid' &&
    !hasOrders &&
    (ssAutoOrderFailed || isStaleAwaiting);

  const retryButtonLabel =
    ssAutoOrderFailed ? 'Retry order' : 'Place SS order';

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/ss-order`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to place SS order');
        return;
      }

      if (data && typeof data === 'object' && 'success' in data && data.success === false) {
        setError(
          typeof data.error === 'string' && data.error.trim()
            ? data.error
            : 'S&S could not place this order (see message above or SS Activity log).'
        );
        return;
      }

      window.location.reload();
    } catch {
      setError('Failed to retry order');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCancel = async (ssOrderNumber: string) => {
    if (!confirm(`Cancel SS order #${ssOrderNumber}? This cannot be undone.`)) return;

    setCancellingOrder(ssOrderNumber);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/ss-cancel`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ss_order_number: ssOrderNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to cancel SS order');
        return;
      }

      window.location.reload();
    } catch {
      setError('Failed to cancel order');
    } finally {
      setCancellingOrder(null);
    }
  };

  function getCancelTimeRemaining(placedAt: string): { canCancel: boolean; timeLeft: string } {
    const placed = new Date(placedAt).getTime();
    const deadline = placed + 10 * 60 * 1000;
    const remaining = deadline - Date.now();

    if (remaining <= 0) return { canCancel: false, timeLeft: 'Expired' };

    const minutes = Math.floor(remaining / 60_000);
    const seconds = Math.floor((remaining % 60_000) / 1000);
    return { canCancel: true, timeLeft: `${minutes}m ${seconds}s` };
  }

  // Auto-refresh cancel timer
  const [, setTick] = useState(0);
  useEffect(() => {
    const hasRecentOrders = ssOrders.some(o => {
      const elapsed = Date.now() - new Date(o.placed_at).getTime();
      return elapsed < 10 * 60 * 1000 && o.ss_order_status !== 'Cancelled';
    });

    if (!hasRecentOrders) return;

    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [ssOrders]);

  if (!hasOrders && !ssAutoOrderFailed && orderStatus !== 'awaiting_purchasing') {
    return null;
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-navy-800 flex items-center gap-2">
          <Package className="h-5 w-5 text-brand-500" />
          SS Activewear
        </h2>
      </div>

      {error && (
        <div className="mb-4 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-800">
          {error}
        </div>
      )}

      {/* Failed auto-order, or stale paid awaiting with no ss_orders (manual place) */}
      {canRetry && (
        <div
          className={`mb-4 rounded-lg border p-4 ${
            ssAutoOrderFailed
              ? 'bg-amber-50 border-amber-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                ssAutoOrderFailed ? 'text-amber-500' : 'text-slate-500'
              }`}
            />
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  ssAutoOrderFailed ? 'text-amber-800' : 'text-slate-800'
                }`}
              >
                {ssAutoOrderFailed
                  ? 'Auto-order failed'
                  : 'No S&S order on file yet'}
              </p>
              {ssAutoOrderFailed && ssAutoOrderError && (
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-amber-800">
                  {ssAutoOrderError}
                </p>
              )}
              {!ssAutoOrderFailed && (
                <p className="text-xs text-slate-600 mt-1">
                  Automatic placement may still be running right after checkout. If this order is paid
                  and you still see no S&S order after a few minutes, use the button below (waits ~3
                  minutes after payment before offering this, to avoid double-submit with the webhook).
                </p>
              )}
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 ${
                  ssAutoOrderFailed
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-slate-700 hover:bg-slate-800'
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Working…' : retryButtonLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No orders yet but awaiting purchasing (fresh — webhook / auto-place may still run) */}
      {!hasOrders &&
        orderStatus === 'awaiting_purchasing' &&
        !ssAutoOrderFailed &&
        !canRetry && (
        <div className="text-center py-6">
          <Clock className="mx-auto h-8 w-8 text-stone-300" />
          <p className="mt-2 text-sm text-slate-500">Awaiting auto-order placement…</p>
          <p className="text-xs text-slate-400 mt-1">
            SS Activewear order will be placed automatically after payment confirmation
          </p>
        </div>
      )}

      {/* SS Order cards */}
      {ssOrders.map((ssOrder) => {
        const statusCfg = SS_STATUS_CONFIG[ssOrder.ss_order_status || ''] || {
          color: 'text-slate-600 bg-slate-50',
          icon: <Package className="h-3.5 w-3.5" />,
        };
        const cancelInfo = getCancelTimeRemaining(ssOrder.placed_at);
        const showCancel = cancelInfo.canCancel && ssOrder.ss_order_status !== 'Cancelled';

        return (
          <div key={ssOrder.id} className="border border-stone-200 rounded-lg p-4 mb-3 last:mb-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-navy-800">
                  #{ssOrder.ss_order_number}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.color}`}>
                  {statusCfg.icon}
                  {ssOrder.ss_order_status || 'Unknown'}
                </span>
              </div>
              {ssOrder.ss_warehouse && (
                <span className="text-xs text-slate-500">
                  {WAREHOUSE_NAMES[ssOrder.ss_warehouse] || ssOrder.ss_warehouse}
                </span>
              )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {ssOrder.ss_invoice_number && (
                <>
                  <span className="text-slate-500">Invoice</span>
                  <span className="text-slate-700 font-medium">{ssOrder.ss_invoice_number}</span>
                </>
              )}
              {ssOrder.ss_tracking_number && (
                <>
                  <span className="text-slate-500">Tracking</span>
                  <span className="text-slate-700 font-medium break-all">{ssOrder.ss_tracking_number}</span>
                </>
              )}
              {ssOrder.ss_carrier && (
                <>
                  <span className="text-slate-500">Carrier</span>
                  <span className="text-slate-700">{ssOrder.ss_carrier}</span>
                </>
              )}
              {ssOrder.ss_expected_delivery_date && (
                <>
                  <span className="text-slate-500">Expected Delivery</span>
                  <span className="text-slate-700">
                    {new Date(ssOrder.ss_expected_delivery_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </>
              )}
              {ssOrder.ss_total != null && (
                <>
                  <span className="text-slate-500">SS Total (COGS)</span>
                  <span className="text-slate-700 font-medium">${ssOrder.ss_total.toFixed(2)}</span>
                </>
              )}
              {ssOrder.ss_delivery_status && (
                <>
                  <span className="text-slate-500">Delivery Status</span>
                  <span className="text-slate-700">{ssOrder.ss_delivery_status}</span>
                </>
              )}
              {ssOrder.last_polled_at && (
                <>
                  <span className="text-slate-500">Last Checked</span>
                  <span className="text-slate-400">
                    {new Date(ssOrder.last_polled_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </>
              )}
            </div>

            {/* Line errors warning */}
            {ssOrder.line_errors && ssOrder.line_errors.length > 0 && (
              <div className="mt-3 rounded-md bg-amber-50 border border-amber-100 p-2">
                <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {ssOrder.line_errors.length} item(s) could not be fulfilled
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-3">
              {showCancel && (
                <button
                  onClick={() => handleCancel(ssOrder.ss_order_number)}
                  disabled={cancellingOrder === ssOrder.ss_order_number}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="h-3 w-3" />
                  Cancel
                  <span className="inline-flex items-center gap-0.5 text-red-400">
                    <Timer className="h-3 w-3" />
                    {cancelInfo.timeLeft}
                  </span>
                </button>
              )}
              {ssOrder.ss_invoice_number && (
                <a
                  href={`/api/admin/orders/${ssOrder.id}/ss-invoice?invoice=${ssOrder.ss_invoice_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-stone-50"
                >
                  <FileText className="h-3 w-3" />
                  Invoice
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
