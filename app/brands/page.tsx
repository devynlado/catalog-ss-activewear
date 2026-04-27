'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { Brand } from '@/lib/types';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch('/api/brands');
        if (res.ok) {
          const data = await res.json();
          setBrands(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrands();
  }, []);

  // Filter brands by search query
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const query = searchQuery.toLowerCase();
    return brands.filter(brand => 
      brand.name.toLowerCase().includes(query)
    );
  }, [brands, searchQuery]);

  // Group brands alphabetically
  const groupedBrands = useMemo(() => {
    const groups: Record<string, Brand[]> = {};
    for (const brand of filteredBrands) {
      const firstLetter = brand.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(brand);
    }
    return groups;
  }, [filteredBrands]);

  const sortedLetters = Object.keys(groupedBrands).sort();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="bg-white border-b border-stone-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <h1 className="text-3xl font-bold text-navy-800 sm:text-4xl">
            Shop by Brand
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl">
            Browse our complete selection of {brands.length}+ premium blank apparel brands. 
            From industry staples to specialty labels, find the perfect fit for your project.
          </p>
          
          {/* Search */}
          <div className="mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white py-3 pl-12 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Brand Grid */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-xl bg-stone-200" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-stone-200" />
                </div>
              ))}
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No brands found matching "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-brand-600 hover:text-brand-700 font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {sortedLetters.map((letter) => (
                <div key={letter}>
                  <h2 className="text-lg font-bold text-navy-800 mb-4 pb-2 border-b border-stone-200">
                    {letter}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {groupedBrands[letter].map((brand) => (
                      <Link
                        key={brand.id}
                        href={`/catalog?brand=${brand.id}`}
                        className="group flex flex-col items-center rounded-xl border border-stone-200 bg-white p-4 transition-all hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/10"
                      >
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-stone-50">
                          {brand.image ? (
                            <Image
                              src={brand.image.startsWith('http') ? brand.image : `https://www.ssactivewear.com/${brand.image}`}
                              alt={brand.name}
                              fill
                              className="object-contain p-1"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400 text-xl font-bold">
                              {brand.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-900 text-center group-hover:text-brand-600 line-clamp-2">
                          {brand.name}
                        </p>
                        <span className="mt-2 text-xs text-slate-400 group-hover:text-brand-500 flex items-center gap-1">
                          Shop <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-stone-100 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-navy-800">Can't find what you're looking for?</h2>
          <p className="mt-2 text-slate-600">
            Our team can help you source specific brands or products.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Contact Us
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-stone-200 px-6 py-3 font-semibold text-slate-700 hover:border-stone-300 hover:bg-stone-50 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
