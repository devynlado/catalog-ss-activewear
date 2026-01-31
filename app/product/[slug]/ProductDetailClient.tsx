'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ShoppingCart, Check, Info, Truck, Package, Palette, ArrowRight } from 'lucide-react';
import { Product, ProductColor, Category } from '@/lib/types';
import { formatPrice, cn, formatNumber } from '@/lib/utils';
import { useQuoteStore } from '@/lib/quote-store';
import { useCartStore } from '@/lib/cart-store';
import { useDiscountStore } from '@/lib/discount-store';
import { GoogleDiscount } from '@/lib/google-discount';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ColorSwatches } from '@/components/builder/ColorSwatches';
import { SizeDistributionRow } from '@/components/builder/SizeDistributionRow';
import { SpecsContent } from '@/components/builder/SpecsAccordion';
import { DecorationMethodModal } from '@/components/builder/DecorationMethodModal';
import { trackViewItem, trackAddToCart, CartItem as GA4CartItem } from '@/lib/analytics';

interface ProductDetailClientProps {
  product: Product;
  googleDiscount?: GoogleDiscount | null;
}

// Type for tracking quantities per color per size
type ColorQuantities = Record<string, Record<string, number>>;

// Helper to get "Popular for" tags based on product categories
function getPopularForTags(categories: Category[]): string[] {
  const categoryNames = categories.map(c => c.name.toLowerCase());
  
  if (categoryNames.some(n => n.includes('polo'))) 
    return ['Corporate', 'Uniforms', 'Golf Events'];
  if (categoryNames.some(n => n.includes('cap') || n.includes('hat') || n.includes('headwear'))) 
    return ['Promo', 'Teams', 'Retail', 'Events'];
  if (categoryNames.some(n => n.includes('hoodie') || n.includes('sweat') || n.includes('fleece'))) 
    return ['Streetwear', 'Merch', 'Teams', 'Events'];
  if (categoryNames.some(n => n.includes('jacket') || n.includes('outerwear'))) 
    return ['Corporate', 'Teams', 'Uniforms'];
  if (categoryNames.some(n => n.includes('tank'))) 
    return ['Events', 'Fitness', 'Promo'];
  if (categoryNames.some(n => n.includes('t-shirt') || n.includes('tee'))) 
    return ['Merch Drops', 'Events', 'Promo', 'Uniforms'];
  
  return ['Custom Apparel', 'Bulk Orders', 'Events'];
}

