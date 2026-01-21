'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingBag, Search, ChevronDown, ChevronRight, Phone, Star } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQuoteStore } from '@/lib/quote-store';
import { cn } from '@/lib/utils';
import { Brand } from '@/lib/types';
import { getMainCategories } from '@/lib/category-taxonomy';

// Get main navigation categories from taxonomy
const mainCategories = getMainCategories().map((cat) => ({
  name: cat.name,
  href: `/catalog?category=${cat.id}`,
  categoryId: cat.id.toString(),
}));

// Mega menu subcategory configuration
// These combine category + attribute filters for refined browsing
interface SubcategoryGroup {
  title: string;
  items: { name: string; href: string }[];
}

interface MegaMenuConfig {
  [categoryId: string]: SubcategoryGroup[];
}

// SS Activewear uses comma-separated category IDs for combined filters
// e.g., ?categoryID=21,57 = T-Shirts + Short Sleeves
const megaMenuConfig: MegaMenuConfig = {
  // T-Shirts (category 21 - was incorrectly 1)
  '21': [
    {
      title: 'By Sleeve',
      items: [
        { name: 'Short Sleeve', href: '/catalog?category=21,57' },
        { name: 'Long Sleeve', href: '/catalog?category=21,56' },
        { name: 'Sleeveless', href: '/catalog?category=21,63' },
        { name: '3/4 Sleeve', href: '/catalog?category=21,81' },
      ],
    },
    {
      title: 'By Collar',
      items: [
        { name: 'Crewneck', href: '/catalog?category=21,8' },
        { name: 'V-Neck', href: '/catalog?category=21,66' },
      ],
    },
    {
      title: 'By Material',
      items: [
        { name: '100% Cotton', href: '/catalog?category=21,71' },
        { name: 'Polyester', href: '/catalog?category=21,85' },
        { name: 'Tri-Blend', href: '/catalog?category=21,95' },
        { name: 'Performance', href: '/catalog?category=21,16' },
      ],
    },
    {
      title: 'By Fit',
      items: [
        { name: 'Fitted', href: '/catalog?category=21,150' },
        { name: 'Relaxed', href: '/catalog?category=21,157' },
      ],
    },
  ],
  // Fleece (category 9)
  '9': [
    {
      title: 'By Style',
      items: [
        { name: 'Hoodies', href: '/catalog?category=9,1161' },
        { name: 'Crewnecks', href: '/catalog?category=9,8' },
        { name: 'Full-Zip', href: '/catalog?category=9,38' },
        { name: 'Quarter-Zip', href: '/catalog?category=9,48' },
        { name: 'Pullover', href: '/catalog?category=9,142' },
      ],
    },
  ],
  // Polos (category 52)
  '52': [
    {
      title: 'By Sleeve',
      items: [
        { name: 'Short Sleeve', href: '/catalog?category=52,57' },
        { name: 'Long Sleeve', href: '/catalog?category=52,56' },
      ],
    },
    {
      title: 'By Material',
      items: [
        { name: 'Cotton', href: '/catalog?category=52,71' },
        { name: 'Performance', href: '/catalog?category=52,16' },
      ],
    },
  ],
  // Outerwear (category 15)
  '15': [
    {
      title: 'By Style',
      items: [
        { name: 'Jackets', href: '/catalog?category=15,47' },
        { name: 'Lightweight', href: '/catalog?category=15,665' },
        { name: 'Vests', href: '/catalog?category=15,62' },
        { name: 'Windbreakers', href: '/catalog?category=15,380' },
        { name: 'Soft Shells', href: '/catalog?category=15,403' },
        { name: 'Rainwear', href: '/catalog?category=15,401' },
        { name: 'Puffers', href: '/catalog?category=15,141' },
      ],
    },
  ],
  // Headwear (category 11)
  '11': [
    {
      title: 'By Style',
      items: [
        { name: 'Snapbacks', href: '/catalog?category=11,363' },
        { name: 'Fitted Hats', href: '/catalog?category=11,1216' },
        { name: 'Trucker Hats', href: '/catalog?category=11,147' },
        { name: 'Dad Hats', href: '/catalog?category=11,796' },
        { name: 'Bucket Hats', href: '/catalog?category=11,242' },
        { name: 'Beanies', href: '/catalog?category=11,120' },
        { name: 'Visors', href: '/catalog?category=11,241' },
      ],
    },
    {
      title: 'By Structure',
      items: [
        { name: 'Structured', href: '/catalog?category=11,244' },
        { name: 'Unstructured', href: '/catalog?category=11,245' },
        { name: '5-Panel', href: '/catalog?category=11,238' },
        { name: '6-Panel', href: '/catalog?category=11,239' },
      ],
    },
    {
      title: 'Other',
      items: [
        { name: 'Bandanas', href: '/catalog?category=11,398' },
      ],
    },
  ],
};


