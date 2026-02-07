'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyMobileCTAProps } from './types';

export function StickyMobileCTA({
  priceText,
  subtext = 'All-inclusive pricing',
  ctaText = 'Build Package',
}: StickyMobileCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (about 400px)
      const shouldShow = window.scrollY > 400;
      setIsVisible(shouldShow);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToBuilder = () => {
    const builder = document.getElementById('builder');
    if (builder) {
      builder.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        >
          <div className="bg-white/95 backdrop-blur-md border-t border-stone-200/60 px-4 py-3 shadow-lg shadow-stone-200/30">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-navy-900">{priceText}</p>
                <p className="text-xs text-stone-500">{subtext}</p>
              </div>
              <button
                onClick={scrollToBuilder}
                className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl hover:from-brand-600 hover:to-brand-700 transition-colors shadow-lg shadow-brand-500/30"
              >
                {ctaText}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
