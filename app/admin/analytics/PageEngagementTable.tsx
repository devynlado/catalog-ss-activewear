'use client';

import { useEffect, useState } from 'react';

export interface PageEngagementRow {
  pagePath: string;
  views: number;
  activeUsers: number;
  viewsPerUser: number;
  averageEngagementTimeSeconds: number;
  click: number;
  form_submit: number;
  generate_lead: number;
}

function formatEngagement(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function PageEngagementTable() {
  const [rows, setRows] = useState<PageEngagementRow[]>([]);
  const [dataSource, setDataSource] = useState<'ga4' | 'mock' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics/page-engagement')
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <p className="font-medium">Could not load page engagement</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{error}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-slate-500">
        No page engagement data available.
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="sticky left-0 z-10 min-w-[220px] bg-stone-50 px-4 py-3 font-semibold text-navy-800">
                Page
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Views</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Active users</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Views per active user</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Avg. engagement time</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Click</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Form submit</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Generate lead</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.pagePath}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}
              >
                <td className="sticky left-0 z-10 min-w-[220px] border-b border-stone-100 bg-inherit px-4 py-2.5 font-medium text-slate-800">
                  {row.pagePath === '/' ? 'Home (/)' : row.pagePath}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.views.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.activeUsers.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.viewsPerUser.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {formatEngagement(row.averageEngagementTimeSeconds)}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.click.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.form_submit.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.generate_lead.toLocaleString()}
                </td>
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
