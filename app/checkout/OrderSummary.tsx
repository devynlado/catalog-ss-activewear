'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Package, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { useState, useMemo } from 'react';
import { CartItem } from '@/lib/database.types';
import { formatPrice, cn } from '@/lib/utils';
import { ShippingMethod, getDeliveryEstimate, formatDateRange } from './ShippingOptions';

interface OrderSummaryProps {
  items: CartItem[];
  shippingMethod: ShippingMethod;
  shippingCost: number;
  taxAmount?: number;
  isEditable?: boolean;
}

// Standard size order for consistent display
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'OS'];
const SIZE_DISPLAY = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'OS'];

// Normalize size names for sorting
function normalizeSize(size: string): string {
  const sizeUpper = size.toUpperCase().trim();
  // Map common variations
  const sizeMap: Record<string, string> = {
    'XSM': 'XS', 'XSMALL': 'XS', 'X-SMALL': 'XS',
    'SML': 'S', 'SMALL': 'S', 'SM': 'S',
    'MED': 'M', 'MEDIUM': 'M', 'MD': 'M',
    'LRG': 'L', 'LARGE': 'L', 'LG': 'L',
    'XLG': 'XL', 'XLARGE': 'XL', 'X-LARGE': 'XL',
    '2X': '2XL', 'XXL': '2XL', '2XLARGE': '2XL',
    '3X': '3XL', 'XXXL': '3XL', '3XLARGE': '3XL',
    '4X': '4XL', 'XXXXL': '4XL', '4XLARGE': '4XL',
    '5X': '5XL', 'XXXXXL': '5XL', '5XLARGE': '5XL',
    'ONE SIZE': 'OS', 'ONESIZE': 'OS', 'O/S': 'OS',
  };
  return sizeMap[sizeUpper] || sizeUpper;
}

// Group items by style and color
interface GroupedItem {
  key: string;
  styleId: number;
  styleName: string;
  productTitle?: string;
  brandName: string;
  colorName: string;
  colorCode: string;
  imageUrl?: string;
  sizes: Map<string, { quantity: number; price: number; discountedPrice?: number }>;
  totalQuantity: number;
  totalPrice: number;
  unitPrice: number;
  hasDiscount: boolean;
}

function groupItemsByStyleColor(items: CartItem[]): GroupedItem[] {
  const groups = new Map<string, GroupedItem>();

  for (const item of items) {
    const key = `${item.styleId}-${item.colorCode}`;
    const normalizedSize = normalizeSize(item.sizeName);
    
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        styleId: item.styleId,
        styleName: item.styleName,
        productTitle: item.productTitle,
        brandName: item.brandName,
        colorName: item.colorName,
        colorCode: item.colorCode,
        imageUrl: item.imageUrl,
        sizes: new Map(),
        totalQuantity: 0,
        totalPrice: 0,
        unitPrice: item.discountedPrice ?? item.unitPrice,
        hasDiscount: !!(item.discountedPrice && item.discountedPrice < item.unitPrice),
      });
    }

    const group = groups.get(key)!;
    const effectivePrice = item.discountedPrice ?? item.unitPrice;
    
    // Add or update size
    const existingSize = group.sizes.get(normalizedSize);
    if (existingSize) {
      existingSize.quantity += item.quantity;
    } else {
      group.sizes.set(normalizedSize, {
        quantity: item.quantity,
        price: item.unitPrice,
        discountedPrice: item.discountedPrice,
      });
    }
    
    group.totalQuantity += item.quantity;
    group.totalPrice += effectivePrice * item.quantity;
  }

  return Array.from(groups.values());
}

// Get ordered sizes that exist in a group
function getOrderedSizes(sizes: Map<string, any>): string[] {
  const sizeKeys = Array.from(sizes.keys());
  return SIZE_ORDER.filter(size => sizeKeys.includes(size));
}

