'use client';

import { Paintbrush, Scissors, ArrowRight, Check, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
import { SCREEN_PRINT_PACKAGES, getAllInPrice } from '@/lib/decoration-pricing';

interface DecorationTeaserProps {
  totalUnits: number;
  onNavigateToCart: () => void;
}

// Get Simple Logo price for display
function getSimpleLogoPrice(quantity: number): number | null {
  const simpleLogoPackage = SCREEN_PRINT_PACKAGES.find(p => p.id === 'sp-simple-logo');
  if (!simpleLogoPackage) return null;
  
  const pricing = getAllInPrice(simpleLogoPackage, quantity);
  if (!pricing) return null;
  
  return pricing.allInPricePerPiece;
}

export function DecorationTeaser({ totalUnits, onNavigateToCart }: DecorationTeaserProps) {
  const decoration = useCartStore((s) => s.decoration);
  
  // Don't show for very small orders
  if (totalUnits < 12) return null;
  
  // If decoration is already selected, show compact summary (non-clickable, just informational)
  if (decoration) {
    return (
      <div className="w-full rounded-xl border border-green-200 bg-gradient-to-r from-green-50/80 to-emerald-50/80 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex-shrink-0 shadow-sm shadow-green-500/25">
            {decoration.type === 'screen-print' ? (
              <Paintbrush className="h-4 w-4 text-white" />
            ) : (
              <Scissors className="h-4 w-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                Decoration Added
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
              {decoration.type === 'screen-print' ? 'Screen Printing' : 'Embroidery'} - {decoration.packageName}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-sm font-bold text-green-600">{formatPrice(decoration.pricePerPiece)}/pc</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Below minimum - soft teaser
  if (totalUnits < 50) {
    return (
      <button
        onClick={onNavigateToCart}
        className="w-full rounded-xl border border-stone-200 bg-gradient-to-r from-stone-50/80 to-white p-3 text-left transition-all hover:border-brand-300 hover:shadow-md group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 group-hover:bg-brand-100 flex-shrink-0 transition-colors">
            <Paintbrush className="h-4 w-4 text-slate-500 group-hover:text-brand-600 transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700">Add custom decoration</p>
            <p className="text-xs text-slate-500 mt-0.5">Screen printing & embroidery for 50+ pcs</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
        </div>
      </button>
    );
  }
  
  // At or above minimum - show pricing teaser
  const pricePerPiece = getSimpleLogoPrice(totalUnits);
  
  return (
    <button
      onClick={onNavigateToCart}
      className="w-full rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50/80 to-white p-3 text-left transition-all hover:border-brand-300 hover:shadow-md group"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex-shrink-0 shadow-sm shadow-brand-500/25">
          <Paintbrush className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">
              Add Decoration
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            Screen printing from{' '}
            {pricePerPiece ? (
              <span className="font-bold text-brand-600">{formatPrice(pricePerPiece)}/pc</span>
            ) : (
              <span className="font-medium text-brand-600">wholesale rates</span>
            )}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-brand-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}
