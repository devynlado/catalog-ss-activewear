'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Linkedin } from 'lucide-react';
import { getMainCategories } from '@/lib/category-taxonomy';

// Get main categories for footer links
const mainCategories = getMainCategories().slice(0, 8);

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-navy-800 via-navy-800 to-navy-900 text-white overflow-hidden">
      {/* Soft edge transition from FinalCTA */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-navy-800/50 to-transparent" />
      
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -left-48 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-48 bottom-0 h-80 w-80 rounded-full bg-brand-500/5 blur-3xl" />
      
      {/* Main Footer Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          
          {/* Contact Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Link href="/" className="inline-block">
                <Image
                  src="/images/brand/logo-wordmark-white.svg"
                  alt="Garment Decor"
                  width={180}
                  height={40}
                />
              </Link>
              <p className="mt-3 text-sm text-slate-300">
                Your trusted source for blank apparel and decoration services.
              </p>
            </div>
            
            <div className="space-y-3">
              <a 
                href="tel:+18559427636" 
                className="flex items-center gap-3 text-sm text-slate-300 hover:text-brand-400 transition-colors"
              >
                <Phone className="h-4 w-4 text-brand-500" />
                (855) 942-7636
              </a>
              <a 
                href="mailto:info@garmentdecor.com" 
                className="flex items-center gap-3 text-sm text-slate-300 hover:text-brand-400 transition-colors"
              >
                <Mail className="h-4 w-4 text-brand-500" />
                info@garmentdecor.com
              </a>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <MapPin className="h-4 w-4 text-brand-500" />
                4778 W. Mission Blvd, Montclair CA 91762
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Clock className="h-4 w-4 text-brand-500" />
                Mon-Fri: 9am - 5pm PST
              </div>
            </div>
            
            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              <a 
                href="https://facebook.com/garmentdecor" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-slate-300 hover:bg-brand-500/20 hover:border-brand-500/30 hover:text-brand-400 transition-all"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="https://instagram.com/garmentdecor" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-slate-300 hover:bg-brand-500/20 hover:border-brand-500/30 hover:text-brand-400 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="https://www.linkedin.com/company/garmentdecor/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-slate-300 hover:bg-brand-500/20 hover:border-brand-500/30 hover:text-brand-400 transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-400">
              Services
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/services/screen-printing" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  Screen Printing
                </Link>
              </li>
              <li>
                <Link href="/services/embroidery" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  Embroidery
                </Link>
              </li>
              <li>
                <Link href="/services/digital-screen-printing" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  Digital Printing
                </Link>
              </li>
              <li>
                <Link href="/services/retail-finishing" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  Retail Finishing
                </Link>
              </li>
              <li>
                <Link href="/services/rush" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  Rush Orders
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  Pricing Calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/resources/screen-printing-guide" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  Screen Printing Guide
                </Link>
              </li>
              <li>
                <Link href="/resources/embroidery-guide" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  Embroidery Guide
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Shop Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Shop
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/catalog" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  All Products
                </Link>
              </li>
              {mainCategories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/catalog/${cat.slug}`}
                    className="text-sm text-slate-300 hover:text-brand-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/guides" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  Product Guides
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Trust Badges Row */}
        <div className="mt-10 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Secure Payment:</span>
              <div className="flex gap-2">
                <div className="flex h-7 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 px-2.5 text-xs font-semibold text-white/80">
                  VISA
                </div>
                <div className="flex h-7 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 px-2.5 text-xs font-semibold text-white/80">
                  MC
                </div>
                <div className="flex h-7 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 px-2.5 text-xs font-semibold text-white/80">
                  AMEX
                </div>
                <div className="flex h-7 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 px-2.5 text-xs font-semibold text-white/80">
                  PayPal
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Free quotes • Fast production • Guaranteed delivery
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <p className="text-sm text-slate-400">
              © {currentYear} Garment Decor. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-slate-400 hover:text-slate-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-400 hover:text-slate-300 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
