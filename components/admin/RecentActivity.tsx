'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
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

interface RecentActivityProps {
  limit?: number;
  showViewAll?: boolean;
}

/** Build the click-through URL for a given resource, or null if it cannot be linked. */
function resourceLinkFor(row: ActivityRow): string | null {
  if (!row.resource_type || !row.resource_id) return null;
  switch (row.resource_type) {
    case 'order':
      // resource_id may be an order_number or UUID; admin order page accepts either.
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

/** Pick a small icon for the row based on the action category. */
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

/** Compact relative time, e.g. "5 min ago", "2 h ago", "3 d ago". */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk} wk ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Full timestamp for the title attribute. Format: "Mar 3, 2026 10:20 am". */
function fullTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function actorInitials(name: string | null): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '??';
}

export function RecentActivity({ limit = 15, showViewAll = true }: RecentActivityProps) {
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/recent-activity?limit=${limit}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setRows(json.activity || []);
      } catch (err) {
        if (!cancelled) {
          console.error('[RecentActivity] fetch failed:', err);
          setError('Failed to load activity');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-800">Recent Activity</h2>
        {showViewAll && (
          <Link
            href="/admin/activity"
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            View all
          </Link>
        )}
      </div>

      {rows === null && !error && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {rows && rows.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 rounded-full bg-stone-100 p-3">
            <Clock className="h-6 w-6 text-stone-400" />
          </div>
          <p className="text-sm text-slate-500">No activity yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Admin actions will start appearing here as they happen
          </p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <ul className="divide-y divide-stone-100">
          {rows.map((row) => {
            const Icon = iconFor(row.action);
            const link = resourceLinkFor(row);
            const role = row.actor_role === 'admin' ? 'Admin' : row.actor_role === 'sales_rep' ? 'Sales Rep' : null;
            const Inner = (
              <div className="flex items-start gap-3 py-3">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    row.is_alert
                      ? 'bg-red-100 text-red-700'
                      : row.action.startsWith('auth.')
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-stone-100 text-slate-600'
                  }`}
                  title={row.actor_name ?? 'Unknown user'}
                >
                  {row.is_alert ? (
                    <ShieldAlert className="h-4 w-4" />
                  ) : (
                    <span aria-hidden="true">{actorInitials(row.actor_name)}</span>
                  )}
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
                  <p
                    className="mt-0.5 flex items-center gap-2 text-xs text-slate-400"
                    title={`${fullTimestamp(row.created_at)}${row.ip_address ? ` · IP ${row.ip_address}` : ''}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{relativeTime(row.created_at)}</span>
                    {row.is_alert && (
                      <span className="text-red-600">· Burst detected</span>
                    )}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={row.id}>
                {link ? (
                  <Link href={link} className="block -mx-2 rounded px-2 hover:bg-stone-50">
                    {Inner}
                  </Link>
                ) : (
                  <div className="-mx-2 rounded px-2">{Inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
