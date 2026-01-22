'use client';

import Link from 'next/link';
import { ArrowRight, Layers, PenTool, Monitor, Maximize } from 'lucide-react';

const services = [
  {
    id: 'screen-printing',
    title: 'Screen Printing',
    specs: [
      'Up to 12 colors',
      'Max print: 16" x 20"',
      'Plastisol, water-based & discharge inks',
    ],
    icon: Layers,
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'embroidery',
    title: 'Embroidery',
    specs: [
      'Up to 15 colors per design',
      'Max size: 14" x 14"',
      '3D puff & flat embroidery',
    ],
    icon: PenTool,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'digital-squeegee',
    title: 'Digital Squeegee',
    specs: [
      'Unlimited colors',
      'Photo-quality prints',
      'Soft hand feel finish',
    ],
    icon: Monitor,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'jumbo-prints',
    title: 'Jumbo Prints',
    specs: [
      'Oversized prints up to 18" x 24"',
      'All-over print capable',
      'Front, back & sleeve coverage',
    ],
    icon: Maximize,
    color: 'from-green-500 to-teal-500',
  },
];

export function ServicesGrid() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
            Our Decoration Services
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Professional-grade decoration with industry-leading equipment 
            and techniques for every project size.
          </p>
        </div>

        {/* Services Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.id}
                href={`/services/${service.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Image/Icon Area */}
                <div className={`relative h-44 bg-gradient-to-br ${service.color}`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="h-16 w-16 text-white/80" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-navy-800 group-hover:text-brand-500 transition-colors">
                    {service.title}
                  </h3>
                  
                  {/* Technical Specs */}
                  <ul className="mt-4 space-y-2">
                    {service.specs.map((spec, index) => (
                      <li 
                        key={index} 
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
                        {spec}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand-500">
                    Learn More
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
