import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Log In | Garment Decor',
  description: 'Sign in to your Garment Decor account to manage quotes, orders, and rep dashboard.',
  path: '/login',
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
