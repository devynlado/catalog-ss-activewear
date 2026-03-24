'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface EmailStatus {
  sent: boolean;
  error?: string;
  skippedReason?: string;
}

interface OrderStatusActionsProps {
  orderId: string;
  currentStatus: string;
  hasTracking: boolean;
}

const statuses = [
  { id: 'awaiting_purchasing', label: 'Awaiting Purchasing', color: 'bg-brand-500' },
  { id: 'ordered', label: 'Ordered', color: 'bg-blue-500' },
  { id: 'in_production', label: 'In Production', color: 'bg-orange-500' },
  { id: 'partially_shipped', label: 'Partially Shipped', color: 'bg-purple-500' },
  { id: 'shipped', label: 'Shipped', color: 'bg-indigo-500' },
  { id: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-stone-500' },
];

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

export function OrderStatusActions({ orderId, currentStatus, hasTracking }: OrderStatusActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === selectedStatus) {
      setShowDropdown(false);
      return;
    }

    if (newStatus === 'shipped' && !hasTracking) {
      setError('Add tracking info below before marking as shipped');
      setShowDropdown(false);
      setTimeout(() => setError(null), 4000);
      return;
    }

    setIsUpdating(true);
    setSelectedStatus(newStatus);
    setShowDropdown(false);
    setError(null);
    setEmailStatus(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      if (data.emailStatus) {
        setEmailStatus(data.emailStatus);
        setTimeout(() => setEmailStatus(null), 8000);
      }

      router.refresh();
    } catch (err) {
      console.error('Status update failed:', err);
      setSelectedStatus(currentStatus);
      setError(err instanceof Error ? err.message : 'Failed to update status');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentRank = STATUS_ORDER[selectedStatus] ?? 0;
  const currentStatusConfig = statuses.find(s => s.id === selectedStatus)
    || { id: selectedStatus, label: selectedStatus, color: 'bg-amber-500' };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isUpdating}
          className={`flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-stone-50 disabled:opacity-50 ${
            isUpdating ? 'cursor-wait' : ''
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${currentStatusConfig.color}`} />
          {currentStatusConfig.label}
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
              {statuses.map((s) => {
                const rank = STATUS_ORDER[s.id] ?? 0;
                const isDisabled = s.id !== 'cancelled' && rank <= currentRank;

                return (
                  <button
                    key={s.id}
                    onClick={() => !isDisabled && handleStatusChange(s.id)}
                    disabled={isDisabled}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
                      isDisabled
                        ? 'cursor-not-allowed text-slate-300'
                        : 'hover:bg-stone-50 text-slate-700'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${isDisabled ? 'bg-stone-200' : s.color}`} />
                    <span className="flex-1">{s.label}</span>
                    {s.id === selectedStatus && (
                      <Check className="h-4 w-4 text-brand-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {emailStatus && (
        <div className={`flex items-center gap-1.5 text-xs ${
          emailStatus.sent
            ? 'text-green-600'
            : emailStatus.skippedReason
              ? 'text-amber-600'
              : 'text-red-600'
        }`}>
          {emailStatus.sent ? (
            <><CheckCircle className="h-3.5 w-3.5" /> Tracking email sent</>
          ) : emailStatus.skippedReason ? (
            <><AlertTriangle className="h-3.5 w-3.5" /> {emailStatus.skippedReason}</>
          ) : (
            <><XCircle className="h-3.5 w-3.5" /> Email failed{emailStatus.error ? `: ${emailStatus.error}` : ''}</>
          )}
        </div>
      )}
    </div>
  );
}
