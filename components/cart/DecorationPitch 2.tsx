'use client';

import Link from 'next/link';
import { Paintbrush, Scissors, ArrowRight, Sparkles, Info, Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/lib/cart-store';
import { SCREEN_PRINT_PACKAGES, getAllInPrice } from '@/lib/decoration-pricing';
import { getDecoratedDeliveryEstimate, formatDateRange } from '@/app/checkout/ShippingOptions';

interface DecorationPitchProps {
  totalUnits: number;
  className?: string;
  onOpenModal?: () => void;
}

// Price breaks for "almost there" nudges
const PRICE_BREAKS = [
  { threshold: 50, label: 'unlock decoration services', savingsPerPiece: null },
  { threshold: 75, label: 'save on screen printing', savingsPerPiece: 1.00 },
  { threshold: 100, label: 'save on screen printing', savingsPerPiece: 0.50 },
  { threshold: 250, label: 'unlock volume pricing', savingsPerPiece: 0.80 },
  { threshold: 500, label: 'unlock wholesale rates', savingsPerPiece: 0.45 },
  { threshold: 1000, label: 'unlock best rates', savingsPerPiece: 0.30 },
];

// Get the Simple Logo package price (lowest package) to display in banners
function getSimpleLogoPrice(quantity: number): { pricePerPiece: number; totalPrice: number } | null {
  const simpleLogoPackage = SCREEN_PRINT_PACKAGES.find(p => p.id === 'sp-simple-logo');
  if (!simpleLogoPackage) return null;
  
  const pricing = getAllInPrice(simpleLogoPackage, quantity);
  if (!pricing) return null;
  
  return {
    pricePerPiece: pricing.allInPricePerPiece,
    totalPrice: pricing.totalPrice,
  };
}

function getNextPriceBreak(quantity: number): { threshold: number; unitsNeeded: number; label: string } | null {
  for (const breakPoint of PRICE_BREAKS) {
    if (quantity < breakPoint.threshold) {
      return {
        threshold: breakPoint.threshold,
        unitsNeeded: breakPoint.threshold - quantity,
        label: breakPoint.label,
      };
    }
  }
  return null;
}

function getTier(quantity: number): 'below-min' | 'entry' | 'mid' | 'volume' {
  if (quantity < 50) return 'below-min';
  if (quantity < 100) return 'entry';
  if (quantity < 250) return 'mid';
  return 'volume';
}

// Card styling consistent with cart page
const glassCard = "bg-white border border-stone-200 rounded-2xl shadow-xl shadow-stone-300/40";

export function DecorationPitch({ totalUnits, className, onOpenModal }: DecorationPitchProps) {
  const tier = getTier(totalUnits);
  const simpleLogoPricing = getSimpleLogoPrice(totalUnits);
  const nextBreak = getNextPriceBreak(totalUnits);
  
  // Check if decoration is already selected
  const decoration = useCartStore((s) => s.decoration);
  const clearDecoration = useCartStore((s) => s.clearDecoration);

  // Don't show anything for very small orders (samples)
  if (totalUnits < 12) return null;

  // If decoration is already selected, show summary instead
  if (decoration) {
    return (
      <div className={className}>
        <div className={`${glassCard} overflow-hidden`}>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2">
            <p className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <Check className="h-4 w-4" />
              Decoration Added
            </p>
          </div>
          <div className="p-5 bg-gradient-to-r from-green-50/50 to-white">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex-shrink-0 shadow-lg shadow-green-500/25">
                {decoration.type === 'screen-print' ? (
                  <Paintbrush className="h-6 w-6 text-white" />
                ) : (
                  <Scissors className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">
                  {decoration.type === 'screen-print' ? 'Screen Printing' : 'Embroidery'} - {decoration.packageName}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Per piece:</span>
                    <span className="ml-1.5 font-bold text-green-600">{formatPrice(decoration.pricePerPiece)}</span>
                  </div>
                  <div className="h-4 w-px bg-stone-300" />
                  <div>
                    <span className="text-slate-500">Total decoration:</span>
                    <span className="ml-1.5 font-bold text-slate-800">{formatPrice(decoration.totalPrice)}</span>
                  </div>
                  {decoration.setupFee > 0 && (
                    <>
                      <div className="h-4 w-px bg-stone-300" />
                      <div>
                        <span className="text-slate-500">Setup:</span>
                        <span className="ml-1.5 font-medium text-slate-700">{formatPrice(decoration.setupFee)}</span>
                      </div>
                    </>
                  )}
                </div>
                {(() => {
                  const decoratedDelivery = getDecoratedDeliveryEstimate('economy');
                  return (
                    <p className="mt-2 text-sm text-green-700 font-medium">
                      Proof in 1-2 days • Arrives {formatDateRange(decoratedDelivery.min, decoratedDelivery.max)}
                    </p>
                  );
                })()}
                {decoration.artworkFileName && (
                  <p className="mt-2 text-sm text-slate-600">
                    Artwork: <span className="font-medium">{decoration.artworkFileName}</span>
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={onOpenModal}>
                    Edit Decoration
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearDecoration}>
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Main decoration pitch */}
      <div className={`${glassCard} overflow-hidden`}>
        {tier === 'below-min' && (
          // Under 50 pieces - soft educational pitch
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 flex-shrink-0">
                <Paintbrush className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">Planning a bigger order?</h3>
                <p className="mt-1 text-sm text-slate-600">
                  We offer screen printing, embroidery, and finishing services for orders of 50+ pieces.
                </p>
                <Link 
                  href="/services" 
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Learn about decoration services
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {tier === 'entry' && simpleLogoPricing && (
          // 50-99 pieces - show pricing, hint at better rates
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex-shrink-0">
                <Paintbrush className="h-5 w-5 text-brand-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">Ready for custom printing?</h3>
                <p className="mt-1 text-sm text-slate-600">
                  You're ordering <span className="font-semibold text-slate-800">{totalUnits} pieces</span> — 
                  screen printing starts at <span className="font-semibold text-brand-600">{formatPrice(simpleLogoPricing.pricePerPiece)}/piece</span>.
                </p>
                {nextBreak && nextBreak.unitsNeeded <= 30 && (
                  <p className="mt-2 text-sm text-brand-600 font-medium">
                    Add {nextBreak.unitsNeeded} more pieces to {nextBreak.label}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={onOpenModal}>
                    Add Decoration
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tier === 'mid' && simpleLogoPricing && (
          // 100-249 pieces - competitive pricing, show estimate
          <div className="p-5 bg-gradient-to-r from-brand-50/50 to-white">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex-shrink-0 shadow-lg shadow-brand-500/25">
                <Paintbrush className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">Perfect quantity for screen printing</h3>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">{totalUnits} pieces</span> qualifies for our mid-volume rates.
                </p>
                
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Simple Logo:</span>
                    <span className="ml-1.5 font-bold text-brand-600">{formatPrice(simpleLogoPricing.pricePerPiece)}/piece</span>
                  </div>
                  <div className="h-4 w-px bg-stone-300" />
                  <div>
                    <span className="text-slate-500">Estimated decoration:</span>
                    <span className="ml-1.5 font-bold text-slate-800">{formatPrice(simpleLogoPricing.totalPrice)}</span>
                  </div>
                </div>

                {nextBreak && nextBreak.unitsNeeded <= 50 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-brand-600 bg-brand-50 rounded-lg px-3 py-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Add {nextBreak.unitsNeeded} more pieces to {nextBreak.label}</span>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={onOpenModal}>
                    Add Decoration
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tier === 'volume' && simpleLogoPricing && (
          // 250+ pieces - celebration, best rates
          <div className="overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2">
              <p className="text-sm font-bold text-white tracking-wide uppercase">
                Volume Pricing Unlocked
              </p>
            </div>
            <div className="p-5 bg-gradient-to-r from-green-50/50 to-white">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex-shrink-0 shadow-lg shadow-green-500/25">
                  <Paintbrush className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">
                    You're ordering {totalUnits} pieces — you qualify for wholesale decoration rates
                  </h3>
                  
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Simple Logo:</span>
                      <span className="ml-1.5 font-bold text-green-600">{formatPrice(simpleLogoPricing.pricePerPiece)}/piece</span>
                    </div>
                    <div className="h-4 w-px bg-stone-300" />
                    <div>
                      <span className="text-slate-500">Estimated decoration:</span>
                      <span className="ml-1.5 font-bold text-slate-800">{formatPrice(simpleLogoPricing.totalPrice)}</span>
                    </div>
                  </div>

                  {nextBreak && nextBreak.unitsNeeded <= 100 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Add {nextBreak.unitsNeeded} more pieces to {nextBreak.label}</span>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25" onClick={onOpenModal}>
                      Add Decoration
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>

                  <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Prices shown are for Simple Logo package. Other packages available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* "Almost there" nudge - only shown when close to a break and not already in the main card */}
      {tier === 'below-min' && nextBreak && nextBreak.unitsNeeded <= 15 && (
        <div className="mt-3 rounded-xl bg-gradient-to-r from-brand-50 to-brand-100/50 border border-brand-200 p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-brand-500 flex-shrink-0" />
            <p className="text-sm text-brand-800">
              <span className="font-semibold">You're {nextBreak.unitsNeeded} pieces away</span> from unlocking 
              decoration services. Add a few more to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
