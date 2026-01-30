import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { QuoteCard } from '@/app/admin/quotes/QuoteCard';
import { RepQuoteFilters } from './RepQuoteFilters';

export const metadata = {
  title: 'My Quotes',
  description: 'View your assigned quotes',
};

export default async function RepQuotesPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string };
}) {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { profile } = await getServerProfile();
  
  // Security: Only sales reps can access
  if (!profile || profile.role !== 'sales_rep') {
    redirect('/dashboard');
  }

  // Build query - only get quotes assigned to this rep
  let query = supabase
    .from('quotes')
    .select('*')
    .eq('assigned_sales_rep_id', user.id)
    .order('created_at', { ascending: false });

  // Filter by status if provided
  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status);
  }

  // Search
  if (searchParams.search) {
    query = query.or(
      `quote_id.ilike.%${searchParams.search}%,customer_name.ilike.%${searchParams.search}%,customer_email.ilike.%${searchParams.search}%,company.ilike.%${searchParams.search}%`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quotes } = await query.limit(50) as { data: any[] | null };

  // Get status counts for this rep
  const { count: allCount } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_sales_rep_id', user.id);

  const { count: newCount } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_sales_rep_id', user.id)
    .eq('status', 'new');

  const { count: contactedCount } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_sales_rep_id', user.id)
    .eq('status', 'contacted');

  const { count: quotedCount } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_sales_rep_id', user.id)
    .eq('status', 'quoted');

  const statusCounts = {
    all: allCount || 0,
    new: newCount || 0,
    contacted: contactedCount || 0,
    quoted: quotedCount || 0,
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link 
          href="/dashboard/rep" 
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            My Quotes
          </h1>
          <p className="mt-1 text-slate-600">
            Quotes assigned to you for follow-up.
          </p>
        </div>

        {/* Filters */}
        <RepQuoteFilters 
          currentStatus={searchParams.status || 'all'} 
          currentSearch={searchParams.search || ''}
          statusCounts={statusCounts}
        />

        {/* Quote List */}
        <div className="mt-6 space-y-4">
          {quotes && quotes.length > 0 ? (
            quotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <Search className="h-8 w-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-semibold text-navy-800">No quotes found</h3>
              <p className="mt-1 text-sm text-slate-600">
                {searchParams.search 
                  ? `No quotes match "${searchParams.search}"`
                  : 'No quotes assigned to you yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
