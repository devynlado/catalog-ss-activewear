'use client';

import Image from 'next/image';
import { Package, Minus, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { CartItem } from '@/lib/database.types';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice, cn } from '@/lib/utils';
import { ShippingMethod, getDeliveryEstimate, formatDateRange } from './ShippingOptions';

interface OrderSummaryProps {
  items: CartItem[];
  shippingMethod: ShippingMethod;
  shippingCost: number;
  taxAmount?: number;
  isEditable?: boolean;
}

export function OrderSummary({ 
  items, 
  shippingMethod,
  shippingCost,
  taxAmount,
  isEditable = true 
}: OrderSummaryProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const [isExpanded, setIsExpanded] = useState(true);
  
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

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm shadow-lg shadow-stone-200/50 overflow-hidden">
      {/* Header - Collapsible on mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white px-4 py-3 lg:cursor-default"
      >
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-900">
            Order Summary
          </h2>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <span className="font-bold text-slate-900">{formatPrice(total)}</span>
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
        isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden lg:max-h-[1000px] lg:opacity-100'
      )}>
        {/* Delivery Estimate Banner */}
        <div className="bg-green-50 border-b border-green-100 px-4 py-2">
          <p className="text-sm text-green-800">
            <span className="font-medium">Estimated delivery:</span>{' '}
            <span className="font-semibold">{formatDateRange(deliveryEstimate.min, deliveryEstimate.max)}</span>
          </p>
        </div>

        {/* Items */}
        <div className="max-h-64 overflow-y-auto p-4">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                {/* Image */}
                <div className="relative w-12 aspect-[3/4] flex-shrink-0 overflow-hidden rounded-lg bg-white border border-stone-100">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.styleName}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-800">
                      {item.styleName}
                      <span className="text-slate-500 font-normal"> × </span>
                      <span className="font-semibold text-brand-600">{item.quantity}</span>
                    </p>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 border border-green-100">
                      <CheckCircle className="h-2.5 w-2.5" />
                      In Stock
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.colorName} / {item.sizeName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.discountedPrice && item.discountedPrice < item.unitPrice ? (
                      <>
                        <span className="text-green-600 font-medium">{formatPrice(item.discountedPrice)}</span>
                        <span className="ml-1 line-through text-slate-400">{formatPrice(item.unitPrice)}</span>
                        <span className="ml-1">each</span>
                      </>
                    ) : (
                      <>{formatPrice(item.unitPrice)} each</>
                    )}
                  </p>
                  
                  {/* Quantity Controls */}
                  {isEditable && (
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded-md border border-stone-200 bg-white p-1.5 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                      >
                        <Minus className="h-3 w-3 text-slate-600" />
                      </button>
                      <span className="min-w-[2.5rem] text-center text-sm font-semibold text-slate-800 bg-stone-50 rounded-md px-2 py-1">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-md border border-stone-200 bg-white p-1.5 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                      >
                        <Plus className="h-3 w-3 text-slate-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="ml-2 rounded-md p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800">
                    {formatPrice((item.discountedPrice ?? item.unitPrice) * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-stone-100 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="text-slate-800">{formatPrice(subtotal)}</span>
          </div>
          
          {totalSavings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">Discount Savings</span>
              <span className="text-green-600 font-medium">-{formatPrice(totalSavings)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Shipping</span>
            <span className={cn(
              'text-slate-800',
              shippingCost === 0 && 'text-green-600 font-medium'
            )}>
              {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Tax (estimated)</span>
            <span className="text-slate-800">{formatPrice(calculatedTax)}</span>
          </div>

          <div className="border-t border-stone-200 pt-3 mt-3">
            <div className="flex justify-between">
              <span className="font-bold text-slate-900">Total</span>
              <span className="text-xl font-bold text-slate-900">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
