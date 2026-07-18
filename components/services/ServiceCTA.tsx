'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceCTAProps {
  title?: string;
  subtitle?: string;
  showRushBanner?: boolean;
  serviceSlug?: string; // For context passing
}

export function ServiceCTA({
  title = "Ready to Get Started?",
  subtitle = "Request a quote and we'll respond within 24 hours.",
  showRushBanner = true,
  serviceSlug,
}: ServiceCTAProps) {
  return (
    <section className="relative bg-stone-50 py-16 lg:py-20 overflow-hidden">
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -right-32 top-10 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-10 h-48 w-48 rounded-full bg-navy-800/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Rush Banner */}
        {showRushBanner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/services/rush"
              className="mb-8 flex items-center justify-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 hover:bg-amber-100 transition-colors group"
            >
              <Zap className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800 font-medium">
                Need it faster? Rush turnaround available — as soon as 48 hours.
              </span>
              <ArrowRight className="h-4 w-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}
        
        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-brand-500/5 p-8 lg:p-12 border border-stone-200"
        >
          <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div>
              <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">
                {title}
              </h2>
              <p className="mt-2 text-slate-600">
                {subtitle}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={serviceSlug ? `/quote?service=${serviceSlug}` : '/quote'}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:-translate-y-0.5"
              >
                Request a Quote
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={serviceSlug ? `/contact?service=${serviceSlug}` : '/contact'}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-stone-300 px-6 py-3.5 text-base font-semibold text-navy-800 transition-all hover:border-brand-300 hover:bg-brand-50"
              >
                Questions? Contact Us
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
