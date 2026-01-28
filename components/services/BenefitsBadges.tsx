'use client';

import { Factory, Users, Clock, Zap, Star, MapPin, Cpu, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export function BenefitsBadges({ benefits = defaultBenefits, title = "And you will get" }: BenefitsBadgesProps) {
  return (
    <section className="bg-white py-12 border-b border-stone-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-slate-500 uppercase tracking-wider mb-6">
          {title}
        </p>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex flex-col items-center text-center p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30 mb-2">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-navy-800 leading-tight">
                  {benefit.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
