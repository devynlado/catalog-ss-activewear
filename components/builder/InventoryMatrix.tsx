'use client';

import { useState, useEffect } from 'react';
import { ProductColor, ProductSize } from '@/lib/types';
import { cn, formatNumber } from '@/lib/utils';
import { InventoryMatrixSkeleton } from '@/components/ui/Skeleton';

interface InventoryMatrixProps {
  productId?: string;
  colors?: ProductColor[];
  lowStockThreshold?: number;
  showQuantities?: boolean;
  onSizeColorSelect?: (color: string, size: string, qty: number) => void;
  selectedColor?: string;
  selectedSize?: string;
  readOnly?: boolean; // When true, cells are not clickable (informational only)
}

interface InventoryData {
  [colorCode: string]: {
    [size: string]: number;
  };
}

export function InventoryMatrix({
  productId,
  colors,
  lowStockThreshold = 12,
  showQuantities = true,
  onSizeColorSelect,
  selectedColor,
  selectedSize,
  readOnly = false,
}: InventoryMatrixProps) {
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all unique sizes across all colors
  const allSizes = colors
    ? [...new Set(colors.flatMap((c) => c.sizes.map((s) => s.name)))]
    : [];

  // Fetch inventory data if productId is provided
  useEffect(() => {
    if (!productId) return;

    const fetchInventory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/${productId}?format=matrix`);
        if (!response.ok) throw new Error('Failed to fetch inventory');
        
        const data = await response.json();
        setInventoryData(data.matrix);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError('Failed to load inventory');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [productId]);

  // Build inventory from colors prop if provided
  const getQuantity = (colorCode: string, sizeName: string): number => {
    // First check fetched inventory data
    if (inventoryData && inventoryData[colorCode]) {
      return inventoryData[colorCode][sizeName] || 0;
    }

    // Fall back to colors prop data
    if (colors) {
      const color = colors.find((c) => c.colorCode === colorCode);
      const size = color?.sizes.find((s) => s.name === sizeName);
      return size?.qty || 0;
    }

    return 0;
  };

  const getStockStatus = (qty: number): 'high' | 'low' | 'out' => {
    if (qty === 0) return 'out';
    if (qty <= lowStockThreshold) return 'low';
    return 'high';
  };

  const stockStyles = {
    high: 'bg-green-50 text-green-700 hover:bg-green-100',
    low: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
    out: 'bg-stone-100 text-slate-400',
  };

  if (isLoading) {
    return <InventoryMatrixSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!colors || colors.length === 0) {
    return (
      <div className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
        No inventory data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto inventory-scroll">
      <table className="w-full min-w-[500px] border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Color
            </th>
            {allSizes.map((size) => (
              <th
                key={size}
                className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {size}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {colors.map((color) => (
            <tr key={color.colorCode}>
              <td className="sticky left-0 z-10 bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  {color.swatchImage ? (
                    <img
                      src={color.swatchImage}
                      alt={color.colorName}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="h-5 w-5 rounded-full border border-stone-200"
                      style={{
                        backgroundColor: color.colorCode.startsWith('#')
                          ? color.colorCode
                          : `#${color.colorCode}`,
                      }}
                    />
                  )}
                  <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                    {color.colorName}
                  </span>
                </div>
              </td>
              {allSizes.map((size) => {
                const qty = getQuantity(color.colorCode, size);
                const status = getStockStatus(qty);
                const isSelected = selectedColor === color.colorCode && selectedSize === size;

                // Read-only mode: just display, no interaction
                if (readOnly) {
                  return (
                    <td key={size} className="px-1 py-1">
                      <div
                        className={cn(
                          'w-full rounded-md px-3 py-2 text-center text-sm font-medium',
                          stockStyles[status],
                          isSelected && 'ring-2 ring-brand-500 ring-offset-1'
                        )}
                      >
                        {showQuantities ? (
                          status === 'out' ? '—' : formatNumber(qty)
                        ) : (
                          status === 'out' ? '—' : '✓'
                        )}
                      </div>
                    </td>
                  );
                }

                // Interactive mode: clickable cells
                return (
                  <td key={size} className="px-1 py-1">
                    <button
                      onClick={() => onSizeColorSelect?.(color.colorCode, size, qty)}
                      disabled={status === 'out'}
                      className={cn(
                        'w-full rounded-md px-3 py-2 text-center text-sm font-medium transition-colors',
                        stockStyles[status],
                        status !== 'out' && 'cursor-pointer',
                        isSelected && 'ring-2 ring-brand-500 ring-offset-1'
                      )}
                    >
                      {showQuantities ? (
                        status === 'out' ? '—' : formatNumber(qty)
                      ) : (
                        status === 'out' ? '—' : '✓'
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-green-100" />
          <span className="text-slate-600">In Stock ({lowStockThreshold}+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-yellow-100" />
          <span className="text-slate-600">Low Stock (1-{lowStockThreshold})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-stone-100" />
          <span className="text-slate-600">Out of Stock</span>
        </div>
      </div>
    </div>
  );
}

// Default export for Builder.io
export default InventoryMatrix;
