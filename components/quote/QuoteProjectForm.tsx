'use client';

/**
 * One project block on the /quote form.
 *
 * A single quote submission can contain up to `MAX_PROJECTS_PER_QUOTE`
 * blocks. Each block is fully self-contained — it captures where the
 * customer's blanks are coming from, which decoration method they want,
 * and the per-method configuration that matches the /pricing calculator.
 *
 * The block is a controlled component: parent (`app/quote/page.tsx`) owns
 * the array of projects and passes `project` + `onChange` down. Every
 * field change goes through `onChange` so the parent can serialize the
 * full state to /api/quote/submit on form submit.
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Check,
  ChevronDown,
  Layers,
  Loader2,
  Maximize2,
  Palette,
  PenTool,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrintLocation, StitchCount } from '@/lib/pricing-utils';
import {
  BLANK_SOURCE_OPTIONS,
  CATALOG_CATEGORY_CHIPS,
  COLOR_COUNT_OPTIONS,
  DECORATION_METHOD_OPTIONS,
  EMBROIDERY_QUANTITY_TIERS,
  FINISHING_OPTIONS,
  LOCATION_OPTIONS,
  QUANTITY_TIERS,
  STITCH_COUNT_OPTIONS,
  type BlankSource,
  type QuoteDecorationMethod,
} from '@/lib/quote-form-options';

// ---------------------------------------------------------------------------
// Public state shape
// ---------------------------------------------------------------------------

export interface QuoteProjectProductRef {
  styleId: number;
  styleName: string;
  brandName: string;
  slug: string;
  imageUrl?: string;
}

export interface QuoteProject {
  blankSource: BlankSource | null;
  blankOwnDescription: string;
  catalogCategory: string | null;
  catalogProduct: QuoteProjectProductRef | null;

  decorationMethod: QuoteDecorationMethod | null;

  // Screen / jumbo / digital tier + embroidery tier all use the same key
  // shape (see QUANTITY_TIERS / EMBROIDERY_QUANTITY_TIERS). We keep one
  // field and swap the option list based on `decorationMethod`.
  quantityTier: string;

  // Screen / jumbo colors
  colors: number;

  // Print / embroidery locations (multi-select)
  locations: PrintLocation[];

  isDark: boolean;
  isFleece: boolean;

  // Embroidery only
  stitchCount: StitchCount;
  numLocations: number;

  // Finishing only (has its own quantity because embroidery/screen tiers
  // don't apply here — finishing is quoted per exact piece count).
  finishingQuantity: number;
  finishingServices: string[];

  designNotes: string;
}

export function makeEmptyProject(
  preselectedMethod?: QuoteDecorationMethod,
): QuoteProject {
  return {
    blankSource: null,
    blankOwnDescription: '',
    catalogCategory: null,
    catalogProduct: null,
    decorationMethod: preselectedMethod ?? null,
    quantityTier: '100-249',
    colors: 2,
    locations: ['front'],
    isDark: false,
    isFleece: false,
    stitchCount: '5k-7.5k',
    numLocations: 1,
    finishingQuantity: 100,
    finishingServices: ['fold-bag-shirts'],
    designNotes: '',
  };
}

// Field-level errors surfaced by the parent form on submit attempt.
export type QuoteProjectErrors = Partial<Record<keyof QuoteProject, string>>;

// ---------------------------------------------------------------------------
// Icons per decoration method — kept in this file (not the options file) so
// the shared options remain UI-framework-agnostic.
// ---------------------------------------------------------------------------
const METHOD_ICONS: Record<QuoteDecorationMethod, LucideIcon> = {
  'screen-printing': Layers,
  embroidery: PenTool,
  digital: Palette,
  jumbo: Maximize2,
  finishing: Sparkles,
};

// ---------------------------------------------------------------------------
// Product search hook — debounced GET /api/products?search=…
// ---------------------------------------------------------------------------
interface ProductSearchResult {
  styleId: number;
  styleName: string;
  brandName: string;
  slug: string;
  imageUrl?: string;
}

function useProductSearch(query: string) {
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  // AbortController tied to the latest fetch. Firing a new keystroke
  // aborts the in-flight request so we never race to render a stale
  // slower response over a newer faster one.
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
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
          `/api/products?search=${encodeURIComponent(trimmed)}&pageSize=8`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error('search failed');
        const data = await res.json();
        const items: ProductSearchResult[] = (data.data || []).map(
          (p: {
            styleId: number;
            styleName: string;
            brandName: string;
            slug: string;
            imageUrl?: string;
          }) => ({
            styleId: p.styleId,
            styleName: p.styleName,
            brandName: p.brandName,
            slug: p.slug,
            imageUrl: p.imageUrl,
          }),
        );
        setResults(items);
      } catch (err) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(handle);
    };
  }, [query]);

  return { results, loading };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface QuoteProjectFormProps {
  project: QuoteProject;
  index: number;
  onChange: (updates: Partial<QuoteProject>) => void;
  onRemove?: () => void;
  errors?: QuoteProjectErrors;
}

export function QuoteProjectForm({
  project,
  index,
  onChange,
  onRemove,
  errors,
}: QuoteProjectFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults, loading: searchLoading } =
    useProductSearch(searchQuery);
  const [searchFocused, setSearchFocused] = useState(false);

  const toggleLocation = (loc: PrintLocation) => {
    const current = project.locations;
    const next = current.includes(loc)
      ? current.filter((l) => l !== loc)
      : [...current, loc];
    // Screen/jumbo/digital pricing requires at least one location, so we
    // don't allow deselecting the last one. Embroidery uses numLocations
    // (a count), not a location list, so this constraint doesn't apply
    // there.
    if (next.length === 0) return;
    onChange({ locations: next });
  };

  const toggleFinishingService = (id: string) => {
    const current = project.finishingServices;
    const next = current.includes(id)
      ? current.filter((s) => s !== id)
      : [...current, id];
    if (next.length === 0) return;
    onChange({ finishingServices: next });
  };

  const isEmbroidery = project.decorationMethod === 'embroidery';
  const quantityOptions = isEmbroidery
    ? EMBROIDERY_QUANTITY_TIERS
    : QUANTITY_TIERS;

  // If the user switches between screen-print-family tiers and embroidery
  // tiers, the currently-stored `quantityTier` might be a value from the
  // wrong family (e.g. `50-74` is a screen key that doesn't exist in the
  // embroidery table). Reconcile silently so the <select> never falls
  // into "unknown value" state.
  useEffect(() => {
    if (!project.decorationMethod) return;
    if (project.decorationMethod === 'finishing') return; // uses its own qty field
    if (!(quantityOptions as readonly string[]).includes(project.quantityTier)) {
      onChange({ quantityTier: quantityOptions[2] }); // 100-249 as a sane default
    }
  }, [project.decorationMethod, quantityOptions, project.quantityTier, onChange]);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {index + 1}
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Project {index + 1}
          </h3>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label={`Remove project ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        )}
      </div>

      <div className="space-y-8 p-6">
        {/* --------- Blank Product --------- */}
        <section>
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-slate-800">
              Blank Product
              <span className="text-red-500 ml-0.5">*</span>
            </h4>
            <p className="mt-0.5 text-xs text-slate-500">
              Where should we source the garments from?
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {BLANK_SOURCE_OPTIONS.map((opt) => {
              const selected = project.blankSource === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ blankSource: opt.id })}
                  className={cn(
                    'relative rounded-xl border-2 p-4 text-left transition-all',
                    selected
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                        selected
                          ? 'border-brand-500 bg-brand-500'
                          : 'border-stone-300 bg-white',
                      )}
                    >
                      {selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {errors?.blankSource && (
            <p className="mt-2 text-xs text-red-600">{errors.blankSource}</p>
          )}

          {/* Blank source = own → textarea */}
          {project.blankSource === 'own' && (
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Describe your blank
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                value={project.blankOwnDescription}
                onChange={(e) =>
                  onChange({ blankOwnDescription: e.target.value })
                }
                rows={2}
                placeholder="e.g. Gildan 5000, 200 pieces, mix of black and navy in M/L/XL"
                className="w-full rounded-lg border border-stone-200 px-4 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {errors?.blankOwnDescription && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.blankOwnDescription}
                </p>
              )}
            </div>
          )}

          {/* Blank source = catalog → category chips + search */}
          {project.blankSource === 'catalog' && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Pick a category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATALOG_CATEGORY_CHIPS.map((chip) => {
                    const selected = project.catalogCategory === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() =>
                          onChange({
                            catalogCategory: selected ? null : chip.id,
                            // Choosing a category clears any selected
                            // specific product (they're alternatives).
                            catalogProduct: null,
                          })
                        }
                        className={cn(
                          'rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-all',
                          selected
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-stone-200 bg-white text-slate-600 hover:border-stone-300',
                        )}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Or search a specific product
                </label>

                {project.catalogProduct ? (
                  // Selected-product pill
                  <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 p-3">
                    {project.catalogProduct.imageUrl ? (
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-white">
                        <Image
                          src={project.catalogProduct.imageUrl}
                          alt={project.catalogProduct.styleName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-white">
                        <ShoppingBag className="h-5 w-5 text-slate-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {project.catalogProduct.brandName}
                      </p>
                      <p className="truncate text-sm font-medium text-slate-900">
                        {project.catalogProduct.styleName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ catalogProduct: null });
                        setSearchQuery('');
                      }}
                      className="flex-shrink-0 rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                      aria-label="Clear selected product"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      // Delay blur so a click on a result registers before
                      // the results dropdown unmounts.
                      onBlur={() =>
                        setTimeout(() => setSearchFocused(false), 150)
                      }
                      placeholder="Try 'Gildan 5000' or 'Bella Canvas 3001'"
                      className="w-full rounded-lg border border-stone-200 py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />

                    {searchFocused &&
                      searchQuery.trim().length >= 2 &&
                      (searchLoading || searchResults.length > 0) && (
                        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-72 overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg">
                          {searchLoading && (
                            <div className="flex items-center justify-center gap-2 p-4 text-sm text-slate-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Searching…
                            </div>
                          )}
                          {!searchLoading && searchResults.length === 0 && (
                            <div className="p-4 text-center text-sm text-slate-500">
                              No products match.
                            </div>
                          )}
                          {!searchLoading &&
                            searchResults.map((r) => (
                              <button
                                key={r.styleId}
                                type="button"
                                onMouseDown={(e) => {
                                  // Prevent input blur before onClick fires.
                                  e.preventDefault();
                                }}
                                onClick={() => {
                                  onChange({
                                    catalogProduct: r,
                                    // Locking to a specific product implies
                                    // the category chip is redundant — but
                                    // we don't force-clear it; a customer
                                    // might have picked "T-Shirts" as a
                                    // hint and then searched within it.
                                  });
                                  setSearchQuery('');
                                  setSearchFocused(false);
                                }}
                                className="flex w-full items-center gap-3 border-b border-stone-100 p-3 text-left transition-colors last:border-b-0 hover:bg-stone-50"
                              >
                                {r.imageUrl ? (
                                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-stone-100">
                                    <Image
                                      src={r.imageUrl}
                                      alt={r.styleName}
                                      fill
                                      sizes="40px"
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-stone-100">
                                    <ShoppingBag className="h-4 w-4 text-slate-300" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    {r.brandName}
                                  </p>
                                  <p className="truncate text-sm font-medium text-slate-900">
                                    {r.styleName}
                                  </p>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                  </div>
                )}
              </div>

              {errors?.catalogCategory && (
                <p className="text-xs text-red-600">{errors.catalogCategory}</p>
              )}
            </div>
          )}
        </section>

        {/* --------- Decoration Method --------- */}
        <section>
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-slate-800">
              Decoration Method
              <span className="text-red-500 ml-0.5">*</span>
            </h4>
            <p className="mt-0.5 text-xs text-slate-500">
              Choose one — you can add another project for a second method.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {DECORATION_METHOD_OPTIONS.map((opt) => {
              const Icon = METHOD_ICONS[opt.id];
              const selected = project.decorationMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ decorationMethod: opt.id })}
                  className={cn(
                    'relative flex flex-col items-center rounded-xl border-2 p-3 text-center transition-all',
                    selected
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50',
                  )}
                >
                  <div
                    className={cn(
                      'mb-2 flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                      selected
                        ? 'bg-brand-100 text-brand-600'
                        : 'bg-stone-100 text-slate-400',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-900">
                    {opt.shortName}
                  </span>
                  <span className="mt-0.5 text-[10px] leading-tight text-slate-500">
                    {opt.description}
                  </span>
                  {selected && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {errors?.decorationMethod && (
            <p className="mt-2 text-xs text-red-600">
              {errors.decorationMethod}
            </p>
          )}
        </section>

        {/* --------- Per-method fields --------- */}
        {project.decorationMethod && (
          <section className="space-y-5 rounded-xl bg-stone-50/50 p-5 ring-1 ring-inset ring-stone-100">
            {/* Quantity tier for screen / jumbo / digital / embroidery */}
            {project.decorationMethod !== 'finishing' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Quantity
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    value={project.quantityTier}
                    onChange={(e) =>
                      onChange({ quantityTier: e.target.value })
                    }
                    className="w-full appearance-none rounded-lg border border-stone-200 bg-white px-4 py-2.5 pr-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {quantityOptions.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier} pieces
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  50 piece minimum. Not sure? Pick the closest range.
                </p>
              </div>
            )}

            {/* Screen printing / jumbo: colors + locations + toggles */}
            {(project.decorationMethod === 'screen-printing' ||
              project.decorationMethod === 'jumbo') && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Number of Colors
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_COUNT_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => onChange({ colors: n })}
                        className={cn(
                          'h-9 w-9 rounded-lg border-2 text-sm font-medium transition-all',
                          project.colors === n
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-stone-200 bg-white text-slate-600 hover:border-stone-300',
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Print Locations
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LOCATION_OPTIONS.map((loc) => {
                      const selected = project.locations.includes(loc.id);
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => toggleLocation(loc.id)}
                          className={cn(
                            'rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all',
                            selected
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-stone-200 bg-white text-slate-600 hover:border-stone-300',
                          )}
                        >
                          {loc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={project.isDark}
                      onChange={(e) =>
                        onChange({ isDark: e.target.checked })
                      }
                      className="rounded border-stone-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-slate-700">
                      Dark garment (adds an underbase color)
                    </span>
                  </label>
                  {project.decorationMethod === 'screen-printing' && (
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={project.isFleece}
                        onChange={(e) =>
                          onChange({ isFleece: e.target.checked })
                        }
                        className="rounded border-stone-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-sm text-slate-700">
                        Fleece garment
                      </span>
                    </label>
                  )}
                </div>
              </>
            )}

            {/* Embroidery: stitch count + # locations */}
            {project.decorationMethod === 'embroidery' && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Estimated Stitch Count
                  </label>
                  <div className="space-y-2">
                    {STITCH_COUNT_OPTIONS.map((opt) => {
                      const selected = project.stitchCount === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onChange({ stitchCount: opt.id })}
                          className={cn(
                            'w-full rounded-lg border-2 px-4 py-2.5 text-left transition-all',
                            selected
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-stone-200 bg-white hover:border-stone-300',
                          )}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-medium text-slate-900">
                              {opt.label}
                            </span>
                            <span className="text-xs text-slate-500">
                              {opt.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Not sure? We'll give you an exact count with your quote.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Number of Locations
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => onChange({ numLocations: n })}
                        className={cn(
                          'h-9 flex-1 rounded-lg border-2 text-sm font-medium transition-all',
                          project.numLocations === n
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-stone-200 bg-white text-slate-600 hover:border-stone-300',
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Digital: fleece toggle only (unlimited colors) */}
            {project.decorationMethod === 'digital' && (
              <>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Full color, unlimited palette.</strong> Digital
                    screen printing includes photorealistic images and complex
                    gradients at no extra charge.
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Print Locations
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LOCATION_OPTIONS.map((loc) => {
                      const selected = project.locations.includes(loc.id);
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => toggleLocation(loc.id)}
                          className={cn(
                            'rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all',
                            selected
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-stone-200 bg-white text-slate-600 hover:border-stone-300',
                          )}
                        >
                          {loc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={project.isFleece}
                    onChange={(e) =>
                      onChange({ isFleece: e.target.checked })
                    }
                    className="rounded border-stone-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">
                    Fleece garment
                  </span>
                </label>
              </>
            )}

            {/* Finishing: numeric quantity + services multi-select */}
            {project.decorationMethod === 'finishing' && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Quantity
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    min={50}
                    value={project.finishingQuantity}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      onChange({
                        finishingQuantity: Number.isFinite(parsed)
                          ? Math.max(50, parsed)
                          : 50,
                      });
                    }}
                    className="w-full rounded-lg border border-stone-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    50 piece minimum.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Services
                  </label>
                  <div className="space-y-2">
                    {FINISHING_OPTIONS.map((opt) => {
                      const selected = project.finishingServices.includes(
                        opt.id,
                      );
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleFinishingService(opt.id)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg border-2 px-4 py-2.5 text-left transition-all',
                            selected
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-stone-200 bg-white hover:border-stone-300',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2',
                                selected
                                  ? 'border-brand-500 bg-brand-500'
                                  : 'border-stone-300 bg-white',
                              )}
                            >
                              {selected && (
                                <Check className="h-2.5 w-2.5 text-white" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-slate-900">
                              {opt.label}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {opt.priceLabel}/pc
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Design notes — shared across methods */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Design Notes (optional)
              </label>
              <textarea
                value={project.designNotes}
                onChange={(e) => onChange({ designNotes: e.target.value })}
                rows={2}
                placeholder="Describe the design, colors, and placement. Attach artwork later — we'll request it in our reply."
                className="w-full rounded-lg border border-stone-200 px-4 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
