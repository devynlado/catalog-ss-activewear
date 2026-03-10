'use client';

import { useEffect, useState } from 'react';

export interface SalesBySourceRow {
  source: string;
  productsViewed: number;
  addedToCart: number;
  valueAddedToCart: number;
  enteredCheckout: number;
  valueCheckout: number;
  productsPurchased: number;
  totalPurchases: number;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function SalesBySourceSection() {
  const [rows, setRows] = useState<SalesBySourceRow[]>([]);
  const [dataSource, setDataSource] = useState<'ga4' | 'mock' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics/sales-by-source')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.error || (res.status === 403 ? 'Admin access required' : res.status === 401 ? 'Please log in.' : 'Failed to load');
          const details = data.details && data.code !== 'GA4_ERROR' ? ` — ${data.details}` : '';
          throw new Error(`${msg}${details}`);
        }
        return data;
      })
      .then((data) => {
        setRows(data.rows ?? []);
        setDataSource(data.source ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-stone-200 bg-white p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-medium">Could not load sales by source</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{error}</p>
        <p className="mt-3 text-xs text-amber-700">
          On production: log in as an admin. For real GA4 data, add GA4_PROPERTY_ID and GA4_SERVICE_ACCOUNT_JSON in Vercel → Environment Variables; otherwise sample data is used.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-slate-500">
        No sales-by-source data available. Ensure ecommerce events (view_item, add_to_cart, begin_checkout, purchase) are sent to GA4.
      </div>
    );
  }

  const maxTotalPurchases = Math.max(1, ...rows.map((r) => r.totalPurchases));

  return (
    <div className="relative space-y-8">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="sticky left-0 z-10 min-w-[180px] bg-stone-50 px-4 py-3 font-semibold text-navy-800">
                Visitor source
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Products viewed</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Added to cart</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Value added to cart</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Entered checkout</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Value at checkout</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Products purchased</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Total purchases</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.source}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}
              >
                <td className="sticky left-0 z-10 min-w-[180px] border-b border-stone-100 bg-inherit px-4 py-2.5 font-medium text-slate-800">
                  {row.source}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.productsViewed.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.addedToCart.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.valueAddedToCart > 0 ? formatCurrency(row.valueAddedToCart) : '—'}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.enteredCheckout.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.valueCheckout > 0 ? formatCurrency(row.valueCheckout) : '—'}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.productsPurchased.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 font-medium text-slate-800 tabular-nums">
                  {formatCurrency(row.totalPurchases)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Horizontal bar chart: Total purchases by source */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-navy-800">
          Total purchases by visitor source
        </h3>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.source} className="flex items-center gap-4">
              <div className="w-44 shrink-0 text-sm font-medium text-slate-700">
                {row.source}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="h-8 rounded-md bg-brand-600"
                  style={{
                    width: `${Math.round((row.totalPurchases / maxTotalPurchases) * 100)}%`,
                    minWidth: row.totalPurchases > 0 ? '4px' : '0',
                  }}
                />
              </div>
              <div className="w-24 shrink-0 text-right text-sm tabular-nums text-slate-700">
                {formatCurrency(row.totalPurchases)}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Bar length is proportional to total purchase revenue. Data last 30 days.
        </p>
      </div>
      {dataSource && (
        <p className="absolute bottom-2 right-3 text-right text-[10px] text-slate-400">
          Data source: {dataSource === 'ga4' ? 'Live (GA4)' : 'Sample data'}
        </p>
      )}
    </div>
  );
}
