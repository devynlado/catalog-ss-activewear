'use client';

import { Check, LucideIcon } from 'lucide-react';

interface Reason {
  icon?: LucideIcon;
  title: string;
  description: string;
}

interface WhyChooseSectionProps {
  title: string;
  subtitle?: string;
  reasons: Reason[];
}

export function WhyChooseSection({ title, subtitle, reasons }: WhyChooseSectionProps) {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-navy-800">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-lg text-slate-600">{subtitle}</p>
          )}
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, index) => {
            const Icon = reason.icon || Check;
            return (
              <div
                key={index}
                className="relative bg-slate-50 rounded-xl p-6 hover:bg-slate-100 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600 mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-navy-800 mb-2">
                  {reason.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {reason.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
