'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Loader2,
  Package,
  EyeOff,
  Eye,
  Ban,
  StickyNote,
  Hash,
  Layers,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  AdminProductSearchResult,
  AdminProductSearchResponse,
} from '@/app/api/admin/products/search/route';
import type { AdminProductFilterOptions } from '@/app/api/admin/products/filter-options/route';

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;
const PER_PAGE = 20;

type BulkAction = 'hide' | 'unhide' | 'set_note' | 'set_min_qty' | 'clear_min_qty';
type NoteMode = 'append' | 'overwrite' | 'only_empty';

const BULK_ACTIONS: Array<{ id: BulkAction; label: string }> = [
  { id: 'hide', label: 'Hide from customers' },
  { id: 'unhide', label: 'Unhide' },
  { id: 'set_note', label: 'Add note' },
  { id: 'set_min_qty', label: 'Set min. order quantity' },
  { id: 'clear_min_qty', label: 'Clear min. order quantity' },
];

interface BulkResult {
  summary: { updated: number; skipped: number };
  skipped: Array<{ style_id: number; reason: string }>;
}

export function ProductsSearchClient() {
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [filterOptions, setFilterOptions] = useState<AdminProductFilterOptions>({
    brands: [],
    categories: [],
  });

  const [results, setResults] = useState<AdminProductSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [capped, setCapped] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bulk selection state (page-scoped).
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  // Modal inputs
  const [noteText, setNoteText] = useState('');
  const [noteMode, setNoteMode] = useState<NoteMode>('append');
  const [hideReason, setHideReason] = useState('');
  const [minQty, setMinQty] = useState('');

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef(0);
  const lastIndexRef = useRef<number | null>(null);

  // Load brand/category filter options once.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/products/filter-options', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AdminProductFilterOptions | null) => {
        if (!cancelled && data) setFilterOptions(data);
      })
      .catch(() => {
        /* filters are optional — search still works without them */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = useCallback(
    async (params: { q: string; brand: string; category: string; page: number }) => {
      const q = params.q.trim();
      const hasText = q.length >= MIN_QUERY_LENGTH;
      const hasFilter = !!params.brand || !!params.category;

      if (!hasText && !hasFilter) {
        setResults([]);
        setTotal(0);
        setTotalPages(0);
        setPage(1);
        setCapped(false);
        setHasSearched(false);
        setError(null);
        setIsSearching(false);
        setSelectedIds(new Set());
        return;
      }

      const reqId = ++requestIdRef.current;
      setIsSearching(true);
      setError(null);

      try {
        const usp = new URLSearchParams();
        if (hasText) usp.set('q', q);
        if (params.brand) usp.set('brand', params.brand);
        if (params.category) usp.set('category', params.category);
        usp.set('page', String(params.page));

        const res = await fetch(`/api/admin/products/search?${usp.toString()}`, {
          cache: 'no-store',
        });
        if (reqId !== requestIdRef.current) return;
        if (!res.ok) throw new Error(`Search failed (${res.status})`);

        const data = (await res.json()) as AdminProductSearchResponse;
        setResults(data.results || []);
        setPage(data.page || 1);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
        setCapped(!!data.capped);
        setHasSearched(true);
        // Selection is page-scoped: clear it whenever the result set changes.
        setSelectedIds(new Set());
        lastIndexRef.current = null;
      } catch (err) {
        if (reqId !== requestIdRef.current) return;
        setResults([]);
        setTotal(0);
        setTotalPages(0);
        setCapped(false);
        setError(err instanceof Error ? err.message : 'Search failed');
        setHasSearched(true);
        setSelectedIds(new Set());
      } finally {
        if (reqId === requestIdRef.current) setIsSearching(false);
      }
    },
    [],
  );

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => runSearch({ q: value, brand, category, page: 1 }),
      DEBOUNCE_MS,
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch({ q: query, brand, category, page: 1 });
  };

  const handleBrandChange = (value: string) => {
    setBrand(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch({ q: query, brand: value, category, page: 1 });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch({ q: query, brand, category: value, page: 1 });
  };

  const goToPage = (nextPage: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch({ q: query, brand, category, page: nextPage });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ---- Selection helpers ---------------------------------------------------
  const resultIndex = useMemo(() => {
    const m = new Map<number, number>();
    results.forEach((r, i) => m.set(r.style_id, i));
    return m;
  }, [results]);

  const toggleSelect = (styleId: number, shiftKey: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const idx = resultIndex.get(styleId) ?? -1;
      if (shiftKey && lastIndexRef.current !== null && idx >= 0) {
        const [start, end] = [lastIndexRef.current, idx].sort((a, b) => a - b);
        const shouldSelect = !next.has(styleId);
        for (let i = start; i <= end; i++) {
          const rid = results[i]?.style_id;
          if (rid == null) continue;
          if (shouldSelect) next.add(rid);
          else next.delete(rid);
        }
      } else {
        if (next.has(styleId)) next.delete(styleId);
        else next.add(styleId);
      }
      lastIndexRef.current = idx;
      return next;
    });
  };

  const allSelected = results.length > 0 && selectedIds.size === results.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === results.length) return new Set();
      return new Set(results.map((r) => r.style_id));
    });
    lastIndexRef.current = null;
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    lastIndexRef.current = null;
  };

  const selectedProducts = useMemo(
    () => results.filter((r) => selectedIds.has(r.style_id)),
    [results, selectedIds],
  );

  // ---- Bulk apply ----------------------------------------------------------
  const openModal = () => {
    if (!bulkAction || selectedIds.size === 0) return;
    setBulkError(null);
    // Reset per-action inputs to sensible defaults each time.
    setNoteText('');
    setNoteMode('append');
    setHideReason('');
    setMinQty('');
    setModalOpen(true);
  };

  const canSubmit = (): boolean => {
    if (bulkAction === 'set_note') return noteText.trim().length > 0;
    if (bulkAction === 'set_min_qty') {
      const n = parseInt(minQty, 10);
      return Number.isInteger(n) && n >= 1;
    }
    return !!bulkAction;
  };

  const handleConfirm = async () => {
    if (!bulkAction) return;
    setSubmitting(true);
    setBulkError(null);
    try {
      const payload: Record<string, unknown> = {
        styleIds: Array.from(selectedIds),
        action: bulkAction,
      };
      if (bulkAction === 'set_note') {
        payload.note = noteText.trim();
        payload.noteMode = noteMode;
      } else if (bulkAction === 'set_min_qty') {
        payload.minQty = parseInt(minQty, 10);
      } else if (bulkAction === 'hide' && hideReason.trim()) {
        payload.reason = hideReason.trim();
      }

      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk action failed');

      setBulkResult(data as BulkResult);
      setModalOpen(false);
      setBulkAction('');
      // Refresh the current page so hidden badges / notes / min-qty update.
      runSearch({ q: query, brand, category, page });
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const hasActiveFilters = !!brand || !!category;

  return (
    <div className="space-y-6">
      {/* Search + filters */}
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

        {/* Brand / Category filters */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Brand
            </label>
            <select
              value={brand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All brands</option>
              {filterOptions.brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All categories</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Type at least {MIN_QUERY_LENGTH} characters, or pick a brand/category to
          list every matching product. Results include hidden products.
        </p>
      </form>

      {/* Bulk result banner */}
      {bulkResult && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-medium text-navy-800">
                  {bulkResult.summary.updated} product
                  {bulkResult.summary.updated !== 1 ? 's' : ''} updated
                  {bulkResult.summary.skipped > 0 && (
                    <span className="text-slate-500">
                      {' '}· {bulkResult.summary.skipped} skipped
                    </span>
                  )}
                </p>
                {bulkResult.summary.skipped > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    {summarizeSkips(bulkResult.skipped)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setBulkResult(null)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* States */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && !hasSearched && <EmptyHint />}

      {!error && hasSearched && results.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
          <Package className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            No products match your search{hasActiveFilters ? ' and filters' : ''}.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Try a brand name, style number, or fewer words.
          </p>
        </div>
      )}

      {!error && results.length > 0 && (
        <ResultsList
          results={results}
          page={page}
          totalPages={totalPages}
          total={total}
          perPage={PER_PAGE}
          capped={capped}
          isSearching={isSearching}
          onPageChange={goToPage}
          selectedIds={selectedIds}
          onToggle={toggleSelect}
          onToggleAll={toggleSelectAll}
          allSelected={allSelected}
          someSelected={someSelected}
        />
      )}

      {/* Sticky bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-30">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
            <span className="text-sm font-medium text-navy-800">
              {selectedIds.size} selected
            </span>
            <div className="flex flex-1 items-center gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as BulkAction | '')}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Choose action…</option>
                {BULK_ACTIONS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
              <button
                onClick={openModal}
                disabled={!bulkAction}
                className="rounded-lg bg-navy-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
            <button
              onClick={clearSelection}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-stone-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {modalOpen && bulkAction && (
        <BulkModal
          action={bulkAction}
          count={selectedIds.size}
          products={selectedProducts}
          submitting={submitting}
          error={bulkError}
          noteText={noteText}
          setNoteText={setNoteText}
          noteMode={noteMode}
          setNoteMode={setNoteMode}
          hideReason={hideReason}
          setHideReason={setHideReason}
          minQty={minQty}
          setMinQty={setMinQty}
          canSubmit={canSubmit()}
          onConfirm={handleConfirm}
          onClose={() => !submitting && setModalOpen(false)}
        />
      )}
    </div>
  );
}

function summarizeSkips(
  skipped: Array<{ style_id: number; reason: string }>,
): string {
  const counts = new Map<string, number>();
  for (const s of skipped) counts.set(s.reason, (counts.get(s.reason) || 0) + 1);
  return Array.from(counts.entries())
    .map(([reason, n]) => `${n} ${reason.toLowerCase()}`)
    .join(', ');
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
        (&ldquo;Gildan&rdquo;), or title — or filter by brand/category.
      </p>
    </div>
  );
}

function ResultsList({
  results,
  page,
  totalPages,
  total,
  perPage,
  capped,
  isSearching,
  onPageChange,
  selectedIds,
  onToggle,
  onToggleAll,
  allSelected,
  someSelected,
}: {
  results: AdminProductSearchResult[];
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  capped: boolean;
  isSearching: boolean;
  onPageChange: (page: number) => void;
  selectedIds: Set<number>;
  onToggle: (styleId: number, shiftKey: boolean) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  someSelected: boolean;
}) {
  const rangeStart = (page - 1) * perPage + 1;
  const rangeEnd = Math.min(page * perPage, total);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Header: select-all + count summary */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/60 px-4 py-2.5 sm:px-5">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            className="h-4 w-4 cursor-pointer rounded border-stone-300 text-brand-600 focus:ring-brand-500/30"
          />
          <span className="tabular-nums">
            Showing{' '}
            <span className="font-medium text-slate-700">
              {rangeStart}–{rangeEnd}
            </span>{' '}
            of{' '}
            <span className="font-medium text-slate-700">
              {total}
              {capped ? '+' : ''}
            </span>{' '}
            {total === 1 ? 'product' : 'products'}
          </span>
        </label>
        {isSearching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      <ul className="divide-y divide-stone-100">
        {results.map((p) => {
          const selected = selectedIds.has(p.style_id);
          return (
            <li
              key={p.style_id}
              className={cn(selected && 'bg-brand-50/50')}
            >
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <input
                  type="checkbox"
                  checked={selected}
                  onClick={(e) => onToggle(p.style_id, (e as React.MouseEvent).shiftKey)}
                  onChange={() => {
                    /* handled in onClick to capture shiftKey */
                  }}
                  aria-label={`Select ${p.style_name}`}
                  className="h-4 w-4 flex-none cursor-pointer rounded border-stone-300 text-brand-600 focus:ring-brand-500/30"
                />
                <Link
                  href={`/admin/products/${p.style_id}`}
                  className="group flex min-w-0 flex-1 items-center gap-4"
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
              </div>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-3 sm:px-5">
          <ResultsPagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {capped && (
        <div className="border-t border-stone-100 bg-amber-50/60 px-4 py-2 text-center text-[11px] text-amber-700">
          Showing the first {total} matches. Narrow your search to see more
          specific results.
        </div>
      )}
    </div>
  );
}

function BulkModal({
  action,
  count,
  products,
  submitting,
  error,
  noteText,
  setNoteText,
  noteMode,
  setNoteMode,
  hideReason,
  setHideReason,
  minQty,
  setMinQty,
  canSubmit,
  onConfirm,
  onClose,
}: {
  action: BulkAction;
  count: number;
  products: AdminProductSearchResult[];
  submitting: boolean;
  error: string | null;
  noteText: string;
  setNoteText: (v: string) => void;
  noteMode: NoteMode;
  setNoteMode: (v: NoteMode) => void;
  hideReason: string;
  setHideReason: (v: string) => void;
  minQty: string;
  setMinQty: (v: string) => void;
  canSubmit: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const titleMap: Record<BulkAction, string> = {
    hide: 'Hide products from customers',
    unhide: 'Unhide products',
    set_note: 'Add note to products',
    set_min_qty: 'Set minimum order quantity',
    clear_min_qty: 'Clear minimum order quantity',
  };
  const confirmLabelMap: Record<BulkAction, string> = {
    hide: `Hide ${count} product${count !== 1 ? 's' : ''}`,
    unhide: `Unhide ${count} product${count !== 1 ? 's' : ''}`,
    set_note: `Apply note to ${count} product${count !== 1 ? 's' : ''}`,
    set_min_qty: `Update ${count} product${count !== 1 ? 's' : ''}`,
    clear_min_qty: `Clear on ${count} product${count !== 1 ? 's' : ''}`,
  };
  const isDestructive = action === 'hide' || (action === 'set_note' && noteMode === 'overwrite');
  const withNote = products.filter((p) => p.has_admin_note).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-100 p-4">
          <h3 className="text-lg font-semibold text-navy-800">{titleMap[action]}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
          <p className="text-sm text-slate-600">
            This will apply to{' '}
            <span className="font-semibold text-navy-800">
              {count} selected product{count !== 1 ? 's' : ''}
            </span>
            . Products already in the target state are skipped automatically.
          </p>

          {/* Action-specific inputs */}
          {action === 'set_note' && (
            <div className="space-y-3">
              <div>
                <span className="mb-1.5 block text-xs font-medium text-slate-500">
                  How to apply the note
                </span>
                <div className="space-y-1.5">
                  {(
                    [
                      ['append', 'Append below existing note'],
                      ['overwrite', 'Overwrite existing note'],
                      ['only_empty', 'Only fill products without a note'],
                    ] as Array<[NoteMode, string]>
                  ).map(([mode, label]) => (
                    <label
                      key={mode}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="radio"
                        name="noteMode"
                        checked={noteMode === mode}
                        onChange={() => setNoteMode(mode)}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500/30"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Note
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="e.g. Runs small — advise sizing up."
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              {noteMode === 'overwrite' && withNote > 0 && (
                <div className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  {withNote} of the selected products already have a note. Overwrite
                  will replace their existing notes (the old values remain in the
                  edit history).
                </div>
              )}
            </div>
          )}

          {action === 'hide' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Reason (optional, shared)
              </label>
              <input
                type="text"
                value={hideReason}
                onChange={(e) => setHideReason(e.target.value)}
                maxLength={500}
                placeholder="e.g. Seasonal — out of range"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          )}

          {action === 'set_min_qty' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Minimum order quantity
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={minQty}
                onChange={(e) => setMinQty(e.target.value)}
                placeholder="e.g. 12"
                className="w-40 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          )}

          {/* Selected products preview */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Selected ({count})
            </p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-stone-200">
              {products.map((p) => (
                <div
                  key={p.style_id}
                  className="flex items-center justify-between gap-2 border-b border-stone-100 px-3 py-1.5 text-xs last:border-b-0"
                >
                  <span className="truncate font-medium text-slate-700">
                    {p.brand_name} · {p.style_name}
                  </span>
                  <span className="flex flex-none items-center gap-1.5 text-slate-400">
                    {p.manually_hidden ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {p.has_admin_note && <StickyNote className="h-3 w-3" />}
                    {p.min_order_quantity != null && <span>Min {p.min_order_quantity}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-stone-100 p-4">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-stone-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting || !canSubmit}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
              isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-navy-800 hover:bg-navy-900',
            )}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabelMap[action]}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultsPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-slate-500 transition-colors hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className="select-none px-1 text-xs text-slate-400"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={cn(
              'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg text-sm font-medium transition-colors',
              p === page
                ? 'bg-navy-800 text-white shadow-sm'
                : 'border border-stone-200 bg-white text-slate-600 hover:bg-stone-50',
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-slate-500 transition-colors hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
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
