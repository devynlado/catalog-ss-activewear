import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Portfolio | Custom Apparel Projects | Garment Decor',
  description: 'Explore our portfolio of custom screen printing, embroidery, and apparel decoration projects. See the quality of our work for brands, businesses, and events.',
};

// Portfolio projects data (simplified for listing)
const projects = [
  {
    slug: 'jumbo-screen-printing-black-wall-street',
    title: 'Jumbo Screen Printing for LA Apparel 1801GD: Black Wall Street T-Shirts',
    category: 'Jumbo Screen Printing',
    client: 'New Haven Festivals Inc.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800',
  },
  {
    slug: 'puff-print-hoodies-awful-cloth',
    title: 'Custom Puff Screen Printed Independent SS4500 Hoodies',
    category: 'Puff Screen Printing',
    client: 'Awful Cloth',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800',
  },
  {
    slug: 'puff-embroidery-hats',
    title: 'Custom 3D Puff Embroidery on Caps: YP Classics, OTTO, and Flexfit',
    category: 'Embroidery',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800',
  },
  {
    slug: 'otto-cap-embroidery-cactus-club',
    title: 'Custom 3D Puff Embroidered OTTO CAP 31-069 for The Cactus Club',
    category: 'Embroidery',
    client: 'Saguaro Street',
    image: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?q=80&w=800',
  },
  {
    slug: 'born-raised-online-ceramics',
    title: 'Custom Screen Printed IND420XD Hoodies for Born & Raised x Online Ceramics',
    category: 'Screen Printing',
    client: 'Born & Raised',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800',
  },
];

const categories = ['All', 'Screen Printing', 'Jumbo Screen Printing', 'Puff Screen Printing', 'Embroidery'];

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Our Work
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Explore real projects we&apos;ve crafted for brands, businesses, events, and creative collaborations.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-800">1M+</p>
              <p className="text-sm text-slate-500">Garments Decorated</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-800">25K+</p>
              <p className="text-sm text-slate-500">Projects Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-800">15+</p>
              <p className="text-sm text-slate-500">Years Experience</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-800">4.8★</p>
              <p className="text-sm text-slate-500">Google Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Category Filter (visual only for now) */}
          <div className="mb-12 flex flex-wrap gap-2 justify-center">
            {categories.map((category, index) => (
              <button
                key={category}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  index === 0
                    ? 'bg-navy-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Projects */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.slug}
                href={`/portfolio/${project.slug}`}
                className="group rounded-2xl bg-white overflow-hidden shadow-sm ring-1 ring-slate-200 hover:shadow-lg hover:ring-brand-200 transition-all"
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-flex items-center gap-1 text-white font-medium text-sm">
                      View Project
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-xs font-medium text-brand-600 mb-2">{project.category}</p>
                  <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
                    {project.title}
                  </h3>
                  {project.client && (
                    <p className="mt-2 text-sm text-slate-500">Client: {project.client}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-brand-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to Start Your Project?</h2>
          <p className="mt-4 text-lg text-white/90">
            Get a quote in 2 hours or less. We&apos;ll help bring your vision to life.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-base font-semibold text-brand-600 shadow-lg transition-all hover:bg-slate-50"
            >
              Request a Quote
            </Link>
            <a
              href="tel:+18559427636"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/20 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/30"
            >
              <Phone className="h-5 w-5" />
              (855) 942-7636
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
