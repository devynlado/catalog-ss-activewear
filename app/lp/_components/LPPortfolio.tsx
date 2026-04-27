'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Palette, Package, Clock, Shirt, Quote } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────

interface LPPortfolioProps {
  service: 'screen-printing' | 'embroidery' | 't-shirt-printing' | 'jumbo-screen-printing' | 'digital-screen-printing' | 'puff-screen-printing';
  dynamic?: boolean;
  categorySlug?: string;
}

interface ProjectItem {
  src: string;
  alt: string;
  title: string;
  client: string | null;
  product?: string | null;
  decoration?: string[];
  quantity?: string | null;
  turnaround?: string | null;
  materials?: string | null;
  testimonialQuote?: string | null;
  testimonialAuthor?: string | null;
  testimonialCompany?: string | null;
}

const DECORATION_LABELS: Record<string, string> = {
  'screen-printing': 'Screen Printing',
  'embroidery': 'Embroidery',
  'digital-screen-printing': 'Digital Screen Printing',
  'puff-screen-printing': 'Puff Screen Printing',
  'jumbo-screen-printing': 'Jumbo Screen Printing',
  'simulated-process': 'Simulated Process',
  'retail-finishing': 'Retail Finishing',
  'rush': 'Rush Services',
  'live-screen-printing': 'Live Screen Printing',
  'large-orders': 'Large Orders',
};

// ── Static image data (kept for non-dynamic LP pages) ───────────────────

