'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Pencil,
  Power,
  Trash2,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { derivePathSection, type RedirectRow } from './types';

interface RedirectsTableProps {
  rows: RedirectRow[];
  loading: boolean;
  onEdit: (row: RedirectRow) => void;
  onChanged: () => void;
}

const PAGE_SIZE = 25;
const ALL_SECTIONS = '__all__';

/**
 * "Active Redirects" tab content. Displays every redirect (active and
 * inactive), with section-based filter chips, inline search, and
 * per-row actions: toggle active, edit, delete. Paginated client-side
 * (PAGE_SIZE per page) so the list stays scannable as it grows.
 */
export function RedirectsTable({ rows, loading, onEdit, onChanged }: RedirectsTableProps) {
  const [search, setSearch] = useState('');
  const [section, setSection] = useState<string>(ALL_SECTIONS);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Build the chip list from the actual data so the UI grows with the
  // catalog (a "/services/*" chip only appears once a services redirect
  // exists). Counts are computed off the full row set.
  const sectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const k = derivePathSection(r.from_path);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (section !== ALL_SECTIONS && derivePathSection(r.from_path) !== section) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        r.from_path.toLowerCase().includes(q) ||
        (r.to_url ?? '').toLowerCase().includes(q) ||
        (r.target_product?.style_name ?? '').toLowerCase().includes(q) ||
        (r.target_product?.brand_name ?? '').toLowerCase().includes(q) ||
        (r.notes ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, section]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Reset to first page when the user types in the search box or
  // switches sections — otherwise typing/clicking while on page 5
  // produces a confusing empty view.
  useEffect(() => {
    setPage(1);
  }, [search, section]);

  // Clamp page if the underlying data shrinks (e.g. row deleted, filter
  // narrowed) and we'd otherwise be stranded past the last page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIndex = (page - 1) * PAGE_SIZE;
  const paged = filtered.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + PAGE_SIZE, filtered.length);

  async function toggleActive(row: RedirectRow) {
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/redirects/${row.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ is_active: !row.is_active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to update');
      } else {
        onChanged();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(row: RedirectRow) {
    if (
      !confirm(
        `Delete redirect for "${row.from_path}"?\n\nThis cannot be undone, but the history entry will be preserved.`,
      )
    ) {
      return;
    }
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/redirects/${row.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete');
      } else {
        onChanged();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by path, target, brand, or notes…"
            className="w-full rounded-lg border border-stone-200 bg-white pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>
      {sectionCounts.length > 1 && (
        <SectionChips
          counts={sectionCounts}
          totalCount={rows.length}
          current={section}
          onChange={setSection}
        />
      )}

      {loading ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading redirects…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-sm text-slate-500">
          {rows.length === 0
            ? 'No redirects yet. Create one or resolve an unresolved path to get started.'
            : 'No redirects match your filters.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-stone-200 table-fixed">
              <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="w-auto px-4 py-3">From → Target</th>
                  <th className="w-28 px-4 py-3">Status</th>
                  <th className="w-20 px-4 py-3 text-right">Hits</th>
                  <th className="w-24 px-4 py-3 hidden md:table-cell">Updated</th>
                  <th className="w-[140px] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {paged.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-stone-50 ${row.is_active ? '' : 'bg-stone-50/50'}`}
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                        <code className="break-all rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                          {row.from_path}
                        </code>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <TargetDisplay row={row} />
                      </div>
                      {row.notes && (
                        <p className="mt-1.5 break-words text-xs italic text-slate-500">
                          {row.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1">
                        <StatusBadge row={row} />
                        {!row.is_active && (
                          <span className="block rounded-full bg-stone-200 px-2 py-0.5 text-center text-[10px] font-semibold uppercase text-slate-600">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right align-top text-sm tabular-nums text-slate-700">
                      {row.hits.toLocaleString()}
                      {row.last_hit_at && (
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          last {formatRelative(row.last_hit_at)}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-slate-500 hidden md:table-cell">
                      {formatRelative(row.updated_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(row)}
                          disabled={busyId === row.id}
                          title={row.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Power
                            className={`h-4 w-4 ${row.is_active ? 'text-emerald-600' : 'text-slate-400'}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(row)}
                          disabled={busyId === row.id}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(row)}
                          disabled={busyId === row.id}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > PAGE_SIZE && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-stone-200 bg-stone-50/50 px-4 py-3 sm:flex-row">
              <p className="text-xs text-slate-500">
                Showing <span className="font-medium text-slate-700">{showingFrom}</span>–
                <span className="font-medium text-slate-700">{showingTo}</span> of{' '}
                <span className="font-medium text-slate-700">{filtered.length}</span>
              </p>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Filter chips driven by the first path segment of `from_path`.
 *
 * The chip set is fully data-driven: a `/services/*` chip appears only
 * once a services redirect exists, an `/lp/*` chip appears only once a
 * landing-page redirect exists, etc. Avoids hard-coding a fixed taxonomy
 * the catalog will outgrow.
 */
function SectionChips({
  counts,
  totalCount,
  current,
  onChange,
}: {
  counts: [string, number][];
  totalCount: number;
  current: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Chip
        active={current === ALL_SECTIONS}
        onClick={() => onChange(ALL_SECTIONS)}
        label="All"
        count={totalCount}
      />
      {counts.map(([sec, n]) => (
        <Chip
          key={sec}
          active={current === sec}
          onClick={() => onChange(sec)}
          label={`/${sec}/`}
          count={n}
        />
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-brand-500 bg-brand-50 text-brand-700'
          : 'border-stone-200 bg-white text-slate-600 hover:border-stone-300 hover:bg-stone-50'
      }`}
    >
      <span className={active ? '' : 'font-mono'}>{label}</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          active ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-slate-500'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function TargetDisplay({ row }: { row: RedirectRow }) {
  if (row.target_type === 'gone') {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-red-700">
        404 / noindex
      </span>
    );
  }
  if (row.target_type === 'product') {
    const p = row.target_product;
    if (!p) {
      return (
        <span className="text-xs italic text-amber-600">missing product #{row.to_product_id}</span>
      );
    }
    const url = p.slug ? `/product/${p.slug}` : null;
    return (
      <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
        <span className="break-words font-medium text-navy-800">
          {p.brand_name} {p.style_name}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-0.5 text-brand-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
      <code className="break-all rounded bg-brand-50 px-1.5 py-0.5 font-mono text-xs text-brand-800">
        {row.to_url}
      </code>
      <a
        href={row.to_url ?? '#'}
        target="_blank"
        rel="noreferrer"
        className="inline-flex shrink-0 items-center text-brand-600 hover:underline"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </span>
  );
}

function StatusBadge({ row }: { row: RedirectRow }) {
  if (row.status_code === 301) {
    return (
      <span className="inline-block whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-emerald-700">
        301 perm
      </span>
    );
  }
  if (row.status_code === 302) {
    const auto = row.promote_to_301_at;
    const willPromote = auto && new Date(auto).getTime() > Date.now();
    return (
      <div className="space-y-1">
        <span className="inline-block whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">
          302 temp
        </span>
        {willPromote && (
          <div className="whitespace-nowrap text-[10px] text-slate-500">
            → 301 {formatRelative(auto!)}
          </div>
        )}
      </div>
    );
  }
  return (
    <span className="inline-block whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-700">
      {row.status_code}
    </span>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;
  const future = diff < 0;
  const abs = Math.abs(diff);
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  let str: string;
  if (abs < min) str = 'just now';
  else if (abs < hour) str = `${Math.floor(abs / min)}m`;
  else if (abs < day) str = `${Math.floor(abs / hour)}h`;
  else if (abs < 30 * day) str = `${Math.floor(abs / day)}d`;
  else str = new Date(iso).toLocaleDateString();
  if (future) return `in ${str}`;
  return abs < min ? str : `${str} ago`;
}
