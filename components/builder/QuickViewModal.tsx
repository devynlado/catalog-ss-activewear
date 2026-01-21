'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag, ExternalLink } from 'lucide-react';
import { Product, ProductColor } from '@/lib/types';
import { formatPrice, cn } from '@/lib/utils';
import { useQuoteStore } from '@/lib/quote-store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ColorSwatches } from './ColorSwatches';
import { InventoryMatrix } from './InventoryMatrix';

interface QuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  productId?: string; // For Builder.io standalone usage
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
    product.colors?.[0] || null
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedQty, setSelectedQty] = useState(0);

  const { addItem } = useQuoteStore();

  const imageUrl = selectedColor?.frontImage || product.imageUrl;
  const displayPrice = product.salePrice || product.price;

  const handleSizeColorSelect = (colorCode: string, size: string, qty: number) => {
    const color = product.colors?.find((c) => c.colorCode === colorCode);
    if (color) {
      setSelectedColor(color);
      setSelectedSize(size);
      setSelectedQty(qty);
    }
  };

  const handleAddToQuote = () => {
    if (!selectedColor || !selectedSize) {
      return;
    }

    const sizeInfo = selectedColor.sizes.find((s) => s.name === selectedSize);

    addItem({
      productId: product.id,
      styleId: product.styleId,
      styleName: product.styleName,
      brandName: product.brandName,
      colorName: selectedColor.colorName,
      colorCode: selectedColor.colorCode,
      sizeName: selectedSize,
      quantity,
      unitPrice: sizeInfo?.price || displayPrice,
      imageUrl: selectedColor.frontImage || product.imageUrl,
    });

    // Reset and close
    setQuantity(1);
    onClose();
  };

  const canAddToQuote = selectedColor && selectedSize && selectedQty > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="grid gap-6 p-6 md:grid-cols-2">
        {/* Left: Image */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ShoppingBag className="h-20 w-20" />
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex flex-col">
          {/* Header */}
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              {product.brandName}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {product.styleName}
            </h2>
            <p className="mt-2 text-2xl font-semibold text-brand-600">
              {formatPrice(displayPrice)}
              <span className="ml-2 text-sm font-normal text-slate-500">per piece</span>
            </p>
          </div>

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-6">
              <ColorSwatches
                colors={product.colors}
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
                swatchSize="lg"
                maxVisible={12}
              />
            </div>
          )}

          {/* Inventory Matrix */}
          <div className="mt-6 flex-1 overflow-hidden">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Select Size (Click to select)
            </h3>
            <div className="max-h-[200px] overflow-y-auto">
              <InventoryMatrix
                colors={product.colors}
                onSizeColorSelect={handleSizeColorSelect}
                selectedColor={selectedColor?.colorCode}
                selectedSize={selectedSize || undefined}
                showQuantities={true}
              />
            </div>
          </div>

          {/* Selection Summary */}
          {selectedColor && selectedSize && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-slate-600">
                Selected: <span className="font-medium">{selectedColor.colorName}</span> / 
                <span className="font-medium"> {selectedSize}</span>
                {selectedQty > 0 && (
                  <span className="ml-2 text-green-600">({selectedQty} available)</span>
                )}
              </p>
            </div>
          )}

          {/* Quantity & Add to Quote */}
          <div className="mt-6 flex items-center gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center rounded-lg border border-slate-200">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-slate-600 hover:bg-slate-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 border-x border-slate-200 py-2 text-center text-sm focus:outline-none"
                min="1"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-slate-600 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Add to Quote Button */}
            <Button
              onClick={handleAddToQuote}
              disabled={!canAddToQuote}
              className="flex-1"
              size="lg"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Add to Quote
            </Button>
          </div>

          {/* View Full Details Link */}
          <Link
            href={`/catalog/${product.id}`}
            className="mt-4 flex items-center justify-center gap-2 text-sm text-brand-600 hover:text-brand-700"
          >
            View Full Details
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Modal>
  );
}

// Default export for Builder.io
export default QuickViewModal;
