'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { factoryTourImages, warehouseImages } from '@/lib/service-images';

/*
 * FactoryTourCarousel
 * Auto-playing, continuously-scrolling marquee of factory-tour photos.
 * Used in the "See Where Your Order Is Made" section (home-preview & portfolio).
 * No manual navigation — it loops seamlessly on its own.
 */

type Slide = { src: string; alt: string; label: string };

const slides: Slide[] = [
  { src: warehouseImages.productionFloor.src, alt: warehouseImages.productionFloor.alt, label: 'Production Floor' },
  { src: warehouseImages.embroideryDepartment.src, alt: warehouseImages.embroideryDepartment.alt, label: 'Embroidery Dept' },
  { src: factoryTourImages.inkMixing.src, alt: factoryTourImages.inkMixing.alt, label: 'Ink Lab' },
  { src: factoryTourImages.qualityInspection.src, alt: factoryTourImages.qualityInspection.alt, label: 'Quality Check' },
  { src: factoryTourImages.threadWall.src, alt: factoryTourImages.threadWall.alt, label: 'Thread Wall' },
  { src: factoryTourImages.productionFloorCuring.src, alt: factoryTourImages.productionFloorCuring.alt, label: 'Curing Station' },
  { src: factoryTourImages.teamMember.src, alt: factoryTourImages.teamMember.alt, label: 'Embroidery Station' },
  { src: factoryTourImages.screenExposure.src, alt: factoryTourImages.screenExposure.alt, label: 'Exposure Room' },
  { src: factoryTourImages.screenReclaim.src, alt: factoryTourImages.screenReclaim.alt, label: 'Screen Reclaim' },
  { src: warehouseImages.facility.src, alt: warehouseImages.facility.alt, label: 'Our Facility' },
  { src: warehouseImages.aerialFacility.src, alt: warehouseImages.aerialFacility.alt, label: 'Aerial View' },
];

// Seconds for one full loop. Higher = slower.
const SCROLL_DURATION = 45;

function SlideCard({ slide }: { slide: Slide }) {
  return (
    <div className="group relative aspect-[4/3] w-64 shrink-0 overflow-hidden rounded-2xl sm:w-72">
      <Image
        src={slide.src}
        alt={slide.alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 256px, 288px"
      />
      {/* Overlay with label */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-sm font-medium text-white">{slide.label}</p>
      </div>
    </div>
  );
}

export function FactoryTourCarousel() {
  const prefersReducedMotion = useReducedMotion();

  // Reduced-motion: show a simple, manually-scrollable row instead of autoplay.
  if (prefersReducedMotion) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {slides.map((slide) => (
          <SlideCard key={slide.label} slide={slide} />
        ))}
      </div>
    );
  }

  // Duplicate the slides so the -50% translation loops seamlessly.
  const looped = [...slides, ...slides];

  return (
    <div className="relative overflow-hidden">
      {/* Edge fades to blend into the dark section */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-navy-800 to-transparent sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-navy-700 to-transparent sm:w-20" />

      <motion.div
        className="flex w-max gap-4"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: SCROLL_DURATION, ease: 'linear', repeat: Infinity }}
      >
        {looped.map((slide, index) => (
          <SlideCard key={`${slide.label}-${index}`} slide={slide} />
        ))}
      </motion.div>
    </div>
  );
}
