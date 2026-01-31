/**
 * GA4 Analytics Utilities
 * 
 * Centralized analytics tracking for Enhanced Ecommerce events.
 * Uses gtag.js directly for type-safe, code-based tracking.
 */

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// ============ Types ============

export interface GA4Item {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
  discount?: number;
}

export interface CartItem {
  sku: string;
  styleId: number;
  styleName: string;
  productTitle?: string;
  brandName: string;
  colorName: string;
  colorCode?: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  discountedPrice?: number;
}

// ============ Core Helpers ============

/**
 * Check if analytics is available (gtag loaded)
 */
function isAnalyticsReady(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Generic event tracking
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (!isAnalyticsReady()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[GA4 Debug]', eventName, params);
    }
    return;
  }
  
  window.gtag('event', eventName, params);
}

// ============ Item Formatters ============

/**
 * Format a cart item for GA4
 */
export function formatCartItemForGA4(item: CartItem, index?: number): GA4Item {
  return {
    item_id: item.sku || `${item.styleId}-${item.colorName}-${item.sizeName}`,
    item_name: item.productTitle || `${item.brandName} ${item.styleName}`,
    item_brand: item.brandName,
    item_variant: `${item.colorName} / ${item.sizeName}`,
    price: item.discountedPrice ?? item.unitPrice,
    quantity: item.quantity,
    ...(item.discountedPrice && item.discountedPrice < item.unitPrice 
      ? { discount: item.unitPrice - item.discountedPrice } 
      : {}),
  };
}

/**
 * Format multiple cart items for GA4
 */
export function formatCartItemsForGA4(items: CartItem[]): GA4Item[] {
  return items.map((item, index) => formatCartItemForGA4(item, index));
}

// ============ Ecommerce Events ============

/**
 * Track product view
 */
export function trackViewItem(params: {
  itemId: string;
  itemName: string;
  itemBrand: string;
  itemCategory?: string;
  price: number;
  currency?: string;
}) {
  trackEvent('view_item', {
    currency: params.currency || 'USD',
    value: params.price,
    items: [{
      item_id: params.itemId,
      item_name: params.itemName,
      item_brand: params.itemBrand,
      item_category: params.itemCategory,
      price: params.price,
      quantity: 1,
    }],
  });
}

/**
 * Track add to cart
 */
export function trackAddToCart(params: {
  items: CartItem[];
  value: number;
  currency?: string;
}) {
  trackEvent('add_to_cart', {
    currency: params.currency || 'USD',
    value: params.value,
    items: formatCartItemsForGA4(params.items),
  });
}

/**
 * Track remove from cart
 */
export function trackRemoveFromCart(params: {
  items: CartItem[];
  value: number;
  currency?: string;
}) {
  trackEvent('remove_from_cart', {
    currency: params.currency || 'USD',
    value: params.value,
    items: formatCartItemsForGA4(params.items),
  });
}

/**
 * Track cart view
 */
export function trackViewCart(params: {
  items: CartItem[];
  value: number;
  currency?: string;
}) {
  trackEvent('view_cart', {
    currency: params.currency || 'USD',
    value: params.value,
    items: formatCartItemsForGA4(params.items),
  });
}

/**
 * Track checkout start
 */
export function trackBeginCheckout(params: {
  items: CartItem[];
  value: number;
  currency?: string;
  coupon?: string;
}) {
  trackEvent('begin_checkout', {
    currency: params.currency || 'USD',
    value: params.value,
    items: formatCartItemsForGA4(params.items),
    ...(params.coupon ? { coupon: params.coupon } : {}),
  });
}

/**
 * Track shipping info added
 */
export function trackAddShippingInfo(params: {
  items: CartItem[];
  value: number;
  shippingTier: string;
  currency?: string;
}) {
  trackEvent('add_shipping_info', {
    currency: params.currency || 'USD',
    value: params.value,
    shipping_tier: params.shippingTier,
    items: formatCartItemsForGA4(params.items),
  });
}

/**
 * Track payment info added
 */
