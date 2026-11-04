'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/* ---------------------------------------------------------------------------
 * HERO BACKGROUND SLIDESHOW
 * ---------------------------------------------------------------------------
 * Drop your own images into:  public/images/hero/
 * Then just point the `src` values below at them, e.g. '/images/hero/slide-1.webp'.
 *
 * Image guidelines (see chat for details):
 *   - Aspect ratio : 16:9 landscape (fills full-width, cropped responsively)
 *   - Resolution   : 2400 x 1350 px minimum (ideal: 2560 x 1440). Keep < ~400KB each.
 *   - Format       : .webp preferred (smaller), .jpg also fine
 *   - Composition  : keep the important subject toward the RIGHT side — the
 *                    left side sits under the dark overlay where the text goes.
 *
 * Add/remove as many slides as you want. They cross-fade automatically.
 * The defaults below use existing factory/warehouse photos so the preview
 * works right now — swap them for your own whenever you're ready.
 * ------------------------------------------------------------------------- */
const HERO_SLIDES = [
  {
    src: '/images/hero/1.webp',
    alt: 'Screen printing production floor at Garment Decor',
  },
  {
    src: '/images/hero/2.webp',
    alt: 'Garment Decor Factory in Montclair, CA',
  },
  {
    src: '/images/hero/3.webp',
    alt: 'Screen printing production floor at the Garment Decor facility',
  },
  {
    src: '/images/hero/4.webp',
    alt: 'Embroidery production floor at the Garment Decor facility',
  },
  {
    src: '/images/hero/5.webp',
    alt: 'Digital Screen Printing Machine at the Garment Decor',
  },
  {
    src: '/images/hero/6.webp',
    alt: 'Embroidery production floor at the Garment Decor facility',
  },
  {
    src: '/images/hero/7.webp',
    alt: 'Screen Printing Factory in Montclair, CA',
  },
];

// How long each image stays before cross-fading to the next (ms)
const SLIDE_INTERVAL = 5000;

const metrics = [
  { value: '1M+', label: 'Shirts/Year' },
  { value: '4.9', label: 'Reviews' },
  { value: '25k', label: 'Sq Ft Factory' },
  { value: 'In-House', label: 'Production' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
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

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  // Autoplay cross-fade (no manual navigation). Pauses for reduced-motion users.
  useEffect(() => {
    if (prefersReducedMotion || HERO_SLIDES.length <= 1) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  return (
    <section className="relative flex min-h-[600px] items-center overflow-hidden bg-navy-900 lg:min-h-[720px]">
      {/* Background slideshow — each image stacked and cross-faded */}
      <div className="absolute inset-0">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.src}
            aria-hidden={index !== active}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === active ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      {/* Readability overlays: darker on the left where the copy lives */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-900/85 via-navy-900/60 to-navy-900/20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-900/60 via-transparent to-navy-900/20" />

      {/* Content */}
      <motion.div
        className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-2xl">
          {/* Subhead (top) */}
          <motion.div
            variants={itemVariants}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm sm:text-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            Southern California&apos;s #1 Decorator
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            High-Volume{' '}
            <span className="text-brand-400">Screen Printing &amp; Embroidery</span>{' '}
            Experts
          </motion.h1>

          {/* Subhead (bottom) */}
          <motion.p
            variants={itemVariants}
            className="mt-4 text-lg font-semibold text-white/90 sm:text-xl"
          >
            Big Orders. Complex Art. Fast.
          </motion.p>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="mt-4 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg"
          >
            Factory-direct custom apparel decorator, built for orders from 50 to 50,000 pieces.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="mt-8 sm:mt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/services"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/40 hover:-translate-y-0.5"
              >
                View Services
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/quote"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white/10 hover:-translate-y-0.5"
              >
                Request a Quote
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              50 piece minimum • Mix sizes, colors &amp; styles •{' '}
              <Link
                href="/portfolio/photos"
                className="text-brand-300 underline underline-offset-2 hover:text-brand-200"
              >
                Check Our Portfolios
              </Link>
            </p>
          </motion.div>

          {/* Quick metrics */}
          <motion.div
            variants={itemVariants}
            className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 pt-6 sm:grid-cols-4"
          >
            {metrics.map((metric) => (
              <div key={metric.label}>
                <p className="text-2xl font-bold text-white sm:text-3xl">{metric.value}</p>
                <p className="mt-0.5 text-xs text-slate-300 sm:text-sm">{metric.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
