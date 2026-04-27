import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Filter } from 'lucide-react';
import { getServerProfile } from '@/lib/supabase-server';
import { AnalyticsDashboard } from './AnalyticsDashboard';

export const metadata = {
  title: 'Analytics | Admin',
  description: 'Profitability, revenue, COGS, margins, and ad spend tracking',
};

export default async function AnalyticsPage() {
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

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-navy-800 sm:text-3xl">
              <BarChart3 className="h-8 w-8 text-brand-600" />
              Analytics
            </h1>
            <p className="mt-1 text-slate-600">
              Profitability, costs, and ad performance across orders.
            </p>
          </div>
          <Link
            href="/admin/sales-funnel"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-brand-300 hover:bg-brand-50"
          >
            <Filter className="h-4 w-4" />
            Sales Funnel
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-navy-800">
            Profitability & Ad Spend
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Revenue, COGS, margins, and ad performance across orders.
          </p>
          <AnalyticsDashboard />
        </section>
      </div>
    </div>
  );
}
