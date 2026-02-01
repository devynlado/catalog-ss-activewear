'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Upload, PhoneCall, CheckCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Shop Products',
    description: 'Browse our catalog of premium blanks. Add items and quantities to your cart.',
    icon: ShoppingBag,
  },
  {
    number: 2,
    title: 'Add Decoration',
    description: 'Choose screen printing or embroidery at checkout. Upload your artwork.',
    icon: Upload,
  },
  {
    number: 3,
    title: 'Approve Proof',
    description: 'Receive a digital proof within 1-2 days. Review and approve to start production.',
    icon: PhoneCall,
  },
  {
    number: 4,
    title: 'Receive Order',
    description: 'We produce and ship your decorated apparel. Track progress every step.',
    icon: CheckCircle,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/20 to-white py-24">
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-navy-800/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
            We Make It Easy
          </p>
          <h2 className="mt-2 text-3xl font-bold text-navy-800 sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Get custom decorated apparel in 4 easy steps. No hassle, no surprises — 
            just quality products delivered on time.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div 
          className="mt-16 sm:mt-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Mobile: 2-column grid | Desktop: 4-column grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;
              
              return (
                <motion.div 
                  key={step.number} 
                  className="relative"
                  variants={itemVariants}
                >
                  {/* Connector Line (hidden on mobile, shown on lg) */}
                  {!isLast && (
                    <div className="absolute left-1/2 top-10 hidden h-0.5 w-full bg-gradient-to-r from-brand-300/50 via-brand-200/30 to-transparent lg:block" />
                  )}
                  
                  <div className="relative flex flex-col items-center text-center">
                    {/* Number Circle - with overflow visible for badge */}
                    <motion.div 
                      className="relative z-10 flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-brand-100 shadow-lg shadow-brand-500/10 overflow-visible"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30">
                        <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
                      </div>
                      {/* Step Number Badge */}
                      <span className="absolute -right-0.5 -top-0.5 sm:-right-1 sm:-top-1 flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-navy-800 text-[9px] sm:text-xs font-bold text-white shadow-md">
                        {step.number}
                      </span>
                    </motion.div>
                    
                    {/* Content */}
                    <h3 className="mt-3 sm:mt-6 text-sm sm:text-lg font-bold text-navy-800">
                      {step.title}
                    </h3>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="inline-flex flex-col items-center rounded-3xl bg-white/70 backdrop-blur-sm border border-stone-200 p-8 shadow-xl shadow-stone-200/50 sm:flex-row sm:gap-6">
            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold text-navy-800">
                Ready to start your project?
              </p>
              <p className="mt-1 text-slate-600">
                Browse our catalog and add decoration at checkout.
              </p>
            </div>
            <Link
              href="/catalog"
              className="group mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:-translate-y-0.5 sm:mt-0"
            >
              Shop Products
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
