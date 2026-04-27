'use client';

import { motion } from 'framer-motion';
import { Clock, FileCheck, Palette, Truck, DollarSign, Eye, ShieldCheck, Scissors, Sparkles, Droplets, LucideIcon } from 'lucide-react';
import { BenefitsRowProps, IconName } from './types';

// Map icon names to actual icon components
const iconMap: Record<IconName, LucideIcon> = {
  Clock,
  FileCheck,
  Palette,
  Truck,
  DollarSign,
  Eye,
  ShieldCheck,
  Scissors,
  Sparkles,
  Droplets,
};

export function BenefitsRow({
  title = 'Why Order With Us?',
  description,
  benefits,
}: BenefitsRowProps) {
  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-[#FAF6F3] to-stone-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
            {title}
          </h2>
          <p className="text-stone-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>
        
        {/* Benefits grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = iconMap[benefit.icon];
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/60 text-center"
              >
                <div className={`inline-flex items-center justify-center h-14 w-14 rounded-xl ${benefit.color} mb-4 shadow-sm`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-navy-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-stone-600">{benefit.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
