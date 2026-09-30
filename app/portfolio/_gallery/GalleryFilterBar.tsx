'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { DECORATION_OPTIONS } from '@/sanity/schema/decorationOptions';
import { BLANK_OPTIONS } from '@/sanity/schema/blankOptions';

type Props = {
  basePath: string;
  selectedDecorations: string[];
  selectedBlank: string;
};

/** Decoration values hidden from the gallery filter (still valid in the CMS). */
const HIDDEN_DECORATIONS = new Set(['rush', 'live-screen-printing', 'large-orders']);
const DECORATION_FILTER_OPTIONS = DECORATION_OPTIONS.filter(
  (o) => !HIDDEN_DECORATIONS.has(o.value)
);

export function GalleryFilterBar({ basePath, selectedDecorations, selectedBlank }: Props) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<'decoration' | 'blank' | null>(null);
  const decorationRef = useRef<HTMLDivElement>(null);
  const blankRef = useRef<HTMLDivElement>(null);

  const pushState = useCallback(
    (decorations: string[], blank: string) => {
      const params = new URLSearchParams();
      if (decorations.length > 0) params.set('decoration', decorations.join(','));
      if (blank) params.set('blank', blank);
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [basePath, router]
  );

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
    pushState(next, selectedBlank);
  };

  const selectBlank = (slug: string) => {
    pushState(selectedDecorations, slug);
    setOpenMenu(null);
  };

  const clearAll = () => {
    pushState([], '');
    setOpenMenu(null);
  };

  const hasFilters = selectedDecorations.length > 0 || Boolean(selectedBlank);
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
