import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Package Deals | Garment Decor',
  description: 'All-inclusive package deals on custom embroidered caps, beanies, printed tees, and tote bags. Fixed per-piece pricing, no hidden fees. Fast turnaround.',
  path: '/packages',
});

export default function PackagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
