'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X } from 'lucide-react';

interface LPFloatingCTAProps {
  service: 'screen-printing' | 'embroidery';
}

export function LPFloatingCTA({ service }: LPFloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isEmbroidery = service === 'embroidery';

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (approximately 600px)
      const scrollPosition = window.scrollY;
      const heroHeight = 600;
      
      if (scrollPosition > heroHeight && !isDismissed) {
        setIsVisible(true);
      } else if (scrollPosition <= heroHeight) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const scrollToForm = () => {
    const form = document.querySelector('form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const firstInput = form.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 500);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-6 bottom-24 z-40 hidden lg:block"
        >
          <div className="relative">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors z-10"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
            
            {/* Main CTA button */}
            <button
              onClick={scrollToForm}
              className={`group flex items-center gap-3 rounded-2xl ${
                isEmbroidery 
                  ? 'bg-indigo-500 shadow-indigo-500/30 hover:bg-indigo-600' 
                  : 'bg-brand-500 shadow-brand-500/30 hover:bg-brand-600'
              } px-6 py-4 text-white shadow-2xl transition-all hover:shadow-xl hover:-translate-y-1`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isEmbroidery ? 'bg-indigo-400/30' : 'bg-brand-400/30'
              }`}>
                <FileText className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Get Your Quote</p>
                <p className="text-xs text-white/80">Free • 2 hour response</p>
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
