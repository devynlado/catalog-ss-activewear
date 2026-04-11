/**
 * GA4 + Google Ads Analytics Utilities
 * 
 * Centralized analytics tracking for Enhanced Ecommerce events.
 * Uses gtag.js directly for type-safe, code-based tracking.
 * Purchase events include cart data for Google Ads conversion tracking
 * with profit reporting (matches item_id to GMC feed COGS).
 */

// Google Ads conversion tracking config (client-side env vars)
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID;
const GADS_LABEL = process.env.NEXT_PUBLIC_GADS_CONVERSION_LABEL;
const MERCHANT_ID = process.env.NEXT_PUBLIC_GOOGLE_MERCHANT_ID;

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// ============ Types ============

export interface GA4Item {
  id: string;       // Google Ads cart data field (matches GMC feed id)
  item_id: string;   // GA4 ecommerce field
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
  googleDiscountPercent?: number;
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
 * Wait for gtag to become available after a fresh page load.
 * After Stripe redirects to the success page, gtag.js needs time to download
 * and initialize. This polls every 200ms and gives up after maxWaitMs.
 */
function waitForGtag(maxWaitMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isAnalyticsReady()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (isAnalyticsReady()) {
        clearInterval(interval);
        console.log(`[Analytics] gtag ready after ${Date.now() - startTime}ms`);
        resolve(true);
      } else if (Date.now() - startTime >= maxWaitMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, 200);
  });
}

/**
 * Generic event tracking (fire-and-forget for non-critical events)
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (!isAnalyticsReady()) {
    console.warn(`[Analytics] gtag not ready, dropping "${eventName}" event`);
    return;
  }
  
  window.gtag('event', eventName, params);
}

// ============ Item Formatters ============

/**
 * Format a cart item for GA4
 */
