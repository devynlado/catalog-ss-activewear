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
  AlertCircle,
  Bookmark,
  X,
  Mail,
  Clock,
  Star,
  Shield,
  Phone,
  Sparkles,
  Shirt,
  type LucideIcon
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
    eventDate: '',
    message: '',
  });
  
  // Decoration & Finishing Services
  const [decorationType, setDecorationType] = useState<'screen' | 'embroidery' | 'digital' | 'none'>('none');
  const [designDescription, setDesignDescription] = useState('');
  const [finishingServices, setFinishingServices] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Save for Later state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveEmail, setSaveEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

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
          eventDate: formData.eventDate || null,
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

  const handleSaveForLater = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    
    if (!saveEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(saveEmail)) {
      setSaveError('Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    
    try {
      // Generate a unique save ID
      const saveId = `SAVE-${Date.now().toString(36).toUpperCase()}`;
      
      // Save to localStorage with the email as reference
      const savedQuote = {
        id: saveId,
        email: saveEmail,
        items,
        decoration: {
          type: decorationType,
          description: designDescription,
        },
        finishing: finishingServices,
        savedAt: new Date().toISOString(),
      };
      
      // Store in localStorage
      const existingQuotes = JSON.parse(localStorage.getItem('savedQuotes') || '[]');
      existingQuotes.push(savedQuote);
      localStorage.setItem('savedQuotes', JSON.stringify(existingQuotes));
      
      // In production, you would also send this to your backend/email service
      // await fetch('/api/quote/save', { method: 'POST', body: JSON.stringify(savedQuote) });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('success');
    } catch (error) {
      console.error('Error saving quote:', error);
      setSaveStatus('error');
      setSaveError('Failed to save quote. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Success State
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
          {/* Success Card */}
          <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">Quote Submitted!</h1>
            <p className="mt-3 text-slate-600">
              Thank you for your interest. We've received your quote request and will 
              get back to you within 1-2 business days.
            </p>
            {quoteId && (
              <p className="mt-3 text-sm text-slate-500">
                Reference ID: <span className="font-medium">{quoteId}</span>
              </p>
            )}
          </div>

          {/* What's Next Section */}
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">What would you like to do next?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/quote"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-colors group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">Start Another Quote</p>
                  <p className="text-sm text-slate-500">Have another project?</p>
                </div>
              </Link>
              
              <Link
                href="/catalog"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-colors group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Shirt className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">Browse Products</p>
                  <p className="text-sm text-slate-500">Explore our catalog</p>
                </div>
              </Link>
              
              <Link
                href="/services/screen-printing"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-colors group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">Our Services</p>
                  <p className="text-sm text-slate-500">Screen printing, embroidery & more</p>
                </div>
              </Link>
              
              <Link
                href="/resources/screen-printing-guide"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-colors group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">Download Our Guide</p>
                  <p className="text-sm text-slate-500">Free screen printing tips</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Help Banner */}
          <div className="mt-6 rounded-xl bg-slate-100 p-4 text-center">
            <p className="text-sm text-slate-600">
              Questions? Call us at{' '}
              <a href="tel:+18559427636" className="font-semibold text-brand-600 hover:text-brand-700">
                (855) 942-7636
              </a>
              {' '}— we respond in under 2 hours on average.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress step based on state
  const getProgressStep = () => {
    if (items.length === 0) return 1;
    if (decorationType === 'none' && !formData.name) return 2;
    if (!formData.name || !formData.email || !formData.phone) return 3;
    return 4;
  };
  const progressStep = getProgressStep();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Trust Signals Banner */}
      <div className="bg-navy-800 text-white py-2.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-brand-400" />
              <span><strong>2hr</strong> avg response</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-brand-400" />
              <span><strong>1M+</strong> shirts/year</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span><strong>4.8</strong> stars (185 reviews)</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Sample before production</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header with Progress Indicator */}
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

          {/* Progress Indicator */}
          {items.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                {[
                  { step: 1, label: 'Select Items', icon: ShoppingBag },
                  { step: 2, label: 'Choose Services', icon: Sparkles },
                  { step: 3, label: 'Contact Info', icon: Mail },
                  { step: 4, label: 'Review', icon: Check },
                ].map((item, index) => (
                  <div key={item.step} className="flex items-center">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                      progressStep >= item.step
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    )}>
                      {progressStep > item.step ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <item.icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={cn(
                      'ml-2 text-sm font-medium hidden sm:block',
                      progressStep >= item.step ? 'text-slate-900' : 'text-slate-400'
                    )}>
                      {item.label}
                    </span>
                    {index < 3 && (
                      <div className={cn(
                        'mx-2 sm:mx-4 h-0.5 w-8 sm:w-16',
                        progressStep > item.step ? 'bg-brand-500' : 'bg-slate-200'
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          // Enhanced Empty State
          <div className="space-y-8">
            {/* Main empty state card */}
            <div className="rounded-xl bg-white p-8 sm:p-12 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
                <ShoppingBag className="h-10 w-10 text-brand-500" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-slate-900">Start Building Your Quote</h2>
              <p className="mt-3 text-slate-600 max-w-md mx-auto">
                Browse our catalog of 5,000+ blank apparel options. Add items, choose your decoration method, and we&apos;ll send you a detailed quote within 2 hours.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/catalog">
                  <Button size="lg">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Browse Catalog
                  </Button>
                </Link>
                <a
                  href="tel:+18559427636"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-slate-200 px-6 py-3 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <Phone className="h-5 w-5" />
                  (855) 942-7636
                </a>
              </div>
            </div>

            {/* Quick Start Categories */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Browse by Category</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: 'T-Shirts', href: '/catalog/t-shirts', color: 'bg-orange-100 text-orange-600' },
                  { name: 'Hoodies', href: '/catalog/sweatshirts', color: 'bg-blue-100 text-blue-600' },
                  { name: 'Hats', href: '/catalog/headwear', color: 'bg-green-100 text-green-600' },
                  { name: 'Polos', href: '/catalog/polos', color: 'bg-purple-100 text-purple-600' },
                ].map((category) => (
                  <Link
                    key={category.name}
                    href={category.href}
                    className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-colors group"
                  >
                    <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Shirt className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-slate-900">{category.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Help Banner */}
            <div className="rounded-xl bg-gradient-to-r from-navy-800 to-navy-900 p-6 text-white">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Not sure where to start?</h3>
                  <p className="text-slate-300 text-sm mt-1">
                    Our team has helped 25,000+ customers find the perfect products. Let us help you too.
                  </p>
                </div>
                <a
                  href="tel:+18559427636"
                  className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Call Now
                </a>
              </div>
            </div>
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
                        Event/Need By Date (Optional)
                      </label>
                      <input
                        type="date"
                        name="eventDate"
                        value={formData.eventDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Have a deadline? Let us know and we'll prioritize your quote.
                      </p>
                    </div>
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

                  {/* Save for Later Button */}
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(true)}
                    className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Bookmark className="h-4 w-4" />
                    Save Quote for Later
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save for Later Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (saveStatus !== 'success') {
                setShowSaveModal(false);
                setSaveStatus('idle');
                setSaveError('');
              }
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            {saveStatus === 'success' ? (
              // Success State
              <div className="text-center py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Quote Saved!</h3>
                <p className="text-slate-600 mb-6">
                  We've saved your quote and sent a copy to <strong>{saveEmail}</strong>. 
                  You can return anytime to complete your order.
                </p>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setSaveStatus('idle');
                    setSaveEmail('');
                  }}
                  className="w-full bg-brand-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-brand-600 transition-colors"
                >
                  Got It
                </button>
              </div>
            ) : (
              // Form State
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Save Quote for Later</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Enter your email and we'll save your quote
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSaveModal(false);
                      setSaveError('');
                    }}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSaveForLater} className="space-y-4">
                  <div>
                    <label htmlFor="saveEmail" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        id="saveEmail"
                        value={saveEmail}
                        onChange={(e) => {
                          setSaveEmail(e.target.value);
                          setSaveError('');
                        }}
                        placeholder="you@company.com"
                        className="w-full rounded-lg border border-slate-300 pl-12 pr-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      />
                    </div>
                    {saveError && (
                      <p className="mt-1.5 text-sm text-red-600">{saveError}</p>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600">
                      <strong className="text-slate-900">What we'll save:</strong>
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      <li>• {items.length} item{items.length !== 1 ? 's' : ''} in your quote</li>
                      {decorationType !== 'none' && (
                        <li>• {decorationOptions.find(d => d.id === decorationType)?.name}</li>
                      )}
                      {finishingServices.length > 0 && (
                        <li>• {finishingServices.length} finishing service{finishingServices.length !== 1 ? 's' : ''}</li>
                      )}
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-brand-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4" />
                        Save My Quote
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-4 text-xs text-slate-500 text-center">
                  We'll only use your email to send you your saved quote. No spam.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