export function ProductDetailClient({ product, googleDiscount: initialDiscount }: ProductDetailClientProps) {
  // Track selected colors (array for multi-color support)
  const [selectedColors, setSelectedColors] = useState<ProductColor[]>([]);
  
  // Track quantities per color: { colorCode: { sizeName: quantity } }
  const [colorQuantities, setColorQuantities] = useState<ColorQuantities>({});
  
  const [addedToQuote, setAddedToQuote] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  
  // Track which image view is active (flat and model views)
  const [activeView, setActiveView] = useState<'front' | 'back' | 'side' | 'modelFront' | 'modelBack' | 'modelSide'>('front');
  
  // Track if main image failed to load
  const [imageError, setImageError] = useState(false);
  
  // Track if specs section has been opened (for lazy loading)
  const [specsOpened, setSpecsOpened] = useState(false);

  const { addItem } = useQuoteStore();
  const { addItem: addToCart } = useCartStore();
  
  // Google automated discounts
  const { addDiscount, getDiscountByStyleId } = useDiscountStore();
  
  // Store the discount from URL param in the store for persistence
  useEffect(() => {
    if (initialDiscount) {
      addDiscount(initialDiscount);
    }
  }, [initialDiscount, addDiscount]);
  
  // Get active discount (from store, which persists across navigation)
  const activeDiscount = getDiscountByStyleId(product.styleId) || initialDiscount;
  
  // Track view_item event on page load
  useEffect(() => {
    trackViewItem({
      itemId: product.styleId.toString(),
      itemName: product.title,
      itemBrand: product.brandName,
      itemCategory: product.categories?.[0]?.name,
      price: product.salePrice || product.price,
    });
  }, [product.styleId, product.title, product.brandName, product.categories, product.salePrice, product.price]);

  // Get the currently displayed color (for order summary purposes)
  const displayColor = selectedColors[0] || null;
  
  // For image display and thumbnails, use first selected color OR first available color
  // This allows users to interact with thumbnails before explicitly selecting a color
  const activeColor = selectedColors[0] || product.colors?.[0] || null;
  
  // Get the image URL based on active view
  // Uses activeColor so thumbnails work immediately on page load
  const getActiveImageUrl = () => {
    if (!activeColor) return product.imageUrl;
    
    switch (activeView) {
      case 'back':
        return activeColor.backImage || product.imageUrl;
      case 'side':
        return activeColor.sideImage || product.imageUrl;
      case 'modelFront':
        return activeColor.onModelFrontImage || activeColor.frontImage || product.imageUrl;
      case 'modelBack':
        return activeColor.onModelBackImage || activeColor.backImage || product.imageUrl;
      case 'modelSide':
        return activeColor.onModelSideImage || activeColor.sideImage || product.imageUrl;
      default:
        // Front view: try colorFrontImage, then model, then styleImage
        return activeColor.frontImage || activeColor.onModelFrontImage || product.imageUrl;
    }
  };
  const imageUrl = getActiveImageUrl();
  
  // Price logic: Google discount > sale price > regular price
  const basePrice = product.salePrice || product.price;
  const displayPrice = activeDiscount?.price ?? basePrice;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const hasGoogleDiscount = activeDiscount && activeDiscount.price < basePrice;
  const originalPrice = hasGoogleDiscount ? basePrice : (hasDiscount ? product.price : null);

  // Calculate base price (lowest S-XL price, excluding plus size upcharges)
  const basePriceDisplay = useMemo(() => {
    // Get the minimum base price across all colors (this is typically the S-XL price)
    const allBasePrices = product.colors?.flatMap(color => 
      color.sizes
        .filter(size => {
          // Filter to standard sizes only (exclude 2XL, 3XL, 4XL, 5XL which have upcharges)
          const sizeName = size.name.toUpperCase();
          return !sizeName.includes('2X') && !sizeName.includes('3X') && 
                 !sizeName.includes('4X') && !sizeName.includes('5X');
        })
        .map(size => size.salePrice || size.price)
    ) || [];
    
    // If no standard sizes found, fall back to all sizes
    const pricesToConsider = allBasePrices.length > 0 
      ? allBasePrices 
      : (product.colors?.flatMap(color => color.sizes.map(size => size.salePrice || size.price)) || []);
    
    if (pricesToConsider.length === 0) {
      return { hasPrice: false, price: 0 };
    }

    const minPrice = Math.min(...pricesToConsider);
    return { 
      hasPrice: true, 
      price: activeDiscount?.price ?? minPrice 
    };
  }, [product.colors, activeDiscount]);
  
  // Helper to validate image URLs (must be http/https)
  const isValidImageUrl = (url: string | undefined | null): url is string => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };
  
  // Reset image error state when URL changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  // Calculate total pieces across all colors and sizes
  const totalPieces = useMemo(() => {
    let total = 0;
    Object.values(colorQuantities).forEach((sizeQtys) => {
      Object.values(sizeQtys).forEach((qty) => {
        total += qty;
      });
    });
    return total;
  }, [colorQuantities]);

  // Calculate number of unique color/size combinations
  const totalLineItems = useMemo(() => {
    let count = 0;
    Object.values(colorQuantities).forEach((sizeQtys) => {
      count += Object.keys(sizeQtys).length;
    });
    return count;
  }, [colorQuantities]);

  // Calculate per-color subtotals and grand total
  const { colorSubtotals, grandTotal } = useMemo(() => {
    const subtotals: Array<{ colorCode: string; colorName: string; pieces: number; total: number }> = [];
    let grand = 0;

    selectedColors.forEach((color) => {
      const sizeQtys = colorQuantities[color.colorCode] || {};
      let colorPieces = 0;
      let colorTotal = 0;

      Object.entries(sizeQtys).forEach(([sizeName, qty]) => {
        if (qty > 0) {
          const size = color.sizes.find((s) => s.name === sizeName);
          const unitPrice = size?.salePrice || size?.price || 0;
          colorPieces += qty;
          colorTotal += unitPrice * qty;
        }
      });

      if (colorPieces > 0) {
        subtotals.push({
          colorCode: color.colorCode,
          colorName: color.colorName,
          pieces: colorPieces,
          total: colorTotal,
        });
        grand += colorTotal;
      }
    });

    return { colorSubtotals: subtotals, grandTotal: grand };
  }, [selectedColors, colorQuantities]);

  // Handle color swatch click - toggle selection
  const handleColorClick = (color: ProductColor | null) => {
    if (!color) return;

    const isSelected = selectedColors.some((c) => c.colorCode === color.colorCode);
    
    if (isSelected) {
      // Remove from selection
      setSelectedColors(selectedColors.filter((c) => c.colorCode !== color.colorCode));
      // Also remove quantities for this color
      const newQuantities = { ...colorQuantities };
      delete newQuantities[color.colorCode];
      setColorQuantities(newQuantities);
    } else {
      // Add to selection at the FRONT so it becomes the active preview color
      // and its size row appears at the top
      setSelectedColors([color, ...selectedColors]);
      // Reset to front view when adding a new color
      setActiveView('front');
    }
  };

  // Handle quantity changes for a specific color
  const handleQuantitiesChange = (colorCode: string, quantities: Record<string, number>) => {
    setColorQuantities({
      ...colorQuantities,
      [colorCode]: quantities,
    });
  };

  // Remove a color row
  const handleRemoveColor = (colorCode: string) => {
    setSelectedColors(selectedColors.filter((c) => c.colorCode !== colorCode));
    const newQuantities = { ...colorQuantities };
    delete newQuantities[colorCode];
    setColorQuantities(newQuantities);
  };

  // Add all items to quote
  const handleAddToQuote = () => {
    if (totalPieces === 0) return;

    // Loop through all colors and sizes with quantities
    Object.entries(colorQuantities).forEach(([colorCode, sizeQtys]) => {
      const color = selectedColors.find((c) => c.colorCode === colorCode);
      if (!color) return;

      // Build available sizes array for this color
      const availableSizes = color.sizes.map(s => ({
        name: s.name,
        code: s.code,
        price: s.price,
        inStock: s.qty > 0,
      }));

      Object.entries(sizeQtys).forEach(([sizeName, quantity]) => {
        if (quantity <= 0) return;

        const sizeInfo = color.sizes.find((s) => s.name === sizeName);

        addItem({
          productId: product.id,
          styleId: product.styleId,
          styleName: product.styleName,
          brandName: product.brandName,
          colorName: color.colorName,
          colorCode: color.colorCode,
          sizeName,
          quantity,
          unitPrice: sizeInfo?.price || displayPrice,
          imageUrl: color.frontImage || product.imageUrl,
          availableSizes,
        });
      });
    });

    setAddedToQuote(true);
    
    // Reset selections after adding
    setTimeout(() => {
      setAddedToQuote(false);
      setSelectedColors([]);
      setColorQuantities({});
    }, 2000);
  };

  // Add all items to cart (for direct checkout)
  const handleAddToCart = () => {
    if (totalPieces === 0) return;

    // Build items for GA4 tracking
    const ga4Items: GA4CartItem[] = [];

    // Loop through all colors and sizes with quantities
    Object.entries(colorQuantities).forEach(([colorCode, sizeQtys]) => {
      const color = selectedColors.find((c) => c.colorCode === colorCode);
      if (!color) return;

      // Build available sizes array for this color
      const availableSizes = color.sizes.map(s => ({
        name: s.name,
        code: s.code,
        price: s.price,
        inStock: s.qty > 0,
      }));

      Object.entries(sizeQtys).forEach(([sizeName, quantity]) => {
        if (quantity <= 0) return;

        const sizeInfo = color.sizes.find((s) => s.name === sizeName);
        const sku = sizeInfo?.sku || `${product.styleId}-${colorCode}-${sizeName}`;

        // Use discounted price if available
        const regularPrice = sizeInfo?.price || basePrice;
        const finalPrice = activeDiscount?.price ?? regularPrice;
        
        addToCart({
          sku,
          styleId: product.styleId,
          styleName: product.styleName,
          productTitle: product.title || `${product.brandName} ${product.styleName}`,
          brandName: product.brandName,
          colorName: color.colorName,
          colorCode: color.colorCode,
          sizeName,
          quantity,
          unitPrice: regularPrice,
          discountedPrice: activeDiscount ? finalPrice : undefined,
          discountSource: activeDiscount ? 'google' : undefined,
          imageUrl: color.frontImage || product.imageUrl,
          availableSizes,
        });

        // Add to GA4 items array
        ga4Items.push({
          sku,
          styleId: product.styleId,
          styleName: product.styleName,
          productTitle: product.title,
          brandName: product.brandName,
          colorName: color.colorName,
          colorCode: colorCode,
          sizeName,
          quantity,
          unitPrice: regularPrice,
          discountedPrice: activeDiscount ? finalPrice : undefined,
        });
      });
    });

    // Track add_to_cart event
    if (ga4Items.length > 0) {
      const totalValue = ga4Items.reduce((sum, item) => 
        sum + (item.discountedPrice ?? item.unitPrice) * item.quantity, 0
      );
      trackAddToCart({ items: ga4Items, value: totalValue });
    }

    setAddedToCart(true);
    
    // Reset selections after adding
    setTimeout(() => {
      setAddedToCart(false);
      setSelectedColors([]);
      setColorQuantities({});
    }, 2000);
  };

  const canAddToQuote = totalPieces > 0;
  const canAddToCart = totalPieces > 0;

  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-[40fr_60fr]">
      {/* Left: Images (45%) */}
      <div className="space-y-3 lg:space-y-4">
        {/* Main Image - constrained height on mobile to show product info above fold - Enhanced depth */}
        <div className="relative w-full overflow-hidden rounded-xl lg:rounded-2xl border border-stone-200 max-h-[50vh] lg:max-h-none flex items-center justify-center bg-white shadow-xl shadow-stone-300/40 min-h-[300px] lg:min-h-[400px]">
          {hasDiscount && (
            <Badge variant="error" className="absolute left-3 top-3 lg:left-4 lg:top-4 z-10">
              Sale
            </Badge>
          )}
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={product.title}
              width={800}
              height={800}
              className="w-full h-auto max-h-[50vh] lg:max-h-none object-contain"
              priority
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-stone-50 text-slate-300">
              <ShoppingBag className="h-24 w-24 lg:h-32 lg:w-32" />
            </div>
          )}
        </div>

        {/* Thumbnail Images - horizontal scroll on mobile, wrap on desktop */}
        {activeColor && (
          isValidImageUrl(activeColor.backImage) || 
          isValidImageUrl(activeColor.sideImage) || 
          isValidImageUrl(activeColor.onModelFrontImage) || 
          isValidImageUrl(activeColor.onModelBackImage) || 
          isValidImageUrl(activeColor.onModelSideImage)
        ) && (
          <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-2 lg:pb-0 lg:flex-wrap -mx-4 px-4 lg:mx-0 lg:px-0">
            {/* Flat product images */}
            {isValidImageUrl(activeColor.frontImage) && (
              <button 
                onClick={() => setActiveView('front')}
                className={cn(
                  "flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                  activeView === 'front' 
                    ? "border-brand-500 ring-2 ring-brand-200" 
                    : "border-stone-200 hover:border-stone-400"
                )}
                title="Front view"
              >
                <Image
                  src={activeColor.frontImage}
                  alt="Front"
                  width={80}
                  height={80}
                  className="h-14 lg:h-20 w-auto"
                />
              </button>
            )}
            {isValidImageUrl(activeColor.backImage) && (
              <button 
                onClick={() => setActiveView('back')}
                className={cn(
                  "flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                  activeView === 'back' 
                    ? "border-brand-500 ring-2 ring-brand-200" 
                    : "border-stone-200 hover:border-stone-400"
                )}
                title="Back view"
              >
                <Image
                  src={activeColor.backImage}
                  alt="Back"
                  width={80}
                  height={80}
                  className="h-14 lg:h-20 w-auto"
                />
              </button>
            )}
            {isValidImageUrl(activeColor.sideImage) && (
              <button 
                onClick={() => setActiveView('side')}
                className={cn(
                  "flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                  activeView === 'side' 
                    ? "border-brand-500 ring-2 ring-brand-200" 
                    : "border-stone-200 hover:border-stone-400"
                )}
                title="Side view"
              >
                <Image
                  src={activeColor.sideImage}
                  alt="Side"
                  width={80}
                  height={80}
                  className="h-14 lg:h-20 w-auto"
                />
              </button>
            )}
            
            {/* Model images (on-model photography) */}
            {isValidImageUrl(activeColor.onModelFrontImage) && (
              <button 
                onClick={() => setActiveView('modelFront')}
                className={cn(
                  "flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                  activeView === 'modelFront' 
                    ? "border-brand-500 ring-2 ring-brand-200" 
                    : "border-stone-200 hover:border-stone-400"
                )}
                title="Model front view"
              >
                <Image
                  src={activeColor.onModelFrontImage}
                  alt="Model Front"
                  width={80}
                  height={80}
                  className="h-14 lg:h-20 w-auto"
                />
              </button>
            )}
            {isValidImageUrl(activeColor.onModelBackImage) && (
              <button 
                onClick={() => setActiveView('modelBack')}
                className={cn(
                  "flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                  activeView === 'modelBack' 
                    ? "border-brand-500 ring-2 ring-brand-200" 
                    : "border-stone-200 hover:border-stone-400"
                )}
                title="Model back view"
              >
                <Image
                  src={activeColor.onModelBackImage}
                  alt="Model Back"
                  width={80}
                  height={80}
                  className="h-14 lg:h-20 w-auto"
                />
              </button>
            )}
            {isValidImageUrl(activeColor.onModelSideImage) && (
              <button 
                onClick={() => setActiveView('modelSide')}
                className={cn(
                  "flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                  activeView === 'modelSide' 
                    ? "border-brand-500 ring-2 ring-brand-200" 
                    : "border-stone-200 hover:border-stone-400"
                )}
                title="Model side view"
              >
                <Image
                  src={activeColor.onModelSideImage}
                  alt="Model Side"
                  width={80}
                  height={80}
                  className="h-14 lg:h-20 w-auto"
                />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Product Details */}
      <div className="space-y-4 lg:space-y-5">
        {/* Product Info Card - Enhanced depth */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 lg:p-6 shadow-xl shadow-stone-300/40">
          {/* Header */}
          <div>
            <p className="text-xs lg:text-sm font-semibold uppercase tracking-wide text-brand-600">
              {product.brandName}
            </p>
            <h1 className="mt-1 lg:mt-2 text-xl lg:text-3xl font-bold text-slate-900">
              {product.title || `${product.brandName} ${product.styleName}`}
            </h1>
            <p className="text-xs lg:text-sm text-slate-500 font-medium">
              Style #{product.styleName}
            </p>
          </div>

          {/* Price Display - Clean and minimal */}
          <div className="mt-4 lg:mt-5">
            {!basePriceDisplay.hasPrice ? (
              <span className="text-lg lg:text-xl font-semibold text-brand-600">
                Request Quote for Pricing
              </span>
            ) : (
              <div className="flex flex-wrap items-baseline gap-2">
                {/* From prefix */}
                <span className="text-base text-slate-500 font-medium">From</span>
                
                {/* Main price - bold and prominent */}
                <span className="text-3xl lg:text-4xl font-bold text-slate-900">
                  {formatPrice(basePriceDisplay.price)}
                </span>
                
                {/* Per piece label */}
                <span className="text-base text-slate-500 font-medium">per piece</span>
                
                {/* Original price if discounted */}
                {originalPrice && (
                  <span className="text-lg text-slate-400 line-through ml-1">
                    {formatPrice(originalPrice)}
                  </span>
                )}
                
                {/* Sale badge - simple */}
                {(hasDiscount || hasGoogleDiscount) && (
                  <span className="ml-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                    Sale
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Popular For Tags */}
          {product.categories && product.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Popular for:</span>
              {getPopularForTags(product.categories).map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 text-xs bg-stone-100 text-slate-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Color Selection Card - Enhanced depth */}
        {product.colors && product.colors.length > 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 lg:p-6 shadow-xl shadow-stone-300/40">
            <h3 className="text-sm lg:text-base font-bold text-slate-800">
              Select Colors <span className="font-normal text-slate-500">({product.colors.length} available)</span>
            </h3>
            <p className="mt-0.5 lg:mt-1 text-xs text-slate-500 hidden lg:block">
              Click colors to add size rows below. Click again to remove.
            </p>
            <div className="mt-3">
              <ColorSwatches
                colors={product.colors}
                selectedColor={null}
                selectedColors={selectedColors}
                onColorSelect={handleColorClick}
                swatchSize="lg"
                maxVisible={20}
                multiSelect={true}
                showSearch={true}
              />
            </div>
          </div>
        )}

        {/* Size Distribution Rows Card - Enhanced depth */}
        {selectedColors.length > 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 lg:p-6 shadow-xl shadow-stone-300/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm lg:text-base font-bold text-slate-800">
                Enter Quantities by Size
              </h3>
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-stone-100 px-2.5 py-1 rounded-full">
                <Info className="h-3.5 w-3.5" />
                <span>Stock shown below each size</span>
              </div>
            </div>

            <div className="space-y-3 lg:space-y-4">
              {selectedColors.map((color) => (
                <SizeDistributionRow
                  key={color.colorCode}
                  color={color}
                  quantities={colorQuantities[color.colorCode] || {}}
                  onQuantitiesChange={(qtys) => handleQuantitiesChange(color.colorCode, qtys)}
                  onRemove={() => handleRemoveColor(color.colorCode)}
                  showRemoveButton={selectedColors.length > 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* No colors selected prompt */}
        {selectedColors.length === 0 && product.colors && product.colors.length > 0 && (
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-gradient-to-br from-stone-50 to-stone-100/50 p-4 lg:p-8 text-center">
            <div className="mx-auto h-12 w-12 lg:h-14 lg:w-14 rounded-full bg-white shadow-sm flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 lg:h-7 lg:w-7 text-slate-400" />
            </div>
            <p className="mt-3 lg:mt-4 text-sm font-medium text-slate-700">
              Select a color above to enter quantities
            </p>
            <p className="mt-1 text-xs text-slate-500 hidden lg:block">
              You can select multiple colors for a multi-color order
            </p>
          </div>
        )}

        {/* Order Summary & Add to Quote */}
        {selectedColors.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/50 border border-brand-200/50 p-4 lg:p-5 shadow-lg shadow-brand-500/10">
            {/* Per-color breakdown - only show when 2+ colors */}
            {colorSubtotals.length > 1 && (
              <div className="space-y-2 mb-3">
                {colorSubtotals.map((item) => (
                  <div key={item.colorCode} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      {item.colorName}{' '}
                      <span className="text-slate-500">
                        ({item.pieces} {item.pieces === 1 ? 'pc' : 'pcs'})
                      </span>
                    </span>
                    <span className="font-semibold text-slate-700">
                      {formatPrice(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Divider (only when 2+ colors) and Grand Total */}
            {grandTotal > 0 && (
              <div className={colorSubtotals.length > 1 ? 'border-t border-brand-200 pt-3' : ''}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">
                    Total:{' '}
                    <span className="font-bold text-brand-700">
                      {formatNumber(totalPieces)} {totalPieces === 1 ? 'piece' : 'pieces'}
                    </span>
                  </span>
                  <span className="text-xl font-bold text-brand-700">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Primary CTA - Add to Cart */}
            <div className="mt-5 space-y-4">
              <Button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                size="lg"
                className={cn(
                  'w-full text-base font-semibold py-4 rounded-xl transition-all duration-200',
                  addedToCart 
                    ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25' 
                    : 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:scale-[1.02]'
                )}
              >
                {addedToCart ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </>
                )}
              </Button>

              {/* Trust Signals - Enhanced Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                  <Check className="h-3 w-3" />
                  In Stock
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                  <Truck className="h-3 w-3" />
                  Ships in 24hrs
                </span>
                {grandTotal >= 500 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                    <Package className="h-3 w-3" />
                    Free Shipping!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                    <Package className="h-3 w-3" />
                    Free over $500
                  </span>
                )}
              </div>

            </div>

            {!canAddToCart && (
              <p className="mt-3 text-xs text-center text-slate-500">
                Select colors and enter quantities to continue
              </p>
            )}
          </div>
        )}

        {/* Product Details - Minimal collapsible sections */}
        <div className="space-y-2">
          {/* Description - First */}
          {product.description && (
            <details className="rounded-xl border border-stone-200 bg-white overflow-hidden group">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-stone-50 transition-colors">
                <span className="font-medium text-slate-700 text-sm">Description</span>
                <svg className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 border-t border-stone-100">
                <div 
                  className="pt-3 prose prose-sm prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }} 
                />
              </div>
            </details>
          )}

          {/* Specifications - Second (lazy loads on open) */}
          <details 
            className="rounded-xl border border-stone-200 bg-white overflow-hidden group"
            onToggle={(e) => {
              if ((e.target as HTMLDetailsElement).open && !specsOpened) {
                setSpecsOpened(true);
              }
            }}
          >
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-stone-50 transition-colors">
              <span className="font-medium text-slate-700 text-sm">Specifications</span>
              <svg className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="border-t border-stone-100">
              <SpecsContent styleId={product.styleId} isActive={specsOpened} />
            </div>
          </details>

          {/* Subtle Decoration Hint */}
          <div className="mt-4 rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50 to-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                <Palette className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Need these decorated?
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Add screen printing or embroidery at checkout.
                </p>
                <Link 
                  href="/services" 
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Learn about decoration
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
