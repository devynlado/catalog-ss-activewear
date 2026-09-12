import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { QuoteCard } from './QuoteCard';
import { QuoteFilters } from './QuoteFilters';
import { QuotesTrendChart } from './QuotesTrendChart';
import { Pagination } from '../orders/Pagination';

export const metadata = {
  title: 'Quotes',
  description: 'Manage customer quote requests',
};

const PER_PAGE = 25;

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    visitor_source?: string;
    category?: string;
    page?: string;
  };
}) {
  const supabase = await createSupabaseServerClient();

  // Shared filter clauses applied to both the data query and the count query
  // so pagination totals reflect the active filters.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (q: any) => {
    // Filter by status if provided
    if (searchParams.status && searchParams.status !== 'all') {
      q = q.eq('status', searchParams.status);
    }

    // Date range filter (mirrors /admin/contacts). `date_to` is inclusive of
    // the whole day, so we bump it to end-of-day.
    if (searchParams.date_from) {
      q = q.gte('created_at', searchParams.date_from);
    }
    if (searchParams.date_to) {
      q = q.lte('created_at', `${searchParams.date_to}T23:59:59.999Z`);
    }

    // Visitor source (indexed TEXT column). '(untracked)' matches NULL rows.
    if (searchParams.visitor_source === '(untracked)') {
      q = q.is('visitor_source', null);
    } else if (searchParams.visitor_source) {
      q = q.eq('visitor_source', searchParams.visitor_source);
    }

    // Project category = decoration method, stored in the indexed
    // decoration_methods TEXT[] column (populated at write time / backfilled).
    if (searchParams.category) {
      q = q.contains('decoration_methods', [searchParams.category]);
    }

    // Search by quote_id, customer_name, email, or company
    if (searchParams.search) {
      q = q.or(
        `quote_id.ilike.%${searchParams.search}%,customer_name.ilike.%${searchParams.search}%,customer_email.ilike.%${searchParams.search}%,company.ilike.%${searchParams.search}%`
      );
    }
    return q;
  };

  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pageFrom = (currentPage - 1) * PER_PAGE;

  // Total matching the active filters — drives the numbered pagination.
  let countQuery = supabase.from('quotes').select('*', { count: 'exact', head: true });
  countQuery = applyFilters(countQuery);
  const { count: filteredCount } = await countQuery;
  const totalFiltered = filteredCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));

  // Page of quotes
  let query = supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });
  query = applyFilters(query);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quotes } = await query.range(pageFrom, pageFrom + PER_PAGE - 1) as { data: any[] | null };

  // Get status counts
  const { count: allCount } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true });

  const { count: newCount } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new');

  const { count: contactedCount } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'contacted');

  const { count: quotedCount } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
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
          href="/admin" 
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Quotes
          </h1>
          <p className="mt-1 text-slate-600">
            Review and manage customer quote requests.
          </p>
        </div>

        {/* Trend chart — daily quote requests broken down by visitor source */}
        <div className="mb-6">
          <QuotesTrendChart />
        </div>

        {/* Filters */}
        <QuoteFilters 
          currentStatus={searchParams.status || 'all'} 
          currentSearch={searchParams.search || ''}
          currentDateFrom={searchParams.date_from || ''}
          currentDateTo={searchParams.date_to || ''}
          currentVisitorSource={searchParams.visitor_source || ''}
          currentCategory={searchParams.category || ''}
          statusCounts={statusCounts}
        />

        {/* Top Pagination */}
        {quotes && quotes.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalFiltered}
              perPage={PER_PAGE}
              basePath="/admin/quotes"
            />
          </div>
        )}

        {/* Quote List */}
        <div className="mt-4 space-y-4">
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
                  : 'No quotes in this category yet.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Bottom Pagination */}
        {quotes && quotes.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalFiltered}
              perPage={PER_PAGE}
              basePath="/admin/quotes"
            />
          </div>
        )}
      </div>
    </div>
  );
}
