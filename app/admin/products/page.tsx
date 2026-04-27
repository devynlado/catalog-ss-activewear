import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getServerProfile } from '@/lib/supabase-server';
import { ProductsSearchClient } from './ProductsSearchClient';

export const metadata = {
  title: 'Product Management',
  description: 'Find a product to edit its admin note or minimum order quantity.',
};

export default async function AdminProductsPage() {
  // The /admin layout already gates for admin/sales_rep, but this feature is
  // admin-only. Redirect any non-admin (e.g. sales_rep) back to the dashboard.
  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    redirect('/admin');
  }

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

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Product Management
          </h1>
          <p className="mt-1 text-slate-600">
            Find a product to add an admin note or set its minimum order quantity.
          </p>
        </div>

        <ProductsSearchClient />
      </div>
    </div>
  );
}
