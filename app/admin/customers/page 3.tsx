import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { CustomerCard } from './CustomerCard';
import { CustomerFilters } from './CustomerFilters';

export const metadata = {
  title: 'Customers',
  description: 'Manage customer accounts',
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { type?: string; search?: string };
}) {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { profile } = await getServerProfile();
  
  // Security: Only admins can access
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get sales reps for assignment dropdown
  const { data: salesReps } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, calendly_url')
    .eq('role', 'sales_rep');

  // Build customer query
  let query = supabase
    .from('profiles')
    .select(`
      *,
      assigned_rep:assigned_sales_rep_id (
        id,
        full_name,
        email,
        avatar_url,
        phone,
        calendly_url
      )
    `)
    .eq('role', 'customer')
    .order('created_at', { ascending: false });

  // Filter by customer type
  if (searchParams.type && searchParams.type !== 'all') {
    query = query.eq('customer_type', searchParams.type);
  }

  // Search
  if (searchParams.search) {
    query = query.or(
      `full_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,company.ilike.%${searchParams.search}%`
    );
  }

  const { data: customers, error } = await query.limit(50);

  // Get type counts
  const { count: allCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer');

  const { count: directCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')
    .eq('customer_type', 'direct');

  const { count: distributorCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')
    .eq('customer_type', 'distributor');

  const typeCounts = {
    all: allCount || 0,
    direct: directCount || 0,
    distributor: distributorCount || 0,
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
            Customers
          </h1>
          <p className="mt-1 text-slate-600">
            Manage customer accounts and sales rep assignments.
          </p>
        </div>

        {/* Filters */}
        <CustomerFilters 
          currentType={searchParams.type || 'all'} 
          currentSearch={searchParams.search || ''}
          typeCounts={typeCounts}
        />

        {/* Customer List */}
        <div className="mt-6 space-y-4">
          {customers && customers.length > 0 ? (
            customers.map((customer) => (
              <CustomerCard 
                key={customer.id} 
                customer={customer}
                salesReps={salesReps || []}
              />
            ))
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <Users className="h-8 w-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-semibold text-navy-800">No customers found</h3>
              <p className="mt-1 text-sm text-slate-600">
                {searchParams.search 
                  ? `No customers match "${searchParams.search}"`
                  : 'No customers in this category yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
