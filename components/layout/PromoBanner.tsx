'use client';

import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function PromoBanner() {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden until we check localStorage

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem('promo-banner-dismissed');
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('promo-banner-dismissed', 'true');
  };

  if (isDismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-white">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-center text-sm">
          <Sparkles className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">
            Need instant pricing?{' '}
            <Link 
              href="/packages" 
              className="underline underline-offset-2 hover:no-underline font-semibold"
            >
              Try our all-inclusive packages
            </Link>
            {' '}— no quotes, no waiting.
          </span>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
