'use client';

import { Phone, MessageSquare } from 'lucide-react';
import { trackPhoneClick } from '@/lib/analytics';

interface LPStickyMobileCTAProps {
  service: 'screen-printing' | 'embroidery' | 't-shirt-printing' | 'jumbo-screen-printing' | 'digital-screen-printing';
}

export function LPStickyMobileCTA({ service }: LPStickyMobileCTAProps) {
  const scrollToForm = () => {
    const form = document.querySelector('form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus the first input after scroll
      setTimeout(() => {
        const firstInput = form.querySelector('input');
        if (firstInput) {
          firstInput.focus();
        }
      }, 500);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Shadow overlay */}
      <div className="absolute inset-x-0 bottom-full h-8 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
      
      {/* CTA Bar */}
      <div className="bg-white border-t border-stone-200 px-4 py-3 shadow-lg">
        <div className="flex gap-3">
          {/* Get Quote Button */}
          <button
            onClick={scrollToForm}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all active:scale-95"
          >
            <MessageSquare className="h-4 w-4" />
            Get Quote
          </button>

          {/* Call Button */}
          <a
            href="tel:+18559427636"
            onClick={() => trackPhoneClick({ source: `lp_${service}_sticky_mobile` })}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-navy-800 bg-white px-4 py-3 text-sm font-semibold text-navy-800 transition-all active:scale-95"
          >
            <Phone className="h-4 w-4" />
            Call Now
          </a>
        </div>
      </div>
    </div>
  );
}
