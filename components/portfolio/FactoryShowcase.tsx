'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cog, Building2, Package, Palette, Factory as FactoryIcon, ArrowRight } from 'lucide-react';
import { FactoryTourCarousel } from '@/components/ui/FactoryTourCarousel';

/*
 * FactoryShowcase — "See Where Your Order Is Made"
 * A standalone copy of the home-v2 BuiltForScale section, used at the bottom
 * of /portfolio/photos. Kept independent so it won't break if the homepage
 * sandbox (components/home-v2) is ever removed.
 */

const capabilities = [
  {
    stat: '25,000',
    label: 'Sq Ft Facility',
    icon: Building2,
  },
  {
    stat: '6',
    label: 'Auto Presses',
    icon: Cog,
  },
  {
    stat: 'In-House',
    label: 'Color Lab',
    icon: Palette,
  },
  {
    stat: 'Auto',
    label: 'Folding & Bagging',
    icon: Package,
  },
];

export function FactoryShowcase() {
  return (
    <section className="relative py-16 lg:py-20 bg-gradient-to-br from-navy-800 via-navy-800 to-navy-700 overflow-hidden">
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
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-medium text-white mb-4">
            <FactoryIcon className="h-4 w-4" />
            Our Factory
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            See Where Your Order Is Made
          </h2>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Tour our Montclair, CA production facility — equipped with the same industrial equipment 
            used by the nation&apos;s largest decorators.
          </p>
        </motion.div>

        {/* Capabilities - Glassmorphism cards */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-center hover:border-brand-500/30 hover:bg-white/10 transition-all"
              >
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 border border-brand-500/20 mb-3">
                  <Icon className="h-5 w-5 text-brand-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {item.stat}
                </div>
                <div className="text-sm text-slate-400">
                  {item.label}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Factory tour carousel (autoplay) */}
        <FactoryTourCarousel />

        {/* Bottom tagline - Glassmorphism */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-3">
            <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            <p className="text-slate-300">
              <span className="text-brand-400 font-semibold">Enterprise-ready infrastructure</span>
              {' '}— capacity for 50 to 50,000 piece orders.
            </p>
          </div>

          {/* Learn more link */}
          <div className="mt-6">
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 text-base font-semibold text-brand-400 transition-colors hover:text-brand-300"
            >
              Learn more about us
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
