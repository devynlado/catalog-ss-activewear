'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, CreditCard, Lock, MapPin, ShoppingCart, Truck, Package, Shield, Clock } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { calculateOrderTotals, ShippingMethod } from '@/lib/stripe';
import { formatPrice, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, getTotalUnits, clearCart, hasHydrated } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('economy');
  
  // Form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');

  // Calculate totals
  const cartItems = items.map(item => ({
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    discountedPrice: item.discountedPrice,
  }));
  const totals = calculateOrderTotals(cartItems, shippingMethod);
  const totalUnits = getTotalUnits();

  // Redirect if cart is empty (but wait for hydration first)
  useEffect(() => {
    if (hasHydrated && items.length === 0) {
      router.push('/cart');
    }
  }, [items, router, hasHydrated]);

  const isFormComplete = Boolean(
    email &&
    firstName &&
    lastName &&
    address1 &&
    city &&
    state &&
    zipCode &&
    phone
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) return;

    setIsLoading(true);
    
    try {
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            sku: item.sku,
            styleId: item.styleId,
            styleName: item.styleName,
            brandName: item.brandName,
            colorName: item.colorName,
            sizeName: item.sizeName,
            quantity: item.quantity,
            unitPrice: item.discountedPrice ?? item.unitPrice,
            imageUrl: item.imageUrl,
          })),
          shippingAddress: {
            email,
            firstName,
            lastName,
            company,
            address1,
            address2,
            city,
            state,
            zipCode,
            phone,
          },
          shippingMethod,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while hydrating or if cart is empty (will redirect)
  if (!hasHydrated || items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/cart" 
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            {/* Left Column - Form */}
            <div className="space-y-8">
              {/* Contact Information */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-sm font-bold">
                    1
                  </div>
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-sm font-bold">
                    2
                  </div>
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  <Input
                    label="Company (Optional)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                  <Input
                    label="Address"
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    placeholder="123 Main St"
                    required
                  />
                  <Input
                    label="Apt, Suite, etc. (Optional)"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    placeholder="Suite 100"
                  />
                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-3">
                      <Input
                        label="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        label="State"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="CA"
                        maxLength={2}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label="ZIP Code"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="90210"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-sm font-bold">
                    3
                  </div>
                  Shipping Method
                </h2>
                <div className="space-y-3">
                  <label
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      shippingMethod === 'economy'
                        ? "border-brand-500 bg-brand-50"
                        : "border-stone-200 hover:border-stone-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value="economy"
                      checked={shippingMethod === 'economy'}
                      onChange={() => setShippingMethod('economy')}
                      className="sr-only"
                    />
                    <div className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2",
                      shippingMethod === 'economy' ? "border-brand-500 bg-brand-500" : "border-stone-300"
                    )}>
                      {shippingMethod === 'economy' && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <Truck className="h-5 w-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Economy Shipping</p>
                      <p className="text-sm text-slate-500">3-5 business days</p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {totals.subtotal >= 500 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        '$15.00'
                      )}
                    </p>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      shippingMethod === 'same_day'
                        ? "border-brand-500 bg-brand-50"
                        : "border-stone-200 hover:border-stone-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value="same_day"
                      checked={shippingMethod === 'same_day'}
                      onChange={() => setShippingMethod('same_day')}
                      className="sr-only"
                    />
                    <div className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2",
                      shippingMethod === 'same_day' ? "border-brand-500 bg-brand-500" : "border-stone-300"
                    )}>
                      {shippingMethod === 'same_day' && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <Clock className="h-5 w-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Express Shipping</p>
                      <p className="text-sm text-slate-500">1-2 business days</p>
                    </div>
                    <p className="font-semibold text-slate-900">$25.00</p>
                  </label>
                </div>
              </div>

              {/* Payment - Handled by Stripe */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-sm font-bold">
                    4
                  </div>
                  Payment
                </h2>
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <Lock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-slate-900">Secure Payment via Stripe</p>
                    <p className="text-sm text-slate-500">You'll enter your card details on the next page</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Image src="/images/payment/visa.svg" alt="Visa" width={40} height={25} className="opacity-60" />
                  <Image src="/images/payment/mastercard.svg" alt="Mastercard" width={40} height={25} className="opacity-60" />
                  <Image src="/images/payment/amex.svg" alt="Amex" width={40} height={25} className="opacity-60" />
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="mt-8 lg:mt-0">
              <div className="rounded-2xl border border-stone-200 bg-white p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>

                {/* Items Preview */}
                <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100 border border-stone-200">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.styleName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.styleName}</p>
                        <p className="text-xs text-slate-500">{item.colorName} / {item.sizeName}</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">
                          {formatPrice((item.discountedPrice ?? item.unitPrice) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-stone-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal ({totalUnits} pieces)</span>
                    <span className="font-medium text-slate-900">{formatPrice(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-medium text-slate-900">
                      {totals.shippingCost === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        formatPrice(totals.shippingCost)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Estimated Tax</span>
                    <span className="font-medium text-slate-900">{formatPrice(totals.taxAmount)}</span>
                  </div>
                  <div className="border-t border-stone-200 pt-3 flex justify-between">
                    <span className="text-lg font-semibold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-brand-600">{formatPrice(totals.total)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6"
                  size="lg"
                  disabled={!isFormComplete || isLoading}
                >
                  {isLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Continue to Payment
                    </>
                  )}
                </Button>

                {/* Trust Signals */}
                <div className="mt-6 pt-6 border-t border-stone-200 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Package className="h-4 w-4 text-brand-600 flex-shrink-0" />
                    <span>Ships from our California warehouse</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Truck className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span>Free returns within 30 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
