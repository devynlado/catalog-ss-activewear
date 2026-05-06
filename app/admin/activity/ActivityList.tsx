'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  LogIn,
  LogOut,
  Package,
  FileText,
  Tag,
  MessageSquare,
  Star,
  Mail,
  ShieldCheck,
  PackageSearch,
  TrendingUp,
  Activity as ActivityIcon,
} from 'lucide-react';

interface ActivityRow {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: 'admin' | 'sales_rep' | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  summary: string;
  ip_address: string | null;
  is_alert: boolean;
  alert_reason: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

function resourceLinkFor(row: ActivityRow): string | null {
  if (!row.resource_type || !row.resource_id) return null;
  switch (row.resource_type) {
    case 'order':
      return `/admin/orders/${row.resource_id}`;
    case 'quote':
      return `/admin/quotes/${row.resource_id}`;
    case 'coupon':
      return `/admin/coupons/${row.resource_id}/edit`;
    case 'contact':
      return `/admin/contacts`;
    case 'review':
      return `/admin/reviews`;
    case 'review_invite':
      return `/admin/review-invites`;
    case 'verification':
      return `/admin/verifications`;
    case 'product':
      return `/admin/products/${row.resource_id}`;
    default:
      return null;
  }
}

function iconFor(action: string) {
  if (action.startsWith('auth.signed_in')) return LogIn;
  if (action.startsWith('auth.signed_out')) return LogOut;
  if (action.startsWith('order.')) return Package;
  if (action.startsWith('quote.')) return FileText;
  if (action.startsWith('coupon.')) return Tag;
  if (action.startsWith('contact.')) return MessageSquare;
  if (action.startsWith('review_invite.')) return Mail;
  if (action.startsWith('review.')) return Star;
  if (action.startsWith('verification.')) return ShieldCheck;
  if (action.startsWith('product.')) return PackageSearch;
  if (action.startsWith('ad_spend.')) return TrendingUp;
  return ActivityIcon;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDayHeader(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function ActivityList() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [actionFilter, setActionFilter] = useState('');
  const [alertsOnly, setAlertsOnly] = useState(false);

  const fetchPage = async (nextOffset: number, replace: boolean) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(nextOffset),
      });
      if (actionFilter) params.set('action', actionFilter);
      if (alertsOnly) params.set('alerts', '1');

      const res = await fetch(`/api/admin/recent-activity?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const next: ActivityRow[] = json.activity || [];
      setRows((prev) => (replace ? next : [...prev, ...next]));
      setTotal(json.total || 0);
      setOffset(nextOffset + next.length);
      setError(null);
    } catch (err) {
      console.error('[ActivityList] fetch failed:', err);
      setError('Failed to load activity');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, alertsOnly]);

  const grouped = useMemo(() => {
    const groups: Array<{ day: string; label: string; items: ActivityRow[] }> = [];
    let currentKey = '';
    for (const row of rows) {
      const k = dayKey(row.created_at);
      if (k !== currentKey) {
        groups.push({ day: k, label: formatDayHeader(row.created_at), items: [] });
        currentKey = k;
      }
      groups[groups.length - 1].items.push(row);
    }
    return groups;
  }, [rows]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          placeholder="Filter by action (e.g. order, coupon, auth)"
          className="flex-1 min-w-[200px] rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={alertsOnly}
            onChange={(e) => setAlertsOnly(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
          />
          Alerts only
        </label>
        <span className="ml-auto text-xs text-slate-400">
          {total > 0 ? `${total.toLocaleString()} entries` : ''}
        </span>
      </div>

      {/* List */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        )}
        {error && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500">
            No activity entries match the current filters.
          </div>
        )}

        {!loading && grouped.map((group) => (
          <div key={group.day} className="border-b border-stone-100 last:border-b-0">
            <div className="sticky top-0 z-[1] border-b border-stone-100 bg-stone-50/95 px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-500 backdrop-blur">
              {group.label}
            </div>
            <ul className="divide-y divide-stone-100">
              {group.items.map((row) => {
                const Icon = iconFor(row.action);
                const link = resourceLinkFor(row);
                const role = row.actor_role === 'admin'
                  ? 'Admin'
                  : row.actor_role === 'sales_rep' ? 'Sales Rep' : null;
                const Inner = (
                  <div className="flex items-start gap-3 px-4 py-3">
                    <span className="mt-0.5 inline-flex h-6 w-14 flex-shrink-0 items-center justify-end font-mono text-xs text-slate-400">
                      {formatTime(row.created_at)}
                    </span>
                    <div
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                        row.is_alert ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-slate-600'
                      }`}
                    >
                      {row.is_alert ? <ShieldAlert className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium text-navy-800">
                          {row.actor_name || 'Unknown user'}
                        </span>
                        {role && (
                          <span
                            className={`ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              row.actor_role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {role}
                          </span>
                        )}
                        <span className="text-slate-500"> · {row.summary}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[10px] text-slate-500">
                          {row.action}
                        </code>
                        {row.ip_address && (
                          <span className="ml-2">IP {row.ip_address}</span>
                        )}
                        {row.is_alert && (
                          <span className="ml-2 text-red-600">
                            · Burst alert{row.alert_reason ? ` (${row.alert_reason})` : ''}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={row.id}>
                    {link ? (
                      <Link href={link} className="block hover:bg-stone-50">
                        {Inner}
                      </Link>
                    ) : (
                      Inner
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {!loading && rows.length < total && (
          <div className="border-t border-stone-100 p-4 text-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => fetchPage(offset, false)}
              className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : `Load more (${total - rows.length} remaining)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
