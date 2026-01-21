'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ProductColor } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ColorSwatchesProps {
  colors: ProductColor[];
  selectedColor?: ProductColor | null;
  onColorSelect?: (color: ProductColor) => void;
  swatchSize?: 'sm' | 'md' | 'lg';
  maxVisible?: number;
  showColorName?: boolean;
  productId?: string; // For Builder.io standalone usage
}

export function ColorSwatches({
  colors,
  selectedColor,
  onColorSelect,
  swatchSize = 'md',
  maxVisible = 8,
  showColorName = true,
}: ColorSwatchesProps) {
  const [internalSelected, setInternalSelected] = useState<ProductColor | null>(
    selectedColor || colors[0] || null
  );
  const [showAll, setShowAll] = useState(false);

  const currentSelected = selectedColor ?? internalSelected;
  const displayedColors = showAll ? colors : colors.slice(0, maxVisible);
  const hasMore = colors.length > maxVisible;

  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-10 w-10',
  };

  const handleSelect = (color: ProductColor) => {
    setInternalSelected(color);
    onColorSelect?.(color);
  };

  if (colors.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {displayedColors.map((color) => (
          <button
            key={color.colorCode}
            onClick={() => handleSelect(color)}
            className={cn(
              'relative rounded-full border-2 transition-all',
              sizes[swatchSize],
              currentSelected?.colorCode === color.colorCode
                ? 'border-brand-500 ring-2 ring-brand-200'
                : 'border-slate-200 hover:border-slate-400'
            )}
            title={color.colorName}
            aria-label={`Select ${color.colorName}`}
          >
            {color.swatchImage ? (
              <Image
                src={color.swatchImage}
                alt={color.colorName}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <span
                className="absolute inset-0.5 rounded-full"
                style={{ 
                  backgroundColor: color.colorCode.startsWith('#') 
                    ? color.colorCode 
                    : `#${color.colorCode}` 
                }}
              />
            )}
          </button>
        ))}

        {/* Show More / Show Less */}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex h-7 items-center rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600 hover:bg-slate-200"
          >
            {showAll ? 'Show less' : `+${colors.length - maxVisible} more`}
          </button>
        )}
      </div>

      {/* Selected Color Name */}
      {showColorName && currentSelected && (
        <p className="mt-2 text-sm text-slate-600">
          Color: <span className="font-medium">{currentSelected.colorName}</span>
        </p>
      )}
    </div>
  );
}

// Standalone version for Builder.io that fetches product data
interface StandaloneColorSwatchesProps {
  productId: string;
  swatchSize?: 'sm' | 'md' | 'lg';
  maxVisible?: number;
}

export function StandaloneColorSwatches({ 
  productId, 
  swatchSize = 'md', 
  maxVisible = 8 
}: StandaloneColorSwatchesProps) {
  // This would fetch product data and render swatches
  return (
    <div className="text-sm text-slate-500">
      Color swatches for product: {productId}
    </div>
  );
}

// Default export for Builder.io
export default StandaloneColorSwatches;
