'use client';

import { Factory, Clock, Users, Star, MapPin, Shield, Award, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const trustSignals = [
  { icon: Factory, label: 'Factory Direct Pricing' },
  { icon: Clock, label: 'Same Week Turnaround' },
  { icon: Users, label: '50,000+ Orders' },
  { icon: Star, label: '4.8★ on Google' },
  { icon: MapPin, label: 'Southern California' },
  { icon: Shield, label: 'Quality Guaranteed' },
  { icon: Award, label: '10+ Years Experience' },
  { icon: Zap, label: 'Rush Available' },
];

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

export function LPTrustSignals() {
  return (
    <section className="bg-white py-8 border-b border-stone-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8"
        >
          {trustSignals.map((signal, index) => {
            const Icon = signal.icon;
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
                  {signal.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
