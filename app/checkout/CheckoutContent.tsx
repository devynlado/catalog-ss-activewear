'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { 
  ArrowLeft, 
  Truck, 
  Zap, 
  Lock, 
  Shield,
  BadgeCheck,
  Phone,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/cart-store';
import { calculateOrderTotals, toStripeCents, ShippingMethod } from '@/lib/stripe-utils';
import { calculateOrderTotalsWithCoupon } from '@/lib/coupon-utils';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { AddressAutocomplete, loadGoogleMapsScript, ParsedAddress } from '@/components/checkout/AddressAutocomplete';
import { OrderSummary } from './OrderSummary';
import { getDeliveryEstimate, getDecoratedDeliveryEstimate, formatDateRange } from './ShippingOptions';
import { trackBeginCheckout, trackGenerateLead, CartItem as GA4CartItem } from '@/lib/analytics';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface ShippingInfo {
  email: string;
  phone: string;
  company: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
}

interface BillingInfo extends ShippingInfo {}

const initialShippingInfo: ShippingInfo = {
  email: '',
  phone: '',
  company: '',
  firstName: '',
  lastName: '',
  address: '',
  apartment: '',
  city: '',
  state: '',
  zipCode: '',
};

const shippingOptions = [
  {
    id: 'economy' as ShippingMethod,
    name: 'Economy Shipping',
    price: 15,
    freeOver: 500,
    icon: Truck,
  },
  {
    id: 'same_day' as ShippingMethod,
    name: 'Express Shipping',
    price: 25,
    freeOver: null,
    icon: Zap,
  },
];

const usStates = [
  { code: '', name: 'Select state' },
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

// Card styles - stronger contrast/depth
const glassCard = "bg-white border border-stone-200 rounded-2xl shadow-xl shadow-stone-300/40";

// Stripe appearance configuration
const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#EE8935',
    colorBackground: '#ffffff',
    colorText: '#1e293b',
    colorDanger: '#dc2626',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    spacingUnit: '4px',
    borderRadius: '12px',
  },
  rules: {
    '.Input': {
      border: '1px solid #d6d3d1',
      boxShadow: 'none',
      padding: '12px 14px',
    },
    '.Input:focus': {
      border: '2px solid #EE8935',
      boxShadow: '0 0 0 3px rgba(238, 137, 53, 0.1)',
    },
    '.Label': {
      fontWeight: '500',
      fontSize: '14px',
      marginBottom: '6px',
    },
  },
};

// ---------- Inline Payment Form (deferred intent) ----------
// This component lives inside <Elements> and handles the full pay flow:
// 1. Validate card via elements.submit()
// 2. Create order + PaymentIntent on server
// 3. Confirm payment with returned clientSecret
// On card-declined retry, reuses the existing clientSecret to avoid duplicate orders.

interface InlinePaymentFormProps {
  items: Array<{
    id: string;
    sku: string;
    styleId: number;
    styleName: string;
    productTitle?: string;
    brandName: string;
    colorCode: string;
    colorName: string;
    sizeName: string;
    unitPrice: number;
    discountedPrice?: number;
    quantity: number;
    imageUrl?: string;
  }>;
  shippingInfo: ShippingInfo;
  shippingMethod: ShippingMethod;
  poNumber: string;
  orderNotes: string;
  isFormValid: boolean;
  missingFields: string[];
  total: number;
}

