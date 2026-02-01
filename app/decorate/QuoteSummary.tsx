'use client';

import { useMemo } from 'react';
import { 
  Package, 
  Palette, 
  MapPin, 
  Scissors,
  Receipt,
  Info,
  Check,
  Clock,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuoteStore } from '@/lib/quote-store';
import { 
  getScreenPrintEstimate,
  getEmbroideryEstimate,
  getFinishingEstimate,
  setupFees,
  locationLabels,
  stitchCountLabels,
  PrintLocation,
  StitchCount
} from '@/lib/pricing-utils';

interface QuoteSummaryProps {
  totalPieces: number;
  garmentTotal?: number; // Total cost of garments
  productName?: string;
  className?: string;
}

export function QuoteSummary({
  totalPieces,
  garmentTotal = 0,
  productName = 'Selected Garments',
  className,
}: QuoteSummaryProps) {
  const { decorationDetails, finishingServices } = useQuoteStore();

  // Calculate decoration estimate
  const decorationEstimate = useMemo(() => {
    if (totalPieces < 50) return null;
    
    if (decorationDetails.type === 'screen') {
      return getScreenPrintEstimate(
        totalPieces, 
        decorationDetails.colors || 1, 
        decorationDetails.locations?.length || 1
      );
    }
    
    if (decorationDetails.type === 'embroidery') {
      return getEmbroideryEstimate(
        totalPieces,
        decorationDetails.stitchCount || '5k-7.5k',
        decorationDetails.locations?.length || 1
      );
    }
    
    return null;
  }, [totalPieces, decorationDetails]);

  // Calculate finishing estimate
  const finishingEstimate = useMemo(() => {
    if (totalPieces < 50 || finishingServices.length === 0) return null;
    return getFinishingEstimate(totalPieces, finishingServices);
  }, [totalPieces, finishingServices]);

  // Setup fee calculation
  const setupFee = useMemo(() => {
    if (decorationDetails.type === 'screen' || decorationDetails.type === 'jumbo') {
      const feePerColor = decorationDetails.type === 'screen' ? setupFees.screenPrint : setupFees.jumbo;
      return (decorationDetails.colors || 1) * (decorationDetails.locations?.length || 1) * feePerColor;
    }
    if (decorationDetails.type === 'digital') {
      return setupFees.digital;
    }
    return 0;
  }, [decorationDetails]);

  // Total estimates
  const totalMin = garmentTotal + (decorationEstimate?.totalMin || 0) + (finishingEstimate?.totalMin || 0);
  const totalMax = garmentTotal + (decorationEstimate?.totalMax || 0) + (finishingEstimate?.totalMax || 0);

  // Decoration type labels
  const decorationTypeLabels: Record<string, string> = {
    'screen': 'Screen Print',
    'jumbo': 'Jumbo Print',
    'embroidery': 'Embroidery',
    'digital': 'Digital Print',
    'none': 'No Decoration',
  };

  // Finishing service labels
  const finishingServiceLabels: Record<string, string> = {
    'fold-bag': 'Fold & Bag',
    'printed-tags': 'Printed Tags',
    'hang-tags': 'Hang Tags',
    'sewn-tags': 'Sewn Tags',
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Summary Card */}
      <div className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm shadow-lg shadow-stone-200/50 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/50 bg-gradient-to-r from-brand-50 to-white">
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-brand-500" />
            Your Quote Summary
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Garments Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 uppercase tracking-wide">
              <Package className="h-4 w-4" />
              Garments
            </div>
            <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-stone-50 border border-stone-200/50">
              <div>
                <p className="font-medium text-slate-900">{productName}</p>
                <p className="text-sm text-slate-500">{totalPieces.toLocaleString()} pieces</p>
              </div>
              <span className="font-semibold text-slate-900">
                {garmentTotal > 0 ? `$${garmentTotal.toLocaleString()}` : '—'}
              </span>
            </div>
          </div>

          {/* Decoration Section */}
          {decorationDetails.type !== 'none' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 uppercase tracking-wide">
                <Palette className="h-4 w-4" />
                Decoration
              </div>
              <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-200/50 space-y-3">
                {/* Type & Colors */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">{decorationTypeLabels[decorationDetails.type]}</span>
                  {(decorationDetails.type === 'screen' || decorationDetails.type === 'jumbo') && (
                    <span className="font-medium text-slate-900">
                      {decorationDetails.colors} color{(decorationDetails.colors || 1) !== 1 ? 's' : ''}
                    </span>
                  )}
                  {decorationDetails.type === 'embroidery' && decorationDetails.stitchCount && (
                    <span className="font-medium text-slate-900">
                      {stitchCountLabels[decorationDetails.stitchCount]} stitches
                    </span>
                  )}
                </div>

                {/* Locations */}
                {decorationDetails.locations && decorationDetails.locations.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-700 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      Locations
                    </span>
                    <div className="text-right">
                      {decorationDetails.locations.map((loc, idx) => (
                        <span key={loc} className="font-medium text-slate-900">
                          {locationLabels[loc as PrintLocation]}
                          {idx < decorationDetails.locations!.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Per-piece estimate */}
                {decorationEstimate && (
                  <div className="flex justify-between items-center pt-2 border-t border-brand-200/50">
                    <span className="text-sm text-slate-600">
                      Est. {decorationEstimate.perPieceMin === decorationEstimate.perPieceMax 
                        ? `$${decorationEstimate.perPieceMin.toFixed(2)}` 
                        : `$${decorationEstimate.perPieceMin.toFixed(2)} - $${decorationEstimate.perPieceMax.toFixed(2)}`
                      }/piece
                    </span>
                    <span className="font-semibold text-brand-600">
                      ${decorationEstimate.totalMin.toLocaleString()}
                      {decorationEstimate.totalMin !== decorationEstimate.totalMax && 
                        ` - $${decorationEstimate.totalMax.toLocaleString()}`
                      }
                    </span>
                  </div>
                )}

                {/* Setup Fee */}
                {setupFee > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">
                      Setup Fee ({decorationDetails.colors} color{(decorationDetails.colors || 1) !== 1 ? 's' : ''} × {decorationDetails.locations?.length || 1} location{(decorationDetails.locations?.length || 1) !== 1 ? 's' : ''})
                    </span>
                    <span className="font-medium text-slate-700">${setupFee}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Finishing Section */}
          {finishingServices.length > 0 && finishingEstimate && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 uppercase tracking-wide">
                <Scissors className="h-4 w-4" />
                Finishing Services
              </div>
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/50 space-y-2">
                {finishingServices.map((service) => (
                  <div key={service} className="flex justify-between items-center">
                    <span className="text-slate-700">{finishingServiceLabels[service] || service}</span>
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-stone-200/50">
                  <span className="text-sm text-slate-600">Finishing Total</span>
                  <span className="font-semibold text-slate-900">
                    ${finishingEstimate.totalMin.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Total Section */}
          <div className="pt-4 border-t-2 border-stone-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-slate-900">Estimated Total</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-brand-600">
                  ${totalMin.toLocaleString()}
                  {totalMin !== totalMax && (
                    <span className="text-lg"> - ${totalMax.toLocaleString()}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Per piece breakdown */}
            {totalPieces > 0 && (
              <p className="text-sm text-slate-500 text-right mt-1">
                ≈ ${((totalMin + totalMax) / 2 / totalPieces).toFixed(2)}/piece average
              </p>
            )}
          </div>

          {/* Disclaimer */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-800 flex items-start gap-2">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Estimate only.</strong> Final pricing will be confirmed after our team reviews your artwork. 
                Setup fees are included in the total above.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <Check className="h-4 w-4 text-green-500" />
          Free artwork review
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-slate-400" />
          Quote in 2 hours
        </span>
        <span className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-slate-400" />
          No payment until approval
        </span>
      </div>
    </div>
  );
}
