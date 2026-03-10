'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  ArrowRight,
  MessageSquare,
  CreditCard,
  Truck,
  PackageCheck,
  Ban,
  RotateCcw,
  FileText,
  CheckCircle,
  XCircle,
  Mail,
  AlertCircle,
} from 'lucide-react';

interface Activity {
  id: string;
  activity_type: string;
  details: Record<string, unknown>;
  created_at: string;
  user: {
    full_name: string;
    avatar_url?: string | null;
  } | null;
}

/** Order summary used to backfill missing activity logs (e.g. paid, confirmed, shipped, refunded) for legacy orders */
export interface OrderActivityLogOrderSummary {
  created_at: string;
  status: string;
  payment_status: string;
  paid_at?: string | null;
  shipped_at?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
  order_number?: string | null;
  /** When payment_status is refunded: date of the (latest) refund for synthetic log */
  refunded_at?: string | null;
  /** Total amount refunded; used for synthetic refund activity text */
  total_refunded?: number;
}

interface OrderActivityLogProps {
  orderId: string;
  /** When provided and there are no activities, show a fallback "Order placed" line for legacy orders */
  orderCreatedAt?: string;
  /** When provided, synthetic activities are added for paid, confirmed, shipped so legacy orders show full history */
  orderSummary?: OrderActivityLogOrderSummary | null;
  /** Current internal admin note for this order; shown and editable below the activity list */
  adminNote?: string | null;
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  awaiting_purchasing: 'Awaiting Purchasing',
  ordered: 'Ordered',
  in_production: 'In Production',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const activityIcons: Record<string, React.ReactNode> = {
  created: <CheckCircle className="h-4 w-4" />,
  payment_processing: <CreditCard className="h-4 w-4" />,
  payment_received: <CreditCard className="h-4 w-4" />,
  payment_failed: <XCircle className="h-4 w-4" />,
  confirmed: <CheckCircle className="h-4 w-4" />,
  status_change: <ArrowRight className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <PackageCheck className="h-4 w-4" />,
  refunded: <RotateCcw className="h-4 w-4" />,
  note: <MessageSquare className="h-4 w-4" />,
  cancelled: <Ban className="h-4 w-4" />,
  email_sent: <Mail className="h-4 w-4" />,
  system_error: <AlertCircle className="h-4 w-4" />,
};

function normalizeDetails(details: unknown): Record<string, unknown> {
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    return details as Record<string, unknown>;
  }
  if (typeof details === 'string') {
    try {
      const parsed = JSON.parse(details) as Record<string, unknown>;
      return parsed ?? {};
    } catch {
      return {};
    }
  }
  return {};
}

/** Format as "Mar 3, 2026 10:20 am" for consistent server/client and full date+time */
function formatActivityTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Synthetic activity for backfilling when DB has no row */
interface SyntheticActivity extends Activity {
  id: string;
  _synthetic?: true;
}

