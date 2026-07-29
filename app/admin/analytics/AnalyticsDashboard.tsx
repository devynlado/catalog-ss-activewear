'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  BarChart3,
  AlertCircle,
  Plus,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ExternalLink,
  Download,
  Calendar,
} from 'lucide-react';
import { ProfitChart } from './ProfitChart';
import { AdSpendForm } from './AdSpendForm';

// ---- Types ----
interface KPIs {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
  orders: number;
  aov: number;
  totalRefunds: number;
  stripeFees: number;
  shippingCharged: number;
  actualShipping: number;
  actualShippingCount: number;
  adSpend: number;
  roas: number | null;
  profitAfterAds: number;
  impressions: number;
  clicks: number;
}

interface PriorPeriod {
  revenue: number;
  orders: number;
  grossProfit: number;
  grossMargin: number;
  aov: number;
  adSpend: number;
  roas: number | null;
}

interface CostBreakdown {
  cogsPercent: number;
  shippingPercent: number;
  stripePercent: number;
  profitPercent: number;
}

interface DailySeries {
  date: string;
  revenue: number;
  cogs: number;
  profit: number;
  orders: number;
  adSpend: number;
  pmaxSpend: number;
  searchSpend: number;
}

interface OrderRow {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  revenue: number;
  cogs: number;
  stripeFee: number;
  shippingCharged: number;
  actualShipping: number | null;
  shippingDelta: number | null;
  netProfit: number;
  margin: number;
  orderType: string;
  cogsSource: string;
  utmSource: string | null;
  refunded: number;
}

interface MissingShippingOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  customerName: string;
  status: string;
  shippingCharged: number;
}

interface ByOrderType {
  cart: { count: number; revenue: number; cogs: number; profit: number; avgMargin: number };
  package: { count: number; revenue: number; cogs: number; profit: number; avgMargin: number };
}

interface PMaxData {
  spend: number;
  roas: number | null;
  profitAfterAds: number;
  impressions: number;
  clicks: number;
}

interface SearchData {
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number | null;
}

interface AnalyticsData {
  kpis: KPIs;
  priorPeriod: PriorPeriod;
  costBreakdown: CostBreakdown;
  dailySeries: DailySeries[];
  orders: OrderRow[];
  missingShippingCost: MissingShippingOrder[];
  byOrderType: ByOrderType;
  pmax?: PMaxData;
  search?: SearchData;
}

type Period = '7d' | '30d' | '90d' | 'custom';

// ---- Helpers ----
function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function TrendBadge({ current, prior, format = 'currency' }: { current: number; prior: number; format?: 'currency' | 'percent' | 'number' }) {
  if (prior === 0) return null;
  const change = ((current - prior) / prior) * 100;
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.5;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(change).toFixed(1)}%
    </span>
  );
}

function MarginBadge({ margin }: { margin: number }) {
  const color = margin >= 25 ? 'bg-green-100 text-green-700' : margin >= 12 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {margin.toFixed(1)}%
    </span>
  );
}

