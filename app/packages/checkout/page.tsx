import { createPageMetadata } from '@/lib/metadata';
import { PackageCheckoutClient } from './PackageCheckoutClient';

export const metadata = createPageMetadata({
  title: 'Checkout - Custom Baseball Caps | Garment Decor',
  description: 'Complete your custom embroidered baseball caps package order.',
  path: '/packages/checkout',
  noIndex: true,
});

export default function PackageCheckoutPage() {
  return <PackageCheckoutClient />;
}
