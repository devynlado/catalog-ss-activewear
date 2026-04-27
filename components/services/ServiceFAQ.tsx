'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ServiceFaqItem {
  q: string;
  a: string;
}

interface ServiceFAQProps {
  title?: string;
  subtitle?: string;
  items: ServiceFaqItem[];
}

export function ServiceFAQ({
  title = 'Frequently Asked Questions',
  subtitle,
  items,
}: ServiceFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-navy-800 text-center">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-lg text-slate-600 text-center">{subtitle}</p>
          )}

          <div className="mt-8 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
            {items.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left hover:bg-stone-50 transition-colors group/faq"
                  >
                    <span
                      className={cn(
                        'text-base font-medium transition-colors',
                        isOpen
                          ? 'text-brand-600'
                          : 'text-navy-800 group-hover/faq:text-brand-600'
                      )}
                    >
                      {item.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 shrink-0 transition-all duration-200',
                        isOpen
                          ? 'rotate-180 text-brand-500'
                          : 'text-slate-400 group-hover/faq:text-brand-500'
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
                      <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {item.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
