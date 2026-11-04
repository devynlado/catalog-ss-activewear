'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shirt, Snowflake, UserRound, ShieldCheck, HardHat, PersonStanding, ShoppingBag, Sparkles } from 'lucide-react';

const categories = [
  {
    id: 21,
    slug: 't-shirts',
    name: 'T-Shirts',
    description: 'Classic tees in every style',
    icon: Shirt,
    color: 'from-red-500 to-red-600',
  },
  {
    id: 9,
    slug: 'sweatshirts',
    name: 'Sweatshirts',
    description: 'Hoodies & sweatshirts',
    icon: Snowflake,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 52,
    slug: 'polos',
    name: 'Polos',
    description: 'Professional & casual',
    icon: UserRound,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 15,
    slug: 'jackets',
    name: 'Jackets',
    description: 'Jackets & vests',
    icon: ShieldCheck,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 11,
    slug: 'headwear',
    name: 'Headwear',
    description: 'Caps, beanies & more',
    icon: HardHat,
    color: 'from-orange-500 to-orange-600',
  },
  {
    id: 384,
    slug: 'bottoms',
    name: 'Bottoms',
    description: 'Pants & shorts',
    icon: PersonStanding,
    color: 'from-teal-500 to-teal-600',
  },
  {
    id: 102,
    slug: 'bags',
    name: 'Bags',
    description: 'Totes & backpacks',
    icon: ShoppingBag,
    color: 'from-pink-500 to-pink-600',
  },
  {
    id: 53,
    slug: 'accessories',
    name: 'Accessories',
    description: 'Towels, blankets & more',
    icon: Sparkles,
    color: 'from-indigo-500 to-indigo-600',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
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

export function CategoryGrid() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-stone-50/50 pt-12 pb-24">
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
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
            Step 1: Choose Your Blanks
          </p>
          <h2 className="mt-2 text-3xl font-bold text-navy-800 sm:text-4xl">
            Start Building Your Quote
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Select from premium blanks by Gildan, Bella+Canvas, Next Level, and more. 
            Add items to your quote — we&apos;ll handle the decoration.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <motion.div 
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.div key={category.id} variants={itemVariants}>
                <Link
                  href={`/catalog/${category.slug}`}
                  className="group flex items-center gap-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-stone-200 p-4 transition-all hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1"
                >
                  <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} text-white shadow-lg`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-navy-800 group-hover:text-brand-500 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">
                      {category.description}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 flex-shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-brand-500" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All Button */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/catalog"
            className="group inline-flex items-center gap-2 rounded-xl bg-navy-800 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-navy-800/20 transition-all hover:bg-navy-700 hover:shadow-xl hover:-translate-y-0.5"
          >
            Browse All Products
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
