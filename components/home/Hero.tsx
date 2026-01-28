'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, Star, TrendingUp, Clock, Factory } from 'lucide-react';
import { PhoneButton } from '@/components/ui/PhoneButton';

// Hero images - asymmetric duo layout
const HERO_PRIMARY = {
  src: '/images/factory-tour/quality-inspection-in-shirts-we-trust.webp',
  alt: 'Quality inspection at Garment Decor - In Shirts We Trust',
};

const HERO_ACCENT = {
  src: '/images/factory-tour/thread-wall-color-selection.webp',
  alt: 'Colorful thread wall for embroidery color matching',
};

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  
  // Parallax transforms - disabled if user prefers reduced motion
  const imageY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, 100]);
  const textY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, 50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden bg-gradient-to-br from-white via-brand-50/30 to-white"
    >
      {/* Subtle grain texture overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-navy-800/5 blur-3xl" />
      
      <motion.div 
        style={{ opacity }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="grid min-h-[500px] items-center gap-8 py-10 sm:min-h-[600px] sm:gap-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          {/* Left Content */}
          <motion.div 
            className="max-w-xl"
            style={{ y: textY }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={itemVariants}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-brand-100 px-3 py-1.5 text-xs font-medium text-brand-600 shadow-sm sm:mb-6 sm:px-4 sm:py-2 sm:text-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
              Southern California&apos;s #1 Decorator
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-3xl font-bold tracking-tight text-navy-800 sm:text-5xl lg:text-6xl"
            >
              Custom Apparel{' '}
              <span className="relative">
                <span className="text-brand-500">Decoration</span>
                <motion.span 
                  className="absolute -bottom-1 left-0 h-1 bg-brand-500/30 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                />
              </span>{' '}
              Experts
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="mt-4 text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg"
            >
              Screen printing, embroidery & premium blank apparel — delivered when you need it. 
              Starting at just 50 pieces (mix sizes, colors & styles!), build your quote in minutes.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="mt-6 sm:mt-10"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="/catalog"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5"
                >
                  Start Your Quote
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                
                <PhoneButton 
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-navy-800 px-6 py-3.5 text-base font-semibold text-navy-800 transition-all hover:bg-navy-800 hover:text-white hover:-translate-y-0.5"
                />
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4 text-brand-500" />
                Quotes in 2 hours or less
              </p>
            </motion.div>
            
            {/* Quick Stats - hidden on mobile for cleaner above-the-fold */}
            <motion.div 
              variants={itemVariants}
              className="mt-8 hidden gap-4 border-t border-slate-200/60 pt-5 sm:flex"
            >
              <div className="flex items-center gap-3 rounded-xl bg-white/60 backdrop-blur-sm border border-stone-200 px-4 py-3 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-navy-800">1M+</p>
                  <p className="text-xs text-slate-500">Shirts/Year</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/60 backdrop-blur-sm border border-stone-200 px-4 py-3 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl font-bold text-navy-800">4.8</p>
                    <p className="text-xs text-slate-500">(185)</p>
                  </div>
                  <p className="text-xs text-slate-500">Reviews</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/60 backdrop-blur-sm border border-stone-200 px-4 py-3 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Factory className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-navy-800">In-House</p>
                  <p className="text-xs text-slate-500">Production</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right - Asymmetric Duo Image Layout with Parallax */}
          <motion.div 
            className="relative hidden lg:block"
            style={{ y: imageY }}
          >
            {/* Main hero image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative aspect-[4/5] max-h-[520px] overflow-hidden rounded-3xl shadow-2xl"
            >
              <Image
                src={HERO_PRIMARY.src}
                alt={HERO_PRIMARY.alt}
                fill
                className="object-cover object-[center_80%]"
                sizes="(max-width: 1024px) 100vw, 500px"
                priority
              />
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/30 via-transparent to-transparent" />
            </motion.div>
            
            {/* Accent image - overlapping bottom right */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.03, rotate: -1 }}
              className="absolute -bottom-6 -right-6 w-48 aspect-square overflow-hidden rounded-2xl shadow-xl border-4 border-white"
            >
              <Image
                src={HERO_ACCENT.src}
                alt={HERO_ACCENT.alt}
                fill
                className="object-cover"
                sizes="200px"
              />
            </motion.div>
            
            {/* Decorative elements */}
            <div className="absolute -right-8 top-12 h-20 w-20 rounded-full bg-brand-500/10 blur-xl" />
            <div className="absolute -left-4 top-1/3 h-16 w-16 rounded-full bg-navy-800/5 blur-lg" />
          </motion.div>
        </div>
      </motion.div>
      
      {/* Mobile stats bar - shows on mobile only */}
      <div className="border-t border-slate-200/60 bg-white/60 backdrop-blur-sm py-4 sm:hidden">
        <div className="mx-auto flex max-w-7xl justify-around px-4">
          <div className="text-center">
            <p className="text-xl font-bold text-navy-800">1M+</p>
            <p className="text-xs text-slate-500">Shirts/Year</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-xl font-bold text-navy-800">4.8</p>
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-xs text-slate-500">185 Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-navy-800">In-House</p>
            <p className="text-xs text-slate-500">Production</p>
          </div>
        </div>
      </div>
    </section>
  );
}
