import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { ActivityList } from './ActivityList';

export const metadata = {
  title: 'Activity Log | Admin',
  description: 'Audit log of every action performed by admins and sales reps.',
};

export const dynamic = 'force-dynamic';

export default async function AdminActivityPage() {
  // Layout already gates /admin to admin/sales_rep, but double-check defensively.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-600"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Activity Log
          </h1>
          <p className="mt-1 text-slate-600">
            Every change made by an admin or sales rep, with timestamp and IP. Append-only — entries cannot be edited or deleted.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Entries are auto-archived after 180 days.
          </p>
        </div>

        <ActivityList />
      </div>
    </div>
  );
}
