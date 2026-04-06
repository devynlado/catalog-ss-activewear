'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Phone, Clock, MessageSquare, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { trackGenerateLead, trackPhoneClick } from '@/lib/analytics';
import { getVisitorSource } from '@/lib/attribution';

interface LPExitIntentProps {
  service: 'screen-printing' | 'embroidery' | 't-shirt-printing' | 'jumbo-screen-printing' | 'digital-screen-printing' | 'puff-screen-printing';
}

// Helper function to check if business is currently open
function isBusinessOpen(): { isOpen: boolean; message: string } {
  const now = new Date();
  const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const day = pstTime.getDay();
  const hour = pstTime.getHours();
  
  const isWeekday = day >= 1 && day <= 5;
  const isDuringHours = hour >= 8 && hour < 17;
  
  if (isWeekday && isDuringHours) {
    return { isOpen: true, message: "We're available now!" };
  }
  
  if (day === 0 || day === 6) {
    return { isOpen: false, message: "Opens Monday 8am PST" };
  } else if (hour < 8) {
    return { isOpen: false, message: "Opens today at 8am PST" };
  } else {
    if (day === 5) return { isOpen: false, message: "Opens Monday 8am PST" };
    return { isOpen: false, message: "Opens tomorrow 8am PST" };
  }
}

export function LPExitIntent({ service }: LPExitIntentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [businessStatus] = useState(() => isBusinessOpen());

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    // Only trigger when mouse leaves through the top of the viewport
    if (e.clientY <= 0 && !hasShown) {
      setIsVisible(true);
      setHasShown(true);
      sessionStorage.setItem('lpExitIntentShown', 'true');
    }
  }, [hasShown]);

  useEffect(() => {
    // Check if we've already shown the popup this session
    const alreadyShown = sessionStorage.getItem('lpExitIntentShown');
    if (alreadyShown) {
      setHasShown(true);
      return;
    }

    // Delay adding the listener to let user engage with page first (10 seconds)
    const timeout = setTimeout(() => {
      document.addEventListener('mouseout', handleMouseLeave);
    }, 10000);
    
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !phone) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          name: '', // Will prompt for call
          service: service,
          source: `lp_${service}_exit_intent`,
          message: 'Exit intent capture - requested callback',
          visitor_source: getVisitorSource(),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit');
      
      // Track conversion
      trackGenerateLead({
        source: `lp_${service}_exit_intent`,
        value: 300,
      });
      
      setSubmitStatus('success');
      
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  const serviceLabels: Record<string, string> = {
    'screen-printing': 'screen printing',
    'embroidery': 'embroidery',
    't-shirt-printing': 'custom t-shirt printing',
    'jumbo-screen-printing': 'jumbo screen printing',
    'digital-screen-printing': 'digital screen printing',
    'puff-screen-printing': 'puff screen printing',
  };
  const serviceLabel = serviceLabels[service] || 'screen printing';

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
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">We'll Call You Back!</h3>
            <p className="text-slate-600">
              Expect a call within 2 hours during business hours. Check your email for confirmation.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={`px-6 py-8 text-center ${
              service === 'embroidery' 
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' 
                : 'bg-gradient-to-r from-brand-500 to-brand-600'
            }`}>
              <h2 className="text-2xl font-bold mb-2 text-white">
                Wait — Get a Quick Quote First
              </h2>
              <p className="text-white/90">
                Still comparing {serviceLabel} options?
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Value Prop */}
              <div className="text-center">
                <p className="text-slate-700 font-medium">
                  Let us beat any competitor's quote
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Factory-direct pricing means we're usually 20-40% less
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-center gap-6 py-3 border-y border-stone-100">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-brand-500" />
                  <span>2hr response</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-brand-500" />
                  <span>Free quote</span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                {/* Option 1: Quick Callback */}
                <div className="p-4 rounded-xl border-2 border-stone-200">
                  <p className="font-semibold text-slate-900 mb-3">Get a Quick Callback</p>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email"
                      className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      required
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Your phone number"
                      className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 text-white font-semibold rounded-lg transition-colors ${
                        service === 'embroidery'
                          ? 'bg-indigo-500 hover:bg-indigo-600'
                          : 'bg-brand-500 hover:bg-brand-600'
                      } disabled:opacity-50`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        'Request Callback'
                      )}
                    </button>
                  </form>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    We'll call within 2 hours • No spam, ever
                  </p>
                </div>

                {/* Option 2: Call Now (if open) */}
                {businessStatus.isOpen ? (
                  <a
                    href="tel:+18559427636"
                    onClick={() => {
                      trackPhoneClick({ source: `lp_${service}_exit_intent` });
                      handleClose();
                    }}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white group-hover:bg-green-600">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Call Now — No Wait</p>
                      <p className="text-sm text-slate-500">(855) 942-7636 • Available now</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-green-500" />
                  </a>
                ) : (
                  <div className="text-center text-sm text-slate-500">
                    Call us during business hours: Mon-Fri 8am-5pm PST
                    <br />
                    <span className="font-medium">(855) 942-7636</span>
                  </div>
                )}

                {/* Dismiss */}
                <button
                  onClick={handleClose}
                  className="w-full text-center py-2 text-sm text-slate-500 hover:text-slate-700"
                >
                  No thanks, I'll keep looking
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
