'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/builder/ProductCard';

// Popular style IDs to feature
const FEATURED_STYLE_IDS = [
  16,    // Gildan 5000 - Heavy Cotton Tee
  7,     // Gildan G200 - Ultra Cotton Tee
  87,    // Bella+Canvas 3001 - Unisex Jersey Tee
  223,   // Next Level 6210 - CVC Crew
  17,    // Gildan G500 - Heavy Cotton Tee
  181,   // Comfort Colors 1717 - Garment Dyed
];

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch products by searching for popular styles
        const response = await fetch('/api/products?search=G500&pageSize=6');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
              Most Requested
            </p>
            <h2 className="mt-2 text-3xl font-bold text-navy-800 sm:text-4xl">
              Popular Picks to Get You Started
            </h2>
            <p className="mt-2 text-lg text-slate-600">
              These best-sellers are perfect for any project — add them to your quote
            </p>
          </div>
          <Link
            href="/catalog"
            className="hidden items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-600 sm:flex"
          >
            Browse All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="mt-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 6).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showSwatches={true}
                  showPricing={true}
                  maxSwatches={4}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white p-12 text-center">
              <p className="text-slate-500">Featured products coming soon</p>
            </div>
          )}
        </div>

        {/* Mobile View All Link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-600"
          >
            View All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
