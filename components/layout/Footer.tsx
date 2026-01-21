'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { getMainCategories } from '@/lib/category-taxonomy';

// Get main categories for footer links
const mainCategories = getMainCategories().slice(0, 8);

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-800 text-white">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Contact Info */}
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-lg">
                  GD
                </div>
                <span className="font-bold text-xl">Garment Decor</span>
              </div>
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
                href="mailto:sales@garmentdecor.com" 
                className="flex items-center gap-3 text-sm text-slate-300 hover:text-brand-400 transition-colors"
              >
                <Mail className="h-4 w-4 text-brand-500" />
                sales@garmentdecor.com
              </a>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <MapPin className="h-4 w-4 text-brand-500" />
                Dallas, TX
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Clock className="h-4 w-4 text-brand-500" />
                Mon-Fri: 9am - 5pm CST
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Categories
            </h3>
            <ul className="space-y-2">
              {mainCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/catalog?category=${cat.id}`}
                    className="text-sm text-slate-300 hover:text-brand-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Company
            </h3>
            <ul className="space-y-2">
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
              <li>
                <Link href="/faq" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Trust */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Connect With Us
            </h3>
            <div className="flex gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-700 text-slate-300 hover:bg-brand-500 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-700 text-slate-300 hover:bg-brand-500 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-700 text-slate-300 hover:bg-brand-500 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-700 text-slate-300 hover:bg-brand-500 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-6">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Secure Payment
              </h4>
              <div className="flex flex-wrap gap-2">
                {/* Payment method badges - simplified icons */}
                <div className="flex h-8 items-center justify-center rounded bg-white px-3 text-xs font-bold text-navy-800">
                  VISA
                </div>
                <div className="flex h-8 items-center justify-center rounded bg-white px-3 text-xs font-bold text-navy-800">
                  MC
                </div>
                <div className="flex h-8 items-center justify-center rounded bg-white px-3 text-xs font-bold text-navy-800">
                  AMEX
                </div>
                <div className="flex h-8 items-center justify-center rounded bg-white px-3 text-xs font-bold text-navy-800">
                  PayPal
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-navy-700">
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
