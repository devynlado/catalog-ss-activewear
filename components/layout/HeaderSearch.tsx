'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Package, Tag, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { matchQuickLinks, type QuickLink } from '@/lib/search-quick-links';

interface ProductResult {
  styleId: number;
  styleName: string;
  brandName: string;
  slug: string;
  imageUrl?: string;
}

interface HeaderSearchProps {
  variant?: 'desktop' | 'mobile';
  autoFocus?: boolean;
  /** Called after a suggestion is chosen / a search is run (e.g. to close a mobile overlay). */
  onNavigate?: () => void;
  className?: string;
}

// Flattened, keyboard-navigable representation of everything in the dropdown.
type FlatItem =
  | { kind: 'page' | 'category'; link: QuickLink }
  | { kind: 'product'; product: ProductResult }
  | { kind: 'search-all' };

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

export function HeaderSearch({
  variant = 'desktop',
  autoFocus = false,
  onNavigate,
  className,
}: HeaderSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // ── Debounced product fetch (cache-backed /api/products) ────────────────
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_CHARS) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(trimmed)}&pageSize=6`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error('search failed');
        const data = await res.json();
        const items: ProductResult[] = (data.data || []).slice(0, 6).map(
          (p: ProductResult) => ({
            styleId: p.styleId,
            styleName: p.styleName,
            brandName: p.brandName,
            slug: p.slug,
            imageUrl: p.imageUrl,
          }),
        );
        setProducts(items);
      } catch (err) {
        if ((err as { name?: string })?.name !== 'AbortError') setProducts([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query]);

  // ── Quick links (pages + categories), resolved instantly client-side ────
  const { pages, categories } = useMemo(
    () => matchQuickLinks(query, { maxPages: 4, maxCategories: 5 }),
    [query],
  );

  const trimmed = query.trim();
  const isOpen = open && trimmed.length >= MIN_CHARS;

  // Build the flat, ordered list used for keyboard navigation.
  const flatItems = useMemo<FlatItem[]>(() => {
    if (trimmed.length < MIN_CHARS) return [];
    const items: FlatItem[] = [
      ...pages.map((link) => ({ kind: link.type, link } as FlatItem)),
      ...categories.map((link) => ({ kind: link.type, link } as FlatItem)),
      ...products.map((product) => ({ kind: 'product', product } as FlatItem)),
      { kind: 'search-all' },
    ];
    return items;
  }, [pages, categories, products, trimmed]);

  // Reset the highlighted row whenever the result set changes.
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // ── Close on outside click ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isOpen]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      onNavigate?.();
      router.push(href);
    },
    [router, onNavigate],
  );

  const selectItem = useCallback(
    (item: FlatItem) => {
      if (item.kind === 'product') {
        go(`/product/${item.product.slug}`);
      } else if (item.kind === 'search-all') {
        go(`/catalog?search=${encodeURIComponent(trimmed)}`);
      } else {
        go(item.link.href);
      }
    },
    [go, trimmed],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (trimmed.length < MIN_CHARS) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item =
        activeIndex >= 0 && activeIndex < flatItems.length
          ? flatItems[activeIndex]
          : flatItems[flatItems.length - 1]; // default: "search all"
      if (item) selectItem(item);
    }
  };

  const hasResults = pages.length > 0 || categories.length > 0 || products.length > 0;

  // Track a running index so keyboard highlight lines up across sections.
  let runningIndex = -1;
  const nextIndex = () => (runningIndex += 1);

  const inputClasses =
    variant === 'mobile'
      ? 'w-full rounded-full border border-stone-200 bg-stone-50 py-3 pl-4 pr-12 text-base focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20'
      : 'w-full rounded-full border border-stone-200 bg-stone-50 py-2 pl-4 pr-10 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="header-search-listbox"
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, categories, pages..."
          className={inputClasses}
        />
        <button
          type="button"
          aria-label="Search"
          onClick={() => {
            if (trimmed.length >= 1) go(`/catalog?search=${encodeURIComponent(trimmed)}`);
          }}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-colors',
            variant === 'mobile' ? 'right-1.5 p-2' : 'right-1 p-1.5',
          )}
        >
          <Search className={variant === 'mobile' ? 'h-5 w-5' : 'h-4 w-4'} />
        </button>
      </div>

      {isOpen && (
        <div
          id="header-search-listbox"
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-stone-200 bg-white py-2 shadow-xl"
        >
          {/* Pages */}
          {pages.length > 0 && (
            <div className="px-2 pb-1">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Pages
              </p>
              {pages.map((link) => {
                const idx = nextIndex();
                return (
                  <SuggestionRow
                    key={`page-${link.href}`}
                    active={activeIndex === idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => go(link.href)}
                    icon={<FileText className="h-4 w-4 text-brand-500" />}
                    label={link.label}
                    sublabel={link.sublabel}
                  />
                );
              })}
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div className="px-2 pb-1">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Categories
              </p>
              {categories.map((link) => {
                const idx = nextIndex();
                return (
                  <SuggestionRow
                    key={`cat-${link.href}-${link.label}`}
                    active={activeIndex === idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => go(link.href)}
                    icon={<Tag className="h-4 w-4 text-brand-500" />}
                    label={link.label}
                    sublabel={link.sublabel}
                  />
                );
              })}
            </div>
          )}

          {/* Products */}
          {(products.length > 0 || loading) && (
            <div className="px-2 pb-1">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Products
              </p>
              {products.map((product) => {
                const idx = nextIndex();
                return (
                  <button
                    key={`prod-${product.styleId}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => go(`/product/${product.slug}`)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors',
                      activeIndex === idx ? 'bg-brand-50' : 'hover:bg-stone-50',
                    )}
                  >
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-stone-100 ring-1 ring-stone-200">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.styleName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-slate-400" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {product.styleName}
                      </span>
                      <span className="block truncate text-xs text-slate-400">
                        {product.brandName}
                      </span>
                    </span>
                  </button>
                );
              })}
              {loading && products.length === 0 && (
                <div className="flex items-center gap-2 px-2 py-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching products…
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && !hasResults && (
            <p className="px-4 py-3 text-sm text-slate-400">
              No quick matches — press Enter to search the full catalog.
            </p>
          )}

          {/* Search-all footer */}
          <div className="mt-1 border-t border-stone-100 px-2 pt-1">
            {(() => {
              const idx = nextIndex();
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={activeIndex === idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => go(`/catalog?search=${encodeURIComponent(trimmed)}`)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    activeIndex === idx ? 'bg-brand-50' : 'hover:bg-stone-50',
                  )}
                >
                  <span className="text-slate-600">
                    Search catalog for{' '}
                    <span className="font-semibold text-slate-800">&ldquo;{trimmed}&rdquo;</span>
                  </span>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-brand-500" />
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestionRow({
  active,
  onMouseEnter,
  onClick,
  icon,
  label,
  sublabel,
}: {
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors',
        active ? 'bg-brand-50' : 'hover:bg-stone-50',
      )}
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-brand-50 ring-1 ring-brand-100">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-800">{label}</span>
        {sublabel && (
          <span className="block truncate text-xs text-slate-400">{sublabel}</span>
        )}
      </span>
    </button>
  );
}
