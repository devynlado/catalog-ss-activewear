'use client';

import { useCallback, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

// Initialize Stripe only when publishable key is set
const stripePublishableKey = typeof process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === 'string'
  ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  : '';
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface EmbeddedCheckoutFormProps {
  clientSecret: string;
  onComplete?: () => void;
}

/**
 * Stripe Embedded Checkout component
 * Renders an inline payment form with card, Apple Pay, and Google Pay support
 */
export function EmbeddedCheckoutForm({ clientSecret, onComplete }: EmbeddedCheckoutFormProps) {
  if (!stripePromise) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">Payment is not configured.</p>
        <p className="mt-1 text-xs text-amber-700">
          Add <code className="rounded bg-amber-100 px-1 font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to <code className="rounded bg-amber-100 px-1 font-mono">.env.local</code> and restart.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl overflow-hidden">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          clientSecret,
          onComplete,
        }}
      >
        <EmbeddedCheckout className="embedded-checkout" />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

interface CheckoutFormWrapperProps {
  items: Array<{
    id: string;
    sku: string;
    styleId: number;
    styleName: string;
    brandName: string;
    colorCode: string;
    colorName: string;
    sizeName: string;
    unitPrice: number;
    discountedPrice?: number;
    quantity: number;
    imageUrl?: string;
  }>;
  shippingInfo: {
    email: string;
    firstName: string;
    lastName: string;
    company?: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  shippingMethod: 'economy' | 'same_day';
  poNumber?: string;
  orderNotes?: string;
  onComplete?: () => void;
}

/**
 * Wrapper component that fetches client secret and renders embedded checkout
 */
export function CheckoutFormWrapper({
  items,
  shippingInfo,
  shippingMethod,
  poNumber,
  orderNotes,
  onComplete,
}: CheckoutFormWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClientSecret = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          shippingInfo,
          shippingMethod,
          poNumber,
          orderNotes,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error creating checkout session:', err);
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('The request timed out. Please check your connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  }, [items, shippingInfo, shippingMethod, poNumber, orderNotes]);

  // Auto-fetch on mount if all required data is present
  // useEffect(() => {
  //   if (shippingInfo.email && shippingInfo.address && !clientSecret) {
  //     fetchClientSecret();
  //   }
  // }, [shippingInfo, fetchClientSecret, clientSecret]);

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchClientSecret}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500 mx-auto" />
        <p className="mt-2 text-sm text-slate-600">Preparing secure checkout...</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-stone-50 to-white border border-stone-200 p-6 text-center">
        <p className="text-sm text-slate-600 mb-4">
          Complete the form above to proceed to payment
        </p>
        <button
          onClick={fetchClientSecret}
          disabled={!shippingInfo.email || !shippingInfo.address}
          className="px-6 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Payment
        </button>
      </div>
    );
  }

  return <EmbeddedCheckoutForm clientSecret={clientSecret} onComplete={onComplete} />;
}
