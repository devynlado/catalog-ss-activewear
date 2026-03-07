'use client';

import { useEffect, useState } from 'react';

export interface LeadBySourceRow {
  source: string;
  allEvents: number;
  page_view: number;
  session_start: number;
  first_visit: number;
  user_engagement: number;
  form_start: number;
  form_submit: number;
  generate_lead: number;
  open_decoration_modal: number;
  click: number;
  add_decoration: number;
  phone_click: number;
  custom_quote_request: number;
}

const COLUMNS: { key: keyof Omit<LeadBySourceRow, 'source'>; label: string }[] = [
  { key: 'allEvents', label: 'All events' },
  { key: 'page_view', label: 'page_view' },
  { key: 'session_start', label: 'Session start' },
  { key: 'first_visit', label: 'First visit' },
  { key: 'user_engagement', label: 'User engagement' },
  { key: 'form_start', label: 'Form start' },
  { key: 'form_submit', label: 'Form submit' },
  { key: 'generate_lead', label: 'Generate lead' },
  { key: 'open_decoration_modal', label: 'Open decoration modal' },
  { key: 'click', label: 'Click' },
  { key: 'add_decoration', label: 'Add decoration' },
  { key: 'phone_click', label: 'Phone click' },
  { key: 'custom_quote_request', label: 'Custom quote request' },
];

export function LeadBySourceTable() {
  const [rows, setRows] = useState<LeadBySourceRow[]>([]);
  const [dataSource, setDataSource] = useState<'ga4' | 'mock' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics/leads-by-source')
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
        <p className="font-medium">Could not load leads by source</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{error}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-slate-500">
        No leads-by-source data available.
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="sticky left-0 z-10 min-w-[120px] bg-stone-50 px-4 py-3 font-semibold text-navy-800">
                Visitor source
              </th>
              {COLUMNS.map(({ key, label }) => (
                <th key={key} className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.source}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}
              >
                <td className="sticky left-0 z-10 min-w-[120px] border-b border-stone-100 bg-inherit px-4 py-2.5 font-medium text-slate-800">
                  {row.source}
                </td>
                {COLUMNS.map(({ key }) => (
                  <td
                    key={key}
                    className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums"
                  >
                    {row[key].toLocaleString()}
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
