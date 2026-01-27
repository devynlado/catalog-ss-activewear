'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ExternalLink, Check, Info } from 'lucide-react';
import { Product, ProductColor } from '@/lib/types';
import { formatPrice, cn, formatNumber } from '@/lib/utils';
import { useQuoteStore } from '@/lib/quote-store';
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

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  // Track selected colors (array for multi-color support)
  const [selectedColors, setSelectedColors] = useState<ProductColor[]>([]);
  
  // Track quantities per color: { colorCode: { sizeName: quantity } }
  const [colorQuantities, setColorQuantities] = useState<ColorQuantities>({});
  
  const [addedToQuote, setAddedToQuote] = useState(false);

  const { addItem } = useQuoteStore();

  // Get image from first selected color or product default
  const displayColor = selectedColors[0] || product.colors?.[0] || null;
  const imageUrl = displayColor?.frontImage || displayColor?.onModelFrontImage || product.imageUrl;
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
    
    // Reset and close after success animation
    setTimeout(() => {
      setAddedToQuote(false);
      setSelectedColors([]);
      setColorQuantities({});
      onClose();
    }, 1500);
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedColors([]);
    setColorQuantities({});
    setAddedToQuote(false);
    onClose();
  };

  const canAddToQuote = totalPieces > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6">
        {/* Left: Image - smaller on mobile */}
        <div className="lg:w-2/5 flex-shrink-0">
          <div className="relative aspect-[4/3] lg:aspect-square overflow-hidden rounded-xl bg-slate-50">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className="object-contain p-4"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ShoppingBag className="h-16 w-16 lg:h-20 lg:w-20" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Details */}
        <div className="lg:w-3/5 flex flex-col min-h-0">
          {/* Header - Fixed */}
          <div className="flex-shrink-0">
            <p className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-500">
              {product.brandName}
            </p>
            <h2 className="mt-0.5 lg:mt-1 text-lg lg:text-xl font-bold text-slate-900 pr-8">
              {product.title || product.styleName}
            </h2>
            <p className="text-xs lg:text-sm text-slate-500">
              Style #{product.styleName}
            </p>
            <div className="mt-1 lg:mt-2 flex items-baseline gap-2">
              <span className="text-xl lg:text-2xl font-semibold text-brand-600">
                {formatPrice(displayPrice)}
              </span>
              <span className="text-xs lg:text-sm text-slate-500">per piece</span>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="mt-3 lg:mt-4">
            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-xs lg:text-sm font-semibold text-slate-900">
                  Select Colors ({product.colors.length} available)
                </h3>
                <p className="mt-0.5 lg:mt-1 text-xs text-slate-500 hidden lg:block">
                  Click colors to add size rows below. Click again to remove.
                </p>
                <div className="mt-2 lg:mt-3">
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
              <div className="mt-4 lg:mt-5 space-y-2 lg:space-y-3">
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
              <div className="mt-4 lg:mt-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 lg:p-6 text-center">
                <ShoppingBag className="mx-auto h-6 w-6 lg:h-8 lg:w-8 text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Select a color above to enter quantities
                </p>
                <p className="mt-1 text-xs text-slate-500 hidden lg:block">
                  You can select multiple colors for a multi-color order
                </p>
              </div>
            )}
          </div>

          {/* Footer: Order Summary & Add to Quote - Fixed */}
          <div className="flex-shrink-0 mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-slate-200">
            {/* Order Summary */}
            {selectedColors.length > 0 && grandTotal > 0 && (
              <div className="rounded-lg bg-brand-50 p-3 lg:p-4 mb-3 lg:mb-4">
                {/* Per-color breakdown - only show when 2+ colors */}
                {colorSubtotals.length > 1 && (
                  <div className="space-y-1.5 mb-2 pb-2 border-b border-brand-200">
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

            {/* Add to Quote Button */}
            <Button
              onClick={handleAddToQuote}
              disabled={!canAddToQuote}
              size="lg"
              className={cn(
                'w-full',
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

            {!canAddToQuote && selectedColors.length > 0 && (
              <p className="mt-2 text-xs text-center text-slate-500">
                Enter quantities for at least one size
              </p>
            )}

            {/* View Full Details Link */}
            <Link
              href={`/product/${product.slug}`}
              onClick={handleClose}
              className="mt-2 lg:mt-3 flex items-center justify-center gap-2 text-xs lg:text-sm text-brand-600 hover:text-brand-700 pb-2"
            >
              View Full Product Details
              <ExternalLink className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Default export for Builder.io
export default QuickViewModal;