function InlinePaymentForm({
  items,
  shippingInfo,
  shippingMethod,
  poNumber,
  orderNotes,
  isFormValid,
  missingFields,
  total,
}: InlinePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Cache clientSecret + orderNumber after successful session creation
  // so declined-card retries reuse the same PI instead of creating duplicates
  const sessionRef = useRef<{ clientSecret: string; orderNumber: string } | null>(null);

  // Invalidate cached session when cart or shipping changes
  // (the amount would differ, so we need a fresh PaymentIntent)
  const prevCartKey = useRef('');
  const cartKey = JSON.stringify({ items: items.map(i => i.id + i.quantity), shippingMethod });
  if (cartKey !== prevCartKey.current) {
    prevCartKey.current = cartKey;
    sessionRef.current = null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isFormValid) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Step 1: Validate card details with Stripe (client-side only, no server call)
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setPaymentError(submitError.message || 'Please check your payment details.');
        setIsProcessing(false);
        return;
      }

      // Step 2: Create order + PaymentIntent on server (skip if we already have one from a prior attempt)
      let clientSecret = sessionRef.current?.clientSecret;
      let orderNumber = sessionRef.current?.orderNumber;

      if (!clientSecret) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        try {
          const response = await fetch('/api/checkout/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items,
              shippingInfo,
              shippingMethod,
              poNumber: poNumber || undefined,
              orderNotes: orderNotes || undefined,
              couponCode: appliedCoupon?.code ?? undefined,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to create checkout');
          }

          clientSecret = data.clientSecret;
          orderNumber = data.orderNumber;

          // Cache for retry
          sessionRef.current = { clientSecret: clientSecret!, orderNumber: orderNumber! };
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          if (fetchErr instanceof DOMException && fetchErr.name === 'AbortError') {
            setPaymentError('The request timed out. Please check your connection and try again.');
          } else {
            setPaymentError(fetchErr instanceof Error ? fetchErr.message : 'Something went wrong creating your order.');
          }
          setIsProcessing(false);
          return;
        }
      }

      // Step 3: Confirm payment with Stripe using the server-created PaymentIntent
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: clientSecret!,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order=${orderNumber}`,
        },
      });

      // Only reached if there's an immediate error (e.g. card declined).
      // On success, Stripe redirects to return_url.
      if (confirmError) {
        setPaymentError(confirmError.message || 'Your payment was not successful. Please try again.');
        // Don't clear sessionRef — the PI is reusable for retry after decline
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {paymentError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{paymentError}</p>
        </div>
      )}

      {!isFormValid && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-medium text-amber-800 mb-2">
            Complete the form above to pay:
          </p>
          <ul className="text-sm text-amber-700 space-y-1">
            {missingFields.map((field) => (
              <li key={field} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {field}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !isFormValid || isProcessing}
        isLoading={isProcessing}
        loadingText="Processing payment..."
        className="w-full"
        size="lg"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        Pay {formatPrice(total)} Now
      </Button>

      <p className="text-center text-xs text-slate-500">
        Your payment is encrypted and secure
      </p>
    </form>
  );
}

// ---------- Main Checkout Page ----------

export default function CheckoutContent() {
  const { items, decoration, getDecorationTotal, appliedCoupon } = useCartStore();
  
  // Form state
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>(initialShippingInfo);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>(initialShippingInfo);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('economy');
  const [poNumber, setPoNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  // General error state (for non-payment errors)
  const [error, setError] = useState<string | null>(null);

  // Calculate totals (with optional coupon)
  const subtotal = items.reduce((sum, item) => sum + (item.discountedPrice ?? item.unitPrice) * item.quantity, 0);
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const couponResult = appliedCoupon
    ? { discountAmount: appliedCoupon.discountAmount, freeShipping: appliedCoupon.freeShipping }
    : null;
  const totalsWithCoupon = calculateOrderTotalsWithCoupon(
    roundedSubtotal,
    shippingMethod,
    couponResult
  );
  const totals = calculateOrderTotals(items, shippingMethod);
  const actualShippingCost = totalsWithCoupon.shippingCost;
  const taxAmount = totalsWithCoupon.taxAmount;
  const orderTotal = totalsWithCoupon.total;

  // Track begin_checkout event when page loads with items
  useEffect(() => {
    if (items.length > 0) {
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
      trackBeginCheckout({ items: ga4Items, value: orderTotal });
    }
  }, []); // Only fire once on mount

  // Load Google Maps Places API for address autocomplete
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      loadGoogleMapsScript(apiKey).catch(() => {
        // Graceful fallback — autocomplete will degrade to regular input
      });
    }
  }, []);

  // Handle address selection from Google Places autocomplete
  const handleShippingAddressSelect = useCallback((address: ParsedAddress) => {
    setShippingInfo(prev => ({
      ...prev,
      address: address.formattedAddress,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
    }));
  }, []);

  const handleBillingAddressSelect = useCallback((address: ParsedAddress) => {
    setBillingInfo(prev => ({
      ...prev,
      address: address.formattedAddress,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
    }));
  }, []);

  // --- Lead capture: debounced fire when email + phone are filled ---
  const leadCapturedRef = useRef<string | null>(null);
  const leadDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending debounce
    if (leadDebounceRef.current) clearTimeout(leadDebounceRef.current);

    const email = shippingInfo.email.trim();
    const phone = shippingInfo.phone.replace(/\D/g, '');

    // Basic validation: valid-looking email and 10+ digit phone
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneValid = phone.length >= 10;

    if (!emailValid || !phoneValid) return;

    // Only fire once per unique email per session
    if (leadCapturedRef.current === email) return;

    leadDebounceRef.current = setTimeout(() => {
      leadCapturedRef.current = email;

      // Fire GA4 generate_lead event
      trackGenerateLead({ source: 'checkout', value: 250 });

      // Non-blocking lead capture API call
      const cartTotal = items.reduce(
        (sum, item) => sum + (item.discountedPrice ?? item.unitPrice) * item.quantity,
        0
      );
      fetch('/api/checkout/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone: shippingInfo.phone,
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          company: shippingInfo.company,
          cartItems: items.map(item => ({
            sku: item.sku,
            styleName: item.styleName,
            brandName: item.brandName,
            colorName: item.colorName,
            sizeName: item.sizeName,
            quantity: item.quantity,
            unitPrice: item.discountedPrice ?? item.unitPrice,
          })),
          cartTotal,
          itemCount: items.length,
        }),
      }).catch(() => {
        // Silent fail — never block checkout
      });
    }, 3000);

    return () => {
      if (leadDebounceRef.current) clearTimeout(leadDebounceRef.current);
    };
  }, [shippingInfo.email, shippingInfo.phone, shippingInfo.firstName, shippingInfo.lastName, shippingInfo.company, items]);

  // Form validation - get list of missing required fields
  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!shippingInfo.email) missing.push('Email');
    if (!shippingInfo.phone) missing.push('Phone');
    if (!shippingInfo.company) missing.push('Company Name');
    if (!shippingInfo.firstName) missing.push('First Name');
    if (!shippingInfo.lastName) missing.push('Last Name');
    if (!shippingInfo.address) missing.push('Street Address');
    if (!shippingInfo.city) missing.push('City');
    if (!shippingInfo.state) missing.push('State');
    if (!shippingInfo.zipCode) missing.push('ZIP Code');
    return missing;
  };

  const missingFields = getMissingFields();
  const isFormValid = missingFields.length === 0;

  // Handle input changes — no longer nullifies payment state
  const handleShippingChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleBillingChange = (field: keyof BillingInfo, value: string) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
  };

  // Get delivery estimates - adjust for decoration if present
  const economyDelivery = decoration 
    ? getDecoratedDeliveryEstimate('economy') 
    : getDeliveryEstimate('economy');
  const expressDelivery = decoration 
    ? getDecoratedDeliveryEstimate('same_day') 
    : getDeliveryEstimate('same_day');

  // Show empty cart message
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="rounded-full bg-gradient-to-br from-stone-100 to-stone-200 p-6 shadow-inner mb-6 mx-auto w-fit">
            <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy-800 mb-2">Your cart is waiting</h1>
          <p className="text-slate-600 mb-8">
            Add some items to your cart before proceeding to checkout.
          </p>
          <Link href="/catalog">
            <Button size="lg" className="shadow-lg shadow-brand-500/25">
              Browse Catalog
              <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex flex-col">
      {/* Grain texture overlay */}
      <div 
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/cart" 
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Link>
            <h1 className="text-3xl font-bold text-navy-800">Complete Your Order</h1>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <a 
              href="tel:+18559427636" 
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors"
            >
              <Phone className="h-4 w-4" />
              (855) 942-7636
            </a>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Lock className="h-4 w-4 text-green-600" />
              Secure Checkout
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-7 space-y-6">
            {/* Contact Information */}
            <div className={glassCard + " p-6"}>
              <h2 className="text-lg font-bold text-slate-800 mb-1">
                Where should we send order updates?
              </h2>
              <p className="text-sm text-slate-500 mb-4">We&apos;ll email you tracking info and delivery updates</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email address"
                  type="email"
                  value={shippingInfo.email}
                  onChange={(e) => handleShippingChange('email', e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
                <Input
                  label="Phone number"
                  type="tel"
                  value={shippingInfo.phone}
                  onChange={(e) => handleShippingChange('phone', e.target.value)}
                  placeholder="(555) 555-5555"
                  required
                  autoComplete="tel"
                  hint="For delivery updates"
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div className={glassCard + " p-6"}>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Delivery Address</h2>
              <div className="space-y-4">
                {/* Company Name - First and prominent for B2B */}
                <Input
                  label="Company Name"
                  value={shippingInfo.company}
                  onChange={(e) => handleShippingChange('company', e.target.value)}
                  placeholder="Your Company, Inc."
                  required
                  autoComplete="organization"
                  hint="Required for business deliveries"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First name"
                    value={shippingInfo.firstName}
                    onChange={(e) => handleShippingChange('firstName', e.target.value)}
                    placeholder="John"
                    required
                    autoComplete="given-name"
                  />
                  <Input
                    label="Last name"
                    value={shippingInfo.lastName}
                    onChange={(e) => handleShippingChange('lastName', e.target.value)}
                    placeholder="Doe"
                    required
                    autoComplete="family-name"
                  />
                </div>

                {/* Address with Google Places autocomplete */}
                <AddressAutocomplete
                  value={shippingInfo.address}
                  onChange={(value) => handleShippingChange('address', value)}
                  onAddressSelect={handleShippingAddressSelect}
                  label="Street address"
                  placeholder="Start typing your address..."
                  required
                />

                <Input
                  label="Apt, suite, unit (optional)"
                  value={shippingInfo.apartment}
                  onChange={(e) => handleShippingChange('apartment', e.target.value)}
                  placeholder="Suite 100"
                  autoComplete="address-line2"
                />

                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-2">
                    <Input
                      label="City"
                      value={shippingInfo.city}
                      onChange={(e) => handleShippingChange('city', e.target.value)}
                      placeholder="Los Angeles"
                      required
                      autoComplete="address-level2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      State<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <select
                      value={shippingInfo.state}
                      onChange={(e) => handleShippingChange('state', e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      required
                    >
                      {usStates.map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      label="ZIP code"
                      value={shippingInfo.zipCode}
                      onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                      placeholder="90001"
                      required
                      autoComplete="postal-code"
                    />
                  </div>
                </div>

                {/* Billing same as shipping toggle */}
                <label className="flex items-center gap-3 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">Billing address same as shipping</span>
                </label>
              </div>
            </div>

            {/* Billing Address - Collapsible */}
            <AnimatePresence>
              {!billingSameAsShipping && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className={glassCard + " p-6"}>
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Billing Address</h2>
                    <div className="space-y-4">
                      <Input
                        label="Company Name"
                        value={billingInfo.company}
                        onChange={(e) => handleBillingChange('company', e.target.value)}
                        placeholder="Your Company, Inc."
                        autoComplete="organization"
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="First name"
                          value={billingInfo.firstName}
                          onChange={(e) => handleBillingChange('firstName', e.target.value)}
                          placeholder="John"
                          autoComplete="given-name"
                        />
                        <Input
                          label="Last name"
                          value={billingInfo.lastName}
                          onChange={(e) => handleBillingChange('lastName', e.target.value)}
                          placeholder="Doe"
                          autoComplete="family-name"
                        />
                      </div>

                      <AddressAutocomplete
                        value={billingInfo.address}
                        onChange={(value) => handleBillingChange('address', value)}
                        onAddressSelect={handleBillingAddressSelect}
                        label="Street address"
                        placeholder="Start typing your address..."
                      />

                      <Input
                        label="Apt, suite, unit (optional)"
                        value={billingInfo.apartment}
                        onChange={(e) => handleBillingChange('apartment', e.target.value)}
                        placeholder="Suite 100"
                        autoComplete="address-line2"
                      />

                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-2">
                          <Input
                            label="City"
                            value={billingInfo.city}
                            onChange={(e) => handleBillingChange('city', e.target.value)}
                            placeholder="Los Angeles"
                            autoComplete="address-level2"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            State
                          </label>
                          <select
                            value={billingInfo.state}
                            onChange={(e) => handleBillingChange('state', e.target.value)}
                            className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          >
                            {usStates.map((state) => (
                              <option key={state.code} value={state.code}>
                                {state.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            label="ZIP code"
                            value={billingInfo.zipCode}
                            onChange={(e) => handleBillingChange('zipCode', e.target.value)}
                            placeholder="90001"
                            autoComplete="postal-code"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Order Details - Now on the left side */}
            <div className={glassCard + " p-6"}>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Order Details</h2>
              <p className="text-sm text-slate-500 mb-4">Optional - for your internal records</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="PO Number"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="PO-12345"
                  hint="We'll include this on your invoice"
                />
                <div className="sm:col-span-1">
                  <Textarea
                    label="Order Notes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Delivery instructions, special requests..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary, Shipping, Payment (Sticky) */}
          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Order Summary - Read-only with size grid */}
              <OrderSummary
                items={items}
                shippingMethod={shippingMethod}
                shippingCost={actualShippingCost}
                taxAmount={taxAmount}
                isEditable={true}
                decoration={decoration}
                couponDiscount={appliedCoupon?.discountAmount}
                couponCode={appliedCoupon?.code}
              />

              {/* Shipping Method */}
              <div className={glassCard + " p-5"}>
                <h3 className="font-bold text-slate-800 mb-4">Shipping Method</h3>
                <div className="space-y-3">
                  {shippingOptions.map((option) => {
                    const isFree = option.freeOver && subtotal >= option.freeOver;
                    const Icon = option.icon;
                    const estimate = option.id === 'economy' ? economyDelivery : expressDelivery;
                    
                    return (
                      <label
                        key={option.id}
                        className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                          shippingMethod === option.id
                            ? 'border-brand-500 bg-white/80 ring-2 ring-brand-500/20'
                            : 'border-stone-200 hover:border-stone-300 bg-white/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          value={option.id}
                          checked={shippingMethod === option.id}
                          onChange={() => setShippingMethod(option.id)}
                          className="sr-only"
                        />
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          shippingMethod === option.id 
                            ? 'bg-brand-500 text-white' 
                            : 'bg-stone-100 text-slate-600'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{option.name}</p>
                            {isFree && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                FREE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            Arrives {formatDateRange(estimate.min, estimate.max)}
                          </p>
                        </div>
                        <div className="text-right">
                          {isFree ? (
                            <>
                              <p className="font-semibold text-green-600">Free</p>
                              <p className="text-xs text-slate-400 line-through">{formatPrice(option.price)}</p>
                            </>
                          ) : (
                            <p className="font-semibold text-slate-900">{formatPrice(option.price)}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Payment Section — always visible, deferred intent */}
              <div className={glassCard + " p-5"}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800">Secure Payment</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Lock className="h-3.5 w-3.5 text-green-600" />
                    Secured by Stripe
                  </div>
                </div>

                <Elements
                  stripe={stripePromise}
                  options={{
                    mode: 'payment',
                    amount: toStripeCents(orderTotal),
                    currency: 'usd',
                    appearance: stripeAppearance,
                  }}
                >
                  <InlinePaymentForm
                    items={items}
                    shippingInfo={shippingInfo}
                    shippingMethod={shippingMethod}
                    poNumber={poNumber}
                    orderNotes={orderNotes}
                    isFormValid={isFormValid}
                    missingFields={missingFields}
                    total={orderTotal}
                  />
                </Elements>

                {/* Reassurance message */}
                <p className="mt-4 text-center text-xs text-slate-500">
                  Your order is protected by our 100% satisfaction guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Trust Strip */}
      <div className="relative z-10 border-t border-stone-200 bg-white/80 backdrop-blur-sm mt-12">
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
          
          {/* No hidden fees */}
          <p className="text-center text-xs text-slate-500 mt-4">
            No hidden fees. The price you see is the price you pay.
          </p>
        </div>
      </div>
    </div>
  );
}
