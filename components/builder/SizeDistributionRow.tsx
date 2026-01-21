'use client';

import { X } from 'lucide-react';
import { ProductColor } from '@/lib/types';
import { cn, formatNumber, formatPrice } from '@/lib/utils';
import Image from 'next/image';

interface SizeDistributionRowProps {
  color: ProductColor;
  quantities: Record<string, number>;
  onQuantitiesChange: (quantities: Record<string, number>) => void;
  onRemove: () => void;
  showRemoveButton?: boolean;
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

  // Calculate subtotal for this color
  const subtotal = Object.entries(quantities).reduce((sum, [sizeName, qty]) => {
    const size = color.sizes.find(s => s.name === sizeName);
    if (size && qty > 0) {
      const unitPrice = size.salePrice || size.price;
      return sum + (unitPrice * qty);
    }
    return sum;
  }, 0);

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
      {/* Header with color info */}
      <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {/* Color swatch */}
          {color.swatchImage ? (
            <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-slate-300">
              <Image
                src={color.swatchImage}
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
        {/* Desktop layout */}
        <div className="hidden sm:flex gap-2 overflow-x-auto pb-2">
          {color.sizes.map((size) => {
            const stock = size.qty;
            const indicator = getStockIndicator(stock);
            const isOutOfStock = stock === 0;
            const currentQty = quantities[size.name] || '';

            return (
              <div
                key={size.code}
                className={cn(
                  'flex flex-col items-center min-w-[70px] p-2 rounded-lg transition-colors',
                  isOutOfStock ? 'bg-slate-50' : indicator.bgColor
                )}
              >
                {/* Size label */}
                <span className="text-xs font-semibold text-slate-700 mb-1">
                  {size.name}
                </span>
                
                {/* Quantity input */}
                <input
                  type="number"
                  value={currentQty}
                  onChange={(e) => handleQuantityChange(size.name, e.target.value)}
                  disabled={isOutOfStock}
                  placeholder="—"
                  min="1"
                  max={stock}
                  className={cn(
                    'w-14 h-10 text-center text-sm font-semibold rounded-md border-2 transition-colors',
                    isOutOfStock
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none'
                  )}
                />
                
                {/* Price */}
                <div className="mt-1 text-xs font-semibold text-brand-600">
                  {size.salePrice ? formatPrice(size.salePrice) : formatPrice(size.price)}
                </div>
                
                {/* Stock count with indicator */}
                <div className={cn('text-[10px] font-medium', indicator.color)}>
                  {isOutOfStock ? (
                    <span>Out</span>
                  ) : (
                    <span>{formatNumber(stock)} avail</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile layout - 3 column grid */}
        <div className="sm:hidden grid grid-cols-3 gap-2">
          {color.sizes.map((size) => {
            const stock = size.qty;
            const indicator = getStockIndicator(stock);
            const isOutOfStock = stock === 0;
            const currentQty = quantities[size.name] || '';

            return (
              <div
                key={size.code}
                className={cn(
                  'flex flex-col items-center p-3 rounded-lg transition-colors',
                  isOutOfStock ? 'bg-slate-50' : indicator.bgColor
                )}
              >
                {/* Size label */}
                <span className="text-xs font-semibold text-slate-700 mb-1.5">
                  {size.name}
                </span>
                
                {/* Quantity input */}
                <input
                  type="number"
                  value={currentQty}
                  onChange={(e) => handleQuantityChange(size.name, e.target.value)}
                  disabled={isOutOfStock}
                  placeholder="—"
                  min="1"
                  max={stock}
                  className={cn(
                    'w-full h-11 text-center text-base font-semibold rounded-md border-2 transition-colors',
                    isOutOfStock
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none'
                  )}
                />
                
                {/* Price */}
                <div className="mt-1 text-xs font-semibold text-brand-600">
                  {size.salePrice ? formatPrice(size.salePrice) : formatPrice(size.price)}
                </div>
                
                {/* Stock count with indicator */}
                <div className={cn('text-[10px] font-medium', indicator.color)}>
                  {isOutOfStock ? (
                    <span>Out of stock</span>
                  ) : (
                    <span>{formatNumber(stock)} avail</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
