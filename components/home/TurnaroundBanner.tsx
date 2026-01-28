'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Clock, Calendar, Phone } from 'lucide-react';

// Calculate business days from today
function addBusinessDays(days: number): Date {
  const date = new Date();
  let added = 0;
  
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  
  return date;
}

// Format date as "Wed, Jan 23"
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function TurnaroundBanner() {
  const rushDate = addBusinessDays(2);
  const standardDate = addBusinessDays(7);

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-navy-800 via-navy-800 to-navy-700 py-12">
      {/* Soft edge transitions */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-stone-50/10 to-transparent" />
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -left-32 top-0 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          
          {/* Guarantee Badge */}
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                Guaranteed
              </p>
              <p className="text-lg font-bold text-white">
                Expedited Service
              </p>
            </div>
          </motion.div>

          {/* Delivery Options */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-6 lg:gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            
            {/* Rush Delivery */}
            <div className="text-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-4">
              <div className="flex items-center justify-center gap-2 text-brand-400">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Rush Order</span>
              </div>
              <p className="mt-1 text-xl font-bold text-white">
                {formatDate(rushDate)}
              </p>
              <a 
                href="tel:+18559427636" 
                className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-brand-400 transition-colors"
              >
                <Phone className="h-3 w-3" />
                Call for rush
              </a>
            </div>

            {/* Divider */}
            <div className="hidden h-16 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent lg:block" />

            {/* Standard Delivery */}
            <div className="text-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-4">
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Standard</span>
              </div>
              <p className="mt-1 text-xl font-bold text-white">
                {formatDate(standardDate)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Most orders
              </p>
            </div>

            {/* Divider */}
            <div className="hidden h-16 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent lg:block" />

            {/* Custom Deadline */}
            <div className="text-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-4">
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Have a Deadline?</span>
              </div>
              <p className="mt-1 text-lg font-semibold text-white">
                We&apos;ll guarantee it
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Tell us your event date
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
