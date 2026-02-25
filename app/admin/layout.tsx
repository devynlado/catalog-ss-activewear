import { redirect } from 'next/navigation';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { profile } = await getServerProfile();

  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
