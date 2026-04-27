'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowLeft, Loader2, Check, Upload, X, FileImage, AlertCircle, Shield, Lock, Clock, Phone, RefreshCw, Palette, Package, Truck, BadgeCheck } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { getAttribution } from '@/lib/attribution';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// US States for dropdown
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

// Proxy Google Drive URLs for product images
function proxyImageUrl(url: string): string {
  if (!url) return '';
  if (url.includes('drive.usercontent.google.com') || url.includes('drive.google.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

interface PackageCheckoutData {
  packageType: 'embroidered-caps';
  productStyleId: number;
  productName: string;
  selectedColors: {
    colorCode: string;
    colorName: string;
    quantity: number;
    frontImage?: string;
  }[];
  embroideryLocations: string[];
  has3DPuff: boolean;
  totalQuantity: number;
  pricePerHat: number;
  subtotal: number;
}

interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
}

interface ShippingAddress {
  address: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
}

export function PackageCheckoutClient() {
  const router = useRouter();
  const [packageData, setPackageData] = useState<PackageCheckoutData | null>(null);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
  });
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    address: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
  });
  
  const [orderNotes, setOrderNotes] = useState('');
  
  // File upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [serverPricing, setServerPricing] = useState<{
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  } | null>(null);
  
  // Load package data from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('packageCheckoutData');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setPackageData(data);
      } catch (e) {
        console.error('Failed to parse package data:', e);
        router.push('/packages/embroidered-caps');
      }
    } else {
      router.push('/packages/embroidered-caps');
    }
  }, [router]);
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/packages/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      setLogoFile(file);
      setLogoUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle continue to payment
  const handleContinueToPayment = async () => {
    if (!packageData) return;
    
    // Validate form
    if (!customerInfo.email || !customerInfo.firstName || !customerInfo.lastName) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      setError('Please complete the shipping address');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/packages/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: customerInfo.email,
          customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
          customerPhone: customerInfo.phone,
          company: customerInfo.company,
          shippingAddress: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            company: customerInfo.company,
            address: shippingAddress.address,
            apartment: shippingAddress.apartment,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
            phone: customerInfo.phone,
          },
          packageType: packageData.packageType,
          productStyleId: packageData.productStyleId,
          productName: packageData.productName,
          selectedColors: packageData.selectedColors.map(c => ({
            colorCode: c.colorCode,
            colorName: c.colorName,
            quantity: c.quantity,
          })),
          embroideryLocations: packageData.embroideryLocations,
          has3DPuff: packageData.has3DPuff,
          totalQuantity: packageData.totalQuantity,
          logoFileUrl: logoUrl,
          orderNotes,
          ...getAttribution(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }
      
      setClientSecret(data.clientSecret);
      setOrderNumber(data.orderNumber);
      setServerPricing(data.pricing);
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!packageData) {
    return (
      <div className="min-h-screen bg-[#FAF6F3] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF6F3] to-stone-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/packages/embroidered-caps" className="flex items-center gap-2 text-stone-600 hover:text-navy-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Package</span>
            </Link>
            <div className="flex items-center gap-4">
              <a href="tel:8559427636" className="hidden sm:flex items-center gap-2 text-sm text-stone-600 hover:text-brand-600 transition-colors">
                <Phone className="h-4 w-4" />
                <span>(855) 942-7636</span>
              </a>
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                <Lock className="h-4 w-4" />
                <span className="font-medium">Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-4 mb-8">
              <div className={cn(
                'flex items-center gap-2',
                step === 'info' ? 'text-brand-600' : 'text-green-600'
              )}>
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold',
                  step === 'info' ? 'bg-brand-500 text-white' : 'bg-green-500 text-white'
                )}>
                  {step === 'payment' ? <Check className="h-5 w-5" /> : '1'}
                </div>
                <span className="font-medium">Information</span>
              </div>
              <div className={cn(
                'flex-1 h-0.5 transition-colors',
                step === 'payment' ? 'bg-green-500' : 'bg-stone-200'
              )} />
              <div className={cn(
                'flex items-center gap-2',
                step === 'payment' ? 'text-brand-600' : 'text-stone-400'
              )}>
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold',
                  step === 'payment' ? 'bg-brand-500 text-white' : 'bg-stone-200 text-stone-500'
                )}>
                  2
                </div>
                <span className="font-medium">Review & Pay</span>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {step === 'info' ? (
              <>
                {/* Contact Information */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
                  <h2 className="text-lg font-semibold text-navy-900 mb-4">Contact Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        placeholder="you@company.com"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerInfo.firstName}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerInfo.lastName}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Company</label>
                        <input
                          type="text"
                          value={customerInfo.company}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, company: e.target.value }))}
                          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Shipping Address */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
                  <h2 className="text-lg font-semibold text-navy-900 mb-4">Shipping Address</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        placeholder="123 Main Street"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Apartment, Suite, etc.</label>
                      <input
                        type="text"
                        value={shippingAddress.apartment}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, apartment: e.target.value }))}
                        className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        placeholder="Suite 100"
                      />
                    </div>
                    <div className="grid grid-cols-6 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                          required
                        >
                          <option value="">Select</option>
                          {US_STATES.map(state => (
                            <option key={state.code} value={state.code}>{state.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          ZIP Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.zipCode}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                          placeholder="12345"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Logo Upload */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
                  <h2 className="text-lg font-semibold text-navy-900 mb-2">Your Logo (Optional)</h2>
                  <p className="text-sm text-stone-500 mb-4">
                    Upload now or we&apos;ll request it after checkout. We&apos;ll create a free mockup for your approval before production.
                  </p>
                  
                  {!logoFile ? (
                    <label className={cn(
                      'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
                      isUploading ? 'border-brand-300 bg-brand-50' : 'border-stone-300 hover:border-brand-400 hover:bg-stone-50'
                    )}>
                      {isUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-stone-400 mb-2" />
                          <span className="text-sm font-medium text-stone-700">Click to upload or drag and drop</span>
                          <span className="text-xs text-stone-500 mt-1">AI, EPS, PDF, PNG, JPG, SVG (max 10MB)</span>
                        </>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept=".ai,.eps,.pdf,.png,.jpg,.jpeg,.svg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        disabled={isUploading}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <FileImage className="h-8 w-8 text-green-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-navy-900 truncate">{logoFile.name}</p>
                        <p className="text-xs text-stone-500">{(logoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        onClick={() => {
                          setLogoFile(null);
                          setLogoUrl(null);
                        }}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Order Notes */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
                  <h2 className="text-lg font-semibold text-navy-900 mb-2">Order Notes (Optional)</h2>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                    placeholder="Any special instructions or notes for your order..."
                  />
                </div>
                
                {/* Continue Button with phone inline */}
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleContinueToPayment}
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating your order...
                      </>
                    ) : (
                      <>
                        Review & Pay
                        <ArrowLeft className="h-5 w-5 rotate-180" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-sm text-stone-500">
                    Questions? Call us at{' '}
                    <a href="tel:8559427636" className="font-medium text-brand-600 hover:text-brand-700">
                      (855) 942-7636
                    </a>
                  </p>
                </div>
              </>
            ) : (
              /* Payment Step */
              <div className="space-y-6">
                {/* Order Confirmation Summary */}
                <div className="bg-green-50/80 backdrop-blur-sm rounded-2xl p-5 border border-green-200/60">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-900">Order Ready for Payment</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-700 font-medium mb-1">Shipping to:</p>
                      <p className="text-green-800">
                        {customerInfo.firstName} {customerInfo.lastName}
                        {customerInfo.company && <span className="block text-green-700">{customerInfo.company}</span>}
                      </p>
                      <p className="text-green-700">
                        {shippingAddress.address}
                        {shippingAddress.apartment && `, ${shippingAddress.apartment}`}
                      </p>
                      <p className="text-green-700">
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-700 font-medium mb-1">Contact:</p>
                      <p className="text-green-800">{customerInfo.email}</p>
                      {customerInfo.phone && <p className="text-green-700">{customerInfo.phone}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('info')}
                    className="mt-3 text-sm text-green-700 hover:text-green-900 font-medium underline underline-offset-2"
                  >
                    Edit information
                  </button>
                </div>
                
                {/* Payment Form */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
                  <h2 className="text-lg font-semibold text-navy-900 mb-4">Complete Payment</h2>
                  
                  {clientSecret && (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: 'stripe',
                          variables: {
                            colorPrimary: '#EE8935',
                            borderRadius: '12px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          },
                          rules: {
                            '.Input': {
                              border: '1px solid #d6d3d1',
                              boxShadow: 'none',
                            },
                            '.Input:focus': {
                              border: '2px solid #EE8935',
                              boxShadow: '0 0 0 3px rgba(238, 137, 53, 0.1)',
                            },
                          },
                        },
                      }}
                    >
                      <PaymentForm 
                        orderNumber={orderNumber || ''} 
                        total={serverPricing?.total || packageData.subtotal}
                      />
                    </Elements>
                  )}
                </div>
                
                {/* Reassurance below payment */}
                <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/50 rounded-xl p-4 border border-amber-200/40">
                  <p className="text-sm text-amber-900 text-center">
                    <strong>100% Risk-Free:</strong> We&apos;ll send you a free mockup to approve before production. 
                    Not happy with the design? Full refund, no questions asked.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Right: Order Summary */}
          <div className="lg:col-span-2 space-y-4">
            {/* Order Summary Card - Glassmorphism */}
            <div className="sticky top-24 space-y-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-stone-200/50 border border-white/60">
                {/* Header with delivery ETA */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-navy-900">Order Summary</h2>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                    <Truck className="h-3.5 w-3.5" />
                    <span>Ships in 10-12 days</span>
                  </div>
                </div>
                
                {/* Package info */}
                <div className="pb-4 border-b border-stone-200/60">
                  <p className="font-medium text-navy-900">{packageData.productName}</p>
                  <p className="text-sm text-stone-500">{packageData.totalQuantity} hats total</p>
                </div>
                
                {/* Color breakdown */}
                <div className="py-4 border-b border-stone-200/60">
                  <p className="text-sm font-medium text-stone-500 mb-3">Colors</p>
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-2">
                    {packageData.selectedColors.map((color) => (
                      <div key={color.colorCode} className="flex items-center gap-3">
                        {color.frontImage && (
                          <div className="relative h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100 border border-stone-200/60">
                            <Image
                              src={proxyImageUrl(color.frontImage)}
                              alt={color.colorName}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-stone-700 truncate block">{color.colorName}</span>
                        </div>
                        <span className="text-sm text-stone-900 font-medium">{color.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Embroidery */}
                <div className="py-4 border-b border-stone-200/60">
                  <p className="text-sm font-medium text-stone-500 mb-2">Embroidery</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Front (included)</span>
                    </div>
                    {packageData.embroideryLocations.includes('side') && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Side (+$5.00/hat)</span>
                      </div>
                    )}
                    {packageData.embroideryLocations.includes('back') && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Back (+$5.00/hat)</span>
                      </div>
                    )}
                    {packageData.has3DPuff && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>3D Puff (+$3.00/hat)</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Pricing */}
                <div className="py-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Price per hat</span>
                    <span>{formatPrice(packageData.pricePerHat)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Subtotal ({packageData.totalQuantity} hats)</span>
                    <span>{formatPrice(serverPricing?.subtotal || packageData.subtotal)}</span>
                  </div>
                  {serverPricing && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-600">Tax</span>
                        <span>{formatPrice(serverPricing.tax)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-600">Shipping</span>
                        <span className={serverPricing.shipping === 0 ? 'text-green-600 font-medium' : ''}>
                          {serverPricing.shipping === 0 ? 'FREE' : formatPrice(serverPricing.shipping)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-stone-200/60">
                    <span>Total</span>
                    <span className="text-navy-900">
                      {formatPrice(serverPricing?.total || packageData.subtotal)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Satisfaction Guarantee Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-2xl p-5 border border-green-200/60">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <BadgeCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">100% Satisfaction Guarantee</h3>
                    <p className="text-sm text-green-800 leading-relaxed">
                      Don&apos;t love your mockup? Full refund, no questions asked. We won&apos;t start production until you approve.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* What Happens Next - Timeline */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-stone-200/60">
                <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-500" />
                  What Happens Next
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 bg-brand-100 rounded-full flex items-center justify-center text-xs font-bold text-brand-600">1</div>
                      <div className="w-0.5 h-full bg-stone-200 mt-1" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-navy-900 text-sm">Art Team Creates Mockup</p>
                      <p className="text-xs text-stone-500">1-2 business days</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 bg-brand-100 rounded-full flex items-center justify-center text-xs font-bold text-brand-600">2</div>
                      <div className="w-0.5 h-full bg-stone-200 mt-1" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-navy-900 text-sm">You Approve the Design</p>
                      <p className="text-xs text-stone-500">Unlimited revisions until perfect</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 bg-brand-100 rounded-full flex items-center justify-center text-xs font-bold text-brand-600">3</div>
                    </div>
                    <div>
                      <p className="font-medium text-navy-900 text-sm">Production & Shipping</p>
                      <p className="text-xs text-stone-500">7-10 business days after approval</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Trust Signals Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/70 rounded-xl p-3 border border-stone-200/40 text-center">
                  <Shield className="h-5 w-5 text-blue-600 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-navy-900">Secure Payment</p>
                  <p className="text-[10px] text-stone-500">256-bit encryption</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3 border border-stone-200/40 text-center">
                  <Palette className="h-5 w-5 text-purple-600 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-navy-900">Free Art Proof</p>
                  <p className="text-[10px] text-stone-500">Before production</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3 border border-stone-200/40 text-center">
                  <RefreshCw className="h-5 w-5 text-green-600 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-navy-900">Money-Back</p>
                  <p className="text-[10px] text-stone-500">If proof not approved</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3 border border-stone-200/40 text-center">
                  <Package className="h-5 w-5 text-orange-600 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-navy-900">Quality Check</p>
                  <p className="text-[10px] text-stone-500">Every order inspected</p>
                </div>
              </div>
              
              {/* Need Help */}
              <div className="text-center py-3">
                <p className="text-xs text-stone-500 mb-1">Need help with your order?</p>
                <a href="tel:8559427636" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                  (855) 942-7636
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Payment form component using Stripe Elements
function PaymentForm({ orderNumber, total }: { orderNumber: string; total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    setIsProcessing(true);
    setPaymentError(null);
    
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/packages/checkout/success?order=${orderNumber}`,
      },
    });
    
    if (error) {
      setPaymentError(error.message || 'Payment failed');
      setIsProcessing(false);
    }
    // If successful, Stripe redirects to return_url
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {paymentError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{paymentError}</p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing payment...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pay {formatPrice(total)} Now
          </>
        )}
      </button>
      
      <p className="text-center text-xs text-stone-500">
        Your payment is secured with 256-bit SSL encryption
      </p>
    </form>
  );
}
