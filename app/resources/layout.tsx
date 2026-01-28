import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Resources | Garment Decor',
    default: 'Resources & Guides | Garment Decor',
  },
  description: 'Free guides and resources for screen printing and embroidery. Learn about artwork preparation, file formats, color matching, and best practices.',
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
