import { Metadata } from 'next';
import { PackageCheckoutClient } from './PackageCheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout - Custom Baseball Caps | Garment Decor',
  description: 'Complete your custom embroidered baseball caps package order.',
};

export default function PackageCheckoutPage() {
  return <PackageCheckoutClient />;
}
