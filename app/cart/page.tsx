'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ShoppingCart, Trash2, Tag, Truck, Shield, BadgeCheck, Package, Pencil, Phone, ChevronDown, Paintbrush, Scissors, X } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CartItem, AvailableSize } from '@/lib/database.types';
import { DecorationPitch } from '@/components/cart/DecorationPitch';
import { getDecoratedDeliveryEstimate, formatDateRange } from '@/app/checkout/ShippingOptions';
import { trackViewCart, CartItem as GA4CartItem } from '@/lib/analytics';
import { hasTieredPricing, getEffectiveItemPrice, isVolumePriced } from '@/lib/tiered-pricing';
import { isMultiWarehouseCart, FREE_ECONOMY_THRESHOLD, WAREHOUSE_CONFIG, groupCartByWarehouse } from '@/lib/shipping';

// Card styles - stronger contrast/depth
const glassCard = "bg-white border border-stone-200 rounded-2xl shadow-xl shadow-stone-300/40";

// Standard size order for consistent display
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'OS'];

// Normalize size names for sorting
function normalizeSize(size: string): string {
  const sizeUpper = size.toUpperCase().trim();
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
interface SizeData {
  id: string;
  quantity: number;
  price: number;
  discountedPrice?: number;
  originalSize: string;
}

interface GroupedItem {
  key: string;
  styleId: number;
  styleName: string;
  productTitle?: string;
  brandName: string;
  colorName: string;
  colorCode: string;
  imageUrl?: string;
  sizes: Map<string, SizeData>;
  availableSizes: AvailableSize[];
  totalQuantity: number;
  totalPrice: number;
  basePrice: number;
  hasDiscount: boolean;
  hasVolumePrice: boolean;
  hasFlatOverride: boolean;
}

function groupItemsByStyleColor(items: CartItem[]): GroupedItem[] {
  const styleQtys = new Map<number, number>();
  for (const item of items) {
    if (hasTieredPricing(item.styleId)) {
      styleQtys.set(item.styleId, (styleQtys.get(item.styleId) || 0) + item.quantity);
    }
  }

  const groups = new Map<string, GroupedItem>();

  for (const item of items) {
    const key = `${item.styleId}-${item.colorCode}`;
    const normalizedSize = normalizeSize(item.sizeName);
    const totalStyleQty = styleQtys.get(item.styleId) ?? 0;
    const effectivePrice = getEffectiveItemPrice(item, totalStyleQty);
    
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
        availableSizes: item.availableSizes || [],
        totalQuantity: 0,
        totalPrice: 0,
        basePrice: effectivePrice,
        hasDiscount: !!(item.discountedPrice && item.discountedPrice < item.unitPrice),
        hasVolumePrice:
          !item.overrideUnitPrice &&
          isVolumePriced(item.styleId, item.sizeName, totalStyleQty),
        hasFlatOverride: !!(item.overrideUnitPrice && item.overrideUnitPrice > 0),
      });
    }

    const group = groups.get(key)!;
    
    // Merge available sizes
    if (item.availableSizes && item.availableSizes.length > group.availableSizes.length) {
      group.availableSizes = item.availableSizes;
    }
    
    group.sizes.set(normalizedSize, {
      id: item.id,
      quantity: item.quantity,
      price: item.unitPrice,
      discountedPrice: item.discountedPrice,
      originalSize: item.sizeName,
    });

    if (item.overrideUnitPrice && item.overrideUnitPrice > 0) {
      group.hasFlatOverride = true;
      group.hasVolumePrice = false;
    }
    
    group.totalQuantity += item.quantity;
    group.totalPrice += effectivePrice * item.quantity;
  }

  return Array.from(groups.values());
}

// Get all available sizes in order
function getAllAvailableSizes(availableSizes: AvailableSize[]): string[] {
  const normalizedSizes = availableSizes.map(s => normalizeSize(s.name));
  return SIZE_ORDER.filter(size => normalizedSizes.includes(size));
}

