import { redirect } from 'next/navigation';
import { getServerProfile } from '@/lib/supabase-server';
import { StudioPage } from './StudioPage';

export const metadata = {
  title: 'Portfolio CMS | Garment Decor',
  robots: 'noindex',
};

export default async function StudioRoute() {
  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }
  return <StudioPage />;
}
