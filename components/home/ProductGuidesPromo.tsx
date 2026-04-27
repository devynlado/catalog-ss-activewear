'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, GraduationCap, Trophy, Building2, PartyPopper, Store } from 'lucide-react';

// Use-case cards for quick navigation
const useCases = [
  { 
    label: 'For Schools', 
    icon: GraduationCap, 
    href: '/guides?filter=schools',
    gradient: 'from-blue-500 to-blue-600',
    bgHover: 'hover:bg-blue-50',
    description: 'Uniforms, spirit wear & youth sizes'
  },
  { 
    label: 'For Sports', 
    icon: Trophy, 
    href: '/guides?filter=sports',
    gradient: 'from-green-500 to-green-600',
    bgHover: 'hover:bg-green-50',
    description: 'Athletic wear & team jerseys'
  },
  { 
    label: 'For Corporate', 
    icon: Building2, 
    href: '/guides?filter=corporate',
    gradient: 'from-purple-500 to-purple-600',
    bgHover: 'hover:bg-purple-50',
    description: 'Polos, workwear & professional'
  },
  { 
    label: 'For Events', 
    icon: PartyPopper, 
    href: '/guides?filter=events',
    gradient: 'from-amber-500 to-amber-600',
    bgHover: 'hover:bg-amber-50',
    description: 'Promos, giveaways & merch'
  },
  { 
    label: 'For Retail', 
    icon: Store, 
    href: '/guides?filter=retail',
    gradient: 'from-rose-500 to-rose-600',
    bgHover: 'hover:bg-rose-50',
    description: 'Streetwear & fashion blanks'
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
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export function ProductGuidesPromo() {
  return (
    <section className="relative overflow-hidden py-20 bg-gradient-to-b from-stone-50 via-white to-white">
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute left-1/4 -top-20 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 -bottom-20 h-80 w-80 rounded-full bg-brand-500/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 mb-4 shadow-lg shadow-emerald-500/10">
            <BookOpen className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Product Guides</h2>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            Curated collections to help you find the perfect blanks for any project
          </p>
        </motion.div>
        
        {/* Use-Case Cards */}
        <motion.div 
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <motion.div key={useCase.label} variants={itemVariants}>
                <Link
                  href={useCase.href}
                  className={`group flex flex-col items-center text-center rounded-2xl bg-white/70 backdrop-blur-sm border border-stone-200 p-6 transition-all hover:shadow-xl hover:shadow-stone-200/50 hover:-translate-y-1 ${useCase.bgHover}`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${useCase.gradient} text-white shadow-lg mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-semibold text-navy-800">{useCase.label}</span>
                  <span className="text-xs mt-1 text-slate-500">{useCase.description}</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
        
        {/* View All CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/guides"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <BookOpen className="h-5 w-5" />
            Browse All Guides
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
