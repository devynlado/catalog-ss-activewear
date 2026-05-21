'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, ShoppingBag, Leaf, Sparkles, Flame, Star, TrendingUp, BadgeDollarSign } from 'lucide-react';
import { Product, ProductColor } from '@/lib/types';
import {
  isLa1801gdSamplePriceProduct,
  LA_1801GD_SAMPLE_PRICE_USD,
} from '@/lib/la-1801gd-sample-price';
import { formatPrice, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { WishlistHeartButton } from '@/components/wishlist/WishlistHeartButton';

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

  // Detect if this is an Otto Cap product (needs image proxying and different swatch style)
  const isOttoCap = product.supplier === 'otto_cap';

  // Image priority:
  // 1. Selected color's model image (if user clicked a swatch) - S&S only
  // 2. Selected color's flat image (fallback)
  // 3. Product's default styleImage (initial state)
  const getImageUrl = () => {
    // Prioritize selected color's images when available
    if (selectedColor) {
      // Otto Cap doesn't have on-model images
      if (!isOttoCap && selectedColor.onModelFrontImage) return proxyImageUrl(selectedColor.onModelFrontImage);
      if (selectedColor.frontImage) return proxyImageUrl(selectedColor.frontImage);
    }
    // Fall back to product's default image
    if (product.imageUrl) return proxyImageUrl(product.imageUrl);
    return '';
  };
  const imageUrl = getImageUrl();
  
  // Reset image error state when image URL changes
  const handleColorChange = (color: ProductColor) => {
    setSelectedColor(color);
    setImageError(false);
  };
  const useSamplePrice = isLa1801gdSamplePriceProduct(product);
  const displayPrice = useSamplePrice
    ? LA_1801GD_SAMPLE_PRICE_USD
    : product.salePrice || product.price;
  const hasDiscount =
    !useSamplePrice && product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.salePrice! / product.price) * 100) : 0;
  const hasPrice = displayPrice > 0;
  
  // Use title if available, otherwise fall back to styleName
  const productName = product.title && product.title !== product.styleName 
    ? product.title 
    : `${product.brandName} ${product.styleName}`;

  return (
    <Link 
      href={`/product/${product.slug}`}
      className="group relative block rounded-2xl bg-white/80 backdrop-blur-sm border border-stone-200 shadow-sm transition-all hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container - 4:5 aspect ratio, white background to blend with product images */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-2xl bg-white">
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
          <div className="flex h-full w-full items-center justify-center bg-stone-50 text-stone-300">
            <ShoppingBag className="h-16 w-16" />
          </div>
        )}

        {/* Hero Badge - Only ONE badge on image, priority: Sale > Best Seller > Staff Pick > Trending > New */}
        {(() => {
          // Determine the single hero badge to show (highest priority wins)
          if (hasDiscount) {
            return (
              <div className="absolute left-3 top-3">
                <Badge variant="error">Sale</Badge>
              </div>
            );
          }
          if (product.isPopular && product.popularTier === 'bestseller') {
            return (
              <div className="absolute left-3 top-3">
                <Badge variant="warning" className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  Best Seller
                </Badge>
              </div>
            );
          }
          if (product.isPopular && product.popularTier === 'staff-pick') {
            return (
              <div className="absolute left-3 top-3">
                <Badge variant="default" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Staff Pick
                </Badge>
              </div>
            );
          }
          if (product.isPopular && product.popularTier === 'streetwear') {
            return (
              <div className="absolute left-3 top-3">
                <Badge variant="info" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Trending
                </Badge>
              </div>
            );
          }
          if (product.isNew) {
            return (
              <div className="absolute left-3 top-3">
                <Badge variant="info" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  New
                </Badge>
              </div>
            );
          }
          return null;
        })()}

        {/* Corner actions: Quick Add (+) then Wishlist (heart), stacked
            vertically so the corner stays compact whether one or both are
            shown. */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {onQuickView && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-md backdrop-blur-sm transition-all hover:bg-brand-500 hover:text-white hover:scale-110"
              title="Quick add to quote"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
          <WishlistHeartButton styleId={product.styleId} variant="card" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {/* Color Swatches with expandable popup */}
        {showSwatches && product.colors && product.colors.length > 0 && (
          <div 
            className="relative mb-3"
            onMouseLeave={() => setShowAllColors(false)}
          >
            {/* Collapsed view - show swatches + count */}
            {/* Otto Cap: show product image thumbnails; S&S: show color swatch circles */}
            <div className={cn(
              "flex items-center gap-1.5 pr-16",
              isOttoCap && "gap-1"
            )}>
              {product.colors.slice(0, maxSwatches).map((color) => (
                <button
                  key={color.colorCode}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleColorChange(color);
                  }}
                  className={cn(
                    'relative flex-shrink-0 overflow-hidden border-2 transition-all',
                    // Otto Cap: rectangular product thumbnails
                    isOttoCap ? 'h-6 w-6 rounded-md' : 'h-5 w-5 rounded-full',
                    selectedColor?.colorCode === color.colorCode
                      ? 'border-brand-500 ring-1 ring-brand-200'
                      : 'border-stone-200 hover:border-stone-400'
                  )}
                  title={color.colorName}
                >
                  {isOttoCap ? (
                    // Otto Cap: use front product image as thumbnail
                    color.frontImage ? (
                      <Image
                        src={proxyImageUrl(color.frontImage)}
                        alt={color.colorName}
                        fill
                        className="rounded-sm object-cover object-center"
                      />
                    ) : (
                      <span className="absolute inset-0 rounded-sm bg-slate-300" />
                    )
                  ) : (
                    // S&S: use swatch image or fallback color
                    color.swatchImage ? (
                      <Image
                        src={color.swatchImage}
                        alt={color.colorName}
                        fill
                        className="rounded-full object-cover object-center"
                      />
                    ) : (
                      <span className="absolute inset-0 rounded-full bg-slate-300" />
                    )
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
            {/* Attribute badges - icon-only on mobile, full badge on desktop */}
            {(product.isSustainable || (product.isPopular && product.popularTier === 'value')) && (
              <div className="absolute right-0 top-0 flex flex-col items-end gap-1">
                {product.isPopular && product.popularTier === 'value' && (
                  <Badge variant="success" className="flex items-center gap-1 px-1.5 sm:px-2">
                    <BadgeDollarSign className="h-3 w-3" />
                    <span className="hidden sm:inline">Value</span>
                  </Badge>
                )}
                {product.isSustainable && (
                  <Badge variant="success" className="flex items-center gap-1 px-1.5 sm:px-2">
                    <Leaf className="h-3 w-3" />
                    <span className="hidden sm:inline">Eco</span>
                  </Badge>
                )}
              </div>
            )}

            {/* Expanded popup - show all colors */}
            {showAllColors && product.colors.length > maxSwatches && (
              <>
                {/* Invisible bridge to maintain hover when moving to popup */}
                <div className="absolute left-0 top-full z-40 h-3 w-48" />
                <div 
                  className={cn(
                    "absolute left-0 top-full z-50 mt-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg",
                    isOttoCap ? "w-56" : "w-48"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                <p className="mb-2 text-xs font-medium text-slate-500">
                  {product.colors.length} Colors Available
                </p>
                <div className={cn(
                  "grid gap-1.5",
                  isOttoCap ? "grid-cols-5" : "grid-cols-6"
                )}>
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
                        'relative flex-shrink-0 overflow-hidden border-2 transition-all',
                        isOttoCap ? 'h-8 w-8 rounded-md' : 'h-6 w-6 rounded-full',
                        selectedColor?.colorCode === color.colorCode
                          ? 'border-brand-500 ring-2 ring-brand-200'
                          : 'border-stone-200 hover:border-stone-400 hover:scale-110'
                      )}
                      title={color.colorName}
                    >
                      {isOttoCap ? (
                        color.frontImage ? (
                          <Image
                            src={proxyImageUrl(color.frontImage)}
                            alt={color.colorName}
                            fill
                            className="rounded-sm object-cover object-center"
                          />
                        ) : (
                          <span className="absolute inset-0 rounded-sm bg-slate-300" />
                        )
                      ) : (
                        color.swatchImage ? (
                          <Image
                            src={color.swatchImage}
                            alt={color.colorName}
                            fill
                            className="rounded-full object-cover object-center"
                          />
                        ) : (
                          <span className="absolute inset-0 rounded-full bg-slate-300" />
                        )
                      )}
                    </button>
                  ))}
                </div>
              </div>
              </>
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

        {/* Price - stacked on mobile when discounted */}
        {showPricing && (
          <div className="mt-2">
            {hasPrice ? (
              hasDiscount ? (
                <>
                  {/* Mobile: stacked layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span className="text-lg font-bold text-slate-900">
                      {formatPrice(displayPrice)}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                      <span className="text-slate-400 line-through">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-green-600 font-medium sm:text-slate-500 sm:font-normal">
                        · Save {discountPercent}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-lg font-bold text-slate-900">
                  {formatPrice(displayPrice)}
                </span>
              )
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
