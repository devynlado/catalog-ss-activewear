'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { ShoppingBag, Check, Info } from 'lucide-react';
import { Product, ProductColor } from '@/lib/types';
import { formatPrice, cn, formatNumber } from '@/lib/utils';
import { useQuoteStore } from '@/lib/quote-store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ColorSwatches } from '@/components/builder/ColorSwatches';
import { SizeDistributionRow } from '@/components/builder/SizeDistributionRow';
import { SpecsAccordion } from '@/components/builder/SpecsAccordion';
import { TruncatedDescription } from '@/components/ui/TruncatedDescription';

interface ProductDetailClientProps {
  product: Product;
}

// Type for tracking quantities per color per size
type ColorQuantities = Record<string, Record<string, number>>;

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  // Track selected colors (array for multi-color support)
  const [selectedColors, setSelectedColors] = useState<ProductColor[]>([]);
  
  // Track quantities per color: { colorCode: { sizeName: quantity } }
  const [colorQuantities, setColorQuantities] = useState<ColorQuantities>({});
  
  const [addedToQuote, setAddedToQuote] = useState(false);
  
  // Track which image view is active (flat and model views)
  const [activeView, setActiveView] = useState<'front' | 'back' | 'side' | 'modelFront' | 'modelBack' | 'modelSide'>('front');

  const { addItem } = useQuoteStore();

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
  const displayPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;

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

  const canAddToQuote = totalPieces > 0;

  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-[45fr_55fr]">
      {/* Left: Images (45%) */}
      <div className="space-y-3 lg:space-y-4">
        {/* Main Image - constrained height on mobile to show product info above fold */}
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl border border-stone-200 max-h-[50vh] lg:max-h-none flex items-center justify-center bg-white">
          {hasDiscount && (
            <Badge variant="error" className="absolute left-3 top-3 lg:left-4 lg:top-4 z-10">
              Sale
            </Badge>
          )}
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              width={800}
              height={800}
              className="w-full h-auto max-h-[50vh] lg:max-h-none object-contain"
              priority
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-stone-50 text-slate-300">
              <ShoppingBag className="h-24 w-24 lg:h-32 lg:w-32" />
            </div>
          )}
        </div>

        {/* Thumbnail Images - horizontal scroll on mobile, wrap on desktop */}
        {activeColor && (
          activeColor.backImage || 
          activeColor.sideImage || 
          activeColor.onModelFrontImage || 
          activeColor.onModelBackImage || 
          activeColor.onModelSideImage
        ) && (
          <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-2 lg:pb-0 lg:flex-wrap -mx-4 px-4 lg:mx-0 lg:px-0">
            {/* Flat product images */}
            {activeColor.frontImage && (
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
            {activeColor.backImage && (
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
            {activeColor.sideImage && (
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
            {activeColor.onModelFrontImage && (
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
            {activeColor.onModelBackImage && (
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
            {activeColor.onModelSideImage && (
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
      <div>
        {/* Header */}
        <div>
          <p className="text-xs lg:text-sm font-medium uppercase tracking-wide text-brand-600">
            {product.brandName}
          </p>
          <h1 className="mt-1 lg:mt-2 text-xl lg:text-3xl font-bold text-slate-900">
            {product.title || `${product.brandName} ${product.styleName}`}
          </h1>
          <p className="text-xs lg:text-sm text-slate-500">
            Style #{product.styleName}
          </p>
        </div>

        {/* Price */}
        <div className="mt-2 lg:mt-4 flex items-baseline gap-2 lg:gap-3">
          {displayPrice > 0 ? (
            <>
              <span className="text-2xl lg:text-3xl font-bold text-brand-600">
                {formatPrice(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="text-lg lg:text-xl text-slate-400 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
              <span className="text-xs lg:text-sm text-slate-500">per piece</span>
            </>
          ) : (
            <span className="text-lg lg:text-xl font-semibold text-brand-600">
              Request Quote for Pricing
            </span>
          )}
        </div>

        {/* Brief Description (truncated with read more) */}
        {product.description && (
          <div className="mt-4">
            <TruncatedDescription 
              html={product.description} 
              maxLines={3}
            />
          </div>
        )}

        {/* Color Selection */}
        {product.colors && product.colors.length > 0 && (
          <div className="mt-4 lg:mt-6">
            <h3 className="text-xs lg:text-sm font-semibold text-slate-900">
              Select Colors ({product.colors.length} available)
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

        {/* Size Distribution Rows */}
        {selectedColors.length > 0 && (
          <div className="mt-4 lg:mt-6 space-y-3 lg:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs lg:text-sm font-semibold text-slate-900">
                Enter Quantities by Size
              </h3>
              <div className="hidden lg:flex items-center gap-1 text-xs text-slate-500">
                <Info className="h-3.5 w-3.5" />
                <span>Stock shown below each size</span>
              </div>
            </div>

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
        )}

        {/* No colors selected prompt */}
        {selectedColors.length === 0 && product.colors && product.colors.length > 0 && (
          <div className="mt-4 lg:mt-6 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-4 lg:p-8 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 lg:h-10 lg:w-10 text-slate-400" />
            <p className="mt-2 lg:mt-3 text-sm font-medium text-slate-600">
              Select a color above to enter quantities
            </p>
            <p className="mt-1 text-xs text-slate-500 hidden lg:block">
              You can select multiple colors for a multi-color order
            </p>
          </div>
        )}

        {/* Order Summary & Add to Quote */}
        {selectedColors.length > 0 && (
          <div className="mt-4 lg:mt-6 rounded-xl bg-brand-50 p-4 lg:p-5">
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

            {/* Add to Quote Button */}
            <Button
              onClick={handleAddToQuote}
              disabled={!canAddToQuote}
              size="lg"
              className={cn(
                'w-full mt-4',
                addedToQuote && 'bg-green-600 hover:bg-green-700'
              )}
            >
              {addedToQuote ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Added to Quote!
                </>
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Add to Quote
                </>
              )}
            </Button>

            {!canAddToQuote && (
              <p className="mt-2 text-xs text-center text-slate-500">
                Enter quantities for at least one size
              </p>
            )}
          </div>
        )}

        {/* Specifications Accordion */}
        <div className="mt-4 lg:mt-6">
          <SpecsAccordion styleId={product.styleId} />
        </div>
      </div>
    </div>
  );
}
