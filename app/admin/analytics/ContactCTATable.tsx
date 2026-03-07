'use client';

import { useEffect, useState } from 'react';

export interface ContactCTARow {
  sourcePage: string;
  contactPageViews: number;
  formSubmissions: number;
  phoneClicks: number;
  emailClicks: number;
  locationClicks: number;
}

export function ContactCTATable() {
  const [rows, setRows] = useState<ContactCTARow[]>([]);
  const [dataSource, setDataSource] = useState<'ga4' | 'mock' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics/contact-cta')
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
        <p className="font-medium">Could not load CTA to contact</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{error}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-slate-500">
        No CTA-to-contact data available. Ensure GA4 is configured and you have traffic to /contact.
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="sticky left-0 z-10 min-w-[160px] bg-stone-50 px-4 py-3 font-semibold text-navy-800">
                Source page
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Contact page views</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Form submissions</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Phone clicks</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Email clicks</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">Location clicks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.sourcePage}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}
              >
                <td className="sticky left-0 z-10 min-w-[160px] border-b border-stone-100 bg-inherit px-4 py-2.5 font-medium text-slate-800">
                  {row.sourcePage === '(direct)' ? '(direct)' : row.sourcePage}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.contactPageViews.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.formSubmissions.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.phoneClicks.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.emailClicks.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-2.5 text-slate-700 tabular-nums">
                  {row.locationClicks.toLocaleString()}
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
