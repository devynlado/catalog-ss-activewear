'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  DollarSign,
  ShoppingCart,
  Star,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Filter,
  X,
  ExternalLink,
  Award,
  TrendingUp,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────

interface CustomerItem {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  phone: string | null;
  customer_type: string;
  city: string | null;
  state: string | null;
  created_at: string;
  has_profile: boolean;
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
  first_order_date: string | null;
  review_count: number;
  avg_rating: number | null;
  coupons_claimed: number;
}

interface CustomerDetail {
  profile: {
    id: string | null;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    company: string | null;
    phone: string | null;
    customer_type: string;
    verification_status: string | null;
    business_type: string | null;
    website: string | null;
    asi_number: string | null;
    ppai_number: string | null;
    billing_address_street: string | null;
    billing_address_city: string | null;
    billing_address_state: string | null;
    billing_address_zip: string | null;
    tax_exempt: boolean;
    pricing_tier: string;
    created_at: string;
    has_profile: boolean;
  };
  assigned_rep: { id: string; full_name: string; email: string } | null;
  orders: OrderSummary[];
  reviews: ReviewItem[];
  metrics: {
    total_spent: number;
    order_count: number;
    all_order_count: number;
    avg_order_value: number;
    first_order_date: string | null;
    last_order_date: string | null;
    review_count: number;
    avg_rating: number | null;
    coupons_claimed: number;
  };
}

interface OrderSummary {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  item_count: number;
  product_count: number;
  coupon_code: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

interface ReviewItem {
  id: string;
  style_id: number;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  product_title: string;
  brand_name: string;
  reward_coupon: { code: string; discount_type: string; amount: number; used: boolean } | null;
  created_at: string;
}

interface Stats {
  totalCustomers: number;
  totalRevenue: number;
  avgOrderValue: number;
  withReviews: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function formatCurrencyFull(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-blue-50 text-blue-700',
  awaiting_purchasing: 'bg-amber-50 text-amber-700',
  ordered: 'bg-indigo-50 text-indigo-700',
  in_production: 'bg-purple-50 text-purple-700',
  partially_shipped: 'bg-cyan-50 text-cyan-700',
  shipped: 'bg-teal-50 text-teal-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const REVIEW_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn('h-3.5 w-3.5', i <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300')}
        />
      ))}
    </div>
  );
}

const SORT_OPTIONS = [
  { value: 'total_spent_desc', label: 'Highest Spend' },
  { value: 'total_spent_asc', label: 'Lowest Spend' },
  { value: 'order_count_desc', label: 'Most Orders' },
  { value: 'last_order_desc', label: 'Most Recent Order' },
  { value: 'created_at_desc', label: 'Newest Customers' },
  { value: 'created_at_asc', label: 'Oldest Customers' },
];

// ── Main Component ───────────────────────────────────────────────────────

