import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { QuoteDrawer } from '@/components/quote/QuoteDrawer';
import { MobileQuoteBar } from '@/components/quote/MobileQuoteBar';
import { ExitIntentPopup } from '@/components/quote/ExitIntentPopup';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Garment Decor Catalog | Blank Apparel & Decoration Services',
  description: 'Browse our catalog of blank apparel. View colors, check inventory, and request quotes for your business.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="min-h-screen bg-background font-sans text-text">
        <Header />
        <main>
          {children}
        </main>
        <Footer />
        <QuoteDrawer />
        <MobileQuoteBar />
        <ExitIntentPopup />
      </body>
    </html>
  );
}
