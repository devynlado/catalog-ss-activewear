'use client';

import { X } from 'lucide-react';
import { ProductColor } from '@/lib/types';
import { cn, formatNumber, formatPrice } from '@/lib/utils';
import { hasTieredPricing, getTieredPrice, getBaseTierPrice, getCurrentTierSavings } from '@/lib/tiered-pricing';
import Image from 'next/image';

/**
 * Proxy Google Drive URLs through our image proxy to bypass CORS restrictions.
 * S3 and other URLs pass through unchanged.
 */
function proxyImageUrl(url: string): string {
  if (!url) return '';
  if (url.includes('drive.usercontent.google.com') || url.includes('drive.google.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

interface SizeDistributionRowProps {
  color: ProductColor;
  quantities: Record<string, number>;
  onQuantitiesChange: (quantities: Record<string, number>) => void;
  onRemove: () => void;
  showRemoveButton?: boolean;
  hideInventory?: boolean;
  discountPercent?: number;
  styleId?: number;
  totalStylePieces?: number;
}

// Stock level thresholds
const STOCK_HIGH = 50;
const STOCK_LOW = 12;

function getStockIndicator(qty: number): { color: string; bgColor: string; label: string } {
  if (qty === 0) {
    return { color: 'text-slate-400', bgColor: 'bg-slate-100', label: 'Out' };
  }
  if (qty < STOCK_LOW) {
    return { color: 'text-red-600', bgColor: 'bg-red-50', label: 'Low' };
  }
  if (qty < STOCK_HIGH) {
    return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Med' };
  }
  return { color: 'text-green-600', bgColor: 'bg-green-50', label: 'Good' };
}

export function SizeDistributionRow({
  color,
  quantities,
  onQuantitiesChange,
  onRemove,
  showRemoveButton = true,
  hideInventory = false,
  discountPercent = 0,
  styleId,
  totalStylePieces = 0,
}: SizeDistributionRowProps) {
  const handleQuantityChange = (sizeName: string, value: string) => {
    const numValue = parseInt(value, 10);
    const newQuantities = { ...quantities };
    
    if (isNaN(numValue) || numValue <= 0) {
      delete newQuantities[sizeName];
    } else {
      newQuantities[sizeName] = numValue;
    }
    
    onQuantitiesChange(newQuantities);
  };

  const totalQty = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  const isTiered = styleId != null && hasTieredPricing(styleId);
  const tierSavings = isTiered && styleId != null
    ? getCurrentTierSavings(styleId, totalStylePieces)
    : null;

  const getBasePrice = (size: { name: string; price: number; salePrice: number | null }) => {
    if (isTiered && styleId != null) {
      const qty = Math.max(totalStylePieces, 1);
      return getTieredPrice(styleId, size.name, qty, size.salePrice || size.price);
    }
    return size.salePrice || size.price;
  };

  const getEffectivePrice = (size: { name: string; price: number; salePrice: number | null }) => {
    const base = getBasePrice(size);
    if (discountPercent > 0) {
      return Math.round(base * (1 - discountPercent) * 100) / 100;
    }
    return base;
  };

  const getOriginalPrice = (size: { name: string; price: number; salePrice: number | null }) => {
    return getBasePrice(size);
  };

  const hasDiscount = discountPercent > 0;

  // Calculate subtotal for this color (uses discounted prices when active)
  const subtotal = Object.entries(quantities).reduce((sum, [sizeName, qty]) => {
    const size = color.sizes.find(s => s.name === sizeName);
    if (size && qty > 0) {
      const unitPrice = getEffectivePrice(size);
      return sum + (unitPrice * qty);
    }
    return sum;
  }, 0);

  return (
    <div className={cn(
      'rounded-xl border-2 bg-white overflow-hidden shadow-md',
      hasDiscount ? 'border-red-200' : 'border-stone-300'
    )}>
      {/* Special Offer banner - shown when Google discount is active */}
      {hasDiscount && (
        <div className="bg-gradient-to-r from-red-50 to-red-100/50 border-b border-red-200 px-4 py-1.5 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Extra {Math.round(discountPercent * 100)}% Off</span>
          <span className="text-[10px] text-red-500">
            applied to all sizes
          </span>
        </div>
      )}
      {/* Inventory Notice Banner - shown when hideInventory is true */}
      {hideInventory && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800">
          <span className="font-medium">Note:</span> Live inventory not available from this supplier. Most sizes typically in stock.
        </div>
      )}
      
      {/* Header with color info */}
      <div className="flex items-center justify-between bg-stone-100 px-4 py-3 border-b border-stone-200">
        <div className="flex items-center gap-3">
          {/* Color swatch - use front image when hideInventory (LA Apparel / Otto Cap) */}
          {hideInventory && color.frontImage ? (
            <div className="relative h-10 w-10 rounded-lg overflow-hidden border-2 border-slate-300">
              <Image
                src={proxyImageUrl(color.frontImage)}
                alt={color.colorName}
                fill
                className="object-cover"
              />
            </div>
          ) : color.swatchImage ? (
            <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-slate-300">
              <Image
                src={proxyImageUrl(color.swatchImage)}
                alt={color.colorName}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-slate-300 border-2 border-slate-400" />
          )}
          <span className="font-semibold text-slate-900">{color.colorName}</span>
          {totalQty > 0 && (
            <span className="text-sm text-slate-500">
              ({totalQty} {totalQty === 1 ? 'piece' : 'pieces'})
            </span>
          )}
          {tierSavings && (
            <span className="text-xs font-medium text-brand-600 animate-in fade-in duration-300">
              {tierSavings.tierLabel} pricing
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Subtotal */}
          {subtotal > 0 && (
            <span className="text-sm font-bold text-brand-600">
              {formatPrice(subtotal)}
            </span>
          )}
          {showRemoveButton && (
            <button
              onClick={onRemove}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              aria-label={`Remove ${color.colorName}`}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Size inputs - Desktop: horizontal row, Mobile: grid */}
      <div className="p-4">
        {/* Desktop layout - wraps to multiple rows if needed */}
        <div className="hidden sm:flex flex-wrap gap-2">
          {color.sizes.map((size) => {
            const stock = size.qty;
            const indicator = hideInventory 
              ? { color: 'text-slate-500', bgColor: 'bg-stone-50', label: '' }
              : getStockIndicator(stock);
            const isOutOfStock = hideInventory ? false : stock === 0;
            const currentQty = quantities[size.name] || '';

            const currentPrice = getBasePrice(size);
            const tier1Price = isTiered && styleId != null
              ? getBaseTierPrice(styleId, size.name)
              : null;
            const showTierStrike = tier1Price != null && currentPrice < tier1Price;

            return (
              <div
                key={size.code}
                className={cn(
                  'flex flex-col items-center min-w-[70px] p-2 rounded-lg transition-all',
                  hideInventory ? 'bg-stone-50' : (isOutOfStock ? 'bg-stone-50' : indicator.bgColor)
                )}
              >
                <span className="text-xs font-bold mb-1 text-slate-700">
                  {size.name}
                </span>
                
                <input
                  type="number"
                  value={currentQty}
                  onChange={(e) => handleQuantityChange(size.name, e.target.value)}
                  disabled={isOutOfStock}
                  placeholder="—"
                  min="1"
                  className={cn(
                    'w-14 h-10 text-center text-sm font-bold rounded-md border-2 transition-all',
                    isOutOfStock
                      ? 'bg-slate-100 border-stone-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none'
                  )}
                />
                
                {hasDiscount ? (
                  <div className="mt-1 flex flex-col items-center">
                    <span className="text-xs font-bold text-red-600 transition-all duration-300">
                      {formatPrice(getEffectivePrice(size))}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">
                      {formatPrice(getOriginalPrice(size))}
                    </span>
                  </div>
                ) : showTierStrike ? (
                  <div className="mt-1 flex flex-col items-center transition-all duration-300">
                    <span className="text-xs font-bold text-brand-600">
                      {formatPrice(currentPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">
                      {formatPrice(tier1Price)}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-xs font-bold text-brand-600 transition-all duration-300">
                    {formatPrice(currentPrice)}
                  </div>
                )}
                
                {!hideInventory && (
                  <div className={cn('text-[10px] font-medium', indicator.color)}>
                    {stock === 0 ? (
                      <span>Out</span>
                    ) : (
                      <span>{formatNumber(stock)} avail</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile layout - 3 column grid */}
        <div className="sm:hidden grid grid-cols-3 gap-2">
          {color.sizes.map((size) => {
            const stock = size.qty;
            const indicator = hideInventory 
              ? { color: 'text-slate-500', bgColor: 'bg-stone-50', label: '' }
              : getStockIndicator(stock);
            const isOutOfStock = hideInventory ? false : stock === 0;
            const currentQty = quantities[size.name] || '';

            const currentPrice = getBasePrice(size);
            const tier1Price = isTiered && styleId != null
              ? getBaseTierPrice(styleId, size.name)
              : null;
            const showTierStrike = tier1Price != null && currentPrice < tier1Price;

            return (
              <div
                key={size.code}
                className={cn(
                  'flex flex-col items-center p-3 rounded-lg transition-all',
                  hideInventory ? 'bg-stone-50' : (isOutOfStock ? 'bg-stone-50' : indicator.bgColor)
                )}
              >
                <span className="text-xs font-bold mb-1.5 text-slate-700">
                  {size.name}
                </span>
                
                <input
                  type="number"
                  value={currentQty}
                  onChange={(e) => handleQuantityChange(size.name, e.target.value)}
                  disabled={isOutOfStock}
                  placeholder="—"
                  min="1"
                  className={cn(
                    'w-full h-11 text-center text-base font-bold rounded-md border-2 transition-all',
                    isOutOfStock
                      ? 'bg-slate-100 border-stone-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none'
                  )}
                />
                
                {hasDiscount ? (
                  <div className="mt-1 flex flex-col items-center">
                    <span className="text-xs font-bold text-red-600 transition-all duration-300">
                      {formatPrice(getEffectivePrice(size))}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">
                      {formatPrice(getOriginalPrice(size))}
                    </span>
                  </div>
                ) : showTierStrike ? (
                  <div className="mt-1 flex flex-col items-center transition-all duration-300">
                    <span className="text-xs font-bold text-brand-600">
                      {formatPrice(currentPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">
                      {formatPrice(tier1Price)}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-xs font-bold text-brand-600 transition-all duration-300">
                    {formatPrice(currentPrice)}
                  </div>
                )}
                
                {!hideInventory && (
                  <div className={cn('text-[10px] font-medium', indicator.color)}>
                    {stock === 0 ? (
                      <span>Out of stock</span>
                    ) : (
                      <span>{formatNumber(stock)} avail</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
