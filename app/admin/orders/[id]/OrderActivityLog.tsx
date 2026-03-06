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
  Plus,
  CheckCircle,
  XCircle,
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

interface OrderActivityLogProps {
  orderId: string;
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
};

export function OrderActivityLog({ orderId }: OrderActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [orderId]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/activities`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'note',
          details: { content: newNote.trim() },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActivities([data.activity, ...activities]);
        setNewNote('');
        setShowNoteForm(false);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityDescription = (activity: Activity) => {
    const d = activity.details;
    switch (activity.activity_type) {
      case 'created':
        return 'Order created';
      case 'payment_processing':
        return 'Payment processing started';
      case 'payment_received':
        return d.amount ? `Payment of $${Number(d.amount).toFixed(2)} received` : 'Payment received';
      case 'payment_failed':
        return d.error_message ? `Payment failed: ${d.error_message}` : 'Payment failed';
      case 'confirmed':
        return 'Order confirmed';
      case 'awaiting_purchasing':
        return 'Order ready — awaiting purchasing';
      case 'ordered':
        return 'Blanks ordered from supplier';
      case 'status_change':
        return (
          <span>
            Status changed from{' '}
            <span className="font-medium">{statusLabels[d.from as string] || String(d.from)}</span>
            {' '}to{' '}
            <span className="font-medium">{statusLabels[d.to as string] || String(d.to)}</span>
          </span>
        );
      case 'shipped':
        return 'Order shipped';
      case 'delivered':
        return 'Order delivered';
      case 'refunded':
        return d.amount
          ? `Refund of $${Number(d.amount).toFixed(2)} processed${d.full_refund ? ' (full)' : ' (partial)'}`
          : 'Refund processed';
      case 'note':
        return (
          <span>
            Note: <span className="text-slate-600">&ldquo;{d.content as string}&rdquo;</span>
          </span>
        );
      case 'cancelled':
        return 'Order cancelled';
      default:
        return activity.activity_type.replace(/_/g, ' ');
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-800">Activity</h2>
        <button
          onClick={() => setShowNoteForm(!showNoteForm)}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Note
        </button>
      </div>

      {showNoteForm && (
        <div className="mb-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add an internal note about this order..."
            rows={3}
            className="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => { setShowNoteForm(false); setNewNote(''); }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim() || isSubmitting}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-stone-300" />
          <p className="mt-2 text-sm text-slate-500">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-stone-100 text-slate-500">
                {activityIcons[activity.activity_type] || <FileText className="h-4 w-4" />}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm text-slate-700">
                  {activity.user && (
                    <span className="font-medium">{activity.user.full_name || 'System'} </span>
                  )}
                  {!activity.user && <span className="font-medium">System </span>}
                  {getActivityDescription(activity)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {formatTime(activity.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
