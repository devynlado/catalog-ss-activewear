import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Forgot Password | Garment Decor',
  description: 'Reset your Garment Decor account password.',
  path: '/forgot-password',
});

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
