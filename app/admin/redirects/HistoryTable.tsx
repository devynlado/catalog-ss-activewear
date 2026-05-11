'use client';

import type { HistoryRow, HistoryAction } from './types';

interface HistoryTableProps {
  rows: HistoryRow[];
  loading: boolean;
}

/**
 * "History" tab. Renders the global change log across all redirects.
 * Read-only; the underlying table is append-only and enforced at the DB
 * trigger level.
 */
export function HistoryTable({ rows, loading }: HistoryTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-sm text-slate-500">
        Loading history…
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-sm text-slate-500">
        No history yet. Changes to redirects will appear here.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">From slug</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 bg-white text-sm">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-stone-50">
                <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-slate-500">
                  <div>{new Date(row.changed_at).toLocaleString()}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top text-slate-700">
                  {row.changed_by_name || (
                    <span className="italic text-slate-400">system</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <ActionBadge action={row.action} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                    /{row.from_slug}
                  </code>
                </td>
                <td className="max-w-md px-4 py-3 align-top text-xs text-slate-600">
                  <SnapshotSummary action={row.action} snapshot={row.snapshot} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: HistoryAction }) {
  const styles: Record<HistoryAction, string> = {
    created: 'bg-emerald-100 text-emerald-700',
    updated: 'bg-blue-100 text-blue-700',
    activated: 'bg-emerald-100 text-emerald-700',
    deactivated: 'bg-amber-100 text-amber-700',
    promoted: 'bg-indigo-100 text-indigo-700',
    deleted: 'bg-red-100 text-red-700',
    imported: 'bg-purple-100 text-purple-700',
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${styles[action] ?? 'bg-stone-100 text-slate-700'}`}
    >
      {action}
    </span>
  );
}

function SnapshotSummary({
  action,
  snapshot,
}: {
  action: HistoryAction;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: any;
}) {
  if (!snapshot || typeof snapshot !== 'object') {
    return <span className="italic text-slate-400">no snapshot</span>;
  }
  const parts: string[] = [];
  if (snapshot.target_type) {
    parts.push(`type=${snapshot.target_type}`);
  }
  if (snapshot.to_product_id != null) {
    parts.push(`product#${snapshot.to_product_id}`);
  }
  if (snapshot.to_url) {
    parts.push(`url=${snapshot.to_url}`);
  }
  if (snapshot.status_code) {
    parts.push(`${snapshot.status_code}`);
  }
  if (typeof snapshot.is_active === 'boolean') {
    parts.push(snapshot.is_active ? 'active' : 'inactive');
  }
  if (action === 'promoted' && snapshot.reason) {
    parts.push(`reason=${snapshot.reason}`);
  }
  return <span className="font-mono">{parts.join(' · ') || '—'}</span>;
}