export function trackAddPaymentInfo(params: {
  items: CartItem[];
  value: number;
  paymentType: string;
  currency?: string;
}) {
  trackEvent('add_payment_info', {
    currency: params.currency || 'USD',
    value: params.value,
    payment_type: params.paymentType,
    items: formatCartItemsForGA4(params.items),
  });
}

/**
 * Track purchase completion
 * Includes deduplication to prevent double-firing on page refresh
 */
export function trackPurchase(params: {
  transactionId: string;
  items: CartItem[];
  value: number;
  shipping?: number;
  tax?: number;
  currency?: string;
  coupon?: string;
}) {
  // Check for duplicate transaction
  if (typeof window !== 'undefined') {
    const trackedKey = `ga4_purchase_${params.transactionId}`;
    if (sessionStorage.getItem(trackedKey)) {
      console.log('[GA4] Duplicate purchase event prevented:', params.transactionId);
      return;
    }
    sessionStorage.setItem(trackedKey, 'true');
  }

  trackEvent('purchase', {
    transaction_id: params.transactionId,
    currency: params.currency || 'USD',
    value: params.value,
    shipping: params.shipping || 0,
    tax: params.tax || 0,
    items: formatCartItemsForGA4(params.items),
    ...(params.coupon ? { coupon: params.coupon } : {}),
  });
}

// ============ Custom Events ============

/**
 * Track decoration modal opened
 */
export function trackOpenDecorationModal(params: {
  totalUnits: number;
  cartValue: number;
}) {
  trackEvent('open_decoration_modal', {
    total_units: params.totalUnits,
    cart_value: params.cartValue,
  });
}

/**
 * Track decoration package selected
 */
export function trackAddDecoration(params: {
  decorationType: 'screen-print' | 'embroidery';
  packageId: string;
  packageName: string;
  pricePerPiece: number;
  totalValue: number;
  quantity: number;
}) {
  trackEvent('add_decoration', {
    decoration_type: params.decorationType,
    package_id: params.packageId,
    package_name: params.packageName,
    price_per_piece: params.pricePerPiece,
    value: params.totalValue,
    quantity: params.quantity,
  });
}

/**
 * Track decoration removed
 */
export function trackRemoveDecoration(params: {
  decorationType: 'screen-print' | 'embroidery';
  packageName: string;
  totalValue: number;
}) {
  trackEvent('remove_decoration', {
    decoration_type: params.decorationType,
    package_name: params.packageName,
    value: params.totalValue,
  });
}

/**
 * Track lead generation (large order form)
 */
export function trackGenerateLead(params?: {
  source?: string;
  value?: number;
}) {
  trackEvent('generate_lead', {
    source: params?.source || 'large_order_form',
    ...(params?.value ? { value: params.value } : {}),
  });
}

/**
 * Track custom quote request
 */
export function trackCustomQuoteRequest(params: {
  decorationType: 'screen-print' | 'embroidery';
  totalUnits: number;
}) {
  trackEvent('custom_quote_request', {
    decoration_type: params.decorationType,
    total_units: params.totalUnits,
  });
}

/**
 * Track phone click (for call tracking attribution)
 */
export function trackPhoneClick(params?: {
  phoneNumber?: string;
  source?: string;
}) {
  trackEvent('phone_click', {
    phone_number: params?.phoneNumber || '(855) 942-7636',
    source: params?.source || 'website',
    link_url: `tel:${params?.phoneNumber || '+18559427636'}`,
  });
}

/**
 * Track contact form submission
 */
export function trackContactFormSubmit(params?: {
  service?: string;
  hasPhone?: boolean;
  hasCompany?: boolean;
}) {
  trackEvent('generate_lead', {
    source: 'contact_form',
    service: params?.service || 'general',
    has_phone: params?.hasPhone || false,
    has_company: params?.hasCompany || false,
  });
}

/**
 * Track quote form submission
 */
export function trackQuoteFormSubmit(params: {
  totalItems: number;
  totalUnits: number;
  decorationType: string;
  estimatedValue?: number;
}) {
  trackEvent('generate_lead', {
    source: 'quote_form',
    total_items: params.totalItems,
    total_units: params.totalUnits,
    decoration_type: params.decorationType,
    value: params.estimatedValue,
  });
}
