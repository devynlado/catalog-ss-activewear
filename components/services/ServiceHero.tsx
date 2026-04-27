'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Calculator } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface ServiceHeroProps {
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  gradient?: string;
  maxPrintSize?: string;
  backLink?: { href: string; label: string };
  serviceSlug?: string; // For context passing: 'screen-printing', 'embroidery', etc.
  samplePrice?: string; // e.g., "Starting at $2.45/piece"
  minimumOrder?: number; // e.g., 50
  heroImage?: { src: string; alt: string }; // Optional hero image
}

export function ServiceHero({
  title,
  tagline,
  description,
  icon: Icon,
  gradient = 'from-brand-500 to-brand-600',
  maxPrintSize,
  backLink,
  serviceSlug,
  samplePrice,
  minimumOrder = 50,
  heroImage,
}: ServiceHeroProps) {
  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${gradient} py-20 lg:py-28`}>
      {/* Hero background image */}
      {heroImage && (
        <div className="absolute inset-0">
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        </div>
      )}
      
      {/* Background pattern (shown when no image) */}
      {!heroImage && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
      )}
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {backLink && (
          <Link
            href={backLink.href}
            className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLink.label}
          </Link>
        )}
        
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Icon className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          
          <p className="mt-4 text-xl font-medium text-white/90">
            {tagline}
          </p>
          
          {/* Info badges row */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {maxPrintSize && (
              <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white">
                Max Size: {maxPrintSize}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-amber-400/90 px-3 py-1 text-sm font-semibold text-amber-950">
              {minimumOrder} Piece Minimum
            </span>
          </div>

          {/* Sample price callout */}
          {samplePrice && (
            <div className="mt-4 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-white/80" />
                <span className="text-sm font-medium text-white">
                  {samplePrice}
                </span>
              </div>
              <Link 
                href={serviceSlug ? `/pricing?service=${serviceSlug}` : '/pricing'}
                className="text-sm font-semibold text-white underline underline-offset-2 hover:no-underline whitespace-nowrap"
              >
                See full pricing →
              </Link>
            </div>
          )}
          
          <p className="mt-6 text-lg text-white/80 leading-relaxed">
            {description}
          </p>
          
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href={serviceSlug ? `/catalog?service=${serviceSlug}` : '/catalog'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-navy-800 shadow-lg transition-all hover:bg-stone-50 hover:shadow-xl hover:-translate-y-0.5"
            >
              Shop {title} Blanks
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href={serviceSlug ? `/contact?service=${serviceSlug}` : '/contact'}
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/50 px-6 py-3.5 text-base font-semibold text-white transition-all hover:border-white hover:bg-white/10"
            >
              Questions? Let&apos;s Talk
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