export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const brandsRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { items, openDrawer } = useQuoteStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch brands for dropdown
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch('/api/brands');
        if (res.ok) {
          const data = await res.json();
          setBrands(data.data || []);
        }
      } catch (e) {
        console.error('Error fetching brands:', e);
      }
    };
    fetchBrands();
  }, []);


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandsRef.current && !brandsRef.current.contains(event.target as Node)) {
        setBrandsOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setActiveMegaMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Popular brands to show at top
  const popularBrands = brands.filter(b => 
    ['Gildan', 'Bella+Canvas', 'Next Level', 'Hanes', 'Port & Company', 'Champion', 'Nike', 'Adidas'].some(
      name => b.name.toLowerCase().includes(name.toLowerCase())
    )
  ).slice(0, 8);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center justify-between text-sm">
            {/* Phone & Availability */}
            <a 
              href="tel:+18559427636" 
              className="hidden items-center gap-2 text-slate-200 hover:text-white transition-colors sm:flex"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="font-medium">(855) 942-7636</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">Avg. wait: 10-30 sec</span>
            </a>
            
            {/* Center - Google Rating */}
            <div className="hidden items-center gap-1.5 md:flex">
              <div className="flex text-yellow-400">
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current stroke-yellow-400" style={{ clipPath: 'inset(0 20% 0 0)' }} />
              </div>
              <span className="font-medium">4.8</span>
              <span className="text-slate-400">on Google</span>
            </div>
            
            {/* Right - Tagline */}
            <p className="text-slate-300">Free quotes • Fast shipping</p>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-lg">
                GD
              </div>
              <span className="hidden font-bold text-xl text-slate-900 lg:block">
                Garment Decor
              </span>
            </Link>
          </div>

          {/* Search Bar (desktop) */}
          <div className="hidden flex-1 max-w-xl mx-8 md:block">
            <form action="/catalog" method="GET" className="relative">
              <input
                type="text"
                name="search"
                placeholder="Search by style # or keyword..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-12 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-brand-600 p-2 text-white hover:bg-brand-700"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Quote button */}
            <button
              onClick={openDrawer}
              className="relative flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden sm:inline">Quote</span>
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-600">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Category Navigation (desktop) */}
        <div className="hidden border-t border-slate-100 lg:block" ref={megaMenuRef}>
          <div className="flex items-center gap-1 py-2">
            {/* All Products */}
            <Link
              href="/catalog"
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/catalog' && !pathname.includes('?')
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              )}
              onMouseEnter={() => setActiveMegaMenu(null)}
            >
              All Products
            </Link>

            {/* Main Categories with Mega Menu */}
            {mainCategories.map((cat) => {
              const hasMegaMenu = megaMenuConfig[cat.categoryId];
              
              return (
                <div key={cat.name} className="relative">
                  <Link
                    href={cat.href}
                    className={cn(
                      'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      activeMegaMenu === cat.categoryId
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    )}
                    onMouseEnter={() => setActiveMegaMenu(hasMegaMenu ? cat.categoryId : null)}
                  >
                    {cat.name}
                    {hasMegaMenu && (
                      <ChevronDown className={cn(
                        'h-3.5 w-3.5 transition-transform',
                        activeMegaMenu === cat.categoryId && 'rotate-180'
                      )} />
                    )}
                  </Link>

                  {/* Mega Menu Panel */}
                  {hasMegaMenu && activeMegaMenu === cat.categoryId && (
                    <div 
                      className="absolute left-0 top-full z-50 mt-1 w-[600px] rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-200"
                      onMouseLeave={() => setActiveMegaMenu(null)}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Shop {cat.name}
                        </h3>
                        <Link
                          href={cat.href}
                          onClick={() => setActiveMegaMenu(null)}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          View All {cat.name} →
                        </Link>
                      </div>
                      
                      {/* Category Links */}
                      <div className="grid grid-cols-4 gap-6">
                        {megaMenuConfig[cat.categoryId].map((group) => (
                          <div key={group.title}>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {group.title}
                            </h4>
                            <ul className="space-y-1">
                              {group.items.map((item) => (
                                <li key={item.name}>
                                  <Link
                                    href={item.href}
                                    onClick={() => setActiveMegaMenu(null)}
                                    className="block rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                  >
                                    {item.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Brands Dropdown */}
            <div className="relative" ref={brandsRef}>
              <button
                onClick={() => setBrandsOpen(!brandsOpen)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Brands
                <ChevronDown className={cn('h-4 w-4 transition-transform', brandsOpen && 'rotate-180')} />
              </button>

              {brandsOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-[600px] rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
                  {/* Popular Brands */}
                  {popularBrands.length > 0 && (
                    <div className="mb-4">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Popular Brands
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {popularBrands.map((brand) => (
                          <Link
                            key={brand.id}
                            href={`/catalog?brand=${brand.id}`}
                            onClick={() => setBrandsOpen(false)}
                            className="flex items-center gap-2 rounded-lg p-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {brand.image && (
                              <Image
                                src={brand.image}
                                alt={brand.name}
                                width={24}
                                height={24}
                                className="rounded"
                              />
                            )}
                            <span className="truncate">{brand.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Brands */}
                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      All Brands (A-Z)
                    </h3>
                    <div className="grid grid-cols-4 gap-1 max-h-64 overflow-y-auto">
                      {brands.slice(0, 40).map((brand) => (
                        <Link
                          key={brand.id}
                          href={`/catalog?brand=${brand.id}`}
                          onClick={() => setBrandsOpen(false)}
                          className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 truncate"
                        >
                          {brand.name}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/catalog"
                      onClick={() => setBrandsOpen(false)}
                      className="mt-3 block text-center text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      View all {brands.length} brands →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 py-4 lg:hidden">
            {/* Mobile Search */}
            <form action="/catalog" method="GET" className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  placeholder="Search products..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 p-2 text-white"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Mobile Categories */}
            <div className="space-y-1">
              <Link
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                All Products
              </Link>
              
              <div className="border-t border-slate-100 pt-2 mt-2">
                <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Categories
                </p>
                {mainCategories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-2 mt-2">
                <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Popular Brands
                </p>
                {popularBrands.slice(0, 6).map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/catalog?brand=${brand.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {brand.image && (
                      <Image
                        src={brand.image}
                        alt={brand.name}
                        width={20}
                        height={20}
                        className="rounded"
                      />
                    )}
                    {brand.name}
                  </Link>
                ))}
                <Link
                  href="/catalog"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-brand-600"
                >
                  View all brands →
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
