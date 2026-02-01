'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Clock, Calendar, Phone } from 'lucide-react';

function getDeliveryDates() {
  const today = new Date();
  
  // Rush: 3 business days from now
  const rushDate = new Date(today);
  let rushDaysAdded = 0;
  while (rushDaysAdded < 3) {
    rushDate.setDate(rushDate.getDate() + 1);
    const dayOfWeek = rushDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      rushDaysAdded++;
    }
  }
  
  // Standard: 7-10 business days (use 8 as middle)
  const standardDate = new Date(today);
  let standardDaysAdded = 0;
  while (standardDaysAdded < 8) {
    standardDate.setDate(standardDate.getDate() + 1);
    const dayOfWeek = standardDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      standardDaysAdded++;
    }
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return {
    rush: formatDate(rushDate),
    standard: formatDate(standardDate),
  };
}

export function LPDeliveryDates() {
  const dates = getDeliveryDates();
  
  return (
    <section className="relative py-12 lg:py-16 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-800 overflow-hidden">
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left - Guarantee badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">
                Guaranteed
              </p>
              <p className="text-xl font-bold text-white lg:text-2xl">
                Expedited Service
              </p>
            </div>
          </motion.div>
          
          {/* Right - Delivery date cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {/* Rush Order */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-center hover:border-brand-500/30 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-center gap-2 text-brand-400 mb-2">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Rush Order</span>
              </div>
              <p className="text-xl font-bold text-white">
                {dates.rush}
              </p>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                <Phone className="h-3 w-3" />
                Call for rush
              </p>
            </div>
            
            {/* Standard */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-center hover:border-white/20 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Standard</span>
              </div>
              <p className="text-xl font-bold text-white">
                {dates.standard}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Most orders
              </p>
            </div>
            
            {/* Custom Deadline */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-center hover:border-white/20 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Have a Deadline?</span>
              </div>
              <p className="text-lg font-bold text-white">
                We&apos;ll guarantee it
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tell us your event date
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
