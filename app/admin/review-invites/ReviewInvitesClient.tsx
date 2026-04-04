'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  MailCheck,
  MailX,
  Star,
  Clock,
  RefreshCw,
  Send,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InviteItem {
  id: string;
  order_id: string;
  customer_email: string;
  customer_name: string | null;
  token: string;
  sent_at: string;
  email_status: 'sent' | 'failed' | 'pending';
  resend_message_id: string | null;
  error_message: string | null;
  last_resent_at: string | null;
  order_number: string | null;
  delivered_at: string | null;
  review: {
    id: string;
    rating: number;
    status: string;
    created_at: string;
  } | null;
}

interface Stats {
  total: number;
  sent: number;
  reviewed: number;
  failed: number;
}

const TABS = [
  { key: 'all', label: 'All Invitations', Icon: Mail },
  { key: 'sent', label: 'Awaiting Review', Icon: Clock },
  { key: 'reviewed', label: 'Reviewed', Icon: Star },
  { key: 'failed', label: 'Failed', Icon: MailX },
] as const;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'
          )}
        />
      ))}
    </div>
  );
}

export function ReviewInvitesClient() {
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, reviewed: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tab: activeTab,
        page: String(page),
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/review-invites?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInvites(data.invites);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setStats(data.stats);
    } catch {
      console.error('Failed to fetch review invites');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleResend = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      const res = await fetch(`/api/admin/review-invites/${inviteId}/resend`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: data.message });
        fetchInvites();
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to resend' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const reviewRate = stats.total > 0
    ? Math.round((stats.reviewed / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all',
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-50 p-2">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Sent</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-50 p-2">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-800">{stats.sent}</p>
              <p className="text-xs text-slate-500">Awaiting Review</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-50 p-2">
              <Star className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-800">{stats.reviewed}</p>
              <p className="text-xs text-slate-500">
                Reviewed
                {stats.total > 0 && (
                  <span className="ml-1 text-green-600 font-semibold">({reviewRate}%)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-50 p-2">
              <MailX className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-800">{stats.failed}</p>
              <p className="text-xs text-slate-500">Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion funnel mini-chart */}
      {stats.total > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Invitation → Review Conversion</p>
          </div>
          <div className="h-3 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
              style={{ width: `${reviewRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-slate-400">{stats.total} invitations</span>
            <span className="text-xs font-semibold text-green-600">{reviewRate}% conversion</span>
          </div>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setPage(1); }}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === key
                  ? 'bg-white text-navy-800 shadow-sm'
                  : 'text-slate-500 hover:text-navy-800'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{key === 'all' ? 'All' : key === 'sent' ? 'Waiting' : key === 'reviewed' ? 'Done' : 'Failed'}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search email or name..."
              className="h-9 w-56 rounded-lg border border-stone-200 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-lg bg-navy-800 px-3 text-sm font-medium text-white hover:bg-navy-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      <p className="text-sm text-slate-500">{total} invitation{total !== 1 ? 's' : ''}</p>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : invites.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-stone-200 bg-white">
          <Mail className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No invitations found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sent</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Review</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {invites.map((inv) => (
                <tr key={inv.id} className="hover:bg-stone-50/50 transition-colors">
                  {/* Customer */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-navy-800">
                      {inv.customer_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-slate-400">{inv.customer_email}</p>
                  </td>

                  {/* Order */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-700">
                      {inv.order_number || '—'}
                    </p>
                    {inv.delivered_at && (
                      <p className="text-xs text-slate-400">
                        Delivered {formatDate(inv.delivered_at)}
                      </p>
                    )}
                  </td>

                  {/* Email Status */}
                  <td className="px-4 py-3">
                    <EmailStatusBadge status={inv.email_status} error={inv.error_message} />
                  </td>

                  {/* Sent date */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-500">{formatDateTime(inv.sent_at)}</p>
                    {inv.last_resent_at && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <RefreshCw className="h-3 w-3" />
                        Resent {formatDate(inv.last_resent_at)}
                      </p>
                    )}
                  </td>

                  {/* Review status */}
                  <td className="px-4 py-3">
                    {inv.review ? (
                      <div>
                        <StarDisplay rating={inv.review.rating} />
                        <span className={cn(
                          'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          inv.review.status === 'approved' && 'bg-green-50 text-green-700',
                          inv.review.status === 'pending' && 'bg-amber-50 text-amber-700',
                          inv.review.status === 'rejected' && 'bg-red-50 text-red-700',
                        )}>
                          {inv.review.status}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No review yet</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {inv.email_status === 'failed' && !inv.review && (
                      <button
                        onClick={() => handleResend(inv.id)}
                        disabled={actionLoading === inv.id}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === inv.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Resend
                      </button>
                    )}
                    {inv.email_status === 'sent' && !inv.review && (
                      <button
                        onClick={() => handleResend(inv.id)}
                        disabled={actionLoading === inv.id}
                        className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === inv.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Resend
                      </button>
                    )}
                    {inv.review && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <MailCheck className="h-3.5 w-3.5" />
                        Complete
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-stone-200 p-2 text-slate-500 hover:bg-stone-50 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-stone-200 p-2 text-slate-500 hover:bg-stone-50 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function EmailStatusBadge({ status, error }: { status: string; error: string | null }) {
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        <MailCheck className="h-3 w-3" />
        Delivered
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <div>
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
          <MailX className="h-3 w-3" />
          Failed
        </span>
        {error && (
          <p className="mt-1 text-[10px] text-red-500 max-w-[200px] truncate" title={error}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-stone-50 border border-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
      <Clock className="h-3 w-3" />
      Pending
    </span>
  );
}
