'use client';

import { useEffect, useState } from 'react';

export interface PageVisitorRow {
  pagePath: string;
  pageTitle?: string;
  direct: number;
  googleAds: number;
  organicSearch: number;
  organicSocial: number;
  organicShopping: number;
  referral: number;
  paidShopping: number;
  paidSocial: number;
  crossNetwork: number;
  other: number;
  total: number;
}

const CHANNEL_COLUMNS: { key: keyof PageVisitorRow; label: string }[] = [
  { key: 'direct', label: 'Direct' },
  { key: 'googleAds', label: 'Google Ads' },
  { key: 'organicSearch', label: 'Organic Search' },
  { key: 'organicSocial', label: 'Organic Social' },
  { key: 'organicShopping', label: 'Organic Shopping' },
  { key: 'referral', label: 'Referral' },
  { key: 'paidShopping', label: 'Paid Shopping' },
  { key: 'paidSocial', label: 'Paid Social' },
  { key: 'crossNetwork', label: 'Cross-network' },
  { key: 'other', label: 'Other' },
  { key: 'total', label: 'Total' },
];

export function PageVisitorTable() {
  const [pages, setPages] = useState<PageVisitorRow[]>([]);
  const [dataSource, setDataSource] = useState<'ga4' | 'mock' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics/page-visitors')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.error || (res.status === 403 ? 'Admin access required' : 'Failed to load');
          const details = data.details ? ` — ${data.details}` : '';
          throw new Error(`${msg}${details}`);
        }
        return data;
      })
      .then((data) => {
        setPages(data.pages ?? []);
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <p className="font-medium">Could not load analytics</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{error}</p>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-slate-500">
        No page visitor data available.
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <th className="sticky left-0 z-30 min-w-[200px] bg-stone-50 px-4 py-3 font-semibold text-navy-800">
                Page
              </th>
              {CHANNEL_COLUMNS.map(({ key, label }) => (
                <th
                  key={key}
                  className="whitespace-nowrap bg-stone-50 px-4 py-3 font-semibold text-navy-800"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
          {pages.map((row, idx) => (
            <tr
              key={row.pagePath}
              className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}
            >
              <td className="sticky left-0 z-10 min-w-[200px] border-b border-stone-100 bg-inherit px-4 py-2.5">
                <span className="font-medium text-slate-800">{row.pagePath}</span>
                {row.pageTitle && (
                  <span className="ml-1 block text-xs text-slate-500">
                    {row.pageTitle}
                  </span>
                )}
              </td>
              {CHANNEL_COLUMNS.map(({ key }) => (
                <td
                  key={key}
                  className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums"
                >
                  {row[key] as number}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      {dataSource && (
        <p className="absolute bottom-2 right-3 text-right text-[10px] text-slate-400">
          Data source: {dataSource === 'ga4' ? 'Live (GA4)' : 'Sample data'}
        </p>
      )}
    </div>
  );
}