// ---- Main Component ----
export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>('7d');
  const [customFrom, setCustomFrom] = useState<string>(daysAgoStr(30));
  const [customTo, setCustomTo] = useState<string>(todayStr());
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdSpendForm, setShowAdSpendForm] = useState(false);
  const [sortField, setSortField] = useState<'createdAt' | 'revenue' | 'margin' | 'netProfit'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async () => {
    // A custom range needs both ends before we hit the API.
    if (period === 'custom' && (!customFrom || !customTo)) return;

    setIsLoading(true);
    try {
      const query =
        period === 'custom'
          ? `period=custom&from=${customFrom}&to=${customTo}`
          : `period=${period}`;
      const res = await fetch(`/api/admin/analytics?${query}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const { kpis, priorPeriod, costBreakdown, dailySeries, orders, missingShippingCost, byOrderType, pmax, search } = data;

  const sortedOrders = [...orders].sort((a, b) => {
    const aVal = a[sortField] ?? 0;
    const bVal = b[sortField] ?? 0;
    if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const periods: { value: Period; label: string }[] = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
    { value: 'custom', label: 'Custom' },
  ];

  const exportCSV = (type: 'orders' | 'daily') => {
    let csvContent = '';
    const rangeLabel = period === 'custom' ? `${customFrom}_to_${customTo}` : period;
    const filename = `analytics_${type}_${rangeLabel}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'orders') {
      csvContent = 'Order,Date,Customer,Type,Revenue,Refunded,COGS,Stripe Fee,Shipping Charged,Actual Shipping,Net Profit,Margin %,Source,COGS Source\n';
      for (const o of sortedOrders) {
        csvContent += [
          o.orderNumber,
          new Date(o.createdAt).toLocaleDateString(),
          `"${o.customerName.replace(/"/g, '""')}"`,
          o.orderType,
          o.revenue.toFixed(2),
          o.refunded.toFixed(2),
          o.cogs.toFixed(2),
          o.stripeFee.toFixed(2),
          o.shippingCharged.toFixed(2),
          o.actualShipping !== null ? o.actualShipping.toFixed(2) : '',
          o.netProfit.toFixed(2),
          o.margin.toFixed(1),
          o.utmSource || 'organic',
          o.cogsSource || '',
        ].join(',') + '\n';
      }
    } else {
      csvContent = 'Date,Revenue,COGS,Profit,Orders,PMax Spend,Search Spend,Total Ad Spend\n';
      for (const d of dailySeries) {
        csvContent += [
          d.date,
          d.revenue.toFixed(2),
          d.cogs.toFixed(2),
          d.profit.toFixed(2),
          d.orders,
          d.pmaxSpend.toFixed(2),
          d.searchSpend.toFixed(2),
          d.adSpend.toFixed(2),
        ].join(',') + '\n';
      }
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-white text-navy-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date range — editing a date auto-selects the Custom period */}
          {period === 'custom' && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={customFrom}
                max={customTo || todayStr()}
                onChange={(e) => { setPeriod('custom'); setCustomFrom(e.target.value); }}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                max={todayStr()}
                onChange={(e) => { setPeriod('custom'); setCustomTo(e.target.value); }}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-stone-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <div className="invisible group-hover:visible absolute right-0 z-20 mt-1 w-44 rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => exportCSV('orders')}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-stone-50"
              >
                Order Profitability
              </button>
              <button
                onClick={() => exportCSV('daily')}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-stone-50"
              >
                Daily Summary
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowAdSpendForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-stone-50"
          >
            <Plus className="h-4 w-4" />
            Log Ad Spend
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard
          label="Revenue"
          value={formatCurrency(kpis.revenue)}
          icon={DollarSign}
          trend={<TrendBadge current={kpis.revenue} prior={priorPeriod.revenue} />}
          color="brand"
        />
        <KpiCard
          label="COGS"
          value={formatCurrency(kpis.cogs)}
          icon={Package}
          color="slate"
        />
        <KpiCard
          label="Gross Profit"
          value={formatCurrency(kpis.grossProfit)}
          icon={TrendingUp}
          trend={<TrendBadge current={kpis.grossProfit} prior={priorPeriod.grossProfit} />}
          color="green"
        />
        <KpiCard
          label="Gross Margin"
          value={formatPercent(kpis.grossMargin)}
          icon={BarChart3}
          color={kpis.grossMargin >= 25 ? 'green' : kpis.grossMargin >= 12 ? 'amber' : 'red'}
        />
        <KpiCard
          label="Net Profit"
          value={formatCurrency(kpis.netProfit)}
          icon={kpis.netProfit >= 0 ? TrendingUp : TrendingDown}
          color={kpis.netProfit >= 0 ? 'green' : 'red'}
          subtitle="After all costs"
        />
        <KpiCard
          label="Orders"
          value={kpis.orders.toString()}
          icon={ShoppingCart}
          trend={<TrendBadge current={kpis.orders} prior={priorPeriod.orders} format="number" />}
          color="blue"
        />
        <KpiCard
          label="AOV"
          value={formatCurrency(kpis.aov)}
          icon={DollarSign}
          trend={<TrendBadge current={kpis.aov} prior={priorPeriod.aov} />}
          color="purple"
        />
      </div>

      {/* PMax Campaign Performance */}
      {pmax && pmax.spend > 0 && (
        <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-1.5">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-navy-800">PMax Campaign — E-Commerce</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-slate-500">PMax Spend</p>
              <p className="mt-1 text-2xl font-bold text-navy-800">{formatCurrency(pmax.spend)}</p>
              {pmax.impressions > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  {pmax.impressions.toLocaleString()} impr · {pmax.clicks.toLocaleString()} clicks
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">PMax ROAS</p>
              <p className={`mt-1 text-2xl font-bold ${pmax.roas && kpis.grossMargin > 0 && pmax.roas >= (1 / (kpis.grossMargin / 100)) ? 'text-green-600' : 'text-red-600'}`}>
                {pmax.roas !== null ? `${pmax.roas.toFixed(2)}x` : 'N/A'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Break-even: {kpis.grossMargin > 0 ? `${(1 / (kpis.grossMargin / 100)).toFixed(2)}x` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Profit After PMax Ads</p>
              <p className={`mt-1 text-2xl font-bold ${pmax.profitAfterAds >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(pmax.profitAfterAds)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search campaign data is tracked but displayed on the service/quotes dashboard */}

      {/* Cost Breakdown Bar */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy-800">Where Each Dollar Goes</h3>
          <p className="text-sm text-slate-500">Revenue: {formatCurrency(kpis.revenue)}</p>
        </div>
        <div className="flex h-8 overflow-hidden rounded-lg">
          {costBreakdown.cogsPercent > 0 && (
            <div
              className="flex items-center justify-center bg-slate-300 text-[11px] font-medium text-slate-700 transition-all"
              style={{ width: `${Math.max(costBreakdown.cogsPercent, 2)}%` }}
              title={`COGS: ${costBreakdown.cogsPercent}%`}
            >
              {costBreakdown.cogsPercent >= 8 && `COGS ${costBreakdown.cogsPercent}%`}
            </div>
          )}
          {costBreakdown.shippingPercent > 0 && (
            <div
              className="flex items-center justify-center bg-amber-200 text-[11px] font-medium text-amber-700 transition-all"
              style={{ width: `${Math.max(costBreakdown.shippingPercent, 2)}%` }}
              title={`Shipping: ${costBreakdown.shippingPercent}%`}
            >
              {costBreakdown.shippingPercent >= 8 && `Ship ${costBreakdown.shippingPercent}%`}
            </div>
          )}
          {costBreakdown.stripePercent > 0 && (
            <div
              className="flex items-center justify-center bg-purple-200 text-[11px] font-medium text-purple-700 transition-all"
              style={{ width: `${Math.max(costBreakdown.stripePercent, 2)}%` }}
              title={`Stripe: ${costBreakdown.stripePercent}%`}
            >
              {costBreakdown.stripePercent >= 6 && `Stripe ${costBreakdown.stripePercent}%`}
            </div>
          )}
          <div
            className={`flex items-center justify-center text-[11px] font-medium transition-all ${
              costBreakdown.profitPercent >= 0 ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
            }`}
            style={{ width: `${Math.max(Math.abs(costBreakdown.profitPercent), 2)}%` }}
            title={`Profit: ${costBreakdown.profitPercent}%`}
          >
            {Math.abs(costBreakdown.profitPercent) >= 8 && `Profit ${costBreakdown.profitPercent}%`}
          </div>
        </div>
        <div className="mt-2 flex gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> COGS</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-200" /> Shipping</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-purple-200" /> Stripe</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-green-200" /> Profit</span>
        </div>
      </div>

      {/* Profit Trend Chart */}
      {dailySeries.length > 1 && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-navy-800">Profit Trend</h3>
          <ProfitChart data={dailySeries} hasAdSpend={kpis.adSpend > 0} />
        </div>
      )}

      {/* Daily Spend vs Revenue Table */}
      {dailySeries.some(d => d.pmaxSpend > 0 || d.searchSpend > 0) && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-navy-800">Daily Profitability & Ad Spend</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3 text-right">PMax Spend</th>
                  <th className="px-4 py-3 text-right">Profit After PMax</th>
                  <th className="px-4 py-3 text-right">PMax ROAS</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {[...dailySeries].reverse().slice(0, 14).map(day => {
                  const dayRoas = day.pmaxSpend > 0 ? day.revenue / day.pmaxSpend : null;
                  const profitAfterPmax = day.profit - day.pmaxSpend;
                  return (
                    <tr key={day.date} className="border-b border-stone-50 hover:bg-stone-50">
                      <td className="px-4 py-2.5 font-medium text-slate-700">
                        {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{formatCurrency(day.revenue)}</td>
                      <td className={`px-4 py-2.5 text-right font-medium ${day.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(day.profit)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600">
                        {day.pmaxSpend > 0 ? formatCurrency(day.pmaxSpend) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {day.pmaxSpend > 0 ? (
                          <span className={`font-medium ${profitAfterPmax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profitAfterPmax)}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {dayRoas !== null ? (
                          <span className={`font-medium ${dayRoas >= 3 ? 'text-green-600' : dayRoas >= 1.5 ? 'text-amber-600' : 'text-red-600'}`}>
                            {dayRoas.toFixed(2)}x
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{day.orders}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Breakdown: Cart vs Package */}
      <div className="grid gap-4 sm:grid-cols-2">
        <BreakdownCard title="Cart Orders" data={byOrderType.cart} />
        <BreakdownCard title="Package Orders" data={byOrderType.package} subtitle="Blank COGS only" />
      </div>

      {/* Missing Shipping Cost Widget */}
      {missingShippingCost.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">
              Orders Missing Shipping Cost ({missingShippingCost.length})
            </h3>
          </div>
          <div className="space-y-2">
            {missingShippingCost.slice(0, 10).map(order => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5 text-sm hover:bg-amber-50/50 border border-amber-100"
              >
                <div>
                  <span className="font-medium text-slate-800">{order.orderNumber}</span>
                  <span className="ml-2 text-slate-500">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">Charged: ${order.shippingCharged.toFixed(2)}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Order Profitability Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-navy-800">Order Profitability</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs font-medium text-slate-500">
                <th className="px-4 py-3">Order</th>
                <th className="cursor-pointer px-4 py-3 hover:text-slate-700" onClick={() => handleSort('createdAt')}>
                  Date {sortField === 'createdAt' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3">Customer</th>
                <th className="cursor-pointer px-4 py-3 text-right hover:text-slate-700" onClick={() => handleSort('revenue')}>
                  Revenue {sortField === 'revenue' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-right">COGS</th>
                <th className="px-4 py-3 text-right">Fees</th>
                <th className="cursor-pointer px-4 py-3 text-right hover:text-slate-700" onClick={() => handleSort('netProfit')}>
                  Profit {sortField === 'netProfit' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="cursor-pointer px-4 py-3 text-right hover:text-slate-700" onClick={() => handleSort('margin')}>
                  Margin {sortField === 'margin' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map(order => (
                <tr key={order.id} className="border-b border-stone-50 hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-brand-600 hover:text-brand-700">
                      {order.orderNumber}
                    </Link>
                    {order.cogsSource === 'backfill' && (
                      <span className="ml-1 text-[10px] text-slate-400" title="COGS estimated from current prices">~</span>
                    )}
                    {order.orderType === 'package' && (
                      <span className="ml-1 rounded bg-purple-100 px-1 py-0.5 text-[10px] font-medium text-purple-600">PKG</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="max-w-[150px] truncate px-4 py-3 text-slate-600">{order.customerName}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">
                    {formatCurrency(order.revenue)}
                    {order.refunded > 0 && (
                      <span className="ml-1 text-[10px] text-red-500">-{formatCurrency(order.refunded)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(order.cogs)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(order.stripeFee)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${order.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(order.netProfit)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <MarginBadge margin={order.margin} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ad Spend Form Modal */}
      {showAdSpendForm && (
        <AdSpendForm
          onClose={() => setShowAdSpendForm(false)}
          onSaved={() => {
            setShowAdSpendForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// ---- Sub-components ----

function KpiCard({ label, value, icon: Icon, trend, color, subtitle }: {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-100 text-brand-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    slate: 'bg-stone-100 text-stone-600',
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className={`rounded-lg p-1.5 ${colorMap[color] || colorMap.slate}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-2 text-xl font-bold text-navy-800">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {trend}
        {subtitle && <span className="text-[11px] text-slate-400">{subtitle}</span>}
      </div>
    </div>
  );
}

function BreakdownCard({ title, data, subtitle }: {
  title: string;
  data: { count: number; revenue: number; cogs: number; profit: number; avgMargin: number };
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy-800">{title}</h3>
        {subtitle && <span className="text-[10px] text-slate-400">{subtitle}</span>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Orders</p>
          <p className="text-lg font-bold text-navy-800">{data.count}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Revenue</p>
          <p className="text-lg font-bold text-navy-800">{formatCurrency(data.revenue)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Profit</p>
          <p className={`text-lg font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.profit)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Avg Margin</p>
          <MarginBadge margin={data.avgMargin} />
        </div>
      </div>
    </div>
  );
}
