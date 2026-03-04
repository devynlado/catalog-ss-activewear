import Link from 'next/link';
import { Layers, Sparkles, Printer, PenTool, Palette, Gem } from 'lucide-react';

const METHODS = [
  {
    icon: Layers,
    name: 'Screen Printing',
    description: 'Bold, vibrant prints for runs of 50+. Up to 8 colors.',
    href: '/services/screen-printing',
  },
  {
    icon: Sparkles,
    name: 'Puff Print',
    description: 'Raised, textured ink that adds dimension to any design.',
    href: '/services/puff-screen-printing',
  },
  {
    icon: Printer,
    name: 'Digital Print',
    description: 'Full-color, photo-quality prints with unlimited detail.',
    href: '/services/digital-screen-printing',
  },
  {
    icon: PenTool,
    name: 'Embroidery',
    description: 'Premium stitched logos for a polished, lasting brand look.',
    href: '/services/embroidery',
  },
  {
    icon: Palette,
    name: 'Jumbo Print',
    description: 'Oversized, edge-to-edge graphics that make a statement.',
    href: '/services/jumbo-screen-printing',
  },
  {
    icon: Gem,
    name: 'Rhinestone',
    description: 'Sparkling stone applications for standout streetwear pieces.',
    href: '/services',
  },
];

export function DecorationMethods() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Decoration Methods
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Every product above can be customized with any of these techniques
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {METHODS.map((method) => (
            <Link
              key={method.name}
              href={method.href}
              className="group flex items-start gap-4 rounded-xl border border-stone-200 p-5 transition-all hover:border-stone-300 hover:shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-stone-100 transition-colors group-hover:bg-brand-50">
                <method.icon className="h-5 w-5 text-stone-600 group-hover:text-brand-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {method.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {method.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