export function CustomersClient() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCustomers: 0, totalRevenue: 0, avgOrderValue: 0, withReviews: 0 });
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [minSpent, setMinSpent] = useState('');
  const [maxSpent, setMaxSpent] = useState('');
  const [minOrders, setMinOrders] = useState('');
  const [hasReviews, setHasReviews] = useState(false);
  const [sortBy, setSortBy] = useState('total_spent_desc');

  // Detail
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Fetch list ──────────────────────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), sort: sortBy });
      if (search) params.set('search', search);
      if (type) params.set('type', type);
      if (stateFilter) params.set('state', stateFilter);
      if (minSpent) params.set('min_spent', minSpent);
      if (maxSpent) params.set('max_spent', maxSpent);
      if (minOrders) params.set('min_orders', minOrders);
      if (hasReviews) params.set('has_reviews', 'true');

      const res = await fetch(`/api/admin/customers?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomers(data.customers);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setStats(data.stats);
      setStates(data.states);
    } catch {
      console.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [page, search, type, stateFilter, minSpent, maxSpent, minOrders, hasReviews, sortBy]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // ── Fetch detail ────────────────────────────────────────────────────────

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDetail(data);
    } catch {
      console.error('Failed to fetch customer detail');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleToggle = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
    } else {
      setExpandedId(id);
      fetchDetail(id);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(''); setSearchInput('');
    setType(''); setStateFilter('');
    setMinSpent(''); setMaxSpent('');
    setMinOrders(''); setHasReviews(false);
    setSortBy('total_spent_desc');
    setPage(1);
  };

  const hasFilters = search || type || stateFilter || minSpent || maxSpent || minOrders || hasReviews || sortBy !== 'total_spent_desc';

  return (
    <div className="space-y-6">
      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4 text-blue-600" />} bg="bg-blue-50" value={String(stats.totalCustomers)} label="Total Customers" />
        <StatCard icon={<DollarSign className="h-4 w-4 text-emerald-600" />} bg="bg-emerald-50" value={formatCurrency(stats.totalRevenue)} label="Total Revenue" />
        <StatCard icon={<ShoppingCart className="h-4 w-4 text-purple-600" />} bg="bg-purple-50" value={formatCurrencyFull(stats.avgOrderValue)} label="Avg Order Value" />
        <StatCard icon={<Star className="h-4 w-4 text-amber-600" />} bg="bg-amber-50" value={String(stats.withReviews)} label="With Reviews" />
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Filter className="h-4 w-4" />
            Filters
          </div>

          {/* Type */}
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-stone-200 px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          >
            <option value="">All Types</option>
            <option value="direct">Direct</option>
            <option value="distributor">Trade Partners</option>
          </select>

          {/* State */}
          {states.length > 0 && (
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-stone-200 px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* Min Spend */}
          <input
            type="number"
            placeholder="Min spend"
            value={minSpent}
            onChange={(e) => { setMinSpent(e.target.value); setPage(1); }}
            className="h-9 w-28 rounded-lg border border-stone-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />

          {/* Min Orders */}
          <input
            type="number"
            placeholder="Min orders"
            value={minOrders}
            onChange={(e) => { setMinOrders(e.target.value); setPage(1); }}
            className="h-9 w-28 rounded-lg border border-stone-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />

          {/* Has Reviews */}
          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={hasReviews}
              onChange={(e) => { setHasReviews(e.target.checked); setPage(1); }}
              className="rounded border-stone-300 text-brand-600 focus:ring-brand-500"
            />
            Has reviews
          </label>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-stone-200 px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, email..."
                className="h-9 w-48 rounded-lg border border-stone-200 pl-8 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <button type="submit" className="h-9 rounded-lg bg-navy-800 px-3 text-xs font-medium text-white hover:bg-navy-700">
              Go
            </button>
          </form>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Results count ──────────────────────────────────────────────── */}
      <p className="text-sm text-slate-500">{total} customer{total !== 1 ? 's' : ''}</p>

      {/* ── Customer Table ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-stone-200 bg-white">
          <Users className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No customers found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Company</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Location</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Orders</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Spent</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell text-center">Rating</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {customers.map(c => (
                <CustomerRow
                  key={c.id}
                  customer={c}
                  expanded={expandedId === c.id}
                  onToggle={() => handleToggle(c.id)}
                  detail={expandedId === c.id ? detail : null}
                  detailLoading={expandedId === c.id && detailLoading}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-stone-200 p-2 text-slate-500 hover:bg-stone-50 disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-stone-200 p-2 text-slate-500 hover:bg-stone-50 disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function StatCard({ icon, bg, value, label }: { icon: React.ReactNode; bg: string; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('rounded-full p-2', bg)}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-navy-800">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function CustomerRow({ customer: c, expanded, onToggle, detail, detailLoading }: {
  customer: CustomerItem;
  expanded: boolean;
  onToggle: () => void;
  detail: CustomerDetail | null;
  detailLoading: boolean;
}) {
  const initials = c.full_name
    ? c.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : c.email.slice(0, 2).toUpperCase();

  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          'cursor-pointer transition-colors',
          expanded ? 'bg-brand-50/20' : 'hover:bg-stone-50/50'
        )}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-navy-800 truncate">{c.full_name || '(no name)'}</p>
                {!c.has_profile && (
                  <span className="inline-block rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">Guest</span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">{c.email}</p>
            </div>
          </div>
        </td>

        <td className="px-4 py-3 hidden lg:table-cell">
          <span className="text-sm text-slate-600 truncate block max-w-[160px]">{c.company || '—'}</span>
        </td>

        <td className="px-4 py-3 hidden md:table-cell">
          <span className="text-xs text-slate-600">
            {c.city && c.state ? `${c.city}, ${c.state}` : c.state || c.city || '—'}
          </span>
        </td>

        <td className="px-4 py-3 text-right">
          <span className="text-sm font-semibold text-navy-800">{c.order_count}</span>
        </td>

        <td className="px-4 py-3 text-right">
          <span className={cn(
            'text-sm font-semibold',
            c.total_spent > 0 ? 'text-emerald-700' : 'text-slate-400'
          )}>
            {c.total_spent > 0 ? formatCurrency(c.total_spent) : '$0'}
          </span>
        </td>

        <td className="px-4 py-3 hidden md:table-cell text-center">
          {c.avg_rating !== null ? (
            <div className="flex items-center justify-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium text-slate-700">{c.avg_rating}</span>
              <span className="text-xs text-slate-400">({c.review_count})</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>

        <td className="px-4 py-3 hidden lg:table-cell">
          <span className="text-xs text-slate-500">{formatDate(c.created_at)}</span>
        </td>

        <td className="w-10 px-3 py-3">
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan={8} className="border-t border-stone-100 bg-stone-50 px-6 py-5">
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : detail ? (
              <CustomerDetailView detail={detail} />
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Failed to load details</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function CustomerDetailView({ detail }: { detail: CustomerDetail }) {
  const { profile: p, assigned_rep, orders, reviews, metrics: m } = detail;

  return (
    <div className="space-y-6">
      {/* Two-column top section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left — Contact Details */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-navy-800">Contact Details</h4>
          <div className="space-y-2">
            <DetailRow icon={<Mail className="h-4 w-4" />}>
              <a href={`mailto:${p.email}`} className="text-brand-600 hover:text-brand-700">{p.email}</a>
            </DetailRow>
            {p.phone && (
              <DetailRow icon={<Phone className="h-4 w-4" />}>
                <a href={`tel:${p.phone}`} className="text-brand-600 hover:text-brand-700">{p.phone}</a>
              </DetailRow>
            )}
            {p.company && (
              <DetailRow icon={<Building2 className="h-4 w-4" />}>{p.company}</DetailRow>
            )}
            {(p.billing_address_city || p.billing_address_state) && (
              <DetailRow icon={<MapPin className="h-4 w-4" />}>
                {[p.billing_address_street, `${p.billing_address_city || ''}, ${p.billing_address_state || ''} ${p.billing_address_zip || ''}`].filter(Boolean).join(', ')}
              </DetailRow>
            )}
            <DetailRow icon={<Calendar className="h-4 w-4" />}>
              Joined {formatDate(p.created_at)}
            </DetailRow>
            <div className="flex flex-wrap gap-2 pt-1">
              {!p.has_profile && (
                <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500">
                  Guest (no account)
                </span>
              )}
              <span className={cn(
                'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                p.customer_type === 'distributor' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              )}>
                {p.customer_type === 'distributor' ? 'Trade Partner' : 'Direct'}
              </span>
              {p.pricing_tier && p.pricing_tier !== 'standard' && (
                <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  {p.pricing_tier.charAt(0).toUpperCase() + p.pricing_tier.slice(1)} Tier
                </span>
              )}
              {p.tax_exempt && (
                <span className="inline-block rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                  Tax Exempt
                </span>
              )}
            </div>
            {assigned_rep && (
              <div className="mt-2 rounded-lg border border-stone-200 bg-white p-3">
                <p className="text-xs text-slate-400 mb-1">Sales Rep</p>
                <p className="text-sm font-medium text-navy-800">{assigned_rep.full_name}</p>
                <p className="text-xs text-slate-500">{assigned_rep.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right — Lifetime Metrics */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-navy-800">Lifetime Metrics</h4>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={<DollarSign className="h-4 w-4 text-emerald-600" />} label="Total Spent" value={formatCurrencyFull(m.total_spent)} />
            <MetricCard icon={<ShoppingCart className="h-4 w-4 text-blue-600" />} label="Paid Orders" value={String(m.order_count)} />
            <MetricCard icon={<TrendingUp className="h-4 w-4 text-purple-600" />} label="Avg Order Value" value={formatCurrencyFull(m.avg_order_value)} />
            <MetricCard icon={<Star className="h-4 w-4 text-amber-600" />} label="Reviews" value={m.avg_rating !== null ? `${m.avg_rating} avg (${m.review_count})` : `${m.review_count}`} />
            <MetricCard icon={<Award className="h-4 w-4 text-teal-600" />} label="Coupons Claimed" value={String(m.coupons_claimed)} />
            <MetricCard icon={<Package className="h-4 w-4 text-indigo-600" />} label="Last Order" value={m.last_order_date ? formatDate(m.last_order_date) : 'Never'} />
          </div>
        </div>
      </div>

      {/* Order History */}
      {orders.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-navy-800">Order History ({orders.length})</h4>
          <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Order</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Date</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Items</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-right">Total</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-stone-50/50">
                    <td className="px-3 py-2">
                      <span className="font-medium text-navy-800">{o.order_number}</span>
                      {o.coupon_code && <span className="ml-1.5 text-xs text-brand-600">({o.coupon_code})</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{formatDate(o.created_at)}</td>
                    <td className="px-3 py-2">
                      <span className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                        ORDER_STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-700'
                      )}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{o.item_count} items</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-700">{formatCurrencyFull(Number(o.total))}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-slate-400 hover:text-brand-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-navy-800">Reviews ({reviews.length})</h4>
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-800 truncate">{r.product_title}</p>
                    {r.brand_name && <p className="text-xs text-slate-400">{r.brand_name}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StarRating rating={r.rating} />
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                      REVIEW_STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-700'
                    )}>
                      {r.status}
                    </span>
                  </div>
                </div>
                {r.title && <p className="mt-2 text-sm font-medium text-slate-700">{r.title}</p>}
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">{r.body}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span>{formatDate(r.created_at)}</span>
                  {r.reward_coupon && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-teal-700 font-medium">
                      <Award className="h-3 w-3" />
                      {r.reward_coupon.code}
                      {r.reward_coupon.used && <span className="text-teal-500">(used)</span>}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for no orders and no reviews */}
      {orders.length === 0 && reviews.length === 0 && (
        <div className="text-center py-6 text-sm text-slate-500">
          No orders or reviews yet for this customer.
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className="text-slate-400 shrink-0">{icon}</span>
      {children}
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-navy-800">{value}</p>
    </div>
  );
}
