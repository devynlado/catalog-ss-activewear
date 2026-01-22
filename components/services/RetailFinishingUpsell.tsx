'use client';

import Link from 'next/link';
import { Package, Tag, Scissors, Award, ArrowRight } from 'lucide-react';

const finishingOptions = [
  {
    icon: Award,
    title: 'Retail Ready Service',
    description: 'From bar codes to hang tags.',
    href: '/services/retail-finishing',
  },
  {
    icon: Package,
    title: 'Fold & Poly Bag',
    description: 'Retail ready presentation.',
    href: '/services/retail-finishing',
  },
  {
    icon: Tag,
    title: 'Screen Printed Tags',
    description: 'Perfect for brands.',
    href: '/services/retail-finishing',
  },
  {
    icon: Scissors,
    title: 'Woven Labels',
    description: 'Professional appearance.',
    href: '/services/retail-finishing',
  },
];

interface RetailFinishingUpsellProps {
  title?: string;
}

export function RetailFinishingUpsell({ title = "Upgrade Your Order" }: RetailFinishingUpsellProps) {
  return (
    <section className="py-16 lg:py-20 bg-navy-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-brand-400 uppercase tracking-wider mb-2">
            Retail Ready Services
          </p>
          <h2 className="text-3xl font-bold text-white">{title}</h2>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {finishingOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <Link
                key={index}
                href={option.href}
                className="group bg-white/5 hover:bg-white/10 rounded-xl p-6 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400 mb-4 group-hover:bg-brand-500/30 transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-white mb-1">{option.title}</h3>
                <p className="text-sm text-slate-400">{option.description}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm text-brand-400 font-medium">
                  Learn More
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