function buildMergedActivities(
  activities: Activity[],
  orderSummary: OrderActivityLogOrderSummary | null | undefined
): (Activity | SyntheticActivity)[] {
  if (!orderSummary) return activities;

  const hasType = (type: string) => activities.some((a) => a.activity_type === type);
  const hasStatusChangeTo = (to: string) =>
    activities.some(
      (a) => a.activity_type === 'status_change' && (a.details as Record<string, unknown>)?.to === to
    );
  const hasShipped =
    hasType('shipped') || hasStatusChangeTo('shipped');

  const synthetic: SyntheticActivity[] = [];

  if (!hasType('created') && orderSummary.created_at) {
    synthetic.push({
      id: 'synthetic-created',
      activity_type: 'created',
      details: orderSummary.order_number ? { order_number: orderSummary.order_number } : {},
      created_at: orderSummary.created_at,
      user: null,
      _synthetic: true,
    });
  }

  if (
    (orderSummary.payment_status === 'paid' || orderSummary.payment_status === 'refunded') &&
    !hasType('payment_received') &&
    orderSummary.paid_at
  ) {
    synthetic.push({
      id: 'synthetic-paid',
      activity_type: 'payment_received',
      details: { amount: null, payment_method: 'Stripe' },
      created_at: orderSummary.paid_at,
      user: null,
      _synthetic: true,
    });
  }

  if (
    orderSummary.status !== 'pending' &&
    orderSummary.status !== 'cancelled' &&
    !hasType('confirmed') &&
    (orderSummary.paid_at || orderSummary.created_at)
  ) {
    const at = orderSummary.paid_at || orderSummary.created_at;
    if (at) {
      synthetic.push({
        id: 'synthetic-confirmed',
        activity_type: 'confirmed',
        details: {},
        created_at: at,
        user: null,
        _synthetic: true,
      });
    }
  }

  if (
    orderSummary.status === 'shipped' &&
    orderSummary.shipped_at &&
    !hasShipped
  ) {
    synthetic.push({
      id: 'synthetic-shipped',
      activity_type: 'status_change',
      details: {
        from: 'confirmed',
        to: 'shipped',
        tracking_number: orderSummary.tracking_number,
        carrier: orderSummary.carrier,
      },
      created_at: orderSummary.shipped_at,
      user: null,
      _synthetic: true,
    });
  }

  if (
    orderSummary.payment_status === 'refunded' &&
    !hasType('refunded') &&
    orderSummary.refunded_at
  ) {
    const at = orderSummary.refunded_at;
    const amount = orderSummary.total_refunded ?? 0;
    synthetic.push({
      id: 'synthetic-refunded',
      activity_type: 'refunded',
      details: {
        amount,
        full_refund: true,
      },
      created_at: at,
      user: null,
      _synthetic: true,
    });
  }

  const merged = [...activities, ...synthetic].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return merged;
}

