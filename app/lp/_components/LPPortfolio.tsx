'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface LPPortfolioProps {
  service: 'screen-printing' | 'embroidery' | 't-shirt-printing';
}

const portfolioImages = {
  'screen-printing': [
    {
      src: '/images/services/screen-printing/custom-screen-printing-for-la-apparel-1801gd-elevate-streetwear-style.webp',
      alt: 'Custom screen printing on LA Apparel t-shirts',
      label: 'Streetwear Brand',
    },
    {
      src: '/images/services/screen-printing/custom-screen-printing-for-independent-trading-ss4500-hoodies.webp',
      alt: 'Custom screen printed Independent Trading hoodies',
      label: 'Custom Hoodies',
    },
    {
      src: '/images/services/puff-printing/custom-3d-puff-screen-printed-la-apparel-1801gd-t-shirts-with-vibrant-orange-ink.webp',
      alt: '3D puff screen printing',
      label: 'Puff Print',
    },
    {
      src: '/images/services/jumbo-screen-printing/jumbo-screen-printed-hoodies-for-spirit-wear-uniforms.webp',
      alt: 'Jumbo screen printed hoodies',
      label: 'Jumbo Print',
    },
  ],
  't-shirt-printing': [
    {
      src: '/images/services/screen-printing/custom-screen-printing-for-la-apparel-1801gd-elevate-streetwear-style.webp',
      alt: 'Custom printed LA Apparel 1801GD streetwear t-shirts',
      label: 'Streetwear Tees',
    },
    {
      src: '/images/services/screen-printing/custom-screen-printing-for-alternative-apparel-aa1070-tees-stand-out.webp',
      alt: 'Custom printed Alternative Apparel t-shirts',
      label: 'Brand Merch',
    },
    {
      src: '/images/services/puff-printing/custom-3d-puff-screen-printed-la-apparel-1801gd-t-shirts-with-vibrant-orange-ink.webp',
      alt: '3D puff printed custom t-shirts',
      label: 'Puff Print Tees',
    },
    {
      src: '/images/services/screen-printing/custom-jumbo-screen-printed-los-angeles-apparel-style-1801gd-t-shirts.webp',
      alt: 'Jumbo screen printed custom t-shirts',
      label: 'Jumbo Print Tees',
    },
  ],
  'embroidery': [
    {
      src: '/images/services/embroidery/elevate-your-brand-with-custom-embroidered-hoodies-by-garment-decor-2-1.webp',
      alt: 'Custom embroidered hoodies',
      label: 'Embroidered Hoodies',
    },
    {
      src: '/images/services/embroidery/otto-cap-31-069-65-panel-mid-profile-baseball-cap-dark-green-white-custom-embroidery-front-view-2.webp',
      alt: 'Custom embroidery on baseball cap',
      label: 'Custom Caps',
    },
    {
      src: '/images/services/embroidery/yupoong-classics-6089-premium-flat-bill-snapback-cap-black-custom-puff-embroidery-front-view-2.webp',
      alt: 'Puff embroidery on snapback',
      label: 'Puff Embroidery',
    },
    {
      src: '/images/services/embroidery/dlx5-custom-embroidered-bag-1.webp',
      alt: 'Custom embroidered bag',
      label: 'Embroidered Bags',
    },
  ],
};

export function LPPortfolio({ service }: LPPortfolioProps) {
  const images = portfolioImages[service];

  return (
    <section className="py-12 lg:py-16 bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Our Recent Work
          </h2>
          <p className="mt-2 text-slate-600">
            Real projects from real clients
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative aspect-square rounded-xl overflow-hidden group"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Label overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white text-sm font-medium">{image.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
