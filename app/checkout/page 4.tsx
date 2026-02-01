'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Loader2, Lock, Mail, Phone, Building, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { ShippingAddress } from '@/lib/database.types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { OrderSummary } from './OrderSummary';
import { ShippingOptions, ShippingMethod } from './ShippingOptions';
import { TrustSignals, CutoffBanner, GuaranteeBadges } from './TrustSignals';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// Load Stripe outside component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal } = useCartStore();
  
  // Form state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('economy');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Shipping address
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
  });
  
  // Billing address (only used if different from shipping)
  const [billingAddress, setBillingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
  });
  
  // Payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [isUpdatingIntent, setIsUpdatingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCreatedIntent = useRef(false);

  // Calculate shipping cost
  const subtotal = getSubtotal();
  const freeEconomyThreshold = 500;
  const shippingCost = shippingMethod === 'same_day' 
    ? 25 
    : (subtotal >= freeEconomyThreshold ? 0 : 15);

  // Create payment intent immediately on page load
  const createPaymentIntent = useCallback(async () => {
    if (hasCreatedIntent.current || items.length === 0) return;
    hasCreatedIntent.current = true;
    
    setIsCreatingIntent(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerEmail: 'pending@checkout.temp', // Placeholder - will be updated
          shippingAddress: {
            firstName: 'Pending',
            lastName: 'Customer',
            address1: 'TBD',
            city: 'TBD',
            state: 'CA',
            zipCode: '00000',
            country: 'US',
          },
          shippingMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setOrderId(data.orderId);
      setOrderNumber(data.orderNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      hasCreatedIntent.current = false; // Allow retry
    } finally {
      setIsCreatingIntent(false);
    }
  }, [items, shippingMethod]);

  // Create payment intent on mount
  useEffect(() => {
    if (items.length > 0 && !hasCreatedIntent.current) {
      createPaymentIntent();
    }
  }, [items, createPaymentIntent]);

  // Update payment intent when shipping method changes
  useEffect(() => {
    if (!paymentIntentId || !orderId) return;
    
    const updatePaymentIntent = async () => {
      setIsUpdatingIntent(true);
      try {
        await fetch('/api/checkout/update-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId,
            orderId,
            items,
            shippingMethod,
          }),
        });
      } catch (err) {
        console.error('Failed to update payment intent:', err);
      } finally {
        setIsUpdatingIntent(false);
      }
    };

    updatePaymentIntent();
  }, [shippingMethod, paymentIntentId, orderId, items]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/catalog');
    }
  }, [items, router]);

  const handleShippingChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };
  
  const handleBillingChange = (field: keyof ShippingAddress, value: string) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
  };

  const isFormComplete = Boolean(
    email && 
    shippingAddress.firstName && 
    shippingAddress.lastName && 
    shippingAddress.address1 && 
    shippingAddress.city && 
    shippingAddress.state && 
    shippingAddress.zipCode &&
    (billingSameAsShipping || (
      billingAddress.firstName && 
      billingAddress.lastName && 
      billingAddress.address1 && 
      billingAddress.city && 
      billingAddress.state && 
      billingAddress.zipCode
    ))
  );

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Your cart is empty</h2>
          <p className="mt-2 text-sm text-slate-500">Add items to your cart to checkout</p>
          <Link
            href="/catalog"
            className="mt-4 inline-flex items-center text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const stripeOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#EE8935',
        colorBackground: '#ffffff',
        colorText: '#1e293b',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  } : undefined;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-stone-50/50 to-stone-100">
      {/* Grain texture overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-80 w-80 rounded-full bg-navy-800/5 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 bottom-0 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link 
            href="/catalog" 
            className="mb-4 inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </motion.div>

        {/* Page title */}
        <motion.h1 
          className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Checkout
        </motion.h1>

        {/* Cutoff Banner */}
        <CutoffBanner />

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* LEFT COLUMN - Form */}
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Contact Information */}
            <motion.div 
              variants={itemVariants}
              className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm p-6 shadow-lg shadow-stone-200/50"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">Contact Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-lg border border-stone-200 pl-10 pr-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Phone (optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full rounded-lg border border-stone-200 pl-10 pr-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Company (optional)
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Company name"
                        className="w-full rounded-lg border border-stone-200 pl-10 pr-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Shipping Address */}
            <motion.div 
              variants={itemVariants}
              className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm p-6 shadow-lg shadow-stone-200/50"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">Shipping Address</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.firstName}
                      onChange={(e) => handleShippingChange('firstName', e.target.value)}
                      className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.lastName}
                      onChange={(e) => handleShippingChange('lastName', e.target.value)}
                      className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.address1}
                    onChange={(e) => handleShippingChange('address1', e.target.value)}
                    placeholder="Street address"
                    className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Apartment, suite, etc. (optional)
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.address2}
                    onChange={(e) => handleShippingChange('address2', e.target.value)}
                    className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => handleShippingChange('city', e.target.value)}
                      className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => handleShippingChange('state', e.target.value)}
                      placeholder="CA"
                      className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.zipCode}
                      onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                      placeholder="90210"
                      className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Billing Address Toggle */}
            <motion.div 
              variants={itemVariants}
              className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm p-6 shadow-lg shadow-stone-200/50"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="billingSame"
                  checked={billingSameAsShipping}
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="billingSame" className="text-sm font-medium text-slate-700">
                  Billing address same as shipping
                </label>
              </div>
              
              {/* Billing Address Form (if different) */}
              {!billingSameAsShipping && (
                <div className="mt-4 pt-4 border-t border-stone-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Billing Address</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={billingAddress.firstName}
                        onChange={(e) => handleBillingChange('firstName', e.target.value)}
                        className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={billingAddress.lastName}
                        onChange={(e) => handleBillingChange('lastName', e.target.value)}
                        className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={billingAddress.address1}
                      onChange={(e) => handleBillingChange('address1', e.target.value)}
                      placeholder="Street address"
                      className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={billingAddress.city}
                        onChange={(e) => handleBillingChange('city', e.target.value)}
                        className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={billingAddress.state}
                        onChange={(e) => handleBillingChange('state', e.target.value)}
                        className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        value={billingAddress.zipCode}
                        onChange={(e) => handleBillingChange('zipCode', e.target.value)}
                        className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* PO Number (optional) */}
            <motion.div 
              variants={itemVariants}
              className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm p-6 shadow-lg shadow-stone-200/50"
            >
              <label className="block text-sm font-medium text-slate-700 mb-1">
                PO Number (optional)
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Your purchase order number"
                className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">For your records - will appear on invoice</p>
            </motion.div>

            {/* Trust Signals */}
            <motion.div variants={itemVariants}>
              <TrustSignals />
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN - Order Summary, Shipping, Payment */}
          <motion.div 
            className="space-y-4 lg:sticky lg:top-6 lg:self-start"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Order Summary */}
            <OrderSummary 
              items={items}
              shippingMethod={shippingMethod}
              shippingCost={shippingCost}
            />

            {/* Shipping Options */}
            <div className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm p-4 shadow-lg shadow-stone-200/50">
              <ShippingOptions
                selected={shippingMethod}
                onSelect={setShippingMethod}
                subtotal={subtotal}
              />
            </div>

            {/* Payment Section */}
            <div className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm p-4 shadow-lg shadow-stone-200/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Payment</h3>
                {isUpdatingIntent && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating...
                  </span>
                )}
              </div>
              
              {clientSecret && stripeOptions ? (
                <Elements stripe={stripePromise} options={stripeOptions}>
                  <PaymentFormContent 
                    clientSecret={clientSecret}
                    orderId={orderId!}
                    orderNumber={orderNumber!}
                    email={email}
                    phone={phone}
                    company={company}
                    shippingAddress={shippingAddress}
                    billingAddress={billingSameAsShipping ? shippingAddress : billingAddress}
                    poNumber={poNumber}
                    isFormComplete={isFormComplete}
                    termsAccepted={termsAccepted}
                    setTermsAccepted={setTermsAccepted}
                    error={error}
                    setError={setError}
                  />
                </Elements>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-stone-50 border border-stone-200 p-6 text-center">
                    {isCreatingIntent ? (
                      <>
                        <Loader2 className="h-6 w-6 text-brand-500 mx-auto mb-2 animate-spin" />
                        <p className="text-sm text-slate-600">Loading secure payment...</p>
                      </>
                    ) : (
                      <>
                        <Lock className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">Secure payment loading...</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {error && !clientSecret && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button 
                    onClick={() => { hasCreatedIntent.current = false; createPaymentIntent(); }}
                    className="mt-2 text-sm font-medium text-red-700 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>

            {/* Guarantees */}
            <div className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm p-4 shadow-lg shadow-stone-200/50">
              <GuaranteeBadges />
            </div>

            {/* Support */}
            <div className="rounded-2xl bg-gradient-to-br from-brand-50/50 to-white border border-brand-100/50 p-4 text-center">
              <p className="text-sm text-slate-600">
                Need help? Call{' '}
                <a href="tel:+18559427636" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                  (855) 942-7636
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Separate component for payment form (must be inside Elements provider)
function PaymentFormContent({ 
  clientSecret,
  orderId,
  orderNumber, 
  email,
  phone,
  company,
  shippingAddress,
  billingAddress,
  poNumber,
  isFormComplete,
  termsAccepted, 
  setTermsAccepted,
  error,
  setError
}: { 
  clientSecret: string;
  orderId: string;
  orderNumber: string;
  email: string;
  phone: string;
  company: string;
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
  poNumber: string;
  isFormComplete: boolean;
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isFormComplete) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsProcessing(true);
    setError(null);

    try {
      // First, update the order with actual customer details
      const updateResponse = await fetch('/api/checkout/update-order-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerEmail: email,
          customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          customerPhone: phone || shippingAddress.phone,
          company: company || shippingAddress.company,
          shippingAddress,
          billingAddress,
          poNumber: poNumber || undefined,
        }),
      });

      if (!updateResponse.ok) {
        const data = await updateResponse.json();
        throw new Error(data.error || 'Failed to update order details');
      }

      // Confirm card payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret!,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${billingAddress.firstName} ${billingAddress.lastName}`,
              email: email,
              phone: phone || billingAddress.phone || undefined,
              address: {
                line1: billingAddress.address1,
                line2: billingAddress.address2 || undefined,
                city: billingAddress.city,
                state: billingAddress.state,
                postal_code: billingAddress.zipCode,
                country: billingAddress.country,
              },
            },
          },
          receipt_email: email,
        }
      );

      if (confirmError) {
        throw confirmError;
      }

      // Payment succeeded - redirect to success page
      if (paymentIntent?.status === 'succeeded') {
        window.location.href = `${window.location.origin}/checkout/success?order=${orderNumber}`;
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const canSubmit = stripe && elements && isFormComplete && termsAccepted && !isProcessing;

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1e293b',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': {
          color: '#94a3b8',
        },
        iconColor: '#64748b',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">
            Card Details
          </label>
          <div className="flex items-center gap-1.5">
            <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-5" />
            <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-5" />
            <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" className="h-5" />
            <img src="https://js.stripe.com/v3/fingerprinted/img/discover-ac52cd46f89fa40a29a0bfb954e33173.svg" alt="Discover" className="h-5" />
          </div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-4 py-3.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
          <CardElement options={cardElementOptions} />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Lock className="h-3 w-3" />
          <span>Your payment is encrypted and secure</span>
        </div>
      </div>
      
      {/* Terms Checkbox */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
        />
        <label htmlFor="terms" className="text-xs text-slate-600">
          I agree to the{' '}
          <a href="/terms" className="text-brand-600 hover:underline" target="_blank">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-brand-600 hover:underline" target="_blank">
            Privacy Policy
          </a>
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!isFormComplete && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs font-medium text-amber-700">
            Complete the shipping details to place your order
          </p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!canSubmit}
        size="lg"
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Place Order
          </>
        )}
      </Button>
    </form>
  );
}
