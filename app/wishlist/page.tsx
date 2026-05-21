import type { Metadata } from 'next';
import { WishlistPageClient } from './WishlistPageClient';

export const metadata: Metadata = {
  title: 'My Wishlist',
  description:
    'Save your favourite products and come back to them anytime. Sign in to keep your wishlist across devices.',
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return <WishlistPageClient />;
}
