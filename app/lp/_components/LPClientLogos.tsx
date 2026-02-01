'use client';

import { motion } from 'framer-motion';
import { Building2, GraduationCap, Music, ShoppingBag, Utensils, Trophy } from 'lucide-react';

// Instead of actual client logos (which may have permission issues),
// we show industry categories they serve
const industries = [
  { icon: ShoppingBag, label: 'Retail Brands' },
  { icon: Music, label: 'Tour Merch' },
  { icon: Building2, label: 'Corporate' },
  { icon: GraduationCap, label: 'Schools' },
  { icon: Utensils, label: 'Restaurants' },
  { icon: Trophy, label: 'Sports Teams' },
];

export function LPClientLogos() {
  return (
    <section className="py-8 bg-white border-y border-stone-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-slate-500 mb-6"
        >
          Trusted by businesses across industries
        </motion.p>

        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            return (
              <motion.div
                key={industry.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex flex-col items-center gap-2 py-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-slate-600">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs text-slate-600 text-center">{industry.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