// Get ordered sizes that have quantities
function getOrderedSizes(sizes: Map<string, SizeData>): string[] {
  const sizeKeys = Array.from(sizes.keys());
  return SIZE_ORDER.filter(size => sizeKeys.includes(size));
}

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    addItem,
    clearCart,
    getSubtotal,
    getTotalUnits,
    getDecorationTotal,
    getGrandTotal,
    decoration,
    clearDecoration,
    hasHydrated,
    openDecorationModal,
    appliedCoupon,
    setAppliedCoupon,
    clearCoupon,
    getTierUpsell,
  } = useCartStore();

  const [promoCode, setPromoCode] = useState('');
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const subtotal = getSubtotal();
  const totalUnits = getTotalUnits();
  const freeShippingThreshold = FREE_ECONOMY_THRESHOLD;
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;
  const amountToFreeShipping = freeShippingThreshold - subtotal;
  const multiWarehouse = useMemo(() => isMultiWarehouseCart(items), [items]);
  const shipmentGroups = useMemo(() => multiWarehouse ? groupCartByWarehouse(items) : [], [items, multiWarehouse]);

  // Group items
  const groupedItems = useMemo(() => groupItemsByStyleColor(items), [items]);

  // Check if any items have discounts
  const hasDiscounts = items.some(item => item.discountedPrice && item.discountedPrice < item.unitPrice);

  // Track view_cart event when page loads with items
  useEffect(() => {
    if (hasHydrated && items.length > 0) {
      const ga4Items: GA4CartItem[] = items.map(item => ({
        sku: item.sku,
        styleId: item.styleId,
        styleName: item.styleName,
        productTitle: item.productTitle,
        brandName: item.brandName,
        colorName: item.colorName,
        colorCode: item.colorCode,
        sizeName: item.sizeName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountedPrice: item.discountedPrice,
      }));
      trackViewCart({ items: ga4Items, value: subtotal });
    }
  }, [hasHydrated]); // Only fire once when hydrated

  // Handle quantity change
  const handleQuantityChange = (itemId: string | null, group: GroupedItem, sizeName: string, newQuantity: number) => {
    if (itemId) {
      if (newQuantity <= 0) {
        removeItem(itemId);
      } else {
        updateQuantity(itemId, newQuantity);
      }
    } else if (newQuantity > 0) {
      const availableSize = group.availableSizes.find(
        s => normalizeSize(s.name) === sizeName
      );
      if (!availableSize) return;
      
      const existingItem = items.find(item => 
        item.styleId === group.styleId && 
        item.colorCode === group.colorCode
      );
      
      if (!existingItem) return;
      
      addItem({
        sku: `${group.styleId}-${group.colorCode}-${sizeName}`,
        styleId: group.styleId,
        styleName: group.styleName,
        brandName: group.brandName,
        colorName: group.colorName,
        colorCode: group.colorCode,
        sizeName: availableSize.name,
        quantity: newQuantity,
        unitPrice: availableSize.price,
        discountedPrice: existingItem.discountedPrice ? availableSize.price : undefined,
        discountSource: existingItem.discountSource,
        imageUrl: group.imageUrl,
        availableSizes: group.availableSizes,
      }, { openDrawer: false });
    }
  };

  // Remove entire group
  const handleRemoveGroup = (group: GroupedItem) => {
    group.sizes.forEach((sizeData) => {
      removeItem(sizeData.id);
    });
  };

  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) return;
    setPromoError(null);
    setPromoLoading(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          items: items.map((i) => ({
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            discountedPrice: i.discountedPrice,
          })),
          context: 'cart',
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code: data.code,
          couponId: data.couponId,
          discountAmount: data.discountAmount,
          freeShipping: data.freeShipping,
        });
        setPromoCode('');
        setPromoExpanded(false);
      } else {
        setPromoError(data.message || 'Invalid or expired code.');
      }
    } catch {
      setPromoError('Something went wrong. Please try again.');
    } finally {
      setPromoLoading(false);
    }
  };

  // Show loading
  if (!hasHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
        <div className="rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 p-8 shadow-inner mb-6">
          <ShoppingCart className="h-14 w-14 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-navy-800 mb-2">Your cart is empty</h1>
        <p className="text-slate-600 mb-8 text-center max-w-md">
          Browse our catalog to find quality blank apparel at wholesale prices.
        </p>
        <Link href="/catalog">
          <Button size="lg" className="shadow-lg shadow-brand-500/25">
            Browse Catalog
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex flex-col">
      {/* Grain texture */}
      <div 
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link 
              href="/catalog" 
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
            <h1 className="text-3xl font-bold text-navy-800">Shopping Cart</h1>
            <p className="text-slate-600 mt-1">{groupedItems.length} products, {totalUnits} pieces total</p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm text-slate-500 hover:text-red-600 transition-colors"
          >
            Clear cart
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Cart Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Free Shipping Banner */}
            <div className={glassCard + " p-4"}>
              {qualifiesForFreeShipping ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500">
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-700">
                      You qualify for FREE shipping{multiWarehouse ? ' on all shipments' : ''}!
                    </p>
                    <p className="text-xs text-slate-500">Economy shipping on orders over $500</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      Add <span className="text-green-600 font-bold">{formatPrice(amountToFreeShipping)}</span> more for <span className="font-bold text-green-600">FREE shipping</span>
                    </p>
                    <div className="mt-2 h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Split Shipment Notice */}
            {multiWarehouse && (
              <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
                <Package className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Your items ship from {shipmentGroups.length} fulfillment centers
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    They&apos;ll arrive in separate packages. Shipping for each is shown at checkout.
                  </p>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div className={glassCard + " overflow-hidden"}>
              {/* Table Header */}
              <div className="bg-stone-100/80 border-b border-stone-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</span>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Size Distribution</span>
                </div>
              </div>

              {/* Product Rows */}
              <div className="divide-y divide-stone-200/60">
                {groupedItems.map((group) => {
                  const sizesToShow = group.availableSizes.length > 0 
                    ? getAllAvailableSizes(group.availableSizes)
                    : getOrderedSizes(group.sizes);
                  
                  return (
                    <div key={group.key} className="p-4">
                      {/* Product Info Row */}
                      <div className="flex items-start gap-4 mb-4">
                        {/* Image */}
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-white border border-stone-200 shadow-sm">
                          {group.imageUrl ? (
                            <Image
                              src={group.imageUrl}
                              alt={group.styleName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <Package className="h-8 w-8" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-medium text-brand-600 uppercase tracking-wide">{group.brandName}</p>
                              <h3 className="font-bold text-slate-800">
                                {group.productTitle || `${group.brandName} ${group.styleName}`}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5 text-sm text-slate-500">
                                <span>{group.colorName}</span>
                                <span>·</span>
                                <span>#{group.styleName}</span>
                                {group.hasDiscount && (
                                  <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                                    <Tag className="h-2.5 w-2.5" />
                                    Sale
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/product/${group.brandName.toLowerCase()}-${group.styleName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </Link>
                              <button
                                onClick={() => handleRemoveGroup(group)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Size Grid Table */}
                      <div className="overflow-x-auto -mx-4 px-4">
                        <table className="w-full min-w-[500px]">
                          <thead>
                            <tr className="border-b border-stone-200">
                              {sizesToShow.map((size) => {
                                return (
                                  <th key={size} className="px-1 py-2 text-center">
                                    <div className="text-xs font-bold text-slate-700 uppercase">{size}</div>
                                  </th>
                                );
                              })}
                              <th className="px-2 py-2 text-center min-w-[60px]">
                                <div className="text-xs font-bold text-slate-700 uppercase">QTY</div>
                              </th>
                              <th className="px-2 py-2 text-right min-w-[90px]">
                                <div className="text-xs font-bold text-slate-700 uppercase">Total</div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {sizesToShow.map((size) => {
                                const sizeData = group.sizes.get(size);
                                const hasQuantity = sizeData && sizeData.quantity > 0;
                                const availableSize = group.availableSizes.find(s => normalizeSize(s.name) === size);
                                const actualPrice = availableSize?.price || group.basePrice;
                                const hasUpcharge = actualPrice > group.basePrice;
                                
                                return (
                                  <td key={size} className="px-1 py-2 text-center">
                                    <div className="flex flex-col items-center">
                                      <input
                                        type="number"
                                        min="0"
                                        value={sizeData?.quantity || ''}
                                        placeholder=""
                                        onChange={(e) => handleQuantityChange(
                                          sizeData?.id || null,
                                          group,
                                          size,
                                          parseInt(e.target.value) || 0
                                        )}
                                        className={`w-14 h-9 text-center text-sm font-semibold rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors ${
                                          hasQuantity 
                                            ? 'bg-white border-2 border-brand-400 text-slate-900' 
                                            : 'bg-stone-50 border border-stone-300 text-slate-400'
                                        }`}
                                      />
                                      {hasUpcharge ? (
                                        <span className="text-[10px] text-orange-600 font-medium mt-0.5">
                                          +{formatPrice(actualPrice - group.basePrice)}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] mt-0.5 invisible">+$0.00</span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                              <td className="px-2 py-2 text-center">
                                <span className="text-sm font-bold text-slate-800 bg-stone-100 rounded-md px-3 py-1.5 inline-block">
                                  {group.totalQuantity}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-right">
                                <span className="text-base font-bold text-navy-800">
                                  {formatPrice(group.totalPrice)}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Price per piece note */}
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                          {group.totalQuantity} pcs @ {formatPrice(group.basePrice)}
                          {group.hasDiscount && <span className="text-green-600 ml-2">• Sale price</span>}
                          {group.hasVolumePrice && (
                            <span className="inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-medium">
                              Volume Price
                            </span>
                          )}
                        </span>
                      </div>
                      {/* Tier upsell nudge */}
                      {(() => {
                        if (group.hasFlatOverride) return null;
                        const upsell = getTierUpsell(group.styleId);
                        if (!upsell) return null;
                        return (
                          <p className="mt-1.5 text-xs font-medium text-brand-600">
                            Add {upsell.unitsNeeded} more for {formatPrice(upsell.nextPrice)}/pc — save {upsell.savingsPercent}%
                          </p>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>

              {/* Cart Total Row */}
              <div className="bg-stone-100/80 border-t border-stone-200 px-4 py-3">
                <div className="flex items-center justify-end gap-8">
                  <span className="text-sm font-semibold text-slate-600">
                    Total: <span className="text-slate-800">{totalUnits} pieces</span>
                  </span>
                  <span className="text-lg font-bold text-navy-800">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Decoration Services Pitch */}
            <DecorationPitch 
              totalUnits={totalUnits} 
              onOpenModal={openDecorationModal}
            />

            {/* Promo Code Section */}
            <div className={glassCard + " p-4"}>
              {appliedCoupon ? (
                <div className="rounded-lg border border-green-200 bg-green-50/80 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        You&apos;re saving {formatPrice(appliedCoupon.discountAmount)} with {appliedCoupon.code}
                      </p>
                      {appliedCoupon.freeShipping && (
                        <p className="text-xs text-green-700 mt-0.5">Free economy shipping applied</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-800"
                      onClick={() => { clearCoupon(); setPromoError(null); }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => { setPromoExpanded(!promoExpanded); setPromoError(null); }}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-sm font-medium text-slate-700">Have a promo code?</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${promoExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {promoExpanded && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={(e) => { setPromoCode(e.target.value); setPromoError(null); }}
                          placeholder="Enter code"
                          className="flex-1"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoCode.trim()}
                        >
                          {promoLoading ? 'Applying…' : 'Apply'}
                        </Button>
                      </div>
                      {promoError && (
                        <p className="text-sm text-red-600">{promoError}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="mt-8 lg:mt-0">
            <div className={glassCard + " p-6 lg:sticky lg:top-24"}>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Order Summary</h2>

              <div className="space-y-3 border-b border-stone-200 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal ({totalUnits} pieces)</span>
                  <span className="font-medium text-slate-800">{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">Discount ({appliedCoupon.code})</span>
                    <span className="font-medium text-green-600">-{formatPrice(appliedCoupon.discountAmount)}</span>
                  </div>
                )}
                {hasDiscounts && !appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">Discount applied</span>
                    <span className="font-medium text-green-600">Included</span>
                  </div>
                )}
                {decoration && (() => {
                  const decoratedDelivery = getDecoratedDeliveryEstimate('economy');
                  return (
                    <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 -mx-1">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 flex-shrink-0">
                          {decoration.type === 'screen-print' ? (
                            <Paintbrush className="h-4 w-4 text-green-600" />
                          ) : (
                            <Scissors className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-800">
                              {decoration.type === 'screen-print' ? 'Screen Printing' : 'Embroidery'} - {decoration.packageName}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{formatPrice(getDecorationTotal())}</span>
                              <button
                                onClick={clearDecoration}
                                className="rounded-full p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Remove decoration"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {totalUnits} pcs × {formatPrice(decoration.pricePerPiece)}/pc • Arrives {formatDateRange(decoratedDelivery.min, decoratedDelivery.max)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    Shipping{multiWarehouse ? ` (${shipmentGroups.length} shipments)` : ''}
                  </span>
                  <span className="font-medium">
                    {appliedCoupon?.freeShipping ? (
                      <span className="text-green-600 font-bold">FREE (promo)</span>
                    ) : qualifiesForFreeShipping ? (
                      <span className="text-green-600 font-bold">FREE</span>
                    ) : (
                      'Calculated at checkout'
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax</span>
                  <span className="font-medium text-slate-800">Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-4">
                <span className="text-lg font-bold text-slate-800">Estimated Total</span>
                <span className="text-2xl font-bold text-brand-600">
                  {formatPrice(getGrandTotal() - (appliedCoupon?.discountAmount ?? 0))}
                </span>
              </div>

              <Link href="/checkout">
                <Button className="w-full shadow-lg shadow-brand-500/25" size="lg">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              {/* Help Link */}
              <div className="mt-4 text-center">
                <a 
                  href="tel:+18559427636" 
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand-600 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Need help? Call (855) 942-7636
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Trust Strip */}
      <div className="relative z-10 border-t border-stone-200 bg-white/80 backdrop-blur-sm mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield className="h-4 w-4 text-green-600" />
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Truck className="h-4 w-4 text-brand-600" />
                <span>Ships within 24hrs</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <BadgeCheck className="h-4 w-4 text-blue-600" />
                <span>100% Satisfaction</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 mr-2">Accepted:</span>
              <div className="h-6 w-10 rounded bg-white shadow-sm flex items-center justify-center border border-stone-200">
                <span className="text-[8px] font-bold text-[#1434CB]">VISA</span>
              </div>
              <div className="h-6 w-10 rounded bg-white shadow-sm flex items-center justify-center border border-stone-200">
                <div className="flex">
                  <div className="w-2 h-2 rounded-full bg-[#EB001B] -mr-0.5"></div>
                  <div className="w-2 h-2 rounded-full bg-[#F79E1B]"></div>
                </div>
              </div>
              <div className="h-6 w-10 rounded bg-white shadow-sm flex items-center justify-center border border-stone-200">
                <span className="text-[8px] font-bold text-[#006FCF]">AMEX</span>
              </div>
              <div className="h-6 w-10 rounded bg-black shadow-sm flex items-center justify-center">
                <span className="text-[7px] font-semibold text-white">Pay</span>
              </div>
            </div>
          </div>
          
          <p className="text-center text-xs text-slate-500 mt-4">
            No hidden fees. The price you see is the price you pay.
          </p>
        </div>
      </div>

    </div>
  );
}
