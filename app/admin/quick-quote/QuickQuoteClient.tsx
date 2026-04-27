'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, X, Plus, Zap, Loader2, Info, Award,
  ChevronDown, ChevronUp, RotateCcw, Check, Star, Phone, Download,
  TrendingDown, Sparkles, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  calculateQuotePricing,
  buildAssumptionsLabel,
  applyMarkupAndRound,
  DEFAULT_CUSTOMIZATIONS,
  STITCH_LABELS,
  LOCATION_LABELS,
  HIGH_STITCH_RATE_PER_1K,
  type QuickQuoteCustomizations,
  type TierRow,
  type DecorationMode,
} from '@/lib/quick-quote';

// ============ Types ============

export interface QuickQuoteProduct {
  styleId: number;
  styleName: string;
  brandName: string;
  title: string;
  imageUrl: string;
  basePrice: number;
  colorCount: number;
  customQuantity?: number;
  decorationMode: DecorationMode;
}

interface SearchResult {
  data: Product[];
  total: number;
}

const MAX_PRODUCTS = 4;
const PRINT_LOCATIONS = ['front', 'back', 'left-sleeve', 'right-sleeve'] as const;

const ADDON_ITEMS = [
  { name: '3D Puff Embroidery', price: '+$3.00/pc', description: 'Raised, textured letters for a premium look. Popular on caps and beanies.', popular: true },
  { name: 'Fold & Bag (Shirts)', price: '+$0.85–1.00/pc', description: 'Individual poly-bagged for retail-ready presentation.', popular: true },
  { name: 'Woven Neck Labels', price: '+$1.80–3.00/pc', description: 'Replace manufacturer tags with your own brand.', popular: true },
  { name: 'Side Embroidery', price: '+$5.00/pc', description: 'Additional logo on left or right side of caps.', popular: false },
  { name: 'Back Embroidery', price: '+$5.00/pc', description: 'Logo placement on the back panel. Great for website URLs.', popular: false },
  { name: 'Fold & Bag (Fleece)', price: '+$1.35–1.50/pc', description: 'Individual poly-bagged for heavier garments.', popular: false },
  { name: 'Hang Tags', price: '+$0.35–0.50/pc', description: 'Custom branded hang tags for retail display.', popular: false },
  { name: 'Barcode/UPC Labels', price: '+$0.19–0.25/pc', description: 'Retail-ready with scannable product codes.', popular: false },
  { name: 'Metallic Ink', price: '+$0.50/pc', description: 'Eye-catching metallic finish for screen prints.', popular: false },
  { name: 'PMS Color Match', price: '+$30 one-time', description: 'Exact Pantone color matching for brand consistency.', popular: false },
];

function mapProductToQuote(product: Product): QuickQuoteProduct {
  return {
    styleId: product.styleId,
    styleName: product.styleName,
    brandName: product.brandName,
    title: product.title,
    imageUrl: product.imageUrl,
    basePrice: product.price || product.basePrice,
    colorCount: product.colors?.length ?? 0,
    decorationMode: 'both',
  };
}

function isDefaultCustomizations(c: QuickQuoteCustomizations): boolean {
  const d = DEFAULT_CUSTOMIZATIONS;
  return (
    c.screenPrintColors === d.screenPrintColors &&
    c.screenPrintLocations.length === d.screenPrintLocations.length &&
    c.screenPrintLocations.every((l, i) => l === d.screenPrintLocations[i]) &&
    c.embroideryStitchIndex === d.embroideryStitchIndex &&
    c.embroideryLocations === d.embroideryLocations &&
    c.isFleece === d.isFleece &&
    c.isDarkGarment === d.isDarkGarment &&
    !c.advancedMode
  );
}

function buildOverrideSummary(c: QuickQuoteCustomizations): string {
  const parts: string[] = [];
  const d = DEFAULT_CUSTOMIZATIONS;

  if (c.screenPrintColors !== d.screenPrintColors || c.isDarkGarment) {
    const effective = c.isDarkGarment ? c.screenPrintColors + 1 : c.screenPrintColors;
    parts.push(`${effective}-color`);
  }
  if (
    c.screenPrintLocations.length !== d.screenPrintLocations.length ||
    !c.screenPrintLocations.every((l, i) => l === d.screenPrintLocations[i])
  ) {
    parts.push(c.screenPrintLocations.map(l => LOCATION_LABELS[l] || l).join(' + '));
  }
  if (c.embroideryStitchIndex !== d.embroideryStitchIndex) {
    if (c.embroideryStitchIndex === 4 && c.embroideryCustomStitchCount) {
      parts.push(`${(c.embroideryCustomStitchCount / 1000).toFixed(0)}K stitches`);
    } else {
      parts.push(STITCH_LABELS[c.embroideryStitchIndex]);
    }
  }
  if (c.embroideryLocations !== d.embroideryLocations) {
    parts.push(`${c.embroideryLocations} emb. locations`);
  }
  if (c.isFleece) parts.push('fleece');
  if (c.isDarkGarment) parts.push('dark garment');

  return parts.length > 0 ? `Custom: ${parts.join(', ')}` : '';
}

// ============ Main Component ============

