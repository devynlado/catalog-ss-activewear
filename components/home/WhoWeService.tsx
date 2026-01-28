'use client';

import { motion } from 'framer-motion';
import { Factory, Music, Building2, Truck } from 'lucide-react';

const audiences = [
  {
    title: 'Contract Decorators',
    description: 'White-label decoration services for print shops and fulfillment centers',
    icon: Factory,
  },
  {
    title: 'Merch & Touring Artists',
    description: 'Tour merch, band tees, and artist collaborations with fast turnaround',
    icon: Music,
  },
  {
    title: 'Companies & Uniforms',
    description: 'Corporate apparel, employee uniforms, and branded workwear',
    icon: Building2,
  },
  {
    title: 'Distributors',
    description: 'Bulk orders and wholesale decoration for resellers and promo companies',
    icon: Truck,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export function WhoWeService() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-stone-100 via-white to-stone-50/50 py-12 sm:py-16">
      {/* Soft transition from dark TurnaroundBanner above */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-navy-800/[0.03] to-transparent" />
      
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-navy-800/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
            Who We Work With
          </p>
          <h2 className="mt-2 text-2xl font-bold text-navy-800 sm:text-3xl">
            Trusted by Businesses of All Sizes
          </h2>
        </motion.div>

        <motion.div 
          className="mt-12 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex flex-col items-center rounded-2xl bg-white/70 backdrop-blur-sm border border-stone-200 p-4 sm:p-6 text-center shadow-sm hover:shadow-xl hover:shadow-brand-500/5 transition-shadow"
              >
                <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-navy-800 to-navy-700 shadow-lg shadow-navy-800/20">
                  <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
                <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold text-navy-800">
                  {audience.title}
                </h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">
                  {audience.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
