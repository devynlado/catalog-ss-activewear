'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Loader2,
  Package,
  EyeOff,
  Ban,
  StickyNote,
  Hash,
  Layers,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminProductSearchResult } from '@/app/api/admin/products/search/route';

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export function ProductsSearchClient() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminProductSearchResult[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef(0);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setTruncated(false);
      setHasSearched(false);
      setError(null);
      setIsSearching(false);
      return;
    }

    const reqId = ++requestIdRef.current;
    setIsSearching(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/products/search?q=${encodeURIComponent(trimmed)}`,
        { cache: 'no-store' },
      );
      // Guard against out-of-order responses from earlier keystrokes.
      if (reqId !== requestIdRef.current) return;

      if (!res.ok) {
        throw new Error(`Search failed (${res.status})`);
      }
      const data = (await res.json()) as {
        results: AdminProductSearchResult[];
        truncated: boolean;
      };
      setResults(data.results || []);
      setTruncated(!!data.truncated);
      setHasSearched(true);
    } catch (err) {
      if (reqId !== requestIdRef.current) return;
      setResults([]);
      setTruncated(false);
      setError(err instanceof Error ? err.message : 'Search failed');
      setHasSearched(true);
    } finally {
      if (reqId === requestIdRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), DEBOUNCE_MS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(query);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Search input */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <label
          htmlFor="admin-product-search"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Search by style number, brand, or title
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="admin-product-search"
            type="search"
            inputMode="search"
            autoComplete="off"
            autoFocus
            placeholder='e.g. "1533", "Gildan", or "Heavy Cotton Tee"'
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-10 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Type at least {MIN_QUERY_LENGTH} characters. Results include hidden products.
        </p>
      </form>

      {/* Results / states */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && !hasSearched && (
        <EmptyHint />
      )}

      {!error && hasSearched && results.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
          <Package className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            No products match &ldquo;{query.trim()}&rdquo;.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Try a brand name, style number, or fewer words.
          </p>
        </div>
      )}

      {!error && results.length > 0 && (
        <ResultsList results={results} truncated={truncated} />
      )}
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
      <Search className="mx-auto h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-700">
        Start typing to find a product
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Search the entire catalog by style number (&ldquo;1533&rdquo;), brand
        (&ldquo;Gildan&rdquo;), or title.
      </p>
    </div>
  );
}

function ResultsList({
  results,
  truncated,
}: {
  results: AdminProductSearchResult[];
  truncated: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <ul className="divide-y divide-stone-100">
        {results.map((p) => (
          <li key={p.style_id}>
            <Link
              href={`/admin/products/${p.style_id}`}
              className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-brand-50/40 sm:px-5"
            >
              {/* Thumb */}
              <div className="relative h-14 w-14 flex-none overflow-hidden rounded-md border border-stone-200 bg-stone-50">
                {p.primary_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.primary_image_url}
                    alt=""
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <Package className="absolute inset-0 m-auto h-5 w-5 text-slate-300" />
                )}
              </div>

              {/* Body */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {p.brand_name}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>{p.style_name}</span>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-navy-800">
                  {p.title}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {p.manually_hidden && (
                    <Badge tone="slate" icon={EyeOff}>
                      Hidden by admin
                    </Badge>
                  )}
                  {!p.is_active && (
                    <Badge tone="red" icon={Ban}>
                      Discontinued
                    </Badge>
                  )}
                  {p.has_admin_note && (
                    <Badge tone="amber" icon={StickyNote}>
                      Note
                    </Badge>
                  )}
                  {p.min_order_quantity != null && (
                    <Badge tone="blue" icon={Hash}>
                      Min {p.min_order_quantity}
                    </Badge>
                  )}
                  {p.variant_overrides_count > 0 && (
                    <Badge tone="violet" icon={Layers}>
                      {p.variant_overrides_count}{' '}
                      {p.variant_overrides_count === 1
                        ? 'variant rule'
                        : 'variant rules'}
                    </Badge>
                  )}
                  {p.slug && (
                    <Link
                      href={`/product/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:text-brand-600"
                    >
                      View public page
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              <ChevronRight className="h-4 w-4 flex-none text-slate-300 transition-colors group-hover:text-brand-500" />
            </Link>
          </li>
        ))}
      </ul>
      {truncated && (
        <div className="border-t border-stone-100 bg-stone-50 px-4 py-2.5 text-center text-xs text-slate-500">
          More matches exist. Refine your search to see them.
        </div>
      )}
    </div>
  );
}

const TONE_CLASSES = {
  red: 'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-300',
} as const;

function Badge({
  tone,
  icon: Icon,
  children,
}: {
  tone: keyof typeof TONE_CLASSES;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        TONE_CLASSES[tone],
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}
