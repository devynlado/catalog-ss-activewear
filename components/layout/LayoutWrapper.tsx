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
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = authRoutes.some(route => pathname?.startsWith(route));
  
  // Global decoration modal state
  const isDecorationModalOpen = useCartStore((s) => s.isDecorationModalOpen);
  const closeDecorationModal = useCartStore((s) => s.closeDecorationModal);

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
      <DecorationModal 
        isOpen={isDecorationModalOpen} 
        onClose={closeDecorationModal} 
      />
      <ExitIntentPopup />
    </>
  );
}