export default function QuickQuoteClient() {
  const [products, setProducts] = useState<QuickQuoteProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const [customerSuppliesBlanks, setCustomerSuppliesBlanks] = useState(false);
  const [customizations, setCustomizations] = useState<QuickQuoteCustomizations>(
    () => ({ ...DEFAULT_CUSTOMIZATIONS, screenPrintLocations: [...DEFAULT_CUSTOMIZATIONS.screenPrintLocations] })
  );
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [isPdfCapturing, setIsPdfCapturing] = useState(false);
  const [markupPerPiece, setMarkupPerPiece] = useState(0);
  const [beautifyPrices, setBeautifyPrices] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());

  const toggleAddOn = (name: string) => {
    setSelectedAddOns(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const presentationRef = useRef<HTMLDivElement>(null);

  const isAtCapacity = products.length >= MAX_PRODUCTS;
  const isDefault = isDefaultCustomizations(customizations);
  const overrideSummary = buildOverrideSummary(customizations);

  // ---- Search Logic ----

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&pageSize=8`);
      if (!res.ok) throw new Error('Search failed');
      const data: SearchResult = await res.json();
      setSearchResults(data.data || []);
      setShowDropdown(true);
      setHighlightedIndex(-1);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => performSearch(value), 250);
  };

  const addProduct = useCallback((product: Product) => {
    if (isAtCapacity) return;
    if (products.some(p => p.styleId === product.styleId)) return;
    setProducts(prev => [...prev, mapProductToQuote(product)]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    searchInputRef.current?.focus();
  }, [isAtCapacity, products]);

  const removeProduct = (styleId: number) => {
    setProducts(prev => prev.filter(p => p.styleId !== styleId));
  };

  const updateProductQuantity = (styleId: number, qty: number | undefined) => {
    setProducts(prev =>
      prev.map(p => (p.styleId === styleId ? { ...p, customQuantity: qty } : p))
    );
  };

  const updateProductDecorationMode = (styleId: number, mode: DecorationMode) => {
    setProducts(prev =>
      prev.map(p => (p.styleId === styleId ? { ...p, decorationMode: mode } : p))
    );
  };


  const handleReset = () => {
    setProducts([]);
    setCustomerSuppliesBlanks(false);
    setCustomizations({
      ...DEFAULT_CUSTOMIZATIONS,
      screenPrintLocations: [...DEFAULT_CUSTOMIZATIONS.screenPrintLocations],
    });
    setOverridesOpen(false);
    setMarkupPerPiece(0);
    setBeautifyPrices(false);
    setSelectedAddOns(new Set());
    searchInputRef.current?.focus();
  };

  const handleDownloadPdf = async () => {
    const el = presentationRef.current;
    if (!el || products.length === 0) return;

    setIsPdfCapturing(true);
    try {
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeight > 297 ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageHeight = 297;
      let position = 0;

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let remaining = imgHeight;
        while (remaining > 0) {
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          remaining -= pageHeight;
          position -= pageHeight;
          if (remaining > 0) pdf.addPage();
        }
      }

      const styleNames = products.map(p => p.styleName).join('-');
      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`QuickQuote-${styleNames}-${date}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsPdfCapturing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim().length >= 2 && !isSearching) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        performSearch(searchQuery);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults.length === 1) addProduct(searchResults[0]);
        else if (highlightedIndex >= 0) addProduct(searchResults[highlightedIndex]);
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, []);

  // ---- Customization Handlers ----

  // ============ RENDER ============

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Print stylesheet: hide controls, show only the presentation */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #quick-quote-presentation,
          #quick-quote-presentation * { visibility: visible; }
          #quick-quote-presentation {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-full bg-brand-100 p-2">
              <Zap className="h-5 w-5 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
              Quick Quote
            </h1>
          </div>
          <p className="mt-1 text-slate-600 ml-12">
            Type a style number to instantly generate a pricing presentation.
          </p>
        </div>

        {/* ============ ZONE 1: Control Panel ============ */}
        <div className="mb-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          {/* Row 1: Search + Global Controls */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search Bar */}
            <div className="relative flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                  disabled={isAtCapacity}
                  placeholder={
                    isAtCapacity
                      ? 'Maximum 4 products per quote'
                      : 'Enter style # (e.g., 5000, 1801GD, PC54)'
                  }
                  className={cn(
                    'w-full rounded-lg border border-stone-300 py-3 pl-12 pr-12 text-base',
                    'placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
                    isAtCapacity && 'cursor-not-allowed bg-stone-50 text-slate-400'
                  )}
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 animate-spin" />
                )}
                {searchQuery && !isSearching && (
                  <button
                    onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); searchInputRef.current?.focus(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Search Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div ref={dropdownRef} className="absolute z-50 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg overflow-hidden">
                  {searchResults.map((product, index) => (
                    <button
                      key={product.styleId}
                      onClick={() => addProduct(product)}
                      disabled={products.some(p => p.styleId === product.styleId)}
                      className={cn(
                        'flex w-full items-center gap-4 px-4 py-3 text-left transition-colors',
                        highlightedIndex === index && 'bg-brand-50',
                        products.some(p => p.styleId === product.styleId) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-stone-50'
                      )}
                    >
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" className="h-12 w-12 rounded-md object-contain bg-stone-100" />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-stone-100" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500">{product.brandName}</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{product.title}</p>
                        <p className="text-xs text-slate-500">
                          Style #{product.styleName}
                          {product.colors?.length > 0 && <span className="ml-2">{product.colors.length} colors</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-navy-800">${(product.price || product.basePrice).toFixed(2)}</p>
                        <p className="text-xs text-slate-400">per piece</p>
                      </div>
                      {products.some(p => p.styleId === product.styleId) ? (
                        <span className="text-xs text-slate-400 shrink-0">Added</span>
                      ) : (
                        <Plus className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && searchResults.length === 0 && !isSearching && searchQuery.trim().length >= 2 && (
                <div ref={dropdownRef} className="absolute z-50 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg p-6 text-center">
                  <p className="text-sm text-slate-500">No products found for &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-xs text-slate-400 mt-1">Try a different style number or product name</p>
                </div>
              )}
            </div>

            {/* Global Toggles */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Customer Supplies Blanks Toggle */}
              <button
                onClick={() => setCustomerSuppliesBlanks(prev => !prev)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  customerSuppliesBlanks
                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                    : 'border-stone-200 bg-white text-slate-600 hover:bg-stone-50'
                )}
              >
                <div className={cn(
                  'h-4 w-4 rounded border flex items-center justify-center transition-colors',
                  customerSuppliesBlanks ? 'border-brand-500 bg-brand-500' : 'border-stone-300'
                )}>
                  {customerSuppliesBlanks && <Check className="h-3 w-3 text-white" />}
                </div>
                Customer supplies blanks
              </button>

              {/* PDF + Reset Buttons */}
              {products.length > 0 && (
                <>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isPdfCapturing}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                      isPdfCapturing
                        ? 'border-brand-200 bg-brand-50 text-brand-400 cursor-wait'
                        : 'border-brand-500 bg-brand-500 text-white hover:bg-brand-600'
                    )}
                  >
                    {isPdfCapturing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {isPdfCapturing ? 'Generating…' : 'Download PDF'}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-slate-500 hover:bg-stone-50 hover:text-red-500 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Markup + Rounding Controls */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-stone-100 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Markup:</span>
              {[0, 1, 2, 3, 5].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setMarkupPerPiece(amt)}
                  className={cn(
                    'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    markupPerPiece === amt
                      ? 'bg-navy-800 text-white'
                      : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
                  )}
                >
                  {amt === 0 ? 'None' : `+$${amt}`}
                </button>
              ))}
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.25}
                  value={![0, 1, 2, 3, 5].includes(markupPerPiece) ? markupPerPiece : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setMarkupPerPiece(isNaN(val) ? 0 : Math.max(0, Math.min(50, val)));
                  }}
                  placeholder="Custom"
                  className={cn(
                    'w-20 rounded-md border py-1.5 pl-5 pr-2 text-xs font-medium transition-colors focus:border-brand-300 focus:ring-1 focus:ring-brand-300 focus:outline-none',
                    ![0, 1, 2, 3, 5].includes(markupPerPiece)
                      ? 'border-navy-300 bg-navy-800 text-white placeholder:text-navy-300'
                      : 'border-stone-200 bg-stone-50 text-slate-600 placeholder:text-slate-400'
                  )}
                />
              </div>
            </div>

            <div className="h-5 w-px bg-stone-200" />

            <button
              onClick={() => setBeautifyPrices(prev => !prev)}
              className={cn(
                'flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                beautifyPrices
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-stone-200 text-slate-600 hover:bg-stone-50'
              )}
            >
              <div className={cn(
                'h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors',
                beautifyPrices ? 'border-brand-500 bg-brand-500' : 'border-stone-300'
              )}>
                {beautifyPrices && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              Round prices
            </button>

            {(markupPerPiece > 0 || beautifyPrices) && (
              <span className="text-[10px] text-slate-400">
                {markupPerPiece > 0 && `+$${markupPerPiece}/pc`}
                {markupPerPiece > 0 && beautifyPrices && ' · '}
                {beautifyPrices && 'rounded to nearest $0.25'}
              </span>
            )}
          </div>

          {/* Product count */}
          {products.length > 0 && (
            <div className="mt-3">
              <span className="text-xs text-slate-500">
                {products.length} of {MAX_PRODUCTS} products added
              </span>
            </div>
          )}

          {/* ---- Customize Defaults (collapsible) ---- */}
          <div className="mt-4 border-t border-stone-100 pt-4">
            <button
              onClick={() => setOverridesOpen(prev => !prev)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Customize Defaults
                </span>
                {!isDefault && !overridesOpen && (
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600">
                    {overrideSummary}
                  </span>
                )}
              </div>
              {overridesOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {overridesOpen && (
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {/* ---- LEFT COLUMN: Screen Print ---- */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Print Locations
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRINT_LOCATIONS.map(loc => (
                        <button
                          key={loc}
                          onClick={() => {
                            setCustomizations(prev => {
                              const has = prev.screenPrintLocations.includes(loc);
                              if (has && prev.screenPrintLocations.length <= 1) return prev;
                              const nextLocs = has
                                ? prev.screenPrintLocations.filter(l => l !== loc)
                                : [...prev.screenPrintLocations, loc];

                              if (nextLocs.length <= 1) {
                                return { ...prev, screenPrintLocations: nextLocs, advancedMode: false, screenPrintColorsPerLocation: undefined };
                              }

                              const nextPerLoc = { ...prev.screenPrintColorsPerLocation };
                              for (const l of nextLocs) {
                                if (nextPerLoc[l] === undefined) nextPerLoc[l] = prev.screenPrintColors;
                              }
                              return { ...prev, screenPrintLocations: nextLocs, advancedMode: true, screenPrintColorsPerLocation: nextPerLoc };
                            });
                          }}
                          className={cn(
                            'rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
                            customizations.screenPrintLocations.includes(loc)
                              ? 'bg-brand-500 text-white'
                              : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                          )}
                        >
                          {customizations.screenPrintLocations.includes(loc) && (
                            <Check className="h-3 w-3" />
                          )}
                          {LOCATION_LABELS[loc]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Per-location color pickers (or single picker) */}
                  {customizations.screenPrintLocations.length === 1 ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-2">
                        Screen Print Colors
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                          <button
                            key={num}
                            onClick={() => setCustomizations(prev => ({ ...prev, screenPrintColors: num }))}
                            className={cn(
                              'h-9 w-9 rounded-lg text-sm font-medium transition-colors',
                              customizations.screenPrintColors === num
                                ? 'bg-brand-500 text-white'
                                : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                            )}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-slate-600">
                        Colors per Location
                      </label>
                      {customizations.screenPrintLocations.map(loc => (
                        <div key={loc}>
                          <span className="text-[11px] font-medium text-slate-500 mb-1 block">{LOCATION_LABELS[loc] || loc}</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                              <button
                                key={num}
                                onClick={() => setCustomizations(prev => ({
                                  ...prev,
                                  advancedMode: true,
                                  screenPrintColorsPerLocation: {
                                    ...Object.fromEntries(prev.screenPrintLocations.map(l => [l, prev.screenPrintColorsPerLocation?.[l] ?? prev.screenPrintColors])),
                                    [loc]: num,
                                  },
                                }))}
                                className={cn(
                                  'h-8 w-8 rounded-lg text-xs font-medium transition-colors',
                                  (customizations.screenPrintColorsPerLocation?.[loc] ?? customizations.screenPrintColors) === num
                                    ? 'bg-brand-500 text-white'
                                    : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                                )}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Garment Options */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Garment Options
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customizations.isFleece}
                          onChange={(e) => setCustomizations(prev => ({ ...prev, isFleece: e.target.checked }))}
                          className="rounded border-stone-300 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="text-sm text-slate-700">Fleece (+$1.00/pc)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customizations.isDarkGarment}
                          onChange={(e) => setCustomizations(prev => ({ ...prev, isDarkGarment: e.target.checked }))}
                          className="rounded border-stone-300 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="text-sm text-slate-700">Dark garment (+1 color)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* ---- RIGHT COLUMN: Embroidery ---- */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Embroidery Locations
                    </label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          onClick={() => setCustomizations(prev => ({ ...prev, embroideryLocations: num }))}
                          className={cn(
                            'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
                            customizations.embroideryLocations === num
                              ? 'bg-brand-500 text-white'
                              : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stitch count — single picker when 1 location, per-location when 2+ */}
                  {customizations.embroideryLocations === 1 ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-2">
                        Stitch Count
                      </label>
                      <div className="space-y-1.5">
                        {STITCH_LABELS.slice(0, 4).map((label, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCustomizations(prev => ({
                              ...prev,
                              embroideryStitchIndex: idx,
                              embroideryCustomStitchCount: undefined,
                            }))}
                            className={cn(
                              'w-full rounded-lg px-3 py-2 text-xs text-left font-medium transition-colors',
                              customizations.embroideryStitchIndex === idx
                                ? 'bg-brand-50 border border-brand-300 text-brand-700'
                                : 'bg-stone-50 border border-transparent text-slate-700 hover:bg-stone-100'
                            )}
                          >
                            {label}
                          </button>
                        ))}
                        <button
                          onClick={() => setCustomizations(prev => ({
                            ...prev,
                            embroideryStitchIndex: 4,
                            embroideryCustomStitchCount: prev.embroideryCustomStitchCount || 15000,
                          }))}
                          className={cn(
                            'w-full rounded-lg px-3 py-2 text-xs text-left font-medium transition-colors',
                            customizations.embroideryStitchIndex === 4
                              ? 'bg-brand-50 border border-brand-300 text-brand-700'
                              : 'bg-stone-50 border border-transparent text-slate-700 hover:bg-stone-100'
                          )}
                        >
                          Custom stitch count
                        </button>
                        {customizations.embroideryStitchIndex === 4 && (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="number"
                              min={10001}
                              step={1000}
                              value={customizations.embroideryCustomStitchCount || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setCustomizations(prev => ({
                                  ...prev,
                                  embroideryCustomStitchCount: isNaN(val) ? undefined : val,
                                }));
                              }}
                              placeholder="e.g. 40000"
                              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-300 focus:ring-1 focus:ring-brand-300 focus:outline-none"
                            />
                            <span className="shrink-0 text-[10px] text-slate-400">stitches</span>
                          </div>
                        )}
                        {customizations.embroideryStitchIndex === 4 && customizations.embroideryCustomStitchCount && customizations.embroideryCustomStitchCount > 10000 && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            +${((Math.ceil((customizations.embroideryCustomStitchCount - 10000) / 1000)) * HIGH_STITCH_RATE_PER_1K).toFixed(2)}/pc above 10K base
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-2">
                        Stitch Count per Location
                      </label>
                      <div className="space-y-2.5">
                        {Array.from({ length: customizations.embroideryLocations }).map((_, locIdx) => (
                          <div key={locIdx}>
                            <span className="text-[11px] font-medium text-slate-500 mb-1 block">Location {locIdx + 1}</span>
                            <div className="flex flex-wrap gap-1">
                              {STITCH_LABELS.slice(0, 4).map((label, stitchIdx) => (
                                <button
                                  key={stitchIdx}
                                  onClick={() => setCustomizations(prev => {
                                    const arr = [...(prev.embroideryStitchPerLocation || Array.from({ length: prev.embroideryLocations }, () => prev.embroideryStitchIndex))];
                                    arr[locIdx] = stitchIdx;
                                    return { ...prev, advancedMode: true, embroideryStitchPerLocation: arr };
                                  })}
                                  className={cn(
                                    'rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                                    (customizations.embroideryStitchPerLocation?.[locIdx] ?? customizations.embroideryStitchIndex) === stitchIdx
                                      ? 'bg-brand-50 border border-brand-300 text-brand-700'
                                      : 'bg-stone-50 border border-transparent text-slate-600 hover:bg-stone-100'
                                  )}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reset Defaults */}
                {!isDefault && (
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      onClick={() => setCustomizations({
                        ...DEFAULT_CUSTOMIZATIONS,
                        screenPrintLocations: [...DEFAULT_CUSTOMIZATIONS.screenPrintLocations],
                      })}
                      className="text-xs text-slate-400 hover:text-brand-500 transition-colors"
                    >
                      Reset to defaults
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ============ ZONE 2: Presentation ============ */}
        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 p-16 text-center">
            <div className="mx-auto mb-4 rounded-full bg-stone-100 p-4 w-fit">
              <Search className="h-8 w-8 text-stone-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-700">
              Search for a product to get started
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Enter a style number above and we&apos;ll generate an instant pricing
              presentation you can screenshot or download as PDF.
            </p>
          </div>
        ) : (
          <div id="quick-quote-presentation" ref={presentationRef} className="mx-auto max-w-4xl">
            {/* Presentation Container */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden">
              {/* Branded Header */}
              <PresentationHeader />

              {/* Combined Quantity Callout */}
              {products.length >= 2 && (
                <div className="mx-8 mt-6 flex items-start gap-2.5 rounded-lg bg-brand-50 px-4 py-3">
                  <Info className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-brand-700">
                    <span className="font-semibold">Ordering multiple styles?</span>{' '}
                    Combined quantities may qualify for additional price breaks &mdash; ask your rep!
                  </p>
                </div>
              )}

              {/* Product Cards */}
              <div className="px-8 py-6 space-y-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.styleId}
                    product={product}
                    onRemove={() => removeProduct(product.styleId)}
                    onQuantityChange={(qty) => updateProductQuantity(product.styleId, qty)}
                    onDecorationModeChange={(mode) => updateProductDecorationMode(product.styleId, mode)}
                    customizations={customizations}
                    customerSuppliesBlanks={customerSuppliesBlanks}
                    isCapturing={isPdfCapturing}
                    markupPerPiece={markupPerPiece}
                    beautifyPrices={beautifyPrices}
                    selectedAddOns={selectedAddOns}
                  />
                ))}
              </div>

              {/* Add-Ons Menu */}
              <AddOnsMenu
                selectedAddOns={selectedAddOns}
                onToggle={toggleAddOn}
                isCapturing={isPdfCapturing}
              />

              {/* Presentation Footer */}
              <PresentationFooter />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Product Card with Pricing Table ============

function ProductCard({
  product,
  onRemove,
  onQuantityChange,
  onDecorationModeChange,
  customizations,
  customerSuppliesBlanks,
  isCapturing = false,
  markupPerPiece = 0,
  beautifyPrices = false,
  selectedAddOns = new Set<string>(),
}: {
  product: QuickQuoteProduct;
  onRemove: () => void;
  onQuantityChange: (qty: number | undefined) => void;
  onDecorationModeChange: (mode: DecorationMode) => void;
  customizations: QuickQuoteCustomizations;
  customerSuppliesBlanks: boolean;
  isCapturing?: boolean;
  markupPerPiece?: number;
  beautifyPrices?: boolean;
  selectedAddOns?: Set<string>;
}) {
  const [qtyInput, setQtyInput] = useState('');
  const mode = product.decorationMode;
  const showScreen = mode !== 'embroidery';
  const showEmb = mode !== 'screen';

  const pricing = calculateQuotePricing(
    product.basePrice,
    customizations,
    product.customQuantity,
  );

  const assumptionsLabel = buildAssumptionsLabel(customizations, mode);

  const handleQtySubmit = () => {
    const parsed = parseInt(qtyInput, 10);
    if (!isNaN(parsed) && parsed >= 50) {
      onQuantityChange(parsed);
    } else if (qtyInput.trim() === '') {
      onQuantityChange(undefined);
    }
  };

  const handleQtyClear = () => {
    setQtyInput('');
    onQuantityChange(undefined);
  };

  const customRow = product.customQuantity
    ? pricing.rows.find(r => r.quantity === product.customQuantity)
    : undefined;

  const DECO_MODES: { value: DecorationMode; label: string }[] = [
    { value: 'screen', label: 'Screen Print' },
    { value: 'embroidery', label: 'Embroidery' },
    { value: 'both', label: 'Both' },
  ];

  return (
    <div className="rounded-lg border border-stone-100 overflow-hidden">
      {/* Card Header */}
      <div className="flex items-start gap-5 p-5">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} className="h-28 w-28 rounded-lg object-contain bg-stone-50 shrink-0" />
        ) : (
          <div className="h-28 w-28 rounded-lg bg-stone-100 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {product.brandName}
          </p>
          <h3 className="text-lg font-bold text-navy-800 mt-0.5">
            {product.title}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Style #{product.styleName}
          </p>

          <div className="flex items-center gap-4 mt-3">
            {customerSuppliesBlanks ? (
              <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-sm text-slate-500">
                <span className="line-through mr-1.5">${product.basePrice.toFixed(2)}</span>
                Customer supplied
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
                Starting at ${product.basePrice.toFixed(2)}/pc
              </span>
            )}
            {product.colorCount > 0 && (
              <span className="text-xs text-slate-500">{product.colorCount} colors available</span>
            )}
          </div>
        </div>

        {/* Quantity Input + Color + Remove (hidden during PDF capture) */}
        {!isCapturing && (
          <div className="shrink-0 flex flex-col items-end gap-2">
            <button
              onClick={onRemove}
              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Remove product"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={50}
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onBlur={handleQtySubmit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleQtySubmit(); }}
                placeholder="Qty"
                className="w-20 rounded-md border border-stone-200 px-2.5 py-1.5 text-sm text-right focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
              />
              {product.customQuantity && (
                <button onClick={handleQtyClear} className="text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-400">Min. 50 pcs</span>
          </div>
        )}
      </div>

      {/* Decoration Mode Toggle (hidden during PDF capture) */}
      {!isCapturing && (
        <div className="mx-5 mb-3 flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1.5">Show:</span>
          {DECO_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onDecorationModeChange(m.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                mode === m.value
                  ? 'bg-navy-800 text-white'
                  : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Assumptions Banner */}
      <div className="mx-5 mb-4 flex items-start gap-2.5 rounded-lg bg-stone-50 px-4 py-3">
        <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-600">Showing:</span>{' '}
          {assumptionsLabel}
        </p>
      </div>

      {/* Pricing Tier Table */}
      <div className="px-5 pb-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="pb-3 pr-4 text-left font-semibold text-navy-800">Quantity</th>
                <th className="pb-3 px-3 text-right font-semibold text-navy-800">Garment</th>
                {showScreen && (
                  <th className="pb-3 px-3 text-right font-semibold text-navy-800">Screen Print</th>
                )}
                {showEmb && (
                  <th className="pb-3 px-3 text-right font-semibold text-navy-800">Embroidery</th>
                )}
                {mode === 'both' ? (
                  <>
                    <th className="pb-3 px-3 text-right font-semibold text-brand-700 bg-brand-50/50 rounded-t-lg">
                      All-In (Screen)
                    </th>
                    <th className="pb-3 px-3 text-right font-semibold text-brand-700 bg-brand-50/50 rounded-t-lg">
                      All-In (Emb.)
                    </th>
                  </>
                ) : (
                  <th className="pb-3 px-3 text-right font-semibold text-brand-700 bg-brand-50/50 rounded-t-lg">
                    All-In Price
                  </th>
                )}
                <th className="pb-3 pl-3 text-right font-semibold text-emerald-700">You Save</th>
              </tr>
            </thead>
            <tbody>
              {pricing.rows.map((row) => (
                <PricingRow
                  key={row.quantity}
                  row={row}
                  customerSuppliesBlanks={customerSuppliesBlanks}
                  decorationMode={mode}
                  markupPerPiece={markupPerPiece}
                  beautifyPrices={beautifyPrices}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Setup Fees */}
      <div className="mx-5 mt-2 mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500">
        {showScreen && (
          <span>
            <span className="font-medium text-slate-600">Screen print setup:</span>{' '}
            {pricing.screenPrintSetupBreakdown}
          </span>
        )}
        {showEmb && (
          <span>
            <span className="font-medium text-slate-600">Embroidery setup:</span> Included
          </span>
        )}
      </div>

      {/* Total Estimate (when custom qty is set) */}
      {customRow && product.customQuantity && (() => {
        const m = markupPerPiece;
        const b = beautifyPrices;
        const spPerPc = applyMarkupAndRound(
          customerSuppliesBlanks ? customRow.screenPrintPerPiece : customRow.allInScreen, m, b
        );
        const embPerPc = applyMarkupAndRound(
          customerSuppliesBlanks ? customRow.embroideryPerPiece : customRow.allInEmbroidery, m, b
        );
        const spTotal = spPerPc * product.customQuantity + pricing.screenPrintSetupFee;
        const embTotal = embPerPc * product.customQuantity;

        const baselineSpPerPc = applyMarkupAndRound(
          customerSuppliesBlanks ? pricing.rows[0]?.screenPrintPerPiece ?? 0 : pricing.rows[0]?.allInScreen ?? 0, m, b
        );
        const baselineEmbPerPc = applyMarkupAndRound(
          customerSuppliesBlanks ? pricing.rows[0]?.embroideryPerPiece ?? 0 : pricing.rows[0]?.allInEmbroidery ?? 0, m, b
        );
        const savingsPerPcScreen = baselineSpPerPc - spPerPc;
        const savingsPerPcEmb = baselineEmbPerPc - embPerPc;
        const primarySavings = mode === 'embroidery' ? savingsPerPcEmb : savingsPerPcScreen;

        const activeAddOns = ADDON_ITEMS.filter(a => selectedAddOns.has(a.name));

        return (
          <div className="mx-5 mb-5 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50/80 via-white to-brand-50/40 px-6 py-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-500 to-brand-400 rounded-l-xl" />

            <div className="flex items-start justify-between gap-6">
              {/* Left: Totals */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-semibold text-navy-800 uppercase tracking-wider">
                    Estimate for {product.customQuantity.toLocaleString()} pieces
                  </p>
                  {primarySavings > 0.005 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <TrendingDown className="h-3.5 w-3.5" />
                      Saving ${primarySavings.toFixed(2)}/pc
                    </span>
                  )}
                  {customRow.isBestValue && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      <Award className="h-3 w-3" />
                      Best Price Tier
                    </span>
                  )}
                </div>

                <div className="flex items-end gap-6">
                  {showScreen && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Screen Print</p>
                      <p className="text-2xl font-bold text-navy-800">
                        ${spTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">${spPerPc.toFixed(2)}/pc + ${pricing.screenPrintSetupFee} setup</p>
                    </div>
                  )}
                  {showScreen && showEmb && <div className="h-10 w-px bg-stone-200" />}
                  {showEmb && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Embroidery</p>
                      <p className="text-2xl font-bold text-navy-800">
                        ${embTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">${embPerPc.toFixed(2)}/pc &middot; no setup fee</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Selected Add-Ons */}
              {activeAddOns.length > 0 && (
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Optional Upgrades</p>
                  <div className="flex flex-col gap-1.5 items-end">
                    {activeAddOns.map(addon => (
                      <span
                        key={addon.name}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white border border-brand-200 px-2.5 py-1 text-xs font-medium text-navy-800 shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />
                        {addon.name}
                        <span className="text-brand-600 font-semibold">{addon.price}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ============ Pricing Table Row ============

function PricingRow({
  row,
  customerSuppliesBlanks,
  decorationMode,
  markupPerPiece = 0,
  beautifyPrices = false,
}: {
  row: TierRow;
  customerSuppliesBlanks: boolean;
  decorationMode: DecorationMode;
  markupPerPiece?: number;
  beautifyPrices?: boolean;
}) {
  const showScreen = decorationMode !== 'embroidery';
  const showEmb = decorationMode !== 'screen';
  const isBaseline = row.quantity === 50;
  const m = markupPerPiece;
  const b = beautifyPrices;

  const spPrice = applyMarkupAndRound(row.screenPrintPerPiece, m, b);
  const embPrice = applyMarkupAndRound(row.embroideryPerPiece, m, b);
  const garmentPrice = applyMarkupAndRound(row.garmentPrice, 0, b);

  const displayAllInScreen = customerSuppliesBlanks
    ? spPrice
    : applyMarkupAndRound(row.allInScreen, m, b);
  const displayAllInEmb = customerSuppliesBlanks
    ? embPrice
    : applyMarkupAndRound(row.allInEmbroidery, m, b);

  const baselineRow50Screen = applyMarkupAndRound(
    customerSuppliesBlanks ? row.screenPrintPerPiece + row.savingsScreen : row.allInScreen + row.savingsScreen, m, b
  );
  const baselineRow50Emb = applyMarkupAndRound(
    customerSuppliesBlanks ? row.embroideryPerPiece + row.savingsEmbroidery : row.allInEmbroidery + row.savingsEmbroidery, m, b
  );
  const savingsScreen = baselineRow50Screen - displayAllInScreen;
  const savingsEmb = baselineRow50Emb - displayAllInEmb;
  const savings = decorationMode === 'embroidery' ? savingsEmb : savingsScreen;
  const hasSavings = savings > 0.005;

  return (
    <tr
      className={cn(
        'border-b border-stone-100 last:border-0 transition-colors',
        row.isCustomQuantity && 'bg-brand-50/60',
      )}
    >
      <td className={cn(
        'py-3 pr-4',
        row.isCustomQuantity && 'shadow-[inset_3px_0_0_0] shadow-brand-500 pl-3',
      )}>
        <div className="flex items-center gap-2 flex-nowrap">
          <span className="font-semibold text-navy-800 shrink-0">{row.quantity.toLocaleString()}</span>
          {row.isBestValue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
              <Award className="h-3 w-3" />
              Best Value
            </span>
          )}
          {row.isCustomQuantity && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700 uppercase tracking-wider">
              Your Qty
            </span>
          )}
        </div>
      </td>

      <td className="py-3 px-3 text-right text-slate-700">
        {customerSuppliesBlanks ? (
          <span className="text-slate-400 line-through text-xs">${garmentPrice.toFixed(2)}</span>
        ) : (
          <span>${garmentPrice.toFixed(2)}</span>
        )}
      </td>

      {showScreen && (
        <td className="py-3 px-3 text-right text-slate-700">
          ${spPrice.toFixed(2)}
        </td>
      )}

      {showEmb && (
        <td className="py-3 px-3 text-right text-slate-700">
          ${embPrice.toFixed(2)}
        </td>
      )}

      {decorationMode === 'both' ? (
        <>
          <td className="py-3 px-3 text-right font-semibold text-navy-800 bg-brand-50/30">
            ${displayAllInScreen.toFixed(2)}/pc
          </td>
          <td className="py-3 px-3 text-right font-semibold text-navy-800 bg-brand-50/30">
            ${displayAllInEmb.toFixed(2)}/pc
          </td>
        </>
      ) : (
        <td className="py-3 px-3 text-right font-semibold text-navy-800 bg-brand-50/30">
          ${(decorationMode === 'screen' ? displayAllInScreen : displayAllInEmb).toFixed(2)}/pc
        </td>
      )}

      <td className="py-3 pl-3 text-right">
        {isBaseline || !hasSavings ? (
          <span className="text-slate-300">&mdash;</span>
        ) : (
          <span className="font-semibold text-emerald-600">
            ${savings.toFixed(2)}/pc
          </span>
        )}
      </td>
    </tr>
  );
}

// ============ Presentation Header ============

function PresentationHeader() {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-white px-8 pt-8 pb-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-8 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
              Garment Decor
            </span>
          </div>
          <h2 className="text-2xl font-bold text-navy-800">Pricing Estimate</h2>
          <p className="mt-1 text-sm text-slate-500">
            Prepared for you by Garment Decor&nbsp;&bull;&nbsp;(855) 942-7636
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">{today}</p>
        </div>
      </div>
      <div className="mt-4 h-px bg-gradient-to-r from-brand-500/40 via-brand-300/20 to-transparent" />
    </div>
  );
}

// ============ Add-Ons Menu ============

function AddOnsMenu({
  selectedAddOns,
  onToggle,
  isCapturing = false,
}: {
  selectedAddOns: Set<string>;
  onToggle: (name: string) => void;
  isCapturing?: boolean;
}) {
  const selected = ADDON_ITEMS.filter(a => selectedAddOns.has(a.name));
  const available = ADDON_ITEMS.filter(a => !selectedAddOns.has(a.name));

  return (
    <div className="px-8 py-6 bg-stone-50/50">
      {/* Selected Upgrades */}
      {selected.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-semibold text-navy-800">
              Your Upgrades
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {selected.map((addon) => (
              <button
                key={addon.name}
                onClick={() => !isCapturing && onToggle(addon.name)}
                className={cn(
                  'rounded-lg border-2 border-brand-300 bg-brand-50/50 px-4 py-3 text-left transition-colors relative',
                  !isCapturing && 'hover:bg-brand-50 cursor-pointer'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0" />
                      <p className="text-sm font-medium text-navy-800">
                        {addon.name}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-6 leading-relaxed">
                      {addon.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-brand-600 whitespace-nowrap">
                    {addon.price}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Available Upgrades */}
      <div>
        <h3 className="text-sm font-semibold text-navy-800 mb-1">
          {selected.length > 0 ? 'More Upgrades Available' : 'Upgrade Your Order'}
        </h3>
        {selected.length === 0 && (
          <p className="text-xs text-slate-500 mb-4">
            Enhance your project with these popular add-ons.
          </p>
        )}
        {selected.length > 0 && (
          <p className="text-xs text-slate-500 mb-3">
            {isCapturing ? 'Ask your rep about these additional options.' : 'Click to add to your quote.'}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {available.map((addon) => (
            <button
              key={addon.name}
              onClick={() => !isCapturing && onToggle(addon.name)}
              className={cn(
                'rounded-lg border border-stone-200 bg-white px-4 py-3 text-left transition-all relative',
                !isCapturing && 'hover:border-brand-300 hover:shadow-sm cursor-pointer'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {addon.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {addon.description}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-brand-600 whitespace-nowrap">
                  {addon.price}
                </span>
              </div>
              {addon.popular && (
                <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  Most Popular
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ Presentation Footer ============

function PresentationFooter() {
  return (
    <div className="px-8 py-6 border-t border-stone-100">
      <div className="text-center">
        <p className="text-xs text-slate-500 leading-relaxed">
          This is a general estimate. Final pricing may vary based on artwork
          complexity, garment selection, and project specifications.
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-brand-600">
          <Phone className="h-3.5 w-3.5" />
          <span>Ready to move forward? Call us at (855) 942-7636</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          garmentdecor.com
        </p>
      </div>
    </div>
  );
}
