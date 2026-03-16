'use client';

import { Fragment, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2, ShoppingCart, ArrowRight, Tag, Truck, Package, Plus, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { CartItem, AvailableSize } from '@/lib/database.types';
import { DecorationTeaser } from './DecorationTeaser';
import { hasTieredPricing, getEffectiveItemPrice, isVolumePriced } from '@/lib/tiered-pricing';
import { isMultiWarehouseCart, FREE_ECONOMY_THRESHOLD } from '@/lib/shipping';

// Quick category links for empty state
const quickCategories = [
  { name: 'T-Shirts', href: '/catalog?category=21' },
  { name: 'Fleece', href: '/catalog?category=9' },
  { name: 'Polos', href: '/catalog?category=52' },
  { name: 'Headwear', href: '/catalog?category=11' },
];

// Standard size order for consistent display
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'OS'];

// Helper to calculate upcharge from base price
function getSizeUpcharge(size: string, sizePrice: number, basePrice: number): number {
  return sizePrice > basePrice ? sizePrice - basePrice : 0;
}

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
  unitPrice: number;
  hasDiscount: boolean;
  hasVolumePrice: boolean;
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
        unitPrice: effectivePrice,
        hasDiscount: !!(item.discountedPrice && item.discountedPrice < item.unitPrice),
        hasVolumePrice: isVolumePriced(item.styleId, item.sizeName, totalStyleQty),
      });
    }

    const group = groups.get(key)!;
    
    // Merge available sizes (in case different items have the data)
    if (item.availableSizes && item.availableSizes.length > group.availableSizes.length) {
      group.availableSizes = item.availableSizes;
    }
    
    // Add or update size (store original item ID for updates)
    group.sizes.set(normalizedSize, {
      id: item.id,
      quantity: item.quantity,
      price: item.unitPrice,
      discountedPrice: item.discountedPrice,
      originalSize: item.sizeName,
    });
    
    group.totalQuantity += item.quantity;
    group.totalPrice += effectivePrice * item.quantity;
  }

  return Array.from(groups.values());
}

// Get ordered sizes that exist in a group (only ordered sizes)
function getOrderedSizes(sizes: Map<string, SizeData>): string[] {
  const sizeKeys = Array.from(sizes.keys());
  return SIZE_ORDER.filter(size => sizeKeys.includes(size));
}

// Get all available sizes in order
function getAllAvailableSizes(availableSizes: AvailableSize[]): string[] {
  const normalizedSizes = availableSizes.map(s => normalizeSize(s.name));
  return SIZE_ORDER.filter(size => normalizedSizes.includes(size));
}

// Glass card style
const glassCard = "bg-white/80 backdrop-blur-sm border border-stone-200/70 rounded-xl shadow-sm";

