'use client';

import { motion } from 'framer-motion';
import { Cog, Building2, Package, Camera, Scissors, Palette } from 'lucide-react';

const capabilities = [
  {
    stat: '6',
    label: 'Automatic Screen Presses',
    description: 'High-volume production',
    icon: Cog,
  },
  {
    stat: '20,000',
    label: 'Sq Ft Facility',
    description: 'Full-scale production space',
    icon: Building2,
  },
  {
    stat: 'Auto',
    label: 'Folding & Bagging',
    description: 'Professional packaging',
    icon: Package,
  },
  {
    stat: 'Complete',
    label: 'Digital Dark Room',
    description: 'In-house screen imaging',
    icon: Camera,
  },
  {
    stat: 'Full',
    label: 'Embroidery Department',
    description: 'Multi-head machines',
    icon: Scissors,
  },
  {
    stat: 'Custom',
    label: 'Ink & Pantone Lab',
    description: 'Exact color matching',
    icon: Palette,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export function BuiltForScale() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-800 via-navy-800 to-navy-700 py-24">
      {/* Soft edge transitions for smoother section blending */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.03] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-50/[0.03] to-transparent" />
      
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -left-48 top-0 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-48 bottom-0 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-navy-600/20 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Built for Scale
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            From 24 pieces to 24,000 — we have the production capacity 
            and equipment to handle any project size.
          </p>
        </motion.div>

        {/* Capabilities Grid */}
        <motion.div 
          className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 transition-all hover:border-brand-500/30 hover:bg-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 border border-brand-500/20">
                    <Icon className="h-6 w-6 text-brand-400" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {item.stat}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-white">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom tagline */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-3">
            <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            <p className="text-slate-300">
              <span className="text-brand-400 font-semibold">Enterprise-ready infrastructure</span>
              {' '}— the same equipment used by the largest decorators in the country.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
