'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Check, Search, X } from 'lucide-react';
import { ProductColor } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ColorSwatchesProps {
  colors: ProductColor[];
  selectedColor?: ProductColor | null;
  selectedColors?: ProductColor[]; // For multi-select mode
  onColorSelect?: (color: ProductColor) => void;
  swatchSize?: 'sm' | 'md' | 'lg';
  maxVisible?: number;
  showColorName?: boolean;
  multiSelect?: boolean; // Enable multi-select mode
  showSearch?: boolean; // Show color search input
  productId?: string; // For Builder.io standalone usage
}

export function ColorSwatches({
  colors,
  selectedColor,
  selectedColors = [],
  onColorSelect,
  swatchSize = 'md',
  maxVisible = 8,
  showColorName = true,
  multiSelect = false,
  showSearch = false,
}: ColorSwatchesProps) {
  const [internalSelected, setInternalSelected] = useState<ProductColor | null>(
    selectedColor || colors[0] || null
  );
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredColor, setHoveredColor] = useState<ProductColor | null>(null);

  const currentSelected = selectedColor ?? internalSelected;
  
  // Filter colors by search query
  const filteredColors = useMemo(() => {
    if (!searchQuery.trim()) return colors;
    const query = searchQuery.toLowerCase();
    return colors.filter(color => 
      color.colorName.toLowerCase().includes(query)
    );
  }, [colors, searchQuery]);
  
  // Show all when searching, otherwise respect maxVisible
  const displayedColors = searchQuery 
    ? filteredColors 
    : (showAll ? filteredColors : filteredColors.slice(0, maxVisible));
  const hasMore = !searchQuery && filteredColors.length > maxVisible;

  // Auto-show search for large color palettes
  const shouldShowSearch = showSearch || colors.length > 20;

  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-10 w-10',
  };

  const handleSelect = (color: ProductColor) => {
    if (!multiSelect) {
      setInternalSelected(color);
    }
    onColorSelect?.(color);
  };

  // Check if a color is selected (for multi-select mode)
  const isColorSelected = (color: ProductColor) => {
    if (multiSelect) {
      return selectedColors.some((c) => c.colorCode === color.colorCode);
    }
    return currentSelected?.colorCode === color.colorCode;
  };

  if (colors.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Color Search */}
      {shouldShowSearch && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search colors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-stone-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      
      {/* Search Results Info */}
      {searchQuery && (
        <p className="text-xs text-slate-500 mb-2">
          {filteredColors.length === 0 
            ? 'No colors found' 
            : `${filteredColors.length} color${filteredColors.length !== 1 ? 's' : ''} found`}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {displayedColors.map((color) => {
          const isSelected = isColorSelected(color);
          const isHovered = hoveredColor?.colorCode === color.colorCode;
          
          return (
            <div key={color.colorCode} className="relative">
              <button
                onClick={() => handleSelect(color)}
                onMouseEnter={() => setHoveredColor(color)}
                onMouseLeave={() => setHoveredColor(null)}
                className={cn(
                  'relative rounded-full border-2 transition-all',
                  sizes[swatchSize],
                  isSelected
                    ? 'border-brand-500 ring-2 ring-brand-200'
                    : 'border-stone-200 hover:border-stone-400 hover:scale-110'
                )}
                aria-label={multiSelect ? `Toggle ${color.colorName}` : `Select ${color.colorName}`}
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
                
                {/* Checkmark overlay for selected colors in multi-select mode */}
                {multiSelect && isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-brand-500/70">
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  </span>
                )}
              </button>
              
              {/* Enhanced Hover Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap z-50 shadow-lg pointer-events-none">
                  {color.colorName}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
              )}
            </div>
          );
        })}

        {/* Show More / Show Less */}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex h-10 items-center rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600 hover:bg-slate-200"
          >
            {showAll ? 'Show less' : `+${filteredColors.length - maxVisible} more`}
          </button>
        )}
      </div>

      {/* Selected Color Name (only in single-select mode) */}
      {showColorName && !multiSelect && currentSelected && (
        <p className="mt-2 text-sm text-slate-600">
          Color: <span className="font-medium">{currentSelected.colorName}</span>
        </p>
      )}
      
      {/* Selected colors count (in multi-select mode) */}
      {multiSelect && selectedColors.length > 0 && (
        <p className="mt-2 text-sm text-slate-600">
          {selectedColors.length} {selectedColors.length === 1 ? 'color' : 'colors'} selected
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