export function CartDrawer() {
  const { 
    items, 
    isDrawerOpen, 
    closeDrawer, 
    removeItem, 
    updateQuantity,
    addItem,
    getSubtotal,
    getTierUpsell,
    getTotalUnits,
  } = useCartStore();
  const router = useRouter();
  const subtotal = getSubtotal();
  const totalUnits = getTotalUnits();
  const freeShippingThreshold = FREE_ECONOMY_THRESHOLD;
  const awayFromFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const multiWarehouse = useMemo(() => isMultiWarehouseCart(items), [items]);
  
  // Track which groups have expanded size selector
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Group items by style and color
  const groupedItems = useMemo(() => groupItemsByStyleColor(items), [items]);
  
  const toggleGroupExpanded = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };
  
  const handleBrowseCatalog = () => {
    closeDrawer();
    router.push('/catalog');
  };
  
  const handleCategoryClick = (href: string) => {
    closeDrawer();
    router.push(href);
  };

  const handleCheckout = () => {
    closeDrawer();
    router.push('/checkout');
  };

  const handleViewCart = () => {
    closeDrawer();
    router.push('/cart');
  };

  // Handle quantity change for a specific size
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  // Add a new size to a group
  const handleAddSize = (group: GroupedItem, sizeName: string, originalSizeName: string, price: number) => {
    // Find an existing item from this group to get the metadata
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
      sizeName: originalSizeName,
      quantity: 1,
      unitPrice: price,
      discountedPrice: existingItem.discountedPrice ? price : undefined,
      discountSource: existingItem.discountSource,
      imageUrl: group.imageUrl,
      availableSizes: group.availableSizes,
    }, { openDrawer: false });
  };

  // Remove entire group
  const handleRemoveGroup = (group: GroupedItem) => {
    group.sizes.forEach((sizeData) => {
      removeItem(sizeData.id);
    });
  };

  if (!isDrawerOpen) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={closeDrawer}
      />

      {/* Drawer - Widened to 480px */}
      <div className="fixed bottom-0 right-0 top-0 z-[70] flex w-full max-w-[480px] flex-col bg-gradient-to-b from-stone-50 to-white shadow-2xl shadow-stone-900/20">
        {/* Subtle grain texture */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -right-20 top-20 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-40 h-40 w-40 rounded-full bg-navy-800/5 blur-3xl" />
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-stone-200/70 bg-white/70 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-md shadow-brand-500/25">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-800">Your Cart</h2>
              <p className="text-xs text-slate-500">{groupedItems.length} {groupedItems.length === 1 ? 'product' : 'products'} · {totalUnits} pieces</p>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="rounded-lg p-2.5 text-slate-400 hover:bg-stone-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {items.length > 0 && awayFromFreeShipping > 0 && (
          <div className="relative z-10 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm px-6 py-3 border-b border-green-100/70">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-green-600" />
              <span className="text-green-800">
                Add <span className="font-bold">{formatPrice(awayFromFreeShipping)}</span> for free shipping
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-green-200/70 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {items.length > 0 && awayFromFreeShipping <= 0 && (
          <div className="relative z-10 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm px-6 py-3 border-b border-green-100/70">
            <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
              <Truck className="h-4 w-4" />
              <span>You qualify for free shipping{multiWarehouse ? ' on all shipments' : ''}!</span>
            </div>
          </div>
        )}

        {items.length > 0 && multiWarehouse && (
          <div className="relative z-10 bg-blue-50/80 backdrop-blur-sm px-6 py-2.5 border-b border-blue-100/70">
            <p className="text-xs text-blue-800">
              <Package className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
              Items ship from 2 locations — arrives in separate packages
            </p>
          </div>
        )}

        {/* Items */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4">
              <div className="rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 p-6 shadow-inner">
                <ShoppingCart className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-navy-800">
                Your cart is empty
              </h3>
              <p className="mt-2 text-sm text-slate-500 max-w-xs">
                Browse our catalog and add items to your cart.
              </p>
              <Button onClick={handleBrowseCatalog} className="mt-6 shadow-lg shadow-brand-500/25">
                Browse Catalog
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              {/* Quick category links */}
              <div className="mt-8 w-full">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Quick Links
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickCategories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryClick(cat.href)}
                      className="rounded-full border border-stone-200 bg-white/70 backdrop-blur-sm px-3.5 py-1.5 text-sm text-slate-600 hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-600 transition-all shadow-sm"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map((group) => {
                const orderedSizes = getOrderedSizes(group.sizes);
                const isExpanded = expandedGroups.has(group.key);
                const allAvailableSizes = getAllAvailableSizes(group.availableSizes);
                const unorderedSizes = allAvailableSizes.filter(size => !group.sizes.has(size));
                const hasMoreSizes = unorderedSizes.length > 0;
                
                return (
                  <div
                    key={group.key}
                    className={glassCard + " p-4"}
                  >
                    {/* Product Header */}
                    <div className="flex gap-3 mb-3">
                      {/* Image */}
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white border border-stone-200/50 shadow-sm">
                        {group.imageUrl ? (
                          <Image
                            src={group.imageUrl}
                            alt={group.styleName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-brand-600">{group.brandName}</p>
                            <h4 className="font-bold text-slate-800 truncate">
                              {group.productTitle || `${group.brandName} ${group.styleName}`}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                              <span>{group.colorName}</span>
                              <span>·</span>
                              <span>#{group.styleName}</span>
                              {group.hasDiscount && (
                                <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                                  <Tag className="h-2.5 w-2.5" />
                                  Sale
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveGroup(group)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Size Table - Ordered sizes only */}
                    <div className="bg-stone-50/80 rounded-lg p-3">
                      <div className="grid grid-cols-4 gap-2">
                        {orderedSizes.map((size) => {
                          const sizeData = group.sizes.get(size);
                          if (!sizeData) return null;
                          
                          // Calculate upcharge from base price
                          const upcharge = getSizeUpcharge(size, sizeData.price, group.unitPrice);
                          
                          return (
                            <div key={size} className="flex flex-col items-center">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase mb-1">
                                {size}
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={sizeData.quantity}
                                onChange={(e) => handleQuantityChange(sizeData.id, parseInt(e.target.value) || 0)}
                                className="w-full h-8 text-center text-sm font-semibold bg-white border border-stone-200 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                              />
                              {upcharge > 0 ? (
                                <span className="text-[9px] text-orange-600 font-medium mt-0.5">
                                  +{formatPrice(upcharge)}
                                </span>
                              ) : (
                                <span className="text-[9px] mt-0.5 invisible">+$0.00</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Expandable Add Size Section */}
                      {hasMoreSizes && (
                        <div className="mt-3 pt-2 border-t border-stone-200/70">
                          <button
                            onClick={() => toggleGroupExpanded(group.key)}
                            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add size
                            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {isExpanded && (
                            <div className="mt-2 grid grid-cols-4 gap-2">
                              {unorderedSizes.map((size) => {
                                const availableSize = group.availableSizes.find(
                                  s => normalizeSize(s.name) === size
                                );
                                if (!availableSize) return null;
                                
                                // Calculate upcharge for this size
                                const upcharge = getSizeUpcharge(size, availableSize.price, group.unitPrice);
                                
                                return (
                                  <button
                                    key={size}
                                    onClick={() => handleAddSize(group, size, availableSize.name, availableSize.price)}
                                    className="flex flex-col items-center p-2 rounded-md border border-dashed border-stone-300 hover:border-brand-400 hover:bg-brand-50/50 transition-colors"
                                  >
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase">
                                      {size}
                                    </span>
                                    {upcharge > 0 ? (
                                      <span className="text-[9px] text-orange-600 font-medium">+{formatPrice(upcharge)}</span>
                                    ) : (
                                      <span className="text-[9px] text-slate-400">tap to add</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Line Summary */}
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {group.totalQuantity} pcs @ {formatPrice(group.unitPrice)}
                        {group.hasVolumePrice && (
                          <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-medium">
                            Volume Price
                          </span>
                        )}
                      </span>
                      <span className="font-bold text-navy-800">
                        {formatPrice(group.totalPrice)}
                      </span>
                    </div>
                    {(() => {
                      const upsell = getTierUpsell(group.styleId);
                      if (!upsell) return null;
                      return (
                        <p className="mt-1 text-[10px] font-medium text-brand-600">
                          Add {upsell.unitsNeeded} more for {formatPrice(upsell.nextPrice)}/pc — save {upsell.savingsPercent}%
                        </p>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="relative z-10 border-t border-stone-200/70 bg-white/80 backdrop-blur-sm p-5">
            {/* Decoration Teaser */}
            <div className="mb-4">
              <DecorationTeaser 
                totalUnits={totalUnits} 
                onNavigateToCart={handleViewCart}
              />
            </div>

            {/* Subtotal card */}
            <div className="mb-4 rounded-xl bg-gradient-to-br from-stone-50 to-stone-100/80 backdrop-blur-sm p-4 border border-stone-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-slate-600">{totalUnits} pieces</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Shipping & taxes at checkout
                  </p>
                </div>
                <span className="text-2xl font-bold text-navy-800">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            {/* Two Button Layout */}
            <div className="space-y-2">
              <Button 
                onClick={handleCheckout}
                className="w-full shadow-lg shadow-brand-500/25" 
                size="lg"
              >
                Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <button 
                onClick={handleViewCart}
                className="w-full py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors rounded-lg hover:bg-stone-50"
              >
                View Full Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </Fragment>
  );
}
