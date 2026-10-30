import { redirect } from 'next/navigation';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { RepSearchClient } from './RepSearchClient';

export const metadata = {
  title: 'Client Lookup — Sales Rep',
  description: "Look up a client's quotes and leads by email.",
};

/**
 * Sales Rep dashboard: an email-only client lookup.
 *
 * Reps search by a client's email and see that client's quotes + leads
 * (read-only), with audited artwork downloads. Everything is fetched and logged
 * server-side via /api/dashboard/rep/*. Admins may open this page too.
 */
export default async function SalesRepDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { profile } = await getServerProfile();

  // Only sales reps (and admins) may use this page.
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const firstName = profile.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Client Lookup
          </h1>
          <p className="mt-1 text-slate-600">
            Welcome back, {firstName}. Search a client&apos;s email to view their
            quotes, leads, and artwork.
          </p>
        </div>

        <RepSearchClient />
      </div>
    </div>
  );
}
