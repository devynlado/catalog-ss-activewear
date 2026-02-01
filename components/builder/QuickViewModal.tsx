'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ExternalLink, Check, Info, Loader2 } from 'lucide-react';
import { Product, ProductColor } from '@/lib/types';
import { formatPrice, cn, formatNumber } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
import { trackAddToCart, CartItem as GA4CartItem } from '@/lib/analytics';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ColorSwatches } from './ColorSwatches';
import { SizeDistributionRow } from './SizeDistributionRow';

interface QuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  productId?: string; // For Builder.io standalone usage
}

// Type for tracking quantities per color per size
type ColorQuantities = Record<string, Record<string, number>>;

export function QuickViewModal({ product: initialProduct, isOpen, onClose }: QuickViewModalProps) {
  // Full product data with SKUs (fetched on modal open)
  const [product, setProduct] = useState<Product>(initialProduct);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  
  // Track selected colors (array for multi-color support)
  const [selectedColors, setSelectedColors] = useState<ProductColor[]>([]);
  
  // Track quantities per color: { colorCode: { sizeName: quantity } }
  const [colorQuantities, setColorQuantities] = useState<ColorQuantities>({});
  
  const [addedToCart, setAddedToCart] = useState(false);
  
  // Track which image view is active (flat and model views)
  const [activeView, setActiveView] = useState<'front' | 'back' | 'side' | 'modelFront' | 'modelBack' | 'modelSide'>('front');

  const { addItem } = useCartStore();
  
  // Fetch full product data with SKUs when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    // Check if we already have size data
    const hasSkuData = initialProduct.colors?.some(c => c.sizes && c.sizes.length > 0);
    if (hasSkuData) {
      setProduct(initialProduct);
      return;
    }
    
    // Fetch full product with SKU data
    const fetchFullProduct = async () => {
      setIsLoadingProduct(true);
      try {
        const response = await fetch(`/api/products/${initialProduct.styleId}`);
        if (response.ok) {
          const fullProduct = await response.json();
          setProduct(fullProduct);
        }
      } catch (error) {
        console.error('Failed to fetch full product data:', error);
      } finally {
        setIsLoadingProduct(false);
      }
    };
    
    fetchFullProduct();
  }, [isOpen, initialProduct]);

  // For image display and thumbnails, use first selected color OR first available color
  const activeColor = selectedColors[0] || product.colors?.[0] || null;
  
  // Get the image URL based on active view (same logic as ProductDetailClient)
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
        // Front view: try frontImage, then model, then styleImage
        return activeColor.frontImage || activeColor.onModelFrontImage || product.imageUrl;
    }
  };
  const imageUrl = getActiveImageUrl();
  const displayPrice = product.salePrice || product.price;

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

  // Add all items to cart
  const handleAddToCart = () => {
    if (totalPieces === 0) return;

    // Build items for GA4 tracking
    const ga4Items: GA4CartItem[] = [];

    // Loop through all colors and sizes with quantities
    Object.entries(colorQuantities).forEach(([colorCode, sizeQtys]) => {
      const color = selectedColors.find((c) => c.colorCode === colorCode);
      if (!color) return;

      Object.entries(sizeQtys).forEach(([sizeName, quantity]) => {
        if (quantity <= 0) return;

        const sizeInfo = color.sizes.find((s) => s.name === sizeName);
        const sku = `${product.styleId}-${colorCode}-${sizeName}`;
        const unitPrice = sizeInfo?.price || displayPrice;

        addItem({
          sku,
          styleId: product.styleId,
          styleName: product.styleName,
          productTitle: product.title,
          brandName: product.brandName,
          colorName: color.colorName,
          colorCode: colorCode,
          sizeName,
          quantity,
          unitPrice,
          imageUrl: color.frontImage || product.imageUrl,
        });

        // Add to GA4 items array
        ga4Items.push({
          sku,
          styleId: product.styleId,
          styleName: product.styleName,
          productTitle: product.title,
          brandName: product.brandName,
          colorName: color.colorName,
          colorCode,
          sizeName,
          quantity,
          unitPrice,
        });
      });
    });

    // Track add_to_cart event
    if (ga4Items.length > 0) {
      const totalValue = ga4Items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      trackAddToCart({ items: ga4Items, value: totalValue });
    }

    setAddedToCart(true);
    
    // Reset and close after success animation
    setTimeout(() => {
      setAddedToCart(false);
      setSelectedColors([]);
      setColorQuantities({});
      onClose();
    }, 1500);
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedColors([]);
    setColorQuantities({});
    setAddedToCart(false);
    setActiveView('front');
    setProduct(initialProduct); // Reset to initial product
    onClose();
  };

  const canAddToCart = totalPieces > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="relative flex flex-col lg:flex-row gap-5 lg:gap-8 p-5 lg:p-8">
        {/* Decorative gradient orb */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-navy-800/5 blur-3xl" />
        
        {/* Left: Image - compact with thumbnails */}
        <div className="lg:w-[38%] flex-shrink-0 relative z-10 space-y-3">
          {/* Main Image - 4:5 aspect ratio to match SS Activewear portrait images */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-stone-50 via-white to-stone-100 border border-stone-200/50 shadow-inner">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className="object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ShoppingBag className="h-12 w-12 lg:h-16 lg:w-16" />
              </div>
            )}
          </div>
          
          {/* Thumbnail Images - horizontal scroll */}
          {activeColor && (
            activeColor.frontImage || 
            activeColor.backImage || 
            activeColor.sideImage || 
            activeColor.onModelFrontImage || 
            activeColor.onModelBackImage || 
            activeColor.onModelSideImage
          ) && (
            <div className="flex gap-2 overflow-x-auto pb-1">
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
                    className="h-14 w-auto"
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
                    className="h-14 w-auto"
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
                    className="h-14 w-auto"
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
                    className="h-14 w-auto"
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
                    className="h-14 w-auto"
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
                    className="h-14 w-auto"
                  />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="lg:w-[62%] flex flex-col min-h-0 relative z-10">
          {/* Header - Fixed */}
          <div className="flex-shrink-0">
            <p className="text-xs lg:text-sm font-semibold uppercase tracking-wide text-brand-600">
              {product.brandName}
            </p>
            <h2 className="mt-1 lg:mt-1.5 text-lg lg:text-xl font-bold text-slate-900 pr-10">
              {product.title || product.styleName}
            </h2>
            <p className="mt-0.5 text-xs lg:text-sm text-slate-500">
              Style #{product.styleName}
            </p>
            <div className="mt-2 lg:mt-3 flex items-baseline gap-2">
              <span className="text-xl lg:text-2xl font-bold text-brand-600">
                {formatPrice(displayPrice)}
              </span>
              <span className="text-xs lg:text-sm text-slate-500">per piece</span>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="mt-5 lg:mt-6">
            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-xs lg:text-sm font-bold text-slate-900">
                  Select Colors ({product.colors.length} available)
                </h3>
                <p className="mt-1 text-xs text-slate-500 hidden lg:block">
                  Click colors to add size rows below. Click again to remove.
                </p>
                <div className="mt-3 lg:mt-4">
                  <ColorSwatches
                    colors={product.colors}
                    selectedColor={null}
                    selectedColors={selectedColors}
                    onColorSelect={handleColorClick}
                    swatchSize="lg"
                    maxVisible={12}
                    multiSelect={true}
                    showSearch={product.colors.length > 12}
                  />
                </div>
              </div>
            )}

            {/* Size Distribution Rows */}
            {selectedColors.length > 0 && (
              <div className="mt-5 lg:mt-6 space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs lg:text-sm font-bold text-slate-900">
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

            {/* Loading state while fetching SKU data */}
            {isLoadingProduct && (
              <div className="mt-5 lg:mt-6 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/80 p-5 lg:p-6 text-center">
                <Loader2 className="mx-auto h-7 w-7 lg:h-8 lg:w-8 text-brand-500 animate-spin" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Loading inventory data...
                </p>
              </div>
            )}

            {/* No colors selected prompt */}
            {!isLoadingProduct && selectedColors.length === 0 && product.colors && product.colors.length > 0 && (
              <div className="mt-5 lg:mt-6 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/80 p-5 lg:p-6 text-center">
                <ShoppingBag className="mx-auto h-7 w-7 lg:h-8 lg:w-8 text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Select a color above to enter quantities
                </p>
                <p className="mt-1.5 text-xs text-slate-500 hidden lg:block">
                  You can select multiple colors for a multi-color order
                </p>
              </div>
            )}
          </div>

          {/* Footer: Order Summary & Add to Cart - Fixed */}
          <div className="flex-shrink-0 mt-4 lg:mt-5 pt-4 lg:pt-5 border-t border-stone-200">
            {/* Order Summary - Glassmorphism style */}
            {selectedColors.length > 0 && grandTotal > 0 && (
              <div className="rounded-xl bg-gradient-to-br from-brand-50/80 to-brand-100/50 backdrop-blur-sm p-4 lg:p-5 mb-4 border border-brand-200/50 shadow-sm">
                {/* Per-color breakdown - only show when 2+ colors */}
                {colorSubtotals.length > 1 && (
                  <div className="space-y-1.5 mb-2 pb-2 border-b border-brand-200/70">
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

                {/* Grand Total */}
                <div className="flex items-center justify-between">
                  <span className="text-sm lg:text-base text-slate-700 font-medium">
                    Total:{' '}
                    <span className="font-bold text-brand-700">
                      {formatNumber(totalPieces)} {totalPieces === 1 ? 'pc' : 'pcs'}
                    </span>
                  </span>
                  <span className="text-lg lg:text-xl font-bold text-brand-700">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              size="lg"
              className={cn(
                'w-full',
                addedToCart && 'bg-green-600 hover:bg-green-700'
              )}
            >
              {addedToCart ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Add to Cart
                </>
              )}
            </Button>

            {!canAddToCart && selectedColors.length > 0 && (
              <p className="mt-2 text-xs text-center text-slate-500">
                Enter quantities for at least one size
              </p>
            )}

            {/* View Full Details Link */}
            <Link
              href={`/product/${product.slug}`}
              onClick={handleClose}
              className="mt-3 lg:mt-4 flex items-center justify-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 pb-1 transition-colors"
            >
              View Full Product Details
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Default export for Builder.io
export default QuickViewModal;
