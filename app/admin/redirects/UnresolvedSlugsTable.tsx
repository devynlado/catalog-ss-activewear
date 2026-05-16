'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, X, Plus, Bot, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { SuggestionsPanel } from './SuggestionsPanel';
import type { PickedProduct } from './ProductPicker';
import { derivePathSection, type NotFoundPathRow } from './types';

const PAGE_SIZE = 25;
const ALL_SECTIONS = '__all__';

interface UnresolvedSlugsTableProps {
  rows: NotFoundPathRow[];
  loading: boolean;
  showResolved: boolean;
  showBots: boolean;
  onToggleShowResolved: (value: boolean) => void;
  onToggleShowBots: (value: boolean) => void;
  /**
   * Opens the create-redirect modal pre-filled with a path, and
   * optionally a pre-picked product target (from the inline suggester).
   */
  onCreateFor: (path: string, presetProduct?: PickedProduct | null) => void;
  onChanged: () => void;
}

/**
 * "Unresolved Paths" tab. Shows 404 misses logged by app/not-found.tsx
 * (any URL on the site, not just /product/*), sorted by recency. Hides
 * bot traffic by default. Each row has two actions: "Create redirect"
 * (opens the form pre-filled) and "Ignore" (marks as junk so it leaves
 * the queue).
 *
 * The suggestions panel is only useful for /product/* paths, so it's
 * gated and the icon disappears for everything else.
 */
export function UnresolvedSlugsTable({
  rows,
  loading,
  showResolved,
  showBots,
  onToggleShowResolved,
  onToggleShowBots,
  onCreateFor,
  onChanged,
}: UnresolvedSlugsTableProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [section, setSection] = useState<string>(ALL_SECTIONS);
  const [search, setSearch] = useState('');

  const sectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const k = derivePathSection(r.path);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (section !== ALL_SECTIONS && derivePathSection(r.path) !== section) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        r.path.toLowerCase().includes(q) ||
        (r.last_referrer ?? '').toLowerCase().includes(q) ||
        (r.last_user_agent ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, section, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  // Reset page when filters/search change, otherwise the user can land
  // on an empty page after a filter narrows the data.
  useEffect(() => {
    setPage(1);
  }, [showResolved, showBots, section, search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIndex = (page - 1) * PAGE_SIZE;
  const pagedRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = filteredRows.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + PAGE_SIZE, filteredRows.length);

  async function handleIgnore(path: string) {
    if (!confirm(`Mark "${path}" as junk and remove it from the queue?`)) return;
    setBusy(path);
    try {
      const res = await fetch('/api/admin/not-found-slugs', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path, action: 'ignore' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to ignore');
      } else {
        onChanged();
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm">
        <label className="flex items-center gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => onToggleShowResolved(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
          />
          Show resolved
        </label>
        <label className="flex items-center gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={showBots}
            onChange={(e) => onToggleShowBots(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
          />
          Show bot/scanner traffic
        </label>
        <span className="ml-auto text-xs text-slate-500">
          {filteredRows.length} of {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </span>
      </div>

      <div className="relative w-full sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by path, referrer, or user-agent…"
          className="w-full rounded-lg border border-stone-200 bg-white pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
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
          Loading queue…
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-sm text-slate-500">
          {rows.length === 0
            ? "No unresolved paths. The queue refreshes whenever a real visitor hits a URL that doesn't resolve."
            : 'No unresolved paths match your filters.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-stone-200 table-fixed">
              <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="w-auto px-4 py-3">Path</th>
                  <th className="w-16 px-4 py-3 text-right">Hits</th>
                  <th className="w-24 px-4 py-3 hidden md:table-cell">First seen</th>
                  <th className="w-24 px-4 py-3">Last seen</th>
                  <th className="w-40 px-4 py-3 hidden lg:table-cell">Last referrer</th>
                  <th className="w-[170px] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {pagedRows.map((row) => {
                  const isExpanded = expandedPath === row.path;
                  return (
                    <FragmentRow
                      key={row.path}
                      row={row}
                      isExpanded={isExpanded}
                      busy={busy === row.path}
                      onToggleSuggest={() =>
                        setExpandedPath(isExpanded ? null : row.path)
                      }
                      onCreateFor={onCreateFor}
                      onIgnore={() => handleIgnore(row.path)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredRows.length > PAGE_SIZE && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-stone-200 bg-stone-50/50 px-4 py-3 sm:flex-row">
              <p className="text-xs text-slate-500">
                Showing <span className="font-medium text-slate-700">{showingFrom}</span>–
                <span className="font-medium text-slate-700">{showingTo}</span> of{' '}
                <span className="font-medium text-slate-700">{filteredRows.length}</span>
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
 * One row + its (optional) expanded suggestions panel. Split out so the
 * map() above stays readable.
 *
 * The suggestions panel is only meaningful for /product/* paths (it
 * scores against the product catalog). For every other URL type we hide
 * the Suggest button entirely so the admin isn't tempted to use it.
 */
function FragmentRow({
  row,
  isExpanded,
  busy,
  onToggleSuggest,
  onCreateFor,
  onIgnore,
}: {
  row: NotFoundPathRow;
  isExpanded: boolean;
  busy: boolean;
  onToggleSuggest: () => void;
  onCreateFor: (path: string, presetProduct?: PickedProduct | null) => void;
  onIgnore: () => void;
}) {
  const isProductPath = row.path.startsWith('/product/');
  const productSlug = isProductPath ? row.path.slice('/product/'.length) : '';

  return (
    <>
      <tr className={`hover:bg-stone-50 ${row.resolved ? 'opacity-60' : ''}`}>
        <td className="px-4 py-3 align-top">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <code className="break-all rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
              {row.path}
            </code>
            <a
              href={row.path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center text-brand-600 hover:underline"
              title="Open live URL"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {row.is_bot && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                <Bot className="h-3 w-3" /> bot
              </span>
            )}
            {row.resolved && (
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                {row.resolution_type === 'redirect' ? 'redirected' : 'ignored'}
              </span>
            )}
          </div>
          {row.last_user_agent && (
            <p className="mt-1.5 truncate text-[11px] text-slate-400" title={row.last_user_agent}>
              {row.last_user_agent}
            </p>
          )}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right align-top text-sm font-medium tabular-nums text-slate-800">
          {row.hits.toLocaleString()}
        </td>
        <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-slate-500 hidden md:table-cell">
          {formatRelative(row.first_seen)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-slate-500">
          {formatRelative(row.last_seen)}
        </td>
        <td className="truncate px-4 py-3 align-top text-xs text-slate-500 hidden lg:table-cell" title={row.last_referrer ?? ''}>
          {row.last_referrer || <span className="italic text-slate-300">—</span>}
        </td>
        <td className="px-4 py-3 text-right align-top">
          {!row.resolved ? (
            <div className="inline-flex items-center gap-1">
              {isProductPath && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleSuggest}
                  disabled={busy}
                  title="Suggest match"
                  className={isExpanded ? 'bg-brand-50 text-brand-700' : ''}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => onCreateFor(row.path)}
                disabled={busy}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Redirect
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onIgnore}
                disabled={busy}
                title="Ignore (mark as junk)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">handled</span>
          )}
        </td>
      </tr>
      {isExpanded && !row.resolved && isProductPath && (
        <tr className="bg-stone-50/40">
          <td colSpan={6} className="px-4 py-3">
            <SuggestionsPanel
              slug={productSlug}
              autoRun
              onPick={(product) => onCreateFor(row.path, product)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

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

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return 'just now';
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString();
}
