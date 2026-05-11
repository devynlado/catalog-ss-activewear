'use client';

import { useState } from 'react';
import { ExternalLink, X, Plus, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SuggestionsPanel } from './SuggestionsPanel';
import type { PickedProduct } from './ProductPicker';
import type { NotFoundSlugRow } from './types';

interface UnresolvedSlugsTableProps {
  rows: NotFoundSlugRow[];
  loading: boolean;
  showResolved: boolean;
  showBots: boolean;
  onToggleShowResolved: (value: boolean) => void;
  onToggleShowBots: (value: boolean) => void;
  /**
   * Opens the create-redirect modal pre-filled with a slug, and
   * optionally a pre-picked product target (from the inline suggester).
   */
  onCreateFor: (slug: string, presetProduct?: PickedProduct | null) => void;
  onChanged: () => void;
}

/**
 * "Unresolved Slugs" tab. Shows misses logged from /product/<slug>
 * 404s, sorted by recency. Hides bot traffic by default. Each row has
 * two actions: "Create redirect" (opens the form pre-filled) and
 * "Ignore" (marks as junk so it leaves the queue).
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
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  async function handleIgnore(slug: string) {
    if (!confirm(`Mark "/${slug}" as junk and remove it from the queue?`)) return;
    setBusy(slug);
    try {
      const res = await fetch(
        `/api/admin/not-found-slugs/${encodeURIComponent(slug)}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'ignore' }),
        },
      );
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
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </span>
      </div>

      {loading ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading queue…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-sm text-slate-500">
          No unresolved slugs. The queue refreshes whenever a real visitor hits a /product/ URL that
          doesn&apos;t resolve.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3 text-right">Hits</th>
                  <th className="px-4 py-3">First seen</th>
                  <th className="px-4 py-3">Last seen</th>
                  <th className="px-4 py-3">Last referrer</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {rows.map((row) => {
                  const isExpanded = expandedSlug === row.slug;
                  return (
                    <FragmentRow
                      key={row.slug}
                      row={row}
                      isExpanded={isExpanded}
                      busy={busy === row.slug}
                      onToggleSuggest={() =>
                        setExpandedSlug(isExpanded ? null : row.slug)
                      }
                      onCreateFor={onCreateFor}
                      onIgnore={() => handleIgnore(row.slug)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One row + its (optional) expanded suggestions panel. Split out so the
 * map() above stays readable.
 *
 * Renders two <tr>s when expanded — the main row and a colSpan row with
 * the inline `<SuggestionsPanel autoRun />`. Clicking "Use this" on a
 * suggestion immediately opens the create-redirect modal pre-filled with
 * both the from-slug AND the chosen product.
 */
function FragmentRow({
  row,
  isExpanded,
  busy,
  onToggleSuggest,
  onCreateFor,
  onIgnore,
}: {
  row: NotFoundSlugRow;
  isExpanded: boolean;
  busy: boolean;
  onToggleSuggest: () => void;
  onCreateFor: (slug: string, presetProduct?: PickedProduct | null) => void;
  onIgnore: () => void;
}) {
  return (
    <>
      <tr className={`hover:bg-stone-50 ${row.resolved ? 'opacity-60' : ''}`}>
        <td className="px-4 py-3 align-top">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
              /product/{row.slug}
            </code>
            <a
              href={`/product/${row.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-brand-600 hover:underline"
              title="Open live URL"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {row.is_bot && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                <Bot className="h-3 w-3" /> bot
              </span>
            )}
            {row.resolved && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
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
        <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-slate-500">
          {formatRelative(row.first_seen)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-slate-500">
          {formatRelative(row.last_seen)}
        </td>
        <td className="max-w-[200px] truncate px-4 py-3 align-top text-xs text-slate-500" title={row.last_referrer ?? ''}>
          {row.last_referrer || <span className="italic text-slate-300">—</span>}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right align-top">
          {!row.resolved ? (
            <div className="inline-flex items-center gap-1">
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
              <Button
                variant="primary"
                size="sm"
                onClick={() => onCreateFor(row.slug)}
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
      {isExpanded && !row.resolved && (
        <tr className="bg-stone-50/40">
          <td colSpan={6} className="px-4 py-3">
            <SuggestionsPanel
              slug={row.slug}
              autoRun
              onPick={(product) => onCreateFor(row.slug, product)}
            />
          </td>
        </tr>
      )}
    </>
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
