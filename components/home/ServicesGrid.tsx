'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export function ServicesGrid() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-stone-50/50 via-white to-stone-100 py-20">
      {/* Soft transition to dark BuiltForScale below */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy-800/[0.03] to-transparent" />
      
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-20 h-80 w-80 rounded-full bg-navy-800/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
            Our Decoration Services
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Professional-grade decoration with industry-leading equipment 
            and techniques for every project size.
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div 
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {services.map((service) => {
            const serviceImages = getServiceImages(service.slug);
            const heroImage = serviceImages?.hero;
            
            return (
              <motion.div key={service.id} variants={itemVariants}>
                <Link
                  href={`/services/${service.id}`}
                  className="group relative block overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-stone-200 shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-brand-500/10"
                >
                  {/* Image Area */}
                  <div className="relative h-44 overflow-hidden">
                    {heroImage ? (
                      <Image
                        src={heroImage.src}
                        alt={heroImage.alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700" />
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/40 via-transparent to-transparent" />
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
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
