'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag,
  Send,
  Check,
  AlertCircle
} from 'lucide-react';
import { useQuoteStore } from '@/lib/quote-store';
import { formatPrice, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Decoration method options
const decorationOptions = [
  {
    id: 'screen',
    name: 'Screen Printing',
    description: 'Best for 1-8 colors, bulk orders',
    image: '/images/services/screen-printing.jpg',
  },
  {
    id: 'embroidery',
    name: 'Embroidery',
    description: 'Professional stitched logos',
    image: '/images/services/embroidery.jpg',
  },
  {
    id: 'digital',
    name: 'Digital Printing',
    description: 'Full color, photo-quality',
    image: '/images/services/digital-printing.jpg',
  },
  {
    id: 'none',
    name: 'No Decoration',
    description: 'Blanks only',
    image: null,
  },
] as const;

// Finishing service options
const finishingOptions = [
  {
    id: 'fold-bag',
    name: 'Fold & Bag',
    image: '/images/services/fold-bag.jpg',
  },
  {
    id: 'printed-tags',
    name: 'Printed Tags',
    image: '/images/services/printed-tags.jpg',
  },
  {
    id: 'hang-tags',
    name: 'Hang Tags',
    image: '/images/services/hang-tags.jpg',
  },
  {
    id: 'sewn-tags',
    name: 'Sewn Tags',
    image: '/images/services/sewn-tags.jpg',
  },
] as const;

export default function QuotePage() {
  const { items, removeItem, updateQuantity, clearQuote } = useQuoteStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [quoteId, setQuoteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  
  // Decoration & Finishing Services
  const [decorationType, setDecorationType] = useState<'screen' | 'embroidery' | 'digital' | 'none'>('none');
  const [designDescription, setDesignDescription] = useState('');
  const [finishingServices, setFinishingServices] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (items.length === 0) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const response = await fetch('/api/quote/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          contact: formData,
          decoration: {
            type: decorationType,
            description: designDescription,
          },
          finishing: finishingServices,
          submittedAt: new Date(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quote');
      }
      
      setSubmitStatus('success');
      setQuoteId(data.quoteId);
      clearQuote();
    } catch (error) {
      console.error('Error submitting quote:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Success State
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-900">Quote Submitted!</h1>
          <p className="mt-4 text-lg text-slate-600">
            Thank you for your interest. We've received your quote request and will 
            get back to you within 1-2 business days.
          </p>
          {quoteId && (
            <p className="mt-4 text-sm text-slate-500">
              Reference ID: <span className="font-medium">{quoteId}</span>
            </p>
          )}
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/catalog">
              <Button variant="primary">Continue Shopping</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/catalog" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ChevronLeft className="h-4 w-4" />
            Back to Catalog
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Your Quote</h1>
          <p className="mt-2 text-slate-600">
            Review your items and submit your quote request
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          // Empty State
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-slate-900">Your quote is empty</h2>
            <p className="mt-2 text-slate-600">
              Browse our catalog and add items to your quote list
            </p>
            <Link href="/catalog" className="mt-6 inline-block">
              <Button>Browse Catalog</Button>
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Quote Items */}
            <div className="lg:col-span-2">
              <div className="rounded-xl bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Quote Items ({totalItems})
                  </h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-6">
                      {/* Image */}
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.styleName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-slate-300" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {item.brandName}
                        </p>
                        <h3 className="font-medium text-slate-900">{item.styleName}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.colorName} / {item.sizeName}
                        </p>
                        <p className="mt-1 text-sm font-medium text-brand-600">
                          {formatPrice(item.unitPrice)} each
                        </p>
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="rounded-md border border-slate-200 p-1 hover:bg-slate-50"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="rounded-md border border-slate-200 p-1 hover:bg-slate-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <p className="text-sm font-semibold text-slate-900">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decoration Services */}
              <div className="mt-8 rounded-xl bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Decoration Services
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select a decoration method for your order
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {decorationOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setDecorationType(option.id)}
                        className={cn(
                          'relative flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all',
                          decorationType === option.id
                            ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        {/* Image placeholder */}
                        <div className="mb-3 h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                          {option.image ? (
                            <Image
                              src={option.image}
                              alt={option.name}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <ShoppingBag className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {option.name}
                        </span>
                        <span className="mt-1 text-xs text-slate-500">
                          {option.description}
                        </span>
                        {/* Selection indicator */}
                        {decorationType === option.id && (
                          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Design description - show when decoration selected */}
                  {decorationType !== 'none' && (
                    <div className="mt-6">
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Describe your design
                      </label>
                      <textarea
                        value={designDescription}
                        onChange={(e) => setDesignDescription(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        placeholder="Describe placement (front, back, sleeve), number of colors, and size. We'll request artwork in our response."
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Finishing Services */}
              <div className="mt-8 rounded-xl bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Finishing Services
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Optional add-ons for retail-ready packaging
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {finishingOptions.map((option) => {
                      const isSelected = finishingServices.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFinishingServices(finishingServices.filter(id => id !== option.id));
                            } else {
                              setFinishingServices([...finishingServices, option.id]);
                            }
                          }}
                          className={cn(
                            'relative flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all',
                            isSelected
                              ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          {/* Image placeholder */}
                          <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                            <ShoppingBag className="h-6 w-6" />
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {option.name}
                          </span>
                          {/* Checkbox indicator */}
                          <div className={cn(
                            'mt-2 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                            isSelected
                              ? 'border-brand-500 bg-brand-500'
                              : 'border-slate-300 bg-white'
                          )}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Summary & Form */}
            <div className="mt-8 lg:mt-0">
              <div className="sticky top-24 space-y-6">
                {/* Summary */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
                  <dl className="mt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <dt className="text-slate-600">Items</dt>
                      <dd className="font-medium text-slate-900">{totalItems}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-slate-600">Estimated Subtotal</dt>
                      <dd className="font-medium text-slate-900">{formatPrice(subtotal)}</dd>
                    </div>
                    {decorationType !== 'none' && (
                      <div className="flex justify-between text-sm">
                        <dt className="text-slate-600">Decoration</dt>
                        <dd className="font-medium text-slate-900">
                          {decorationOptions.find(o => o.id === decorationType)?.name}
                        </dd>
                      </div>
                    )}
                    {finishingServices.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <dt className="text-slate-600">Finishing</dt>
                        <dd className="font-medium text-slate-900 text-right">
                          {finishingServices.map(id => 
                            finishingOptions.find(o => o.id === id)?.name
                          ).join(', ')}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <p className="mt-4 text-xs text-slate-500">
                    * Final pricing will be confirmed in your quote response
                  </p>
                </div>

                {/* Contact Form */}
                <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    We'll use this to send you the quote
                  </p>

                  <div className="mt-6 space-y-4">
                    <Input
                      label="Full Name *"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={formErrors.name}
                      placeholder="John Smith"
                    />
                    <Input
                      label="Email Address *"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={formErrors.email}
                      placeholder="john@company.com"
                    />
                    <Input
                      label="Phone Number *"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={formErrors.phone}
                      placeholder="(555) 123-4567"
                    />
                    <Input
                      label="Company (Optional)"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Your Company Name"
                    />
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        placeholder="Any special requirements or questions..."
                      />
                    </div>
                  </div>

                  {submitStatus === 'error' && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      Failed to submit quote. Please try again.
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="mt-6 w-full"
                    size="lg"
                    isLoading={isSubmitting}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit Quote Request
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
