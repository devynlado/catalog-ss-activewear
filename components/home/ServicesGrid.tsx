'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getServiceImages } from '@/lib/service-images';

const services = [
  {
    id: 'screen-printing',
    slug: 'screen-printing',
    title: 'Screen Printing',
    specs: [
      'Up to 12 colors',
      'Max print: 17" x 23"',
      'Plastisol, water-based & discharge inks',
    ],
  },
  {
    id: 'embroidery',
    slug: 'embroidery',
    title: 'Embroidery',
    specs: [
      'Up to 15 colors per design',
      'Max size: 15.7" x 16.5"',
      '3D puff & flat embroidery',
    ],
  },
  {
    id: 'digital-screen-printing',
    slug: 'digital-screen-printing',
    title: 'Digital Squeegee',
    specs: [
      'Unlimited colors',
      'Photo-quality prints',
      'Soft hand feel finish',
    ],
  },
  {
    id: 'jumbo-screen-printing',
    slug: 'jumbo-screen-printing',
    title: 'Jumbo Prints',
    specs: [
      'Oversized prints up to 17" x 23"',
      'All-over print capable',
      'Front, back & sleeve coverage',
    ],
  },
];

export function ServicesGrid() {
  return (
    <section className="bg-white py-12 sm:py-16">
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
            const serviceImages = getServiceImages(service.slug);
            const heroImage = serviceImages?.hero;
            
            return (
              <Link
                key={service.id}
                href={`/services/${service.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Image Area */}
                <div className="relative h-44 overflow-hidden">
                  {heroImage ? (
                    <Image
                      src={heroImage.src}
                      alt={heroImage.alt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700" />
                  )}
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
