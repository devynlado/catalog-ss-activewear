'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-800 via-navy-800 to-navy-700 py-24 border-b border-white/10">
      {/* Soft edge transition at top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-stone-50/[0.04] to-transparent" />
      
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -left-48 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-48 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 h-64 w-[600px] rounded-full bg-navy-600/30 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2 
            className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Ready to Start Your Project?
          </motion.h2>
          <motion.p 
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Add items to your quote and we&apos;ll get back to you within 24 hours 
            with pricing and turnaround time.
          </motion.p>
          
          <motion.div 
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/catalog"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-brand-500/30 transition-all hover:shadow-2xl hover:shadow-brand-500/40 hover:-translate-y-1"
            >
              Start Building Your Quote
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="tel:+18559427636"
              className="group inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-white transition-all hover:border-white/40 hover:bg-white/10 hover:-translate-y-1"
            >
              <Phone className="h-5 w-5" />
              Call Us Now
            </a>
          </motion.div>
          
          <motion.p 
            className="mt-10 text-sm text-slate-400"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Questions? Call us at{' '}
            <a href="tel:+18559427636" className="text-brand-400 hover:text-brand-300 transition-colors">
              (855) 942-7636
            </a>
            {' '}— Average wait time: 10-30 seconds
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
