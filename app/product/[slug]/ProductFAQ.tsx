'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductFaqItems } from './productFaqData';

interface ProductFAQProps {
  productName: string;
}

export function ProductFAQ({ productName }: ProductFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = getProductFaqItems(productName);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">
        Frequently Asked Questions
      </h2>
      <div className="mt-6 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white overflow-hidden">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-stone-50 transition-colors group/faq"
              >
                <span className={cn(
                  'text-sm font-medium transition-colors',
                  isOpen ? 'text-brand-600' : 'text-slate-800 group-hover/faq:text-brand-600'
                )}>{item.q}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 transition-all duration-200',
                    isOpen ? 'rotate-180 text-brand-500' : 'text-slate-400 group-hover/faq:text-brand-500'
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-all duration-200 ease-in-out',
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {item.a}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
