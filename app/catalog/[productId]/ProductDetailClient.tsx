'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { ShoppingBag, Check, Package } from 'lucide-react';
import { Product, ProductColor, ProductSize } from '@/lib/types';
import { formatPrice, cn, formatNumber } from '@/lib/utils';
import { useQuoteStore } from '@/lib/quote-store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ColorSwatches } from '@/components/builder/ColorSwatches';
import { InventoryMatrix } from '@/components/builder/InventoryMatrix';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
    product.colors?.[0] || null
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<string>(''); // String for controlled input
  const [addedToQuote, setAddedToQuote] = useState(false);

  const { addItem } = useQuoteStore();

  const imageUrl = selectedColor?.frontImage || product.imageUrl;
  const displayPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  // Get sizes for the selected color
  const availableSizes = useMemo(() => {
    return selectedColor?.sizes || [];
  }, [selectedColor]);

  // Get selected size details
  const selectedSizeDetails = useMemo(() => {
    if (!selectedSize || !selectedColor) return null;
    return selectedColor.sizes.find((s) => s.name === selectedSize);
  }, [selectedSize, selectedColor]);

  // Get stock for selected color/size
  const selectedStock = selectedSizeDetails?.qty || 0;

  // Handle color change - reset size selection
  const handleColorChange = (color: ProductColor | null) => {
    setSelectedColor(color);
    setSelectedSize(null);
    setQuantity('');
  };

  const handleAddToQuote = () => {
    const qty = parseInt(quantity, 10);
    if (!selectedColor || !selectedSize || !qty || qty < 1) return;

    const sizeInfo = selectedColor.sizes.find((s) => s.name === selectedSize);

    addItem({
      productId: product.id,
      styleId: product.styleId,
      styleName: product.styleName,
      brandName: product.brandName,
      colorName: selectedColor.colorName,
      colorCode: selectedColor.colorCode,
      sizeName: selectedSize,
      quantity: qty,
      unitPrice: sizeInfo?.price || displayPrice,
      imageUrl: selectedColor.frontImage || product.imageUrl,
    });

    setAddedToQuote(true);
    setQuantity(''); // Reset quantity after adding
    setTimeout(() => setAddedToQuote(false), 2000);
  };

  const parsedQuantity = parseInt(quantity, 10) || 0;
  const canAddToQuote = selectedColor && selectedSize && parsedQuantity > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Left: Images */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-contain p-4"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ShoppingBag className="h-32 w-32" />
            </div>
          )}
          {hasDiscount && (
            <Badge variant="error" className="absolute left-4 top-4">
              Sale
            </Badge>
          )}
        </div>

        {/* Thumbnail Images (if available) */}
        {selectedColor && (selectedColor.backImage || selectedColor.sideImage) && (
          <div className="flex gap-3">
            <button className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-brand-500 bg-white">
              <Image
                src={selectedColor.frontImage || product.imageUrl}
                alt="Front"
                fill
                className="object-contain p-1"
              />
            </button>
            {selectedColor.backImage && (
              <button className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-slate-200 bg-white hover:border-slate-400">
                <Image
                  src={selectedColor.backImage}
                  alt="Back"
                  fill
                  className="object-contain p-1"
                />
              </button>
            )}
            {selectedColor.sideImage && (
              <button className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-slate-200 bg-white hover:border-slate-400">
                <Image
                  src={selectedColor.sideImage}
                  alt="Side"
                  fill
                  className="object-contain p-1"
                />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Product Details */}
      <div>
        {/* Header - Title is now the focus, SKU is secondary */}
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
            {product.brandName}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {product.title || `${product.brandName} ${product.styleName}`}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Style #{product.styleName}
          </p>
        </div>

        {/* Price */}
        <div className="mt-4 flex items-baseline gap-3">
          {displayPrice > 0 ? (
            <>
              <span className="text-3xl font-bold text-brand-600">
                {formatPrice(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xl text-slate-400 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
              <span className="text-sm text-slate-500">per piece</span>
            </>
          ) : (
            <span className="text-xl font-semibold text-brand-600">
              Request Quote for Pricing
            </span>
          )}
        </div>

        {/* Description - Renders HTML properly */}
        {product.description && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">Description</h3>
            <div 
              className="mt-2 text-sm text-slate-600 leading-relaxed prose prose-sm prose-slate max-w-none prose-ul:list-disc prose-ul:pl-5 prose-li:my-1"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {/* Color Selection */}
        {product.colors && product.colors.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">
              Color ({product.colors.length} available)
            </h3>
            <div className="mt-3">
              <ColorSwatches
                colors={product.colors}
                selectedColor={selectedColor}
                onColorSelect={handleColorChange}
                swatchSize="lg"
                maxVisible={16}
              />
            </div>
            {selectedColor && (
              <p className="mt-2 text-sm text-slate-600">
                Color: <span className="font-medium">{selectedColor.colorName}</span>
              </p>
            )}
          </div>
        )}

        {/* Size Selection */}
        {selectedColor && availableSizes.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">
              Select Size
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableSizes.map((size) => {
                const isOutOfStock = size.qty === 0;
                const isSelected = selectedSize === size.name;
                
                return (
                  <button
                    key={size.code}
                    onClick={() => {
                      setSelectedSize(size.name);
                      setQuantity('');
                    }}
                    disabled={isOutOfStock}
                    className={cn(
                      'relative rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : isOutOfStock
                        ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                    )}
                  >
                    {size.name}
                    {isOutOfStock && (
                      <span className="absolute -top-2 -right-2 rounded-full bg-slate-200 px-1.5 text-xs text-slate-500">
                        —
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Input & Stock Info */}
        {selectedColor && selectedSize && (
          <div className="mt-6 rounded-xl bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-6">
              {/* Stock Info (read-only) */}
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Available Stock</p>
                  <p className={cn(
                    'text-lg font-bold',
                    selectedStock > 12 ? 'text-green-600' : selectedStock > 0 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {selectedStock > 0 ? formatNumber(selectedStock) : 'Out of Stock'}
                  </p>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="flex-1 max-w-[200px]">
                <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">
                  Quantity Needed
                </label>
                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter qty"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg font-semibold text-center focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  min="1"
                />
              </div>
            </div>

            {/* Selection Summary */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">Selected:</span>{' '}
                {selectedColor.colorName} / {selectedSize}
                {parsedQuantity > 0 && (
                  <span className="ml-2 font-semibold text-brand-600">
                    × {parsedQuantity}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Add to Quote Button */}
        <div className="mt-6">
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

          {!canAddToQuote && selectedColor && !selectedSize && (
            <p className="mt-2 text-sm text-slate-500 text-center">
              Please select a size to continue
            </p>
          )}
          {!canAddToQuote && selectedColor && selectedSize && parsedQuantity === 0 && (
            <p className="mt-2 text-sm text-slate-500 text-center">
              Enter the quantity you need
            </p>
          )}
        </div>

        {/* Full Inventory Matrix (read-only reference) */}
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Size & Availability
          </h3>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <InventoryMatrix
              colors={product.colors}
              selectedColor={selectedColor?.colorCode}
              selectedSize={selectedSize || undefined}
              showQuantities={true}
              lowStockThreshold={12}
              readOnly={true}
            />
          </div>
        </div>

        {/* Product Details Table */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Product Details</h3>
          <dl className="mt-4 divide-y divide-slate-100">
            <div className="flex justify-between py-3">
              <dt className="text-sm text-slate-500">Style Number</dt>
              <dd className="text-sm font-medium text-slate-900">{product.styleName}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-sm text-slate-500">Brand</dt>
              <dd className="text-sm font-medium text-slate-900">{product.brandName}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-sm text-slate-500">Available Colors</dt>
              <dd className="text-sm font-medium text-slate-900">
                {product.colors?.length || 0}
              </dd>
            </div>
            {product.categories && product.categories.length > 0 && (
              <div className="flex justify-between py-3">
                <dt className="text-sm text-slate-500">Categories</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {product.categories.map((c) => c.name).join(', ')}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
