'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Building2, Cog, Package, Palette, Factory as FactoryIcon, Scissors } from 'lucide-react';
import { warehouseImages, factoryTourImages } from '@/lib/service-images';

interface LPFactoryProps {
  service: 'screen-printing' | 'embroidery' | 't-shirt-printing';
}

const screenPrintingCapabilities = [
  {
    stat: '25,000',
    label: 'Sq Ft Facility',
    icon: Building2,
  },
  {
    stat: '6',
    label: 'Auto Presses',
    icon: Cog,
  },
  {
    stat: 'In-House',
    label: 'Color Lab',
    icon: Palette,
  },
  {
    stat: 'Auto',
    label: 'Folding & Bagging',
    icon: Package,
  },
];

const embroideryCapabilities = [
  {
    stat: '25,000',
    label: 'Sq Ft Facility',
    icon: Building2,
  },
  {
    stat: 'Multi-Head',
    label: 'Machines',
    icon: Scissors,
  },
  {
    stat: '1000+',
    label: 'Thread Colors',
    icon: Palette,
  },
  {
    stat: 'Auto',
    label: 'Folding & Bagging',
    icon: Package,
  },
];

const screenPrintingImages = [
  {
    src: warehouseImages.productionFloor.src,
    alt: warehouseImages.productionFloor.alt,
    label: 'Production Floor',
  },
  {
    src: factoryTourImages.teamMember.src,
    alt: factoryTourImages.teamMember.alt,
    label: 'Embroidery Dept',
  },
  {
    src: factoryTourImages.inkMixing.src,
    alt: factoryTourImages.inkMixing.alt,
    label: 'Ink Lab',
  },
  {
    src: factoryTourImages.qualityInspection.src,
    alt: factoryTourImages.qualityInspection.alt,
    label: 'Quality Check',
  },
];

const embroideryImages = [
  {
    src: warehouseImages.embroideryDepartment.src,
    alt: warehouseImages.embroideryDepartment.alt,
    label: 'Embroidery Dept',
  },
  {
    src: factoryTourImages.threadWall.src,
    alt: factoryTourImages.threadWall.alt,
    label: 'Thread Selection',
  },
  {
    src: factoryTourImages.teamMember.src,
    alt: factoryTourImages.teamMember.alt,
    label: 'Quality Stitching',
  },
  {
    src: factoryTourImages.qualityInspection.src,
    alt: factoryTourImages.qualityInspection.alt,
    label: 'Quality Check',
  },
];

export function LPFactory({ service }: LPFactoryProps) {
  const isEmbroidery = service === 'embroidery';
  const capabilities = isEmbroidery ? embroideryCapabilities : screenPrintingCapabilities;
  const factoryImages = isEmbroidery ? embroideryImages : screenPrintingImages;
  return (
    <section className="relative py-16 lg:py-20 bg-gradient-to-br from-navy-800 via-navy-800 to-navy-700 overflow-hidden">
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -left-48 top-0 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-48 bottom-0 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-medium text-white mb-4">
            <FactoryIcon className="h-4 w-4" />
            Our Factory
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            See Where Your Order Is Made
          </h2>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Tour our Montclair, CA production facility — equipped with the same industrial equipment 
            used by the nation&apos;s largest decorators.
          </p>
        </motion.div>

        {/* Capabilities - Glassmorphism cards */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-center hover:border-brand-500/30 hover:bg-white/10 transition-all"
              >
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 border border-brand-500/20 mb-3">
                  <Icon className="h-5 w-5 text-brand-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {item.stat}
                </div>
                <div className="text-sm text-slate-400">
                  {item.label}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {factoryImages.map((image, index) => (
            <motion.div
              key={image.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden group"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {/* Overlay with label */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-sm font-medium text-white">{image.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom tagline - Glassmorphism */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-3">
            <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            <p className="text-slate-300">
              <span className="text-brand-400 font-semibold">Enterprise-ready infrastructure</span>
              {' '}— capacity for 50 to 50,000 piece orders.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
