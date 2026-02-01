'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { QuoteDrawer } from '@/components/quote/QuoteDrawer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { DecorationModal } from '@/components/cart/DecorationModal';
import { ExitIntentPopup } from '@/components/quote/ExitIntentPopup';
import { useCartStore } from '@/lib/cart-store';

// Routes that should not show the main header/footer
const minimalLayoutRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/lp'];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMinimalLayout = minimalLayoutRoutes.some(route => pathname?.startsWith(route));
  
  // Global decoration modal state
  const isDecorationModalOpen = useCartStore((s) => s.isDecorationModalOpen);
  const closeDecorationModal = useCartStore((s) => s.closeDecorationModal);

  if (isMinimalLayout) {
    // Landing pages and auth pages get minimal layout (no header/footer)
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
      <DecorationModal 
        isOpen={isDecorationModalOpen} 
        onClose={closeDecorationModal} 
      />
      <ExitIntentPopup />
    </>
  );
}
