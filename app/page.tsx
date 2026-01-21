import Link from 'next/link';
import { Search, ShoppingBag, Palette, Package } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Garment Decor
              <span className="block text-brand-400">Product Catalog</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              Browse our complete selection of blank apparel. View available colors, 
              check real-time inventory, and build your quote list.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link 
                href="/catalog" 
                className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base"
              >
                <Search className="h-5 w-5" />
                Browse Catalog
              </Link>
              <Link 
                href="/catalog?search=" 
                className="btn-secondary inline-flex items-center gap-2 border-slate-600 bg-transparent px-8 py-3 text-base text-white hover:bg-slate-700"
              >
                Search by Style #
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Palette className="h-8 w-8" />}
              title="View All Colors"
              description="See every available color with product images. Click swatches to preview exactly what you'll get."
            />
            <FeatureCard
              icon={<Package className="h-8 w-8" />}
              title="Real-Time Inventory"
              description="Check stock levels by size and color before you order. Never get caught by backorders."
            />
            <FeatureCard
              icon={<ShoppingBag className="h-8 w-8" />}
              title="Build Your Quote"
              description="Add items to your quote list and submit for pricing. We'll get back to you quickly."
            />
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Popular Categories
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            Start browsing our most popular product categories
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <CategoryCard title="T-Shirts" href="/catalog?category=t-shirts" count="500+" />
            <CategoryCard title="Hoodies & Sweatshirts" href="/catalog?category=hoodies" count="200+" />
            <CategoryCard title="Polos" href="/catalog?category=polos" count="150+" />
            <CategoryCard title="Hats & Caps" href="/catalog?category=headwear" count="300+" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-600 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Know your style number?
          </h2>
          <p className="mt-4 text-lg text-brand-100">
            Search directly by style number like G500, BC3001, or NL6210
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <form action="/catalog" method="GET" className="flex gap-2">
              <input
                type="text"
                name="search"
                placeholder="Enter style number..."
                className="input flex-1 border-brand-500 bg-white/10 text-white placeholder:text-brand-200 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400"
              />
              <button type="submit" className="btn-secondary bg-white text-brand-600 hover:bg-brand-50">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-8 shadow-sm">
      <div className="inline-flex rounded-lg bg-brand-50 p-3 text-brand-600">
        {icon}
      </div>
      <h3 className="mt-6 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600">{description}</p>
    </div>
  );
}

function CategoryCard({ 
  title, 
  href, 
  count 
}: { 
  title: string; 
  href: string; 
  count: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl bg-slate-100 p-8 transition-all hover:bg-slate-200"
    >
      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-600">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-500">{count} products</p>
      <div className="absolute bottom-0 right-0 translate-x-4 translate-y-4 text-8xl font-bold text-slate-200/50 transition-transform group-hover:translate-x-2 group-hover:translate-y-2">
        →
      </div>
    </Link>
  );
}
