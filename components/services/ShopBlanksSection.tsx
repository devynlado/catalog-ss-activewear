'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag, Shirt, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface CategoryLink {
  name: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
}

interface ShopBlanksSectionProps {
  title: string;
  subtitle?: string;
  categories: CategoryLink[];
  serviceSlug?: string;
}

// Popular products to highlight
const featuredProducts = [
  { name: 'Gildan 5000', desc: 'Heavy Cotton Tee', category: 'T-Shirts' },
  { name: 'Bella+Canvas 3001', desc: 'Unisex Jersey Tee', category: 'T-Shirts' },
  { name: 'Gildan 18000', desc: 'Heavy Blend Crewneck', category: 'Fleece' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export function ShopBlanksSection({ title, subtitle, categories, serviceSlug }: ShopBlanksSectionProps) {
  return (
    <section className="relative py-16 lg:py-20 bg-gradient-to-b from-white to-stone-50 overflow-hidden">
      {/* Decorative orb */}
      <div className="pointer-events-none absolute -left-32 bottom-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 text-brand-600 mb-2">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Shop Blanks</span>
          </div>
          <h2 className="text-3xl font-bold text-navy-800">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-lg text-slate-600">{subtitle}</p>
          )}
        </motion.div>

        {/* Category Cards - Larger, more prominent */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {categories.slice(0, 6).map((category, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Link
                href={serviceSlug ? `${category.href}&service=${serviceSlug}` : category.href}
                className="group relative flex bg-white/80 backdrop-blur-sm rounded-xl border border-stone-200 p-6 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/5 transition-all"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30 group-hover:scale-105 transition-transform">
                      <Shirt className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-navy-800">{category.name}</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-stone-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Featured Products Highlight */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-brand-50 rounded-2xl p-6 mb-8 border border-brand-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-brand-600" />
            <span className="font-semibold text-brand-900">Popular Choices</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {featuredProducts.map((product, index) => (
              <Link
                key={index}
                href={`/catalog?search=${encodeURIComponent(product.name.split(' ')[1])}`}
                className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 hover:shadow-md transition-shadow border border-stone-100"
              >
                <div className="h-10 w-10 rounded bg-stone-100 flex items-center justify-center">
                  <Shirt className="h-5 w-5 text-stone-400" />
                </div>
                <div>
                  <p className="font-medium text-navy-800 text-sm">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Strong CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href={serviceSlug ? `/catalog?service=${serviceSlug}` : '/catalog'}
            className="inline-flex items-center justify-center gap-2 bg-brand-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25 hover:shadow-xl hover:-translate-y-0.5"
          >
            <ShoppingBag className="h-5 w-5" />
            Start Building Your Quote
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-slate-600 font-medium hover:text-brand-600 transition-colors"
          >
            See Pricing First
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
