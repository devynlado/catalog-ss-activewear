'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { QuoteDrawer } from '@/components/quote/QuoteDrawer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ExitIntentPopup } from '@/components/quote/ExitIntentPopup';

// Routes that should not show the main header/footer
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = authRoutes.some(route => pathname?.startsWith(route));

  if (isAuthPage) {
    // Auth pages get minimal layout (no header/footer)
    return <>{children}</>;
  }

  // Regular pages get full layout
  return (
    <>
      <Header />
      <main>
        {children}
      </main>
      <Footer />
      <QuoteDrawer />
      <CartDrawer />
      <ExitIntentPopup />
    </>
  );
}
