import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { CouponsClient } from './CouponsClient';

export const metadata = {
  title: 'Coupons',
  description: 'Manage discount coupons',
};

export default async function CouponsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">Coupons</h1>
          <p className="mt-1 text-slate-600">Create and manage discount codes.</p>
        </div>
        <CouponsClient />
      </div>
    </div>
  );
}
