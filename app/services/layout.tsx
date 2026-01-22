import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Garment Decor',
    default: 'Services | Garment Decor',
  },
  description: 'Professional screen printing, embroidery, and retail finishing services. Factory direct pricing, fast turnaround, 50 piece minimum.',
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
