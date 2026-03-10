'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Scale, Factory, Droplets, Palette, Layers, Scissors, Printer, ChevronDown, Star, MapPin, Users, ArrowUp, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Value Props Strip
// ---------------------------------------------------------------------------

const VALUE_PROPS = [
  { icon: Scale, label: '6.5oz Heavyweight', detail: 'Thickest in its class' },
  { icon: Droplets, label: 'Garment Dyed', detail: 'Vintage hand-feel, pre-shrunk' },
  { icon: Factory, label: 'Made in Los Angeles', detail: '100% USA cotton, ethically made' },
  { icon: Palette, label: '30+ Colors', detail: 'From classics to trending shades' },
];

export function ValuePropsStrip() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {VALUE_PROPS.map((prop) => (
        <div
          key={prop.label}
          className="flex items-start gap-2.5 rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-3"
        >
          <prop.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{prop.label}</p>
            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{prop.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Social Proof Banner
// ---------------------------------------------------------------------------

export function SocialProofBanner() {
  return (
    <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-stone-50 border border-stone-100 border-l-4 border-l-brand-500 px-3.5 py-2.5">
      <div className="flex -space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-brand-500 text-brand-500" />
        ))}
      </div>
      <p className="text-xs text-slate-700">
        <span className="font-semibold">The #1 blank</span> for streetwear brands, print shops &amp; embroiderers
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Use-Case Callouts
// ---------------------------------------------------------------------------

const USE_CASES = [
  {
    icon: Users,
    title: 'Streetwear Brands',
    detail: 'Premium blank for drops, collections & merch',
  },
  {
    icon: Layers,
    title: 'Print Shops',
    detail: 'Dense fabric holds ink perfectly, zero bleed',
  },
  {
    icon: Scissors,
    title: 'Embroiderers',
    detail: 'Thick cotton supports stitches without puckering',
  },
];

export function UseCaseCallouts() {
  return (
    <div className="mt-3 grid gap-1.5">
      {USE_CASES.map((uc) => (
        <div
          key={uc.title}
          className="flex items-center gap-2.5 rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-2.5"
        >
          <uc.icon className="h-4 w-4 shrink-0 text-brand-500" />
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-700">{uc.title}</span>{' — '}{uc.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Curated Description (replaces raw SS Activewear copy)
// ---------------------------------------------------------------------------

export function CuratedDescription() {
  return (
    <div className="pt-3 space-y-3">
      <p className="text-sm text-slate-600 leading-relaxed">
        The Los Angeles Apparel 1801GD is a 6.5oz garment-dyed heavyweight tee knitted, cut, sewn, and dyed in Los Angeles. 
        The garment-dye process gives each shirt a broken-in, vintage hand-feel with colors that stay true wash after wash. 
        Cut with a modern relaxed fit through the sleeves and torso, it&apos;s become the go-to blank for streetwear brands, 
        print shops, and embroiderers who demand premium quality.
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
        <li className="flex items-center gap-1.5">
          <Check className="h-3 w-3 text-green-600 shrink-0" />
          <span>6.5 oz / 220 g/m²</span>
        </li>
        <li className="flex items-center gap-1.5">
          <Check className="h-3 w-3 text-green-600 shrink-0" />
          <span>100% USA Cotton</span>
        </li>
        <li className="flex items-center gap-1.5">
          <Check className="h-3 w-3 text-green-600 shrink-0" />
          <span>18/1 Open-End Cotton</span>
        </li>
        <li className="flex items-center gap-1.5">
          <Check className="h-3 w-3 text-green-600 shrink-0" />
          <span>Shrink-Free Garment Dye</span>
        </li>
        <li className="flex items-center gap-1.5">
          <Check className="h-3 w-3 text-green-600 shrink-0" />
          <span>High-Ribbed Collar</span>
        </li>
        <li className="flex items-center gap-1.5">
          <Check className="h-3 w-3 text-green-600 shrink-0" />
          <span>Modern Relaxed Fit</span>
        </li>
        <li className="flex items-center gap-1.5">
          <Check className="h-3 w-3 text-green-600 shrink-0" />
          <span>Made in Los Angeles</span>
        </li>
        <li className="flex items-center gap-1.5">
          <Check className="h-3 w-3 text-green-600 shrink-0" />
          <span>Unisex Sizing</span>
        </li>
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// "Why the 1801GD?" Section — groups Comparison + FAQ
// ---------------------------------------------------------------------------

const COMPARISON_ROWS = [
  { label: 'Weight', la: '6.5 oz', cc: '6.1 oz', gildan: '5.3 oz' },
  { label: 'Material', la: '100% USA Cotton', cc: 'Ring-Spun Cotton', gildan: '100% Cotton' },
  { label: 'Garment Dyed', la: true, cc: true, gildan: false },
  { label: 'Made in USA', la: true, cc: false, gildan: false },
  { label: 'Fit', la: 'Modern Relaxed', cc: 'Relaxed', gildan: 'Classic' },
  { label: 'Print Quality', la: 'Excellent', cc: 'Very Good', gildan: 'Good' },
  { label: 'Best For', la: 'Premium streetwear', cc: 'Vintage / casual', gildan: 'Budget bulk' },
];

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-green-600" />
    ) : (
      <span className="text-slate-300">—</span>
    );
  }
  return <>{value}</>;
}

const FAQ_ITEMS = [
  {
    q: 'How does the 1801GD compare to Comfort Colors 1717?',
    a: 'Both are garment-dyed heavyweight tees, but the 1801GD is heavier (6.5oz vs 6.1oz), made in the USA, and has a more modern relaxed fit. The denser fabric produces cleaner prints with less ink absorption.',
  },
  {
    q: 'What decoration methods work best on the 1801GD?',
    a: 'The 1801GD excels with every method: screen printing, puff printing, jumbo prints, digital, and embroidery. The 6.5oz weight and garment-dyed cotton make it the most versatile premium blank available.',
  },
  {
    q: 'Is the 1801GD good for screen printing?',
    a: 'Excellent. The dense 6.5oz fabric holds ink beautifully with zero bleed-through, delivering vibrant plastisol prints. It\'s the preferred blank for print shops producing premium streetwear.',
  },
  {
    q: 'What colors are available?',
    a: 'The 1801GD comes in 30+ garment-dyed colors — from classic Black and White to trending shades like Sage, Cement, and Burnt Orange. All colors have that signature soft, vintage hand-feel.',
  },
];

export function WhyThe1801GD() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      {/* Section header */}
      <div className="px-4 py-3 border-b border-stone-200 bg-gradient-to-r from-brand-50/60 to-stone-50/60">
        <p className="text-sm font-bold text-slate-800">Why the 1801GD?</p>
        <p className="text-[11px] text-slate-500 mt-0.5">See how it stacks up against the competition</p>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="text-left px-3 py-2 font-medium text-slate-500 w-[28%]" />
              <th className="px-3 py-2 font-bold text-brand-700 bg-brand-50/50 w-[28%]">1801GD</th>
              <th className="px-3 py-2 font-medium text-slate-600 w-[22%]">CC 1717</th>
              <th className="px-3 py-2 font-medium text-slate-600 w-[22%]">Gildan 5000</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row, idx) => (
              <tr
                key={row.label}
                className={cn(
                  'border-b border-stone-50',
                  idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/30',
                )}
              >
                <td className="px-3 py-2 font-medium text-slate-600">{row.label}</td>
                <td className="px-3 py-2 text-center font-semibold text-slate-800 bg-brand-50/30">
                  <CellValue value={row.la} />
                </td>
                <td className="px-3 py-2 text-center text-slate-600">
                  <CellValue value={row.cc} />
                </td>
                <td className="px-3 py-2 text-center text-slate-600">
                  <CellValue value={row.gildan} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Divider + FAQ */}
      <div className="border-t border-stone-200">
        <div className="px-4 py-3 bg-stone-50/60">
          <p className="text-sm font-bold text-slate-800">Frequently Asked Questions</p>
        </div>
        <div className="divide-y divide-stone-100">
          {FAQ_ITEMS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full text-left px-4 py-3 hover:bg-stone-50/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 leading-relaxed">{item.q}</p>
                <ChevronDown
                  className={cn(
                    'mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform',
                    openIdx === idx && 'rotate-180',
                  )}
                />
              </div>
              {openIdx === idx && (
                <p className="mt-2 text-xs text-slate-500 leading-relaxed pr-4">{item.a}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Keep old exports for backward compat (unused now, but safe)
export const ComparisonChart = WhyThe1801GD;
export const FAQSection = () => null;

// ---------------------------------------------------------------------------
// Enhanced Decoration Upsell (with image)
// ---------------------------------------------------------------------------

export function DecorationUpsell() {
  return (
    <div className="rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white overflow-hidden">
      <div className="flex">
        {/* Image */}
        <div className="hidden sm:block w-28 shrink-0 relative">
          <Image
            src="/images/services/screen-printing/custom-jumbo-screen-printed-los-angeles-apparel-style-1801gd-t-shirts.webp"
            alt="Custom screen printed LA Apparel 1801GD"
            fill
            className="object-cover"
          />
        </div>
        {/* Content */}
        <div className="flex-1 p-4">
          <p className="text-sm font-bold text-slate-800">
            Need the 1801GD customized?
          </p>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Screen printing from <span className="font-semibold text-brand-700">$0.90/pc</span>, 
            embroidery from <span className="font-semibold text-brand-700">$3.00/pc</span>. 
            Factory-direct pricing, 50pc minimum, same-week turnaround.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/blanks/los-angeles-apparel-1801gd"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Get a Quote
            </a>
            <a
              href="tel:+18559427636"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3.5 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              <Phone className="h-3 w-3" />
              (855) 942-7636
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bottom CTA — scroll back to color selection
// ---------------------------------------------------------------------------

export function BottomCTA() {
  return (
    <div className="rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50/80 to-white p-4 text-center">
      <p className="text-sm font-bold text-slate-800">Ready to order?</p>
      <p className="mt-1 text-xs text-slate-500">Select your colors and sizes above to get started</p>
      <button
        onClick={() => {
          document.getElementById('color-selection')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
      >
        <ArrowUp className="h-3.5 w-3.5" />
        Select Colors &amp; Sizes
      </button>
    </div>
  );
}
