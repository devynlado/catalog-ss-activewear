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

  // Admin area is admin-only. Sales reps use /dashboard/rep (client lookup).
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
