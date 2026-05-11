'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Info, RefreshCw, Sparkles, ImageOff, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { PickedProduct } from './ProductPicker';

interface SuggestedProduct {
  style_id: number;
  brand_name: string;
  style_name: string;
  title: string;
  slug: string | null;
  primary_image_url: string | null;
  is_active: boolean;
  manually_hidden: boolean;
  score: number;
  reasons: string[];
}

interface SuggestResponse {
  normalizedSlug: string;
  tokens: string[];
  detectedStyleCode: string | null;
  suggestions: SuggestedProduct[];
  noStrongMatch: boolean;
}

interface SuggestionsPanelProps {
  /** The slug to score against. The panel only fetches when this is non-empty. */
  slug: string;
  /** Callback when admin clicks "Use this" on a candidate. */
  onPick: (product: PickedProduct) => void;
  /**
   * Optional callback fired when the engine reports "no strong match".
   * Lets the parent form nudge the admin toward the Category target type.
   */
  onNoStrongMatch?: () => void;
  /** When set, the panel auto-runs on mount instead of waiting for click. */
  autoRun?: boolean;
  /** Optional className for outer wrapper. */
  className?: string;
}

/**
 * Suggestion panel. Shows the top candidate products for a slug, with
 * score badges, match reasons, and a "Use this" action on each card.
 *
 * The panel is collapsed by default; clicking the Suggest button (or
 * `autoRun=true`) runs the engine. Results live only in component state
 * — nothing is persisted server-side.
 */
export function SuggestionsPanel({
  slug,
  onPick,
  onNoStrongMatch,
  autoRun,
  className,
}: SuggestionsPanelProps) {
  const [open, setOpen] = useState(Boolean(autoRun));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SuggestResponse | null>(null);

  const runSuggest = useCallback(async () => {
    if (!slug.trim()) {
      setError('Enter a slug first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/redirects/suggest?slug=${encodeURIComponent(slug.trim())}&topN=5`,
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Failed to fetch suggestions');
        setData(null);
      } else {
        setData(body as SuggestResponse);
        if ((body as SuggestResponse).noStrongMatch) {
          onNoStrongMatch?.();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug, onNoStrongMatch]);

  // Auto-run when requested and we have a slug.
  useEffect(() => {
    if (autoRun && slug.trim() && !data && !loading) {
      void runSuggest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, slug]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          void runSuggest();
        }}
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline ${className ?? ''}`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Suggest match
      </button>
    );
  }

  return (
    <div className={`rounded-lg border border-brand-200 bg-brand-50/40 p-3 ${className ?? ''}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
          <Sparkles className="h-3.5 w-3.5" />
          Suggested matches
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void runSuggest()}
            disabled={loading}
            className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-700 disabled:opacity-40"
            title="Re-run"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-700"
            title="Hide"
          >
            <span className="text-xs">Hide</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 px-1 py-3 text-xs text-slate-600">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Scoring candidates…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <DiagnosticsLine data={data} />

          {data.suggestions.length === 0 ? (
            <div className="rounded-md border border-stone-200 bg-white px-3 py-3 text-xs text-slate-600">
              No products matched the tokens in this slug. Consider:
              <ul className="ml-4 mt-1 list-disc space-y-0.5">
                <li>Switching the target type to <strong>Category</strong> and routing to a catalog filter.</li>
                <li>Or marking the slug as <strong>Gone / 404</strong> if it&apos;s clearly junk.</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-1.5">
              {data.noStrongMatch && (
                <div className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                  <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    No high-confidence match. Verify carefully, or use a <strong>Category</strong> redirect
                    instead of forcing a single SKU.
                  </span>
                </div>
              )}
              {data.suggestions.map((s) => (
                <SuggestionCard key={s.style_id} suggestion={s} onPick={onPick} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DiagnosticsLine({ data }: { data: SuggestResponse }) {
  const parts: string[] = [];
  if (data.tokens.length > 0) {
    parts.push(`tokens: ${data.tokens.slice(0, 8).join(', ')}${data.tokens.length > 8 ? '…' : ''}`);
  }
  if (data.detectedStyleCode) {
    parts.push(`style code: ${data.detectedStyleCode}`);
  }
  if (parts.length === 0) return null;
  return (
    <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
      {parts.join(' · ')}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onPick,
}: {
  suggestion: SuggestedProduct;
  onPick: (product: PickedProduct) => void;
}) {
  const unavailable = !suggestion.is_active || suggestion.manually_hidden;
  return (
    <div className="flex items-start gap-2 rounded-md border border-stone-200 bg-white p-2 shadow-sm">
      {suggestion.primary_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={suggestion.primary_image_url}
          alt=""
          className="h-12 w-12 flex-shrink-0 rounded border border-stone-100 bg-stone-50 object-contain"
        />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded border border-stone-100 bg-stone-50 text-slate-300">
          <ImageOff className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-medium text-navy-800">
            {suggestion.brand_name} {suggestion.style_name}
          </span>
          <ScoreBadge score={suggestion.score} />
          {unavailable && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-red-700">
              {suggestion.manually_hidden ? 'Hidden' : 'Inactive'}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-600" title={suggestion.title}>
          {suggestion.title}
        </p>
        {suggestion.slug && (
          <a
            href={`/product/${suggestion.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 truncate font-mono text-[11px] text-slate-400 hover:text-brand-600"
          >
            /product/{suggestion.slug}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {suggestion.reasons.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 text-[11px] text-slate-500">
            {suggestion.reasons.slice(0, 3).map((r, i) => (
              <li key={i} className="leading-snug">
                <span className="text-slate-300">·</span> {r}
              </li>
            ))}
            {suggestion.reasons.length > 3 && (
              <li className="italic text-slate-400">+{suggestion.reasons.length - 3} more</li>
            )}
          </ul>
        )}
      </div>
      <div className="flex-shrink-0 self-center">
        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            onPick({
              style_id: suggestion.style_id,
              style_name: suggestion.style_name,
              brand_name: suggestion.brand_name,
              title: suggestion.title,
              primary_image_url: suggestion.primary_image_url,
              slug: suggestion.slug,
              is_active: suggestion.is_active,
              manually_hidden: suggestion.manually_hidden,
            })
          }
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Use this
        </Button>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  let color = 'bg-stone-100 text-slate-700';
  let label = `${score}`;
  if (score >= 80) {
    color = 'bg-emerald-100 text-emerald-700';
    label = `${score} · strong`;
  } else if (score >= 50) {
    color = 'bg-amber-100 text-amber-700';
    label = `${score} · medium`;
  } else if (score > 0) {
    color = 'bg-red-100 text-red-700';
    label = `${score} · weak`;
  }
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${color}`}>
      {label}
    </span>
  );
}
