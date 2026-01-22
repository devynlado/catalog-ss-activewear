'use client';

import { Lightbulb } from 'lucide-react';

interface Tip {
  title: string;
  description: string;
}

interface TipsSectionProps {
  title?: string;
  tips: Tip[];
}

export function TipsSection({ title = "Pro Tips", tips }: TipsSectionProps) {
  return (
    <section className="py-16 lg:py-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-brand-600 mb-2">
            <Lightbulb className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Expert Advice</span>
          </div>
          <h2 className="text-3xl font-bold text-navy-800">{title}</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-navy-800">{tip.title}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
