'use client';

import Link from 'next/link';
import { BookOpen, ArrowRight, GraduationCap, Trophy, Building2, PartyPopper, Store } from 'lucide-react';

// Use-case cards for quick navigation
const useCases = [
  { 
    label: 'For Schools', 
    icon: GraduationCap, 
    href: '/guides?filter=schools',
    color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    description: 'Uniforms, spirit wear & youth sizes'
  },
  { 
    label: 'For Sports', 
    icon: Trophy, 
    href: '/guides?filter=sports',
    color: 'bg-green-50 text-green-600 hover:bg-green-100',
    description: 'Athletic wear & team jerseys'
  },
  { 
    label: 'For Corporate', 
    icon: Building2, 
    href: '/guides?filter=corporate',
    color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    description: 'Polos, workwear & professional'
  },
  { 
    label: 'For Events', 
    icon: PartyPopper, 
    href: '/guides?filter=events',
    color: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
    description: 'Promos, giveaways & merch'
  },
  { 
    label: 'For Retail', 
    icon: Store, 
    href: '/guides?filter=retail',
    color: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
    description: 'Streetwear & fashion blanks'
  },
];

export function ProductGuidesPromoLegacy() {
  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-100 mb-4">
            <BookOpen className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Product Guides</h2>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            Curated collections to help you find the perfect blanks for any project
          </p>
        </div>
        
        {/* Use-Case Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-10">
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <Link
                key={useCase.label}
                href={useCase.href}
                className={`group flex flex-col items-center text-center rounded-xl p-5 transition-all hover:shadow-md ${useCase.color}`}
              >
                <Icon className="h-8 w-8 mb-3" />
                <span className="font-semibold">{useCase.label}</span>
                <span className="text-xs mt-1 opacity-75">{useCase.description}</span>
              </Link>
            );
          })}
        </div>
        
        {/* View All CTA */}
        <div className="text-center">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
          >
            <BookOpen className="h-4 w-4" />
            Browse All Guides
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
