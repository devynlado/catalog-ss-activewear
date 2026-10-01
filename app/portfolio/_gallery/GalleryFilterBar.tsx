'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { DECORATION_OPTIONS } from '@/sanity/schema/decorationOptions';
import { BLANK_OPTIONS } from '@/sanity/schema/blankOptions';

type Props = {
  basePath: string;
  selectedDecorations: string[];
  selectedBlank: string;
  searchQuery: string;
};

/** Decoration values hidden from the gallery filter (still valid in the CMS). */
const HIDDEN_DECORATIONS = new Set(['rush', 'live-screen-printing', 'large-orders']);
const DECORATION_FILTER_OPTIONS = DECORATION_OPTIONS.filter(
  (o) => !HIDDEN_DECORATIONS.has(o.value)
);

export function GalleryFilterBar({
  basePath,
  selectedDecorations,
  selectedBlank,
  searchQuery,
}: Props) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<'decoration' | 'blank' | null>(null);
  const [search, setSearch] = useState(searchQuery);
  const decorationRef = useRef<HTMLDivElement>(null);
  const blankRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushState = useCallback(
    (decorations: string[], blank: string, query: string) => {
      const params = new URLSearchParams();
      if (decorations.length > 0) params.set('decoration', decorations.join(','));
      if (blank) params.set('blank', blank);
      if (query.trim()) params.set('q', query.trim());
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [basePath, router]
  );

  // Keep the input in sync when the URL changes from outside (clear, back/forward).
  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  // Debounce URL updates while typing in the search box.
  const onSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      pushState(selectedDecorations, selectedBlank, value);
    }, 350);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        decorationRef.current &&
        !decorationRef.current.contains(target) &&
        blankRef.current &&
        !blankRef.current.contains(target)
      ) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggleDecoration = (slug: string) => {
    const next = selectedDecorations.includes(slug)
      ? selectedDecorations.filter((s) => s !== slug)
      : [...selectedDecorations, slug];
    pushState(next, selectedBlank, search);
  };

  const selectBlank = (slug: string) => {
    pushState(selectedDecorations, slug, search);
    setOpenMenu(null);
  };

  const clearAll = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearch('');
    pushState([], '', '');
    setOpenMenu(null);
  };

  const hasFilters =
    selectedDecorations.length > 0 || Boolean(selectedBlank) || Boolean(search.trim());
  const blankLabel =
    BLANK_OPTIONS.find((o) => o.value === selectedBlank)?.title ?? 'All Blanks';
  const decorationLabel =
    selectedDecorations.length > 0
      ? `Decoration (${selectedDecorations.length})`
      : 'All Decorations';

  const triggerClass = (active: boolean) =>
    `inline-flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors sm:w-56 ${
      active
        ? 'border-navy-300 bg-navy-50 text-navy-800'
        : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:bg-stone-50'
    }`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Decoration dropdown (multi-select) */}
      <div className="relative" ref={decorationRef}>
        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === 'decoration' ? null : 'decoration'))}
          className={triggerClass(selectedDecorations.length > 0)}
          aria-haspopup="true"
          aria-expanded={openMenu === 'decoration'}
        >
          <span>{decorationLabel}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${openMenu === 'decoration' ? 'rotate-180' : ''}`}
          />
        </button>

        {openMenu === 'decoration' && (
          <div className="absolute left-0 top-full z-30 mt-2 max-h-80 w-64 overflow-y-auto rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-stone-200">
            {DECORATION_FILTER_OPTIONS.map((opt) => {
              const active = selectedDecorations.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleDecoration(opt.value)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-stone-50"
                  aria-pressed={active}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      active ? 'border-navy-600 bg-navy-600 text-white' : 'border-stone-300 bg-white'
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                  </span>
                  {opt.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Blank dropdown (single-select) */}
      <div className="relative" ref={blankRef}>
        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === 'blank' ? null : 'blank'))}
          className={triggerClass(Boolean(selectedBlank))}
          aria-haspopup="true"
          aria-expanded={openMenu === 'blank'}
        >
          <span>{blankLabel}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${openMenu === 'blank' ? 'rotate-180' : ''}`}
          />
        </button>

        {openMenu === 'blank' && (
          <div className="absolute left-0 top-full z-30 mt-2 max-h-80 w-64 overflow-y-auto rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-stone-200">
            <button
              type="button"
              onClick={() => selectBlank('')}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-stone-50"
            >
              All Blanks
              {!selectedBlank && <Check className="h-4 w-4 text-navy-600" />}
            </button>
            {BLANK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => selectBlank(opt.value)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-stone-50"
              >
                {opt.title}
                {selectedBlank === opt.value && <Check className="h-4 w-4 text-navy-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search box */}
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search projects…"
          aria-label="Search portfolio"
          className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-700 placeholder:text-slate-400 transition-colors hover:border-stone-300 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-100"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              if (searchTimer.current) clearTimeout(searchTimer.current);
              setSearch('');
              pushState(selectedDecorations, selectedBlank, '');
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-stone-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <X className="h-4 w-4" />
          Clear filters
        </button>
      )}
    </div>
  );
}
