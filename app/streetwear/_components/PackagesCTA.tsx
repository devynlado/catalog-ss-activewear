import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';

const PACKAGES = [
  {
    name: 'Gildan 5000 Tees',
    price: 'From $4.40/pc',
    href: '/packages/printed-tees-gildan',
  },
  {
    name: 'Comfort Colors 1717',
    price: 'From $8.95/pc',
    href: '/packages/printed-tees-comfort-colors',
  },
  {
    name: 'Embroidered Caps',
    price: 'From $12.45/pc',
    href: '/packages/embroidered-caps',
  },
  {
    name: 'Trucker Caps',
    price: 'From $10.45/pc',
    href: '/packages/trucker-caps',
  },
  {
    name: 'Snapback Caps',
    price: 'From $14.45/pc',
    href: '/packages/snapback-caps',
  },
  {
    name: 'Dad Caps',
    price: 'From $11.45/pc',
    href: '/packages/dad-caps',
  },
  {
    name: 'Beanies',
    price: 'From $10.45/pc',
    href: '/packages/beanies',
  },
  {
    name: 'Canvas Tote Bags',
    price: 'From $5.95/pc',
    href: '/packages/printed-totes-isabella',
  },
];

export function PackagesCTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
            <Package className="h-6 w-6 text-brand-600" />
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Ready to Order Now?
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Our self-serve packages include everything — blanks, decoration, and
            shipping. Configure and checkout in minutes.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((pkg) => (
            <Link
              key={pkg.name}
              href={pkg.href}
              className="group flex items-center justify-between rounded-xl border border-stone-200 px-5 py-4 transition-all hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                  {pkg.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{pkg.price}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/packages"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all packages →
          </Link>
        </div>
      </div>
    </section>
  );
}