export function formatCartItemForGA4(item: CartItem, index?: number): GA4Item {
  const sku = item.sku || `${item.styleId}-${item.colorName}-${item.sizeName}`;
  return {
    id: sku,        // Google Ads cart data matching (must match GMC feed `id`)
    item_id: sku,   // GA4 ecommerce tracking
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
    cart_value: params.value, // for GA4 custom metric "Value added to cart"
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
    checkout_value: params.value, // for GA4 custom metric "Value at checkout"
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
 * - Waits for gtag to load (handles fresh page loads after Stripe redirect)
 * - Sends to both GA4 and Google Ads with conversion label
 * - Deduplicates to prevent double-firing on page refresh
 */
export async function trackPurchase(params: {
  transactionId: string;
  items: CartItem[];
  value: number;
  shipping?: number;
  tax?: number;
  currency?: string;
  coupon?: string;
}) {
  const TAG = '[Purchase Tracking]';

  // ---- Env var check (surfaces missing config immediately) ----
  if (!GA4_ID) console.warn(`${TAG} NEXT_PUBLIC_GA4_ID is not set — GA4 won't receive this event`);
  if (!GADS_ID) console.warn(`${TAG} NEXT_PUBLIC_GADS_ID is not set — Google Ads conversion won't fire`);
  if (!GADS_LABEL) console.warn(`${TAG} NEXT_PUBLIC_GADS_CONVERSION_LABEL is not set — Google Ads conversion won't fire`);
  if (!MERCHANT_ID) console.warn(`${TAG} NEXT_PUBLIC_GOOGLE_MERCHANT_ID is not set — cart data matching disabled`);

  // ---- Dedup check ----
  if (typeof window !== 'undefined') {
    const trackedKey = `ga4_purchase_${params.transactionId}`;
    if (sessionStorage.getItem(trackedKey)) {
      console.log(`${TAG} Duplicate prevented for ${params.transactionId}`);
      return;
    }
    sessionStorage.setItem(trackedKey, 'true');
  }

  // ---- Wait for gtag to load (critical after Stripe redirect) ----
  const gtagReady = await waitForGtag();
  if (!gtagReady) {
    console.error(`${TAG} FAILED: gtag did not load within 3 seconds. Purchase event NOT sent for ${params.transactionId}`);
    // Remove dedup flag so a page refresh can retry
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`ga4_purchase_${params.transactionId}`);
    }
    return;
  }

  // ---- Event 1: GA4 purchase event (for analytics reporting) ----
  const ga4Payload = {
    ...(GA4_ID ? { send_to: GA4_ID } : {}),
    transaction_id: params.transactionId,
    currency: params.currency || 'USD',
    value: params.value,
    shipping: params.shipping || 0,
    tax: params.tax || 0,
    items: formatCartItemsForGA4(params.items),
    ...(params.coupon ? { coupon: params.coupon } : {}),
  };

  console.log(`${TAG} Firing GA4 purchase event:`, {
    transaction_id: params.transactionId,
    value: params.value,
    send_to: GA4_ID,
    item_count: params.items.length,
  });

  window.gtag('event', 'purchase', ga4Payload);

  // ---- Calculate order-level discount from per-item savings ----
  const totalDiscount = params.items.reduce((sum, item) => {
    if (item.discountedPrice && item.discountedPrice < item.unitPrice) {
      return sum + (item.unitPrice - item.discountedPrice) * item.quantity;
    }
    return sum;
  }, 0);
  const roundedDiscount = Math.round(totalDiscount * 100) / 100;

  // ---- Event 2: Google Ads conversion event (matches their snippet exactly) ----
  if (GADS_ID && GADS_LABEL) {
    const gadsPayload = {
      send_to: `${GADS_ID}/${GADS_LABEL}`,
      transaction_id: params.transactionId,
      currency: params.currency || 'USD',
      value: params.value,
      discount: roundedDiscount,
      items: formatCartItemsForGA4(params.items),
      ...(MERCHANT_ID ? {
        aw_merchant_id: Number(MERCHANT_ID),
        aw_feed_country: 'US',
        aw_feed_language: 'EN',
      } : {}),
    };

    console.log(`${TAG} Firing Google Ads purchase event (full payload):`, gadsPayload);

    window.gtag('event', 'purchase', gadsPayload);
  } else {
    console.warn(`${TAG} Google Ads conversion NOT fired — missing GADS_ID or GADS_LABEL`);
  }

  // ---- Event 3: GTM dataLayer push (for GTM-based Google Ads conversion with cart data) ----
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ ecommerce: null });

    const gtmPayload = {
      event: 'purchase_complete',
      transaction_id: params.transactionId,
      value: params.value,
      currency: params.currency || 'USD',
      shipping: params.shipping || 0,
      tax: params.tax || 0,
      discount: roundedDiscount,
      ...(params.coupon ? { coupon: params.coupon } : {}),
      aw_merchant_id: MERCHANT_ID ? Number(MERCHANT_ID) : undefined,
      aw_feed_country: 'US',
      aw_feed_language: 'EN',
      items: params.items.map(item => {
        const sku = item.sku || `${item.styleId}-${item.colorName}-${item.sizeName}`;
        return {
          id: sku,
          price: item.unitPrice,
          quantity: item.quantity,
        };
      }),
    };

    console.log(`${TAG} Pushing GTM dataLayer purchase_complete:`, gtmPayload);

    window.dataLayer.push(gtmPayload);
  }

  console.log(`${TAG} All tracking events sent for ${params.transactionId}`);
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
  contact_source_page?: string;
}) {
  trackEvent('phone_click', {
    phone_number: params?.phoneNumber || '(855) 942-7636',
    source: params?.source || 'website',
    link_url: `tel:${params?.phoneNumber || '+18559427636'}`,
    ...(params?.contact_source_page != null && params.contact_source_page !== ''
      ? { contact_source_page: params.contact_source_page }
      : {}),
  });
  trackEvent('contact_phone_click', {
    contact_source_page: params?.contact_source_page != null && params.contact_source_page !== '' ? params.contact_source_page : '(direct)',
  });
}

/**
 * Track contact form submission (and contact_form_submit for CTA report)
 */
