'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { useQuoteStore } from '@/lib/quote-store';

interface CartItem {
  sku?: string;
  styleName: string;
  brandName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
}

type RecoveryState = 
  | { status: 'loading' }
  | { status: 'success'; items: CartItem[]; email: string }
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'already_recovered' }
  | { status: 'error'; message: string };

export default function ResumeQuotePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [state, setState] = useState<RecoveryState>({ status: 'loading' });
  const [isRestoring, setIsRestoring] = useState(false);
  const { restoreFromSaved, items: currentItems } = useQuoteStore();

  useEffect(() => {
    async function recoverQuote() {
      try {
        const response = await fetch(`/api/recover-quote/${params.token}`, {
          method: 'POST',
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          if (response.status === 404) {
            setState({ status: 'invalid' });
          } else if (response.status === 410) {
            setState({ status: 'expired' });
          } else if (response.status === 409) {
            setState({ status: 'already_recovered' });
          } else {
            setState({ status: 'error', message: data.error || 'Failed to recover quote' });
          }
          return;
        }
        
        setState({ 
          status: 'success', 
          items: data.cartItems || [],
          email: data.email,
        });
      } catch (error) {
        console.error('Recovery error:', error);
        setState({ status: 'error', message: 'Unable to connect. Please try again.' });
      }
    }
    
    recoverQuote();
  }, [params.token]);

  const handleRestoreAndContinue = async () => {
    if (state.status !== 'success') return;
    
    setIsRestoring(true);
    
    try {
      // Restore items to the quote store
      restoreFromSaved(state.items);
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to quote page
      router.push('/quote');
    } catch (error) {
      console.error('Restore error:', error);
      setState({ status: 'error', message: 'Failed to restore items. Please try again.' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Loading State */}
        {state.status === 'loading' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Loader2 className="h-12 w-12 text-brand-500 animate-spin mx-auto" />
            <h1 className="mt-4 text-xl font-bold text-navy-800">
              Recovering Your Quote...
            </h1>
            <p className="mt-2 text-slate-600">
              Please wait while we restore your saved items.
            </p>
          </div>
        )}

        {/* Success State */}
        {state.status === 'success' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
              <CheckCircle className="h-12 w-12 text-white mx-auto" />
              <h1 className="mt-3 text-xl font-bold text-white">
                Quote Found!
              </h1>
              <p className="mt-1 text-green-100">
                {state.items.length} item{state.items.length !== 1 ? 's' : ''} ready to restore
              </p>
            </div>
            
            <div className="p-6">
              {/* Items Preview */}
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Your Saved Items
                </h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {state.items.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="font-medium text-navy-800 text-sm">{item.brandName}</p>
                        <p className="text-xs text-slate-500">{item.styleName} - {item.colorName}</p>
                      </div>
                      <span className="text-sm text-slate-600">×{item.quantity}</span>
                    </div>
                  ))}
                  {state.items.length > 5 && (
                    <p className="text-xs text-slate-400 italic pt-2">
                      + {state.items.length - 5} more items
                    </p>
                  )}
                </div>
              </div>

              {/* Warning if cart has items */}
              {currentItems.length > 0 && (
                <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> You have {currentItems.length} item{currentItems.length !== 1 ? 's' : ''} in your current quote. 
                    Restoring will add these saved items to your existing quote.
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleRestoreAndContinue}
                disabled={isRestoring}
                className="w-full flex items-center justify-center gap-2 bg-brand-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    Continue to Quote
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              
              <p className="mt-4 text-center text-xs text-slate-400">
                Items will be added to your quote builder
              </p>
            </div>
          </div>
        )}

        {/* Invalid Token State */}
        {state.status === 'invalid' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-navy-800">
              Link Not Found
            </h1>
            <p className="mt-2 text-slate-600">
              This recovery link is invalid or has already been used.
            </p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex items-center gap-2 bg-brand-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-brand-600 transition-colors"
            >
              Start New Quote
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}

        {/* Expired State */}
        {state.status === 'expired' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-navy-800">
              Link Expired
            </h1>
            <p className="mt-2 text-slate-600">
              This recovery link has expired. Recovery links are valid for 30 days.
            </p>
            <div className="mt-6 space-y-3">
              <Link
                href="/catalog"
                className="block w-full bg-brand-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-brand-600 transition-colors text-center"
              >
                Start New Quote
              </Link>
              <Link
                href="/contact"
                className="block w-full border-2 border-slate-200 text-navy-800 font-semibold py-3 px-6 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-colors text-center"
              >
                Contact Us for Help
              </Link>
            </div>
          </div>
        )}

        {/* Already Recovered State */}
        {state.status === 'already_recovered' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-navy-800">
              Already Recovered
            </h1>
            <p className="mt-2 text-slate-600">
              You've already used this link to recover your quote.
            </p>
            <div className="mt-6 space-y-3">
              <Link
                href="/quote"
                className="block w-full bg-brand-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-brand-600 transition-colors text-center"
              >
                Go to My Quote
              </Link>
              <Link
                href="/catalog"
                className="block w-full border-2 border-slate-200 text-navy-800 font-semibold py-3 px-6 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-colors text-center"
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.status === 'error' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-navy-800">
              Something Went Wrong
            </h1>
            <p className="mt-2 text-slate-600">
              {state.message}
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="block w-full bg-brand-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-brand-600 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/contact"
                className="block w-full border-2 border-slate-200 text-navy-800 font-semibold py-3 px-6 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-colors text-center"
              >
                Contact Support
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Need help? Call us at{' '}
          <a href="tel:+18559427636" className="text-brand-500 hover:underline">
            (855) 942-7636
          </a>
        </p>
      </div>
    </div>
  );
}
