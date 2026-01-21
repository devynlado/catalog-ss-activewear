import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { QuoteDrawer } from '@/components/quote/QuoteDrawer';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Garment Decor Catalog | SS Activewear',
  description: 'Browse our catalog of blank apparel. View colors, check inventory, and request quotes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="min-h-screen bg-slate-50 font-sans">
        <Header />
        <main className="pb-20">
          {children}
        </main>
        <QuoteDrawer />
      </body>
    </html>
  );
}