export function trackContactFormSubmit(params?: {
  service?: string;
  hasPhone?: boolean;
  hasCompany?: boolean;
  contact_source_page?: string;
}) {
  trackEvent('generate_lead', {
    source: 'contact_form',
    service: params?.service || 'general',
    has_phone: params?.hasPhone || false,
    has_company: params?.hasCompany || false,
    ...(params?.contact_source_page != null && params.contact_source_page !== ''
      ? { contact_source_page: params.contact_source_page }
      : {}),
  });
  trackEvent('contact_form_submit', {
    contact_source_page: params?.contact_source_page != null && params.contact_source_page !== '' ? params.contact_source_page : '(direct)',
  });
}

/**
 * Track email link click on contact page (for CTA report)
 */
export function trackContactEmailClick(params?: { contact_source_page?: string }) {
  trackEvent('contact_email_click', {
    contact_source_page: params?.contact_source_page && params.contact_source_page !== '' ? params.contact_source_page : '(direct)',
  });
}

/**
 * Track location/maps link click on contact page (for CTA report)
 */
export function trackContactLocationClick(params?: { contact_source_page?: string }) {
  trackEvent('contact_location_click', {
    contact_source_page: params?.contact_source_page && params.contact_source_page !== '' ? params.contact_source_page : '(direct)',
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

// ============ Package Deals Events ============

/**
 * Track packages page view
 */
export function trackPackagesPageView(params?: {
  referrer?: string;
}) {
  trackEvent('packages_page_view', {
    referrer: params?.referrer || document?.referrer || 'direct',
  });
}

/**
 * Track package card click (user selects a package)
 */
export function trackPackageCardClick(params: {
  packageId: string;
  packageName: string;
}) {
  trackEvent('package_card_click', {
    package_id: params.packageId,
    package_name: params.packageName,
  });
}

/**
 * Track product selection in packages flow
 */
export function trackPackageProductSelected(params: {
  productId: string;
  productName: string;
  packageId: string;
}) {
  trackEvent('package_product_selected', {
    product_id: params.productId,
    product_name: params.productName,
    package_id: params.packageId,
  });
}

/**
 * Track form start (user begins filling form)
 */
export function trackPackageFormStart(params: {
  packageId: string;
  productId: string;
  quantity: number;
}) {
  trackEvent('package_form_start', {
    package_id: params.packageId,
    product_id: params.productId,
    quantity: params.quantity,
  });
}

/**
 * Track package form submission
 */
export function trackPackageFormSubmit(params: {
  packageId: string;
  packageName: string;
  productId: string;
  productName: string;
  quantity: number;
  estimatedValue: number;
  rushOrder: boolean;
  hasLogo: boolean;
}) {
  trackEvent('generate_lead', {
    source: 'package_form',
    package_id: params.packageId,
    package_name: params.packageName,
    product_id: params.productId,
    product_name: params.productName,
    quantity: params.quantity,
    value: params.estimatedValue,
    rush_order: params.rushOrder,
    has_logo: params.hasLogo,
  });
}

/**
 * Track exit intent popup shown
 */
export function trackExitIntentShown(params?: {
  timeOnPage?: number;
  page?: string;
}) {
  trackEvent('exit_intent_shown', {
    time_on_page: params?.timeOnPage,
    page: params?.page || 'packages',
  });
}

/**
 * Track exit intent click (user clicks sample pack CTA)
 */
export function trackExitIntentClick() {
  trackEvent('exit_intent_click', {
    destination: 'samples',
  });
}

// ============ Sample Packs Events ============

/**
 * Track samples page view
 */
export function trackSamplesPageView() {
  trackEvent('samples_page_view', {
    referrer: typeof document !== 'undefined' ? document.referrer : 'direct',
  });
}

/**
 * Track sample pack added to cart
 */
export function trackSamplePackAddToCart(params: {
  packId: string;
  packName: string;
  price: number;
}) {
  trackEvent('sample_pack_add_to_cart', {
    pack_id: params.packId,
    pack_name: params.packName,
    price: params.price,
  });
}

/**
 * Track sample pack checkout start
 */
export function trackSamplePackCheckout(params: {
  packIds: string[];
  totalValue: number;
  itemCount: number;
}) {
  trackEvent('begin_checkout', {
    source: 'sample_packs',
    pack_ids: params.packIds.join(','),
    value: params.totalValue,
    item_count: params.itemCount,
  });
}
