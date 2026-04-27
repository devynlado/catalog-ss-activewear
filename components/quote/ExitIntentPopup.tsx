'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Phone, MessageSquare, Clock, ArrowRight, Mail } from 'lucide-react';
import { useQuoteStore } from '@/lib/quote-store';
import Link from 'next/link';

// Helper function to check if business is currently open
// Business hours: Monday-Friday, 8am-5pm PST
function isBusinessOpen(): { isOpen: boolean; message: string } {
  const now = new Date();
  // Convert to PST
  const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const day = pstTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = pstTime.getHours();
  
  const isWeekday = day >= 1 && day <= 5;
  const isDuringHours = hour >= 8 && hour < 17;
  
  if (isWeekday && isDuringHours) {
    return { isOpen: true, message: "We're available now!" };
  }
  
  // Calculate next open time
  if (day === 0) { // Sunday
    return { isOpen: false, message: "Opens Monday 8am PST" };
  } else if (day === 6) { // Saturday
    return { isOpen: false, message: "Opens Monday 8am PST" };
  } else if (hour < 8) {
    return { isOpen: false, message: "Opens today at 8am PST" };
  } else {
    // After hours on weekday
    if (day === 5) { // Friday after hours
      return { isOpen: false, message: "Opens Monday 8am PST" };
    }
    return { isOpen: false, message: "Opens tomorrow 8am PST" };
  }
}

export function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [businessStatus, setBusinessStatus] = useState(() => isBusinessOpen());
  
  const { items } = useQuoteStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    // Only trigger when mouse leaves through the top of the viewport
    if (e.clientY <= 0 && !hasShown && itemCount > 0) {
      setIsVisible(true);
      setHasShown(true);
    }
  }, [hasShown, itemCount]);

  useEffect(() => {
    // Check if we've already shown the popup this session
    const alreadyShown = sessionStorage.getItem('exitIntentShown');
    if (alreadyShown) {
      setHasShown(true);
      return;
    }

    document.addEventListener('mouseout', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('exitIntentShown', 'true');
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Save to Supabase via API
      const response = await fetch('/api/exit-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          pageUrl: window.location.href,
          cartItems: items.map(item => ({
            sku: item.sku,
            styleName: item.styleName,
            brandName: item.brandName,
            colorName: item.colorName,
            sizeName: item.sizeName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save');
      }
      
      // Also save to localStorage as backup
      const savedQuote = {
        email,
        items,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('savedQuote', JSON.stringify(savedQuote));
      
      setSubmitStatus('success');
      
      // Close after success message
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error('Error saving quote:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 transition-colors z-10"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>

        {submitStatus === 'success' ? (
          // Success State
          <div className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Quote Saved!</h3>
            <p className="text-slate-600">
              We&apos;ve sent a link to <strong>{email}</strong>. You can return anytime to complete your order.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-navy-800 to-navy-900 px-6 py-8 text-center">
              <h2 className="text-2xl font-bold mb-2 text-white">Wait! Don&apos;t Lose Your Quote</h2>
              <p className="text-white/80">
                You have {itemCount} item{itemCount !== 1 ? 's' : ''} in your quote
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Quick Stats */}
              <div className="flex items-center justify-center gap-6 py-3 border-b border-stone-100">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-brand-500" />
                  <span>2hr avg response</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-brand-500" />
                  <span>Free quote</span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                {/* Option 1: Call (when open) or Contact (when closed) */}
                {businessStatus.isOpen ? (
                  <a
                    href="tel:+18559427636"
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white group-hover:bg-green-600">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Talk to an Expert</p>
                      <p className="text-sm text-slate-500">(855) 942-7636 • Available now</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-500" />
                  </a>
                ) : (
                  <Link
                    href="/contact"
                    onClick={handleClose}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white group-hover:bg-brand-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Leave Us a Message</p>
                      <p className="text-sm text-slate-500">We respond within 2hrs • {businessStatus.message}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-500" />
                  </Link>
                )}

                {/* Option 2: Save Quote */}
                <div className="p-4 rounded-xl border-2 border-slate-200">
                  <p className="font-semibold text-slate-900 mb-3">Save Your Quote for Later</p>
                  <form onSubmit={handleSaveQuote} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2.5 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </form>
                  <p className="text-xs text-slate-400 mt-2">We&apos;ll email you a link to resume your quote</p>
                </div>

                {/* Option 3: Continue */}
                <Link
                  href="/quote"
                  onClick={handleClose}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-stone-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Continue Building Quote
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
