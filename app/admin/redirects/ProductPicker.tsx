'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X, ImageOff } from 'lucide-react';

export interface PickedProduct {
  style_id: number;
  style_name: string;
  brand_name: string;
  title: string;
  primary_image_url: string | null;
  slug: string | null;
  is_active: boolean;
  manually_hidden: boolean;
}

interface ProductPickerProps {
  value: PickedProduct | null;
  onChange: (product: PickedProduct | null) => void;
  /** When true, the input is locked (e.g. while submitting). */
  disabled?: boolean;
}

/**
 * Autocomplete picker backed by /api/admin/products/search.
 *
 * Debounced (200ms) on input, surfaces brand + style + title + image
 * preview so the admin can confidently pick the right SKU when
 * resolving a legacy slug.
 */
export function ProductPicker({ value, onChange, disabled }: ProductPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced search.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/products/search?q=${encodeURIComponent(query.trim())}&limit=10`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults((data.results ?? []) as PickedProduct[]);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (value) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-3">
        <div className="flex items-start gap-3">
          {value.primary_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.primary_image_url}
              alt={value.title}
              className="h-12 w-12 flex-shrink-0 rounded-md border border-stone-100 bg-stone-50 object-contain"
            />
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border border-stone-100 bg-stone-50 text-slate-300">
              <ImageOff className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-navy-800">
                {value.brand_name} {value.style_name}
              </span>
              {!value.is_active && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                  Inactive
                </span>
              )}
              {value.manually_hidden && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                  Hidden
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-600">{value.title}</p>
            {value.slug && (
              <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                /product/{value.slug}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="rounded-md p-1.5 text-slate-400 hover:bg-stone-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder="Search by brand, style number, or title…"
          className="w-full rounded-lg border border-stone-200 bg-white pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-stone-50"
        />
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-stone-200 bg-white shadow-lg">
          {loading && (
            <div className="px-4 py-3 text-xs text-slate-500">Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-500">
              No products match &quot;{query}&quot;.
            </div>
          )}
          {!loading &&
            results.map((p) => (
              <button
                key={p.style_id}
                type="button"
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-start gap-3 border-b border-stone-100 px-3 py-2 text-left transition-colors hover:bg-brand-50 last:border-b-0"
              >
                {p.primary_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.primary_image_url}
                    alt=""
                    className="h-10 w-10 flex-shrink-0 rounded border border-stone-100 bg-stone-50 object-contain"
                  />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-stone-100 bg-stone-50 text-slate-300">
                    <ImageOff className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="font-medium text-navy-800">
                      {p.brand_name} {p.style_name}
                    </span>
                    {!p.is_active && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700">
                        Inactive
                      </span>
                    )}
                    {p.manually_hidden && (
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-red-700">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-600">{p.title}</p>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
