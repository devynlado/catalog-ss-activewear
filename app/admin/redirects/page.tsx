import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Route } from 'lucide-react';
import { getServerProfile } from '@/lib/supabase-server';
import { RedirectsClient } from './RedirectsClient';

export const metadata = {
  title: 'Slug Redirects | Admin',
  description: 'Manage product-page redirects and triage unresolved slugs.',
};

export default async function RedirectsPage() {
  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-navy-800 sm:text-3xl">
            <Route className="h-8 w-8 text-brand-600" />
            Slug Redirects
          </h1>
          <p className="mt-1 text-slate-600">
            Recover traffic to legacy product URLs (old WordPress slugs,
            Meta Catalog links, etc.) and triage unresolved slugs.
          </p>
        </div>

        <RedirectsClient />
      </div>
    </div>
  );
}
