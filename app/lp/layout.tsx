import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Star } from 'lucide-react';
import Script from 'next/script';

// GA4 Measurement ID from environment
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

export const metadata: Metadata = {
  robots: {
    index: false, // Landing pages shouldn't be indexed (we want organic traffic to main pages)
    follow: true,
  },
};

/**
 * Minimal Landing Page Layout
 * - No navigation distractions
 * - Logo + Phone only header
 * - Designed for paid traffic conversion
 */
export default function LPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Minimal Header: Logo + Phone Only */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/images/brand/logo-wordmark-dark.svg"
                alt="Garment Decor"
                width={160}
                height={36}
                className="h-8 w-auto sm:h-9"
                priority
              />
            </Link>

            {/* Phone CTA - Always visible */}
            <div className="flex items-center gap-4">
              {/* Rating badge - Desktop only */}
              <div className="hidden items-center gap-1 md:flex">
                <div className="flex">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-slate-600 ml-1">4.8 on Google</span>
              </div>

              {/* Phone Button */}
              <a
                href="tel:+18559427636"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:-translate-y-0.5"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">(855) 942-7636</span>
                <span className="sm:hidden">Call Now</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main>
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="bg-navy-800 py-8 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Garment Decor. Factory-direct custom apparel in Southern California.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
            {' · '}
            <Link href="/terms" className="hover:text-slate-300">Terms</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