const portfolioImages: Record<string, ProjectItem[]> = {
  'screen-printing': [
    { src: '/images/services/screen-printing/custom-screen-printing-for-la-apparel-1801gd-elevate-streetwear-style.webp', alt: 'Custom screen printing on LA Apparel t-shirts', title: 'Streetwear Brand', client: null },
    { src: '/images/services/screen-printing/custom-screen-printing-for-independent-trading-ss4500-hoodies.webp', alt: 'Custom screen printed Independent Trading hoodies', title: 'Custom Hoodies', client: null },
    { src: '/images/services/puff-printing/custom-3d-puff-screen-printed-la-apparel-1801gd-t-shirts-with-vibrant-orange-ink.webp', alt: '3D puff screen printing', title: 'Puff Print', client: null },
    { src: '/images/services/jumbo-screen-printing/jumbo-screen-printed-hoodies-for-spirit-wear-uniforms.webp', alt: 'Jumbo screen printed hoodies', title: 'Jumbo Print', client: null },
  ],
  'jumbo-screen-printing': [
    { src: '/images/services/jumbo-screen-printing/jumbo-screen-printed-hoodies-for-spirit-wear-uniforms.webp', alt: 'Custom jumbo screen printed hoodies for spirit wear', title: 'Oversized Hoodies', client: null },
    { src: '/images/services/jumbo-screen-printing/custom-jumbo-screen-printing-for-jpeg-mafia-american-apparel-1304-long-sleeve.webp', alt: 'Jumbo screen printing on American Apparel long sleeve', title: 'Jumbo Long Sleeves', client: null },
    { src: '/images/services/jumbo-screen-printing/los-angeles-apparel-1801gd-6.5oz-garment-dye-crew-neck-t-shirt-white-custom-jumbo-screen-print-back-view.webp', alt: 'Oversized screen print on LA Apparel 1801GD tee', title: 'Oversized Tees', client: null },
    { src: '/images/services/jumbo-screen-printing/shaka-wear-7.5oz-max-heavyweight-garment-dye-shadow-custom-jumbo-screen-print-front-view.webp', alt: 'Jumbo screen print on Shaka Wear heavyweight tee', title: 'Heavyweight Prints', client: null },
  ],
  'digital-screen-printing': [
    { src: '/images/services/digital-screen-printing/digital-screen-printing-by-garment-decor-on-la-apparel-tee.webp', alt: 'Full-color digital screen printing on LA Apparel tee', title: 'Full Color Tees', client: null },
    { src: '/images/services/digital-screen-printing/comfort-colors-1717-garment-dyed-heavyweight-t-shirt-black-custom-digital-squeegee-front-view.webp', alt: 'Digital squeegee print on Comfort Colors heavyweight tee', title: 'Photo-Realistic Print', client: null },
    { src: '/images/services/digital-screen-printing/independent-trading-style-ind420xd-pullover-hoodie-black-custom-digitial-squeegee-back-view-1.webp', alt: 'Digital screen printing on Independent Trading hoodie', title: 'Digital Hoodies', client: null },
    { src: '/images/services/digital-screen-printing/as-colour-5080-heavy-tee-custom-digital-squeegee-front-view.webp', alt: 'Digital squeegee print on AS Colour heavy tee', title: 'Unlimited Colors', client: null },
  ],
  'puff-screen-printing': [
    { src: '/images/services/puff-printing/custom-3d-puff-screen-printed-la-apparel-1801gd-t-shirts-with-vibrant-orange-ink.webp', alt: 'Custom 3D puff screen printed LA Apparel 1801GD t-shirts', title: 'Puff Print Tees', client: null },
    { src: '/images/services/screen-printing/custom-screen-printing-for-independent-trading-ss4500-hoodies.webp', alt: 'Custom puff screen printed hoodies', title: 'Puff Hoodies', client: null },
    { src: '/images/services/screen-printing/custom-screen-printing-for-la-apparel-1801gd-elevate-streetwear-style.webp', alt: 'Raised 3D puff printing for streetwear brands', title: 'Streetwear Brand', client: null },
    { src: '/images/services/jumbo-screen-printing/shaka-wear-7.5oz-max-heavyweight-garment-dye-shadow-custom-jumbo-screen-print-front-view.webp', alt: 'Custom puff printing on heavyweight garment dye tee', title: 'Heavyweight Puff', client: null },
  ],
  't-shirt-printing': [
    { src: '/images/services/screen-printing/custom-screen-printing-for-la-apparel-1801gd-elevate-streetwear-style.webp', alt: 'Custom printed LA Apparel 1801GD streetwear t-shirts', title: 'Streetwear Tees', client: null },
    { src: '/images/services/screen-printing/custom-screen-printing-for-alternative-apparel-aa1070-tees-stand-out.webp', alt: 'Custom printed Alternative Apparel t-shirts', title: 'Brand Merch', client: null },
    { src: '/images/services/puff-printing/custom-3d-puff-screen-printed-la-apparel-1801gd-t-shirts-with-vibrant-orange-ink.webp', alt: '3D puff printed custom t-shirts', title: 'Puff Print Tees', client: null },
    { src: '/images/services/screen-printing/custom-jumbo-screen-printed-los-angeles-apparel-style-1801gd-t-shirts.webp', alt: 'Jumbo screen printed custom t-shirts', title: 'Jumbo Print Tees', client: null },
  ],
  'embroidery': [
    { src: '/images/services/embroidery/elevate-your-brand-with-custom-embroidered-hoodies-by-garment-decor-2-1.webp', alt: 'Custom embroidered hoodies', title: 'Embroidered Hoodies', client: null },
    { src: '/images/services/embroidery/otto-cap-31-069-65-panel-mid-profile-baseball-cap-dark-green-white-custom-embroidery-front-view-2.webp', alt: 'Custom embroidery on baseball cap', title: 'Custom Caps', client: null },
    { src: '/images/services/embroidery/yupoong-classics-6089-premium-flat-bill-snapback-cap-black-custom-puff-embroidery-front-view-2.webp', alt: 'Puff embroidery on snapback', title: 'Puff Embroidery', client: null },
    { src: '/images/services/embroidery/dlx5-custom-embroidered-bag-1.webp', alt: 'Custom embroidered bag', title: 'Embroidered Bags', client: null },
  ],
};

// ── Quick View Lightbox ──────────────────────────────────────────────────