export function OrderActivityLog({ orderId, orderCreatedAt, orderSummary, adminNote: initialAdminNote }: OrderActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminNote, setAdminNote] = useState<string | null>(initialAdminNote ?? null);
  const [showNoteForm, setShowNoteForm] = useState(!(initialAdminNote && initialAdminNote.trim()));
  const [noteDraft, setNoteDraft] = useState(initialAdminNote ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [orderId]);

  useEffect(() => {
    const v = initialAdminNote ?? null;
    setAdminNote(v);
    setNoteDraft(v ?? '');
    setShowNoteForm(!(v && v.trim()));
  }, [initialAdminNote]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/activities`);
      if (response.ok) {
        const data = await response.json();
        const raw = data.activities || [];
        setActivities(
          raw.map((a: Activity & { details?: unknown }) => ({
            ...a,
            details: normalizeDetails(a.details),
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const mergedActivities = buildMergedActivities(activities, orderSummary);

  const handleSaveNote = async () => {
    const content = noteDraft.trim();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_note: content || null }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save note');
      }

      setAdminNote(content || null);
      setShowNoteForm(false);
      if (data.activity) {
        const act = data.activity as Activity & { details?: unknown };
        setActivities([
          { ...act, details: normalizeDetails(act.details), user: data.user ? { full_name: data.user.full_name, avatar_url: data.user?.avatar_url ?? null } : null },
          ...activities,
        ]);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityDescription = (activity: Activity | SyntheticActivity, summary?: OrderActivityLogOrderSummary | null) => {
    const d = activity.details;
    switch (activity.activity_type) {
      case 'created':
        return d.order_number
          ? `Order placed (${d.order_number as string})`
          : 'Order placed';
      case 'payment_processing':
        return 'Payment processing started (customer completing payment via Stripe)';
      case 'payment_received':
        if (d.amount != null) {
          return `Payment made via Stripe ($${Number(d.amount).toFixed(2)})`;
        }
        return 'Payment made via Stripe — customer has paid for the order';
      case 'payment_failed':
        return d.error_message
          ? `Order payment failed: ${d.error_message as string}`
          : 'Order payment failed — there was an error in the customer\'s payment process';
      case 'confirmed':
        return 'Order confirmed';
      case 'awaiting_purchasing':
        return 'Order ready — awaiting purchasing';
      case 'ordered':
        return 'Blanks ordered from supplier';
      case 'status_change': {
        const from = statusLabels[d.from as string] || String(d.from);
        const to = statusLabels[d.to as string] || String(d.to);
        const tracking = (d.tracking_number as string) || summary?.tracking_number;
        const carrier = (d.carrier as string) || summary?.carrier;
        if (d.to === 'shipped' && (tracking || carrier)) {
          const carrierLabel = carrier ? String(carrier).toUpperCase() : 'Carrier';
          return (
            <span>
              Order status changed from <span className="font-medium">{from}</span> to{' '}
              <span className="font-medium">{to}</span>.{' '}
              {tracking ? (
                <>Order shipped with {carrierLabel}, tracking number {tracking}</>
              ) : (
                <>Order shipped with {carrierLabel}</>
              )}
            </span>
          );
        }
        return (
          <span>
            Order status changed from <span className="font-medium">{from}</span> to{' '}
            <span className="font-medium">{to}</span>
          </span>
        );
      }
      case 'shipped':
        return d.tracking_number
          ? `Order shipped with ${(d.carrier as string) || 'carrier'}, tracking ${d.tracking_number as string}`
          : 'Order shipped';
      case 'delivered':
        return 'Order delivered';
      case 'refunded':
        return d.amount != null
          ? `Refund of $${Number(d.amount).toFixed(2)} processed${d.full_refund ? ' (full refund)' : ' (partial refund)'}`
          : 'Refund processed';
      case 'note':
        return (
          <span>
            Internal note: <span className="text-slate-600">&ldquo;{d.content as string}&rdquo;</span>
          </span>
        );
      case 'cancelled':
        return 'Order cancelled';
      case 'email_sent': {
        const emailType = d.email_type as string;
        const label =
          emailType === 'order_confirmation'
            ? 'Order confirmation email sent to customer'
            : emailType === 'order_shipped'
              ? 'Shipping / tracking email sent to customer (tracking number and shipment info)'
              : emailType === 'refund_confirmation'
                ? 'Refund confirmation email sent to customer'
                : emailType === 'package_order_confirmation'
                  ? 'Package order confirmation email sent to customer'
                  : 'Email sent to customer';
        const recipient = d.recipient ? ` (${d.recipient as string})` : '';
        return `${label}${recipient}`;
      }
      case 'system_error':
        return (
          <span>
            System error{d.error_message ? `: ${d.error_message as string}` : ''}
          </span>
        );
      default:
        return String(activity.activity_type).replace(/_/g, ' ');
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-navy-800">Activity</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : mergedActivities.length === 0 ? (
        <div className="py-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-stone-300" />
          <p className="mt-2 text-sm text-slate-500">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mergedActivities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-stone-100 text-slate-500">
                {activityIcons[activity.activity_type] || <FileText className="h-4 w-4" />}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm text-slate-700">
                  {activity.user && (
                    <span className="font-medium">{activity.user.full_name || 'System'} · </span>
                  )}
                  {!activity.user && <span className="font-medium">System · </span>}
                  {getActivityDescription(activity, orderSummary)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {formatActivityTime(activity.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 border-t border-stone-200 pt-4">
        <h3 className="mb-2 text-sm font-semibold text-navy-800">Internal note</h3>
        {showNoteForm ? (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Add an internal note about this order..."
              rows={3}
              className="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <div className="mt-2 flex justify-end gap-2">
              {adminNote != null && adminNote !== '' && (
                <button
                  type="button"
                  onClick={() => { setShowNoteForm(false); setNoteDraft(adminNote ?? ''); }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={isSubmitting}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving…' : 'Save note'}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            {adminNote && adminNote.trim() ? (
              <>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{adminNote}</p>
                <button
                  type="button"
                  onClick={() => { setShowNoteForm(true); setNoteDraft(adminNote); }}
                  className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Edit
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowNoteForm(true)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Add a note…
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
