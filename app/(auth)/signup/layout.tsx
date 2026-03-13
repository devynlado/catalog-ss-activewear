import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Sign Up | Garment Decor',
  description: 'Create a Garment Decor account to save quotes, track orders, and access rep tools.',
  path: '/signup',
});

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