export function OrderSummary({ 
  items, 
  shippingMethod,
  shippingCost,
  taxAmount,
  isEditable = true 
}: OrderSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Group items
  const groupedItems = useMemo(() => groupItemsByStyleColor(items), [items]);
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.discountedPrice ?? item.unitPrice) * item.quantity, 0);
  const totalSavings = items.reduce((sum, item) => {
    if (item.discountedPrice && item.discountedPrice < item.unitPrice) {
      return sum + (item.unitPrice - item.discountedPrice) * item.quantity;
    }
    return sum;
  }, 0);
  
  // Calculate tax (8.25% estimate if not provided)
  const calculatedTax = taxAmount ?? subtotal * 0.0825;
  const total = subtotal + shippingCost + calculatedTax;
  
  // Get delivery estimate
  const deliveryEstimate = getDeliveryEstimate(shippingMethod);

  // Generate product slug from style name
  const getProductSlug = (group: GroupedItem) => {
    const slug = `${group.brandName}-${group.styleName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return slug;
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-300/40 overflow-hidden">
      {/* Header - Collapsible on mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between border-b border-stone-100 bg-gradient-to-r from-stone-50/80 to-white/80 px-5 py-4 lg:cursor-default"
      >
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-slate-800">
            Order Summary
          </h2>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <span className="font-bold text-navy-800">{formatPrice(total)}</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      <div className={cn(
        'transition-all duration-200',
        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden lg:max-h-[2000px] lg:opacity-100'
      )}>
        {/* Delivery Estimate Banner */}
        <div className="bg-green-50/80 border-b border-green-100 px-5 py-2.5">
          <p className="text-sm text-green-800">
            <span className="font-medium">Estimated delivery:</span>{' '}
            <span className="font-semibold">{formatDateRange(deliveryEstimate.min, deliveryEstimate.max)}</span>
          </p>
        </div>

        {/* Grouped Items */}
        <div className="max-h-80 overflow-y-auto p-4">
          <div className="space-y-4">
            {groupedItems.map((group) => {
              const orderedSizes = getOrderedSizes(group.sizes);
              
              return (
                <div 
                  key={group.key} 
                  className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
                >
                  {/* Product Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Image */}
                    <Link 
                      href={`/product/${getProductSlug(group)}`}
                      target="_blank"
                      className="relative w-12 aspect-square flex-shrink-0 overflow-hidden rounded-lg bg-white border border-stone-100 hover:border-brand-300 transition-colors"
                    >
                      {group.imageUrl ? (
                        <Image
                          src={group.imageUrl}
                          alt={group.styleName}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/product/${getProductSlug(group)}`}
                        target="_blank"
                        className="text-sm font-semibold text-slate-800 hover:text-brand-600 transition-colors block truncate"
                      >
                        {group.productTitle || `${group.brandName} ${group.styleName}`}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {group.colorName} · #{group.styleName}
                      </p>
                    </div>

                    {/* Line Total */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-800">
                        {formatPrice(group.totalPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Size Grid */}
                  <div className="bg-stone-50/80 rounded-lg p-2">
                    <div className="flex flex-wrap gap-1">
                      {orderedSizes.map((size) => {
                        const sizeData = group.sizes.get(size);
                        if (!sizeData || sizeData.quantity === 0) return null;
                        
                        return (
                          <div 
                            key={size}
                            className="flex items-center gap-1.5 bg-white rounded-md px-2 py-1 border border-stone-200"
                          >
                            <span className="text-xs font-medium text-slate-500 w-6">
                              {size}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {sizeData.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {group.totalQuantity} pcs @ {formatPrice(group.unitPrice)}
                    </span>
                    {group.hasDiscount && (
                      <span className="text-green-600 font-medium">
                        Sale price
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edit in cart link */}
          {isEditable && (
            <Link 
              href="/cart"
              className="mt-4 flex items-center justify-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 transition-colors py-2"
            >
              <Pencil className="h-3 w-3" />
              Edit quantities in cart
            </Link>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-stone-100 p-5 space-y-2.5 bg-gradient-to-b from-transparent to-stone-50/50">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal ({itemCount} pieces)</span>
            <span className="font-medium text-slate-800">{formatPrice(subtotal)}</span>
          </div>
          
          {totalSavings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">Discount Savings</span>
              <span className="text-green-600 font-medium">-{formatPrice(totalSavings)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              Shipping ({shippingMethod === 'economy' ? 'Economy' : 'Express'})
            </span>
            <span className={cn(
              'font-medium',
              shippingCost === 0 ? 'text-green-600' : 'text-slate-800'
            )}>
              {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Tax (est.)</span>
            <span className="font-medium text-slate-800">{formatPrice(calculatedTax)}</span>
          </div>

          <div className="border-t border-stone-200 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">Total</span>
              <span className="text-xl font-bold text-slate-800">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