function QuickView({
  items,
  startIndex,
  onClose,
}: {
  items: ProjectItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);

  const prev = useCallback(() => setIndex(i => (i - 1 + items.length) % items.length), [items.length]);
  const next = useCallback(() => setIndex(i => (i + 1) % items.length), [items.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  const item = items[index];
  const decorationLabels = (item.decoration || []).map(d => DECORATION_LABELS[d] || d);
  const hasDetails = item.product || decorationLabels.length > 0 || item.quantity || item.turnaround || item.testimonialQuote;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:top-4 sm:right-4"
      >
        <X className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Nav arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:left-4"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:right-4"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </>
      )}

      {/* Content card */}
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex flex-col ${hasDetails ? 'md:flex-row' : ''}`}>
          {/* Left: Image */}
          <div className={`relative ${hasDetails ? 'md:w-1/2' : 'w-full'} aspect-square shrink-0`}>
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              unoptimized
            />
          </div>

          {/* Right: Details */}
          {hasDetails ? (
            <div className="flex flex-col justify-center p-6 sm:p-8 md:w-1/2">
              <h3 className="text-xl font-bold text-navy-800 sm:text-2xl leading-tight">
                {item.title}
              </h3>
              {item.client && (
                <p className="mt-1 text-sm text-slate-500">for {item.client}</p>
              )}

              <div className="mt-5 space-y-3">
                {decorationLabels.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Palette className="h-4 w-4 mt-0.5 text-brand-500 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Decoration</p>
                      <p className="text-sm text-slate-700">{decorationLabels.join(', ')}</p>
                    </div>
                  </div>
                )}
                {item.product && (
                  <div className="flex items-start gap-3">
                    <Shirt className="h-4 w-4 mt-0.5 text-brand-500 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Product</p>
                      <p className="text-sm text-slate-700">{item.product}</p>
                    </div>
                  </div>
                )}
                {item.quantity && (
                  <div className="flex items-start gap-3">
                    <Package className="h-4 w-4 mt-0.5 text-brand-500 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Quantity</p>
                      <p className="text-sm text-slate-700">{item.quantity}</p>
                    </div>
                  </div>
                )}
                {item.turnaround && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 mt-0.5 text-brand-500 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Turnaround</p>
                      <p className="text-sm text-slate-700">{item.turnaround}</p>
                    </div>
                  </div>
                )}
              </div>

              {item.testimonialQuote && (
                <div className="mt-6 rounded-xl bg-stone-50 p-4 border border-stone-100">
                  <Quote className="h-4 w-4 text-brand-400 mb-2" />
                  <p className="text-sm text-slate-600 italic leading-relaxed">
                    &ldquo;{item.testimonialQuote}&rdquo;
                  </p>
                  {(item.testimonialAuthor || item.testimonialCompany) && (
                    <p className="mt-2 text-xs text-slate-500 font-medium">
                      — {[item.testimonialAuthor, item.testimonialCompany].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Counter */}
              <p className="mt-6 text-xs text-slate-400">{index + 1} / {items.length}</p>
            </div>
          ) : (
            <div className="p-5">
              <h3 className="text-lg font-bold text-navy-800">{item.title}</h3>
              {item.client && <p className="mt-1 text-sm text-slate-500">{item.client}</p>}
              <p className="mt-2 text-xs text-slate-400">{index + 1} / {items.length}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export function LPPortfolio({ service, dynamic, categorySlug }: LPPortfolioProps) {
  const [dynamicItems, setDynamicItems] = useState<ProjectItem[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!dynamic || !categorySlug) return;
    fetch(`/api/portfolio/by-category?category=${encodeURIComponent(categorySlug)}&limit=8`)
      .then(r => r.json())
      .then(data => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projects: any[] = data.projects || [];
        setDynamicItems(
          projects.map(p => ({
            src: p.featuredImage,
            alt: p.title,
            title: p.title,
            client: p.client || null,
            product: p.product || null,
            decoration: Array.isArray(p.decoration) ? p.decoration : p.decoration ? [p.decoration] : [],
            quantity: p.quantity || null,
            turnaround: p.turnaround || null,
            materials: p.materials || null,
            testimonialQuote: p.testimonialQuote || null,
            testimonialAuthor: p.testimonialAuthor || null,
            testimonialCompany: p.testimonialCompany || null,
          }))
        );
      })
      .catch(() => {});
  }, [dynamic, categorySlug]);

  const items = dynamic && dynamicItems ? dynamicItems : portfolioImages[service];

  // Loading skeleton
  if (dynamic && !dynamicItems) {
    return (
      <section className="py-12 lg:py-16 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">Our Recent Work</h2>
            <p className="mt-2 text-slate-600">Real projects from real clients</p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-stone-200 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

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
          {items.map((item, index) => (
            <motion.button
              key={index}
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              onClick={() => setLightboxIndex(index)}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
                unoptimized={dynamic}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white text-sm font-semibold line-clamp-2">{item.title}</p>
                {item.client && (
                  <p className="text-white/70 text-xs mt-0.5">{item.client}</p>
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <QuickView
            items={items}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
