'use client';

import { Check, Factory, Users, Clock, Zap, Star, MapPin, Cpu, Headphones } from 'lucide-react';

const defaultBenefits = [
  { icon: Factory, label: 'Factory Direct Pricing' },
  { icon: Users, label: '50 Piece Minimum Order' },
  { icon: Clock, label: 'Two-Week Turnaround' },
  { icon: Zap, label: 'Rush Upgrade Available' },
  { icon: Star, label: 'Hundreds of 5-Star Reviews' },
  { icon: MapPin, label: 'Located Near Los Angeles' },
  { icon: Cpu, label: 'The Latest Technology' },
  { icon: Headphones, label: 'Professional Account Reps' },
];

interface BenefitsBadgesProps {
  benefits?: { icon: React.ElementType; label: string }[];
  title?: string;
}

export function BenefitsBadges({ benefits = defaultBenefits, title = "And you will get" }: BenefitsBadgesProps) {
  return (
    <section className="bg-white py-12 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-slate-500 uppercase tracking-wider mb-6">
          {title}
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-2">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-700 leading-tight">
                  {benefit.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
