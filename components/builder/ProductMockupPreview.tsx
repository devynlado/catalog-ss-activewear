'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { 
  Package, 
  Palette, 
  MapPin, 
  DollarSign,
  Sparkles,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getScreenPrintEstimate, 
  formatPriceRange, 
  formatTotalRange,
  setupFees,
  PrintLocation,
  locationLabels
} from '@/lib/pricing-utils';

interface ProductMockupPreviewProps {
  productName: string;
  productImage?: string;
  totalPieces: number;
  colors: number;
  locations: PrintLocation[];
  className?: string;
}

export function ProductMockupPreview({
  productName,
  productImage,
  totalPieces,
  colors,
  locations,
  className,
}: ProductMockupPreviewProps) {
  // Calculate pricing estimate
  const estimate = useMemo(() => {
    if (totalPieces < 50) return null;
    return getScreenPrintEstimate(totalPieces, colors, locations.length || 1);
  }, [totalPieces, colors, locations.length]);

  const setupFee = colors * (locations.length || 1) * setupFees.screenPrint;

  return (
    <div className={cn(
      'rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm shadow-lg shadow-stone-200/50 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-stone-200/50 bg-gradient-to-r from-brand-50/50 to-white">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          Live Preview
        </h3>
      </div>

      {/* Product Image with Logo Placeholder */}
      <div className="relative aspect-square bg-stone-50 flex items-center justify-center">
        {productImage ? (
          <Image
            src={productImage}
            alt={productName}
            fill
            className="object-contain p-4"
          />
        ) : (
          <div className="w-3/4 h-3/4 bg-stone-200 rounded-lg flex items-center justify-center">
            <span className="text-stone-400 text-sm">Product Image</span>
          </div>
        )}
        
        {/* Logo Placeholder Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {locations.includes('front') && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="px-4 py-2 border-2 border-dashed border-brand-400 rounded-lg bg-brand-50/80 backdrop-blur-sm">
                <span className="text-xs font-medium text-brand-600">Your Logo Here</span>
              </div>
            </div>
          )}
          {locations.includes('back') && (
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2">
              <div className="px-3 py-1.5 border-2 border-dashed border-stone-400 rounded-lg bg-stone-50/80 backdrop-blur-sm">
                <span className="text-[10px] font-medium text-stone-500">Back Print</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="p-5 space-y-4">
        {/* Product Name */}
        <div>
          <p className="text-sm font-medium text-slate-900 truncate">{productName}</p>
          <p className="text-xs text-slate-500">Screen Print Configuration</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/50">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">Pieces</span>
            </div>
            <p className="font-semibold text-slate-900">{totalPieces.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/50">
            <div className="flex items-center gap-2 mb-1">
              <Palette className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">Colors</span>
            </div>
            <p className="font-semibold text-slate-900">{colors} color{colors !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Locations */}
        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/50">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">Print Locations</span>
          </div>
          {locations.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {locations.map((loc) => (
                <span 
                  key={loc}
                  className="px-2 py-1 rounded-md bg-brand-100 text-brand-700 text-xs font-medium"
                >
                  {locationLabels[loc]}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No locations selected</p>
          )}
        </div>

        {/* Pricing Estimate */}
        {estimate && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-brand-50 to-white border border-brand-200">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-medium text-slate-700">Estimated Pricing</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-slate-600">Per piece:</span>
                <span className="font-semibold text-slate-900">{formatPriceRange(estimate)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-slate-600">Setup fee:</span>
                <span className="font-medium text-slate-700">${setupFee}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-brand-200/50 flex justify-between items-baseline">
                <span className="text-sm font-medium text-slate-700">Est. Total:</span>
                <span className="text-lg font-bold text-brand-600">{formatTotalRange(estimate)}</span>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="mt-3 text-[10px] text-slate-500 flex items-start gap-1">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              Final pricing confirmed after artwork review
            </p>
          </div>
        )}

        {/* Under minimum notice */}
        {totalPieces < 50 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> Minimum order is 50 pieces for decoration services.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
