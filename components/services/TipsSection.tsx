'use client';

import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface Tip {
  title: string;
  description: string;
}

interface TipsSectionProps {
  title?: string;
  tips: Tip[];
}

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

export function TipsSection({ title = "Pro Tips", tips }: TipsSectionProps) {
  return (
    <section className="relative py-16 lg:py-20 bg-stone-50 overflow-hidden">
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 text-brand-600 mb-2">
            <Lightbulb className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Expert Advice</span>
          </div>
          <h2 className="text-3xl font-bold text-navy-800">{title}</h2>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {tips.map((tip, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-stone-200 hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold text-sm shadow-md shadow-brand-500/30">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-navy-800">{tip.title}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {tip.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
