'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Truck,
  Package,
  RefreshCw,
  Ban,
  Activity,
} from 'lucide-react';

interface SSActivityEntry {
  id: string;
  order_id: string;
  ss_order_id: string | null;
  activity_type: string;
  status: string;
  title: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface SSActivityLogProps {
  orderId: string;
  /**
   * True for cap-package orders (see /api/packages/checkout). These orders skip
   * SS Activewear entirely, so the log is always empty. We use this flag to swap
   * the empty-state message from the generic "No activity yet" (which reads like
   * a bug) to a clear "Not applicable" explanation.
   */
  isPackageOrder?: boolean;
}

const STATUS_ICONS: Record<string, { icon: React.ReactNode; bg: string }> = {
  success: { icon: <CheckCircle className="h-4 w-4" />, bg: 'bg-green-100 text-green-600' },
  error: { icon: <XCircle className="h-4 w-4" />, bg: 'bg-red-100 text-red-600' },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, bg: 'bg-amber-100 text-amber-600' },
  info: { icon: <Info className="h-4 w-4" />, bg: 'bg-blue-100 text-blue-600' },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  order_placed: <Package className="h-4 w-4" />,
  order_placing: <RefreshCw className="h-4 w-4" />,
  order_failed: <XCircle className="h-4 w-4" />,
  order_cancelled: <Ban className="h-4 w-4" />,
  tracking_received: <Truck className="h-4 w-4" />,
  order_shipped: <Truck className="h-4 w-4" />,
  order_delivered: <CheckCircle className="h-4 w-4" />,
  order_retry: <RefreshCw className="h-4 w-4" />,
  status_polled: <Activity className="h-4 w-4" />,
};

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function SSActivityLog({ orderId, isPackageOrder = false }: SSActivityLogProps) {
  const [activities, setActivities] = useState<SSActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [orderId]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/ss-activities`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch SS activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between"
      >
        <h2 className="text-lg font-semibold text-navy-800 flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-500" />
          SS Activewear Activity Log
        </h2>
        <span className="text-xs text-slate-400">
          {activities.length} {activities.length === 1 ? 'entry' : 'entries'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : activities.length === 0 ? (
            <div className="py-6 text-center">
              {isPackageOrder ? (
                <>
                  <Info className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Not applicable for package orders
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                    Package orders are decorated in-house at the Montclair
                    warehouse, so no SS Activewear activity is generated.
                  </p>
                </>
              ) : (
                <>
                  <Clock className="mx-auto h-7 w-7 text-stone-300" />
                  <p className="mt-2 text-sm text-slate-500">
                    No SS Activewear activity yet
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {activities.map((activity) => {
                const statusStyle = STATUS_ICONS[activity.status] || STATUS_ICONS.info;
                const typeIcon = TYPE_ICONS[activity.activity_type];

                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${statusStyle.bg}`}>
                      {typeIcon || statusStyle.icon}
                    </div>
                    <div className="flex-1 pt-0.5 min-w-0">
                      <p className="text-sm text-slate-700">{activity.title}</p>

                      {/* Expandable details */}
                      {activity.details && Object.keys(activity.details).length > 0 && (
                        <DetailsBlock details={activity.details} />
                      )}

                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailsBlock({ details }: { details: Record<string, unknown> }) {
  const [isOpen, setIsOpen] = useState(false);

  const entries = Object.entries(details).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );
  if (entries.length === 0) return null;

  // Show key fields inline
  const inlineKeys = ['ss_order_number', 'tracking_number', 'carrier', 'error', 'warehouse', 'total'];
  const inlineEntries = entries.filter(([k]) => inlineKeys.includes(k));
  const extraEntries = entries.filter(([k]) => !inlineKeys.includes(k));

  return (
    <div className="mt-1">
      {inlineEntries.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {inlineEntries.map(([key, value]) => (
            <span key={key} className="text-xs text-slate-500">
              <span className="text-slate-400">{formatKey(key)}:</span>{' '}
              <span className="font-medium text-slate-600">{formatValue(value)}</span>
            </span>
          ))}
        </div>
      )}
      {extraEntries.length > 0 && (
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs text-brand-500 hover:text-brand-600 mt-0.5"
          >
            {isOpen ? 'Hide details' : `${extraEntries.length} more fields…`}
          </button>
          {isOpen && (
            <div className="mt-1 rounded bg-stone-50 p-2 text-xs text-slate-500 space-y-0.5">
              {extraEntries.map(([key, value]) => (
                <div key={key}>
                  <span className="text-slate-400">{formatKey(key)}:</span>{' '}
                  <span className="text-slate-600">{formatValue(value)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
