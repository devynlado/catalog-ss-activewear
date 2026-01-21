'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, ShoppingBag } from 'lucide-react';
import { Product, ProductColor } from '@/lib/types';
import { formatPrice, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface ProductCardProps {
  product: Product;
  showSwatches?: boolean;
  showPricing?: boolean;
  maxSwatches?: number;
  preferredColorFamily?: string; // Comma-separated color families to prefer
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ 
  product, 
  showSwatches = true, 
  showPricing = true,
  maxSwatches = 5,
  preferredColorFamily,
  onQuickView 
}: ProductCardProps) {
  // Find a color matching the preferred color family filter, or default to first
  const getInitialColor = (): ProductColor | null => {
    if (!product.colors || product.colors.length === 0) return null;
    
    if (preferredColorFamily) {
      const preferredFamilies = preferredColorFamily.split(',').map(f => f.trim().toLowerCase());
      const matchingColor = product.colors.find(color => {
        const colorFamily = (color.colorFamily || '').toLowerCase();
        return preferredFamilies.some(pf => 
          colorFamily.includes(pf) || pf.includes(colorFamily)
        );
      });
      if (matchingColor) return matchingColor;
    }
    
    return product.colors[0];
  };

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(getInitialColor);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);

  const imageUrl = selectedColor?.frontImage || product.imageUrl;
  
  // Reset image error state when image URL changes
  const handleColorChange = (color: ProductColor) => {
    setSelectedColor(color);
    setImageError(false);
  };
  const displayPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const hasPrice = displayPrice > 0;
  
  // Use title if available, otherwise fall back to styleName
  const productName = product.title && product.title !== product.styleName 
    ? product.title 
    : `${product.brandName} ${product.styleName}`;

  return (
    <Link 
      href={`/catalog/${product.id}`}
      className="group relative block overflow-hidden rounded-xl bg-white shadow-card transition-all hover:shadow-card-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container - 4:5 aspect ratio, white background to blend with product images */}
      <div className="relative aspect-[4/5] overflow-hidden bg-white">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={productName}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
            <ShoppingBag className="h-16 w-16" />
          </div>
        )}

        {/* Sale Badge */}
        {hasDiscount && (
          <Badge variant="error" className="absolute left-3 top-3">
            Sale
          </Badge>
        )}

        {/* Quick View Button */}
        {onQuickView && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className={cn(
              'absolute bottom-3 left-1/2 -translate-x-1/2 transform rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-slate-900 shadow-lg backdrop-blur-sm transition-all',
              isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            )}
          >
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Quick View
            </span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Color Swatches with expandable popup */}
        {showSwatches && product.colors && product.colors.length > 0 && (
          <div 
            className="relative mb-3"
            onMouseLeave={() => setShowAllColors(false)}
          >
            {/* Collapsed view - show first few swatches + count */}
            <div className="flex items-center gap-1">
              {product.colors.slice(0, maxSwatches).map((color) => (
                <button
                  key={color.colorCode}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleColorChange(color);
                  }}
                  className={cn(
                    'relative h-5 w-5 rounded-full border-2 transition-all',
                    selectedColor?.colorCode === color.colorCode
                      ? 'border-brand-500 ring-1 ring-brand-200'
                      : 'border-slate-200 hover:border-slate-400'
                  )}
                  title={color.colorName}
                >
                  {color.swatchImage ? (
                    <Image
                      src={color.swatchImage}
                      alt={color.colorName}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0.5 rounded-full bg-slate-300" />
                  )}
                </button>
              ))}
              {product.colors.length > maxSwatches && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAllColors(!showAllColors);
                  }}
                  onMouseEnter={() => setShowAllColors(true)}
                  className="text-xs text-slate-500 hover:text-brand-600 transition-colors"
                >
                  +{product.colors.length - maxSwatches}
                </button>
              )}
            </div>

            {/* Expanded popup - show all colors */}
            {showAllColors && product.colors.length > maxSwatches && (
              <div 
                className="absolute left-0 top-full z-50 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="mb-2 text-xs font-medium text-slate-500">
                  {product.colors.length} Colors Available
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {product.colors.map((color) => (
                    <button
                      key={color.colorCode}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleColorChange(color);
                        setShowAllColors(false);
                      }}
                      className={cn(
                        'relative h-6 w-6 rounded-full border-2 transition-all',
                        selectedColor?.colorCode === color.colorCode
                          ? 'border-brand-500 ring-2 ring-brand-200'
                          : 'border-slate-200 hover:border-slate-400 hover:scale-110'
                      )}
                      title={color.colorName}
                    >
                      {color.swatchImage ? (
                        <Image
                          src={color.swatchImage}
                          alt={color.colorName}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <span className="absolute inset-0.5 rounded-full bg-slate-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Brand */}
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {product.brandName}
        </p>

        {/* Product Title (main focus) */}
        <h3 className="mt-1 font-semibold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
          {productName}
        </h3>

        {/* Style Number + Selected Color (inline) */}
        <p className="mt-0.5 text-xs text-slate-400">
          Style #{product.styleName}
          {selectedColor && showSwatches && (
            <span> · {selectedColor.colorName}</span>
          )}
        </p>

        {/* Price */}
        {showPricing && (
          <div className="mt-2 flex items-center gap-2">
            {hasPrice ? (
              <>
                <span className="text-lg font-bold text-slate-900">
                  {formatPrice(displayPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-medium text-brand-600">
                Request Quote
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// Static version for Builder.io that fetches its own data
interface StaticProductCardProps {
  productId: string;
  showSwatches?: boolean;
}

export function StaticProductCard({ productId, showSwatches = true }: StaticProductCardProps) {
  // This would fetch the product data
  // For now, show a placeholder
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <p className="text-sm text-slate-500">Product ID: {productId}</p>
      <p className="text-xs text-slate-400">Configure in Builder.io</p>
    </div>
  );
}

// Default export for Builder.io registration
export default StaticProductCard;
