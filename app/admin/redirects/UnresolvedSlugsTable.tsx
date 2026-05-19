'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, X, Plus, Bot, Sparkles, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { SuggestionsPanel } from './SuggestionsPanel';
import type { PickedProduct } from './ProductPicker';
import type { NotFoundPathRow } from './types';

const PAGE_SIZE = 25;

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
  const [bulkBusy, setBulkBusy] = useState(false);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  // Selection lives in a Set so check/uncheck is O(1) regardless of how
  // many rows are in the queue. Keys are the row `path` (which is the
  // table's primary key and the API contract for ignore).
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        r.path.toLowerCase().includes(q) ||
        (r.last_referrer ?? '').toLowerCase().includes(q) ||
        (r.last_user_agent ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  // Reset page when filters/search change, otherwise the user can land
  // on an empty page after a filter narrows the data.
  useEffect(() => {
    setPage(1);
  }, [showResolved, showBots, search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Drop selected rows that no longer exist (after a refresh / mutation)
  // or that the current filter has hidden. Acting on hidden rows would be
  // a UI footgun: the admin doesn't see them and would not know what they
  // confirmed away.
  useEffect(() => {
    const visiblePaths = new Set(filteredRows.map((r) => r.path));
    let changed = false;
    const next = new Set<string>();
    for (const p of selected) {
      if (visiblePaths.has(p)) next.add(p);
      else changed = true;
    }
    if (changed) setSelected(next);
  }, [filteredRows, selected]);

  const startIndex = (page - 1) * PAGE_SIZE;
  const pagedRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = filteredRows.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + PAGE_SIZE, filteredRows.length);

  // Only count UNRESOLVED rows toward the master-checkbox state; rows that
  // are already resolved get rendered with no checkbox at all (their
  // action cell shows "handled"), so they can't be part of a bulk-ignore.
  const selectablePagedRows = pagedRows.filter((r) => !r.resolved);
  const pageSelectedCount = selectablePagedRows.filter((r) =>
    selected.has(r.path),
  ).length;
  const allOnPageSelected =
    selectablePagedRows.length > 0 &&
    pageSelectedCount === selectablePagedRows.length;
  const someOnPageSelected =
    pageSelectedCount > 0 && pageSelectedCount < selectablePagedRows.length;

  function toggleRow(path: string, next: boolean) {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(path);
      else copy.delete(path);
      return copy;
    });
  }

  function toggleAllOnPage(next: boolean) {
    setSelected((prev) => {
      const copy = new Set(prev);
      for (const r of selectablePagedRows) {
        if (next) copy.add(r.path);
        else copy.delete(r.path);
      }
      return copy;
    });
  }

  function selectAllFiltered() {
    setSelected(new Set(filteredRows.filter((r) => !r.resolved).map((r) => r.path)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

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

  async function handleBulkIgnore() {
    const paths = Array.from(selected);
    if (paths.length === 0) return;
    const message =
      paths.length === 1
        ? `Mark 1 path as junk and remove it from the queue?`
        : `Mark ${paths.length} paths as junk and remove them from the queue?`;
    if (!confirm(message)) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/admin/not-found-slugs', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ paths, action: 'ignore' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to ignore');
      } else {
        setSelected(new Set());
        onChanged();
      }
    } finally {
      setBulkBusy(false);
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

      {selected.size > 0 && (
        <BulkActionBar
          selectedCount={selected.size}
          filteredCount={filteredRows.filter((r) => !r.resolved).length}
          busy={bulkBusy}
          onClear={clearSelection}
          onSelectAllFiltered={selectAllFiltered}
          onBulkIgnore={handleBulkIgnore}
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
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                      checked={allOnPageSelected}
                      // `indeterminate` isn't a React prop; set imperatively via ref.
                      ref={(el) => {
                        if (el) el.indeterminate = someOnPageSelected;
                      }}
                      onChange={(e) => toggleAllOnPage(e.target.checked)}
                      disabled={selectablePagedRows.length === 0}
                    />
                  </th>
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
                      busy={busy === row.path || bulkBusy}
                      isSelected={selected.has(row.path)}
                      onToggleSelected={(next) => toggleRow(row.path, next)}
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
  isSelected,
  onToggleSelected,
  onToggleSuggest,
  onCreateFor,
  onIgnore,
}: {
  row: NotFoundPathRow;
  isExpanded: boolean;
  busy: boolean;
  isSelected: boolean;
  onToggleSelected: (next: boolean) => void;
  onToggleSuggest: () => void;
  onCreateFor: (path: string, presetProduct?: PickedProduct | null) => void;
  onIgnore: () => void;
}) {
  const isProductPath = row.path.startsWith('/product/');
  const productSlug = isProductPath ? row.path.slice('/product/'.length) : '';

  return (
    <>
      <tr
        className={`hover:bg-stone-50 ${row.resolved ? 'opacity-60' : ''} ${
          isSelected ? 'bg-brand-50/40' : ''
        }`}
      >
        <td className="px-3 py-3 align-top">
          {!row.resolved ? (
            <input
              type="checkbox"
              aria-label={`Select ${row.path}`}
              className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
              checked={isSelected}
              onChange={(e) => onToggleSelected(e.target.checked)}
              disabled={busy}
            />
          ) : null}
        </td>
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
          <td colSpan={7} className="px-4 py-3">
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

/**
 * Sticky bar that appears whenever there's at least one selected path.
 * Mirrors the GitHub / Gmail pattern: a single contextual surface that
 * shows the count, lets the admin escape selection with one click, and
 * exposes the bulk destructive action (Ignore selected). The "Select all
 * N matching this filter" link only appears when the admin has filled the
 * current page — that's the moment it stops being noise and starts being
 * useful.
 */
function BulkActionBar({
  selectedCount,
  filteredCount,
  busy,
  onClear,
  onSelectAllFiltered,
  onBulkIgnore,
}: {
  selectedCount: number;
  filteredCount: number;
  busy: boolean;
  onClear: () => void;
  onSelectAllFiltered: () => void;
  onBulkIgnore: () => void;
}) {
  const showSelectAll = selectedCount < filteredCount;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm">
      <span className="font-medium text-brand-800">
        {selectedCount} {selectedCount === 1 ? 'path' : 'paths'} selected
      </span>
      {showSelectAll && (
        <button
          type="button"
          onClick={onSelectAllFiltered}
          disabled={busy}
          className="text-xs font-medium text-brand-700 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Select all {filteredCount} matching this filter
        </button>
      )}
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClear} disabled={busy}>
          Clear
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onBulkIgnore}
          disabled={busy}
          className="bg-red-600 text-white hover:bg-red-700"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {busy
            ? 'Ignoring…'
            : `Ignore ${selectedCount === 1 ? 'selected' : `${selectedCount} selected`}`}
        </Button>
      </div>
    </div>
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
