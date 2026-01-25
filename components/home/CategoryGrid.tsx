'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shirt, CloudSnow, Award, Cloudy, HardHat, ArrowDown, ShoppingBag, Sparkles } from 'lucide-react';

const categories = [
  {
    id: 21,
    slug: 't-shirts',
    name: 'T-Shirts',
    description: 'Classic tees in every style',
    icon: Shirt,
    color: 'bg-red-500',
  },
  {
    id: 9,
    slug: 'sweatshirts',
    name: 'Sweatshirts',
    description: 'Hoodies & sweatshirts',
    icon: CloudSnow,
    color: 'bg-blue-500',
  },
  {
    id: 52,
    slug: 'polos',
    name: 'Polos',
    description: 'Professional & casual',
    icon: Award,
    color: 'bg-green-500',
  },
  {
    id: 15,
    slug: 'jackets',
    name: 'Jackets',
    description: 'Jackets & vests',
    icon: Cloudy,
    color: 'bg-purple-500',
  },
  {
    id: 11,
    slug: 'headwear',
    name: 'Headwear',
    description: 'Caps, beanies & more',
    icon: HardHat,
    color: 'bg-orange-500',
  },
  {
    id: 384,
    slug: 'bottoms',
    name: 'Bottoms',
    description: 'Pants & shorts',
    icon: ArrowDown,
    color: 'bg-teal-500',
  },
  {
    id: 102,
    slug: 'bags',
    name: 'Bags',
    description: 'Totes & backpacks',
    icon: ShoppingBag,
    color: 'bg-pink-500',
  },
  {
    id: 53,
    slug: 'accessories',
    name: 'Accessories',
    description: 'Towels, blankets & more',
    icon: Sparkles,
    color: 'bg-indigo-500',
  },
];

export function CategoryGrid() {
  return (
    <section className="bg-white pt-10 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
            Step 1: Choose Your Blanks
          </p>
          <h2 className="mt-2 text-3xl font-bold text-navy-800 sm:text-4xl">
            Start Building Your Quote
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Select from premium blanks by Gildan, Bella+Canvas, Next Level, and more. 
            Add items to your quote — we'll handle the decoration.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                href={`/catalog/${category.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-lg"
              >
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${category.color} text-white`}>
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
            );
          })}
        </div>

        {/* View All Button */}
        <div className="mt-10 text-center">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-navy-700"
          >
            Browse All Products
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
