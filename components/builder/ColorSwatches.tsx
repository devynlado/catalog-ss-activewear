'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Check, Search, X } from 'lucide-react';
import { ProductColor } from '@/lib/types';
import { cn } from '@/lib/utils';

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

// Map color names to hex values for fallback swatch display
const COLOR_NAME_TO_HEX: Record<string, string> = {
  // Basics
  black: '#1a1a1a', blk: '#1a1a1a',
  white: '#ffffff', wht: '#ffffff',
  grey: '#808080', gray: '#808080', gry: '#808080',
  navy: '#1e3a5f', nvy: '#1e3a5f',
  
  // Blues
  blue: '#3b82f6', blu: '#3b82f6',
  'royal blue': '#4169e1', royal: '#4169e1', ryl: '#4169e1',
  'cobalt blue': '#0047ab', cobalt: '#0047ab', cblu: '#0047ab',
  'dolphin blue': '#5b92a8', dolphin: '#5b92a8', dlb: '#5b92a8',
  'neon blue': '#1e90ff', nhblu: '#1e90ff',
  'blue moon': '#6b8ba4', blmn: '#6b8ba4',
  
  // Greens
  green: '#22c55e', grn: '#22c55e',
  army: '#4b5320', arm: '#4b5320',
  olive: '#808000', olv: '#808000',
  sage: '#9dc183', sge: '#9dc183',
  ivy: '#3b5323', igy: '#3b5323',
  matcha: '#9ab973', mtc: '#9ab973',
  'atlantic green': '#006d5b', atlg: '#006d5b',
  
  // Reds/Pinks
  red: '#ef4444', 
  burgundy: '#800020', brg: '#800020',
  coral: '#ff7f50', corl: '#ff7f50',
  ruby: '#e0115f', rub: '#e0115f',
  tomato: '#ff6347', tom: '#ff6347',
  
  // Yellows/Oranges
  yellow: '#eab308', ylw: '#eab308',
  gold: '#d4af37', gld: '#d4af37',
  brass: '#b5a642', bra: '#b5a642',
  orange: '#f97316', org: '#f97316', 'bright orange': '#ff5722',
  
  // Purples
  purple: '#9333ea', pur: '#9333ea',
  'vintage black': '#2d2d2d', vblk: '#2d2d2d',
  
  // Browns/Neutrals
  brown: '#8b4513', brn: '#8b4513',
  tan: '#d2b48c',
  beige: '#f5f5dc', bge: '#f5f5dc',
  khaki: '#c3b091', kha: '#c3b091',
  mushroom: '#b39b84', msh: '#b39b84',
  cocoa: '#4a3728', cco: '#4a3728',
  clove: '#6b4423', clve: '#6b4423',
  
  // Others
  arctic: '#d4e5ed', arct: '#d4e5ed',
  ash: '#b2beb5', ashe: '#b2beb5',
  'carbon black': '#333333', carbk: '#333333',
  'black edge': '#1f1f1f', bkedg: '#1f1f1f',
};

/**
 * Get a hex color from colorName or colorCode
 * Falls back to a neutral color if no match found
 */
function getSwatchColor(colorName: string, colorCode: string): string {
  const nameLower = colorName.toLowerCase();
  const codeLower = colorCode.toLowerCase();
  
  // Try exact color name match
  if (COLOR_NAME_TO_HEX[nameLower]) {
    return COLOR_NAME_TO_HEX[nameLower];
  }
  
  // Try color code match
  if (COLOR_NAME_TO_HEX[codeLower]) {
    return COLOR_NAME_TO_HEX[codeLower];
  }
  
  // Try partial name match (first word)
  const firstWord = nameLower.split(' ')[0];
  if (COLOR_NAME_TO_HEX[firstWord]) {
    return COLOR_NAME_TO_HEX[firstWord];
  }
  
  // If colorCode looks like a hex value (6 chars, all hex digits), use it
  if (/^[0-9a-f]{6}$/i.test(colorCode)) {
    return `#${colorCode}`;
  }
  
  // Default to a neutral gray
  return '#a0a0a0';
}

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
  useProductImages?: boolean; // Show product frontImage instead of swatch (for LA Apparel)
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
  useProductImages = false,
}: ColorSwatchesProps) {
  const [internalSelected, setInternalSelected] = useState<ProductColor | null>(
    selectedColor || colors[0] || null
  );
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredColor, setHoveredColor] = useState<ProductColor | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  // Track images that fail to load
  const handleImageError = (colorCode: string) => {
    setFailedImages(prev => new Set(prev).add(colorCode));
  };

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

  // When using product images, make swatches larger for better visibility
  const sizes = useProductImages ? {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-14 w-14',
  } : {
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
                  'relative border-2 transition-all overflow-hidden',
                  useProductImages ? 'rounded-lg' : 'rounded-full',
                  sizes[swatchSize],
                  isSelected
                    ? 'border-brand-500 ring-2 ring-brand-200'
                    : 'border-stone-200 hover:border-stone-400 hover:scale-105'
                )}
                aria-label={multiSelect ? `Toggle ${color.colorName}` : `Select ${color.colorName}`}
              >
                {/* Use product image when useProductImages is true */}
                {useProductImages && color.frontImage ? (
                  <Image
                    src={proxyImageUrl(color.frontImage)}
                    alt={color.colorName}
                    fill
                    className="object-cover"
                    onError={() => handleImageError(color.colorCode)}
                  />
                ) : color.swatchImage && !failedImages.has(color.colorCode) ? (
                  <Image
                    src={proxyImageUrl(color.swatchImage)}
                    alt={color.colorName}
                    fill
                    className="rounded-full object-cover"
                    onError={() => handleImageError(color.colorCode)}
                  />
                ) : (
                  <span
                    className={cn(
                      "absolute inset-0.5",
                      useProductImages ? "rounded-md" : "rounded-full"
                    )}
                    style={{ 
                      backgroundColor: getSwatchColor(color.colorName, color.colorCode)
                    }}
                  />
                )}
                
                {/* Checkmark overlay for selected colors in multi-select mode */}
                {multiSelect && isSelected && (
                  <span className={cn(
                    "absolute inset-0 flex items-center justify-center bg-brand-500/70",
                    useProductImages ? "rounded-md" : "rounded-full"
                  )}>
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
