import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Search, Users, Phone, Mail, Building2, BadgeCheck } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { Badge } from '@/components/ui/Badge';

export const metadata = {
  title: 'My Customers',
  description: 'View your assigned customers',
};

export default async function RepCustomersPage({
  searchParams,
}: {
  searchParams: { search?: string };
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

  // Build query - only get customers assigned to this rep
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('assigned_sales_rep_id', user.id)
    .eq('role', 'customer')
    .order('created_at', { ascending: false });

  // Search
  if (searchParams.search) {
    query = query.or(
      `full_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,company.ilike.%${searchParams.search}%`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: customers } = await query.limit(50) as { data: any[] | null };

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
            My Customers
          </h1>
          <p className="mt-1 text-slate-600">
            Customers assigned to you for relationship management.
          </p>
        </div>

        {/* Search */}
        <form className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search || ''}
              placeholder="Search by name, email, or company..."
              className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </form>

        {/* Customer List */}
        <div className="space-y-4">
          {customers && customers.length > 0 ? (
            customers.map((customer) => {
              const initials = customer.full_name
                ?.split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || customer.email[0].toUpperCase();

              const joinedDate = new Date(customer.created_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={customer.id}
                  className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    {customer.avatar_url ? (
                      <Image
                        src={customer.avatar_url}
                        alt={customer.full_name || 'Customer'}
                        width={56}
                        height={56}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-600">
                        {initials}
                      </div>
                    )}

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-navy-800">
                          {customer.full_name || customer.email}
                        </h3>
                        {customer.customer_type === 'distributor' && (
                          <Badge variant="brand" className="text-xs">
                            <BadgeCheck className="mr-1 h-3 w-3" />
                            Trade
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {customer.company && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            {customer.company}
                          </div>
                        )}
                        <a 
                          href={`mailto:${customer.email}`}
                          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                        >
                          <Mail className="h-4 w-4" />
                          {customer.email}
                        </a>
                        {customer.phone && (
                          <a 
                            href={`tel:${customer.phone}`}
                            className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                          >
                            <Phone className="h-4 w-4" />
                            {customer.phone}
                          </a>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-slate-400">
                        Customer since {joinedDate}
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      {customer.phone && (
                        <a
                          href={`tel:${customer.phone}`}
                          className="rounded-lg border border-stone-200 p-2 text-slate-500 hover:bg-stone-50 hover:text-slate-700"
                          title="Call"
                        >
                          <Phone className="h-5 w-5" />
                        </a>
                      )}
                      <a
                        href={`mailto:${customer.email}`}
                        className="rounded-lg border border-stone-200 p-2 text-slate-500 hover:bg-stone-50 hover:text-slate-700"
                        title="Email"
                      >
                        <Mail className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <Users className="h-8 w-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-semibold text-navy-800">No customers found</h3>
              <p className="mt-1 text-sm text-slate-600">
                {searchParams.search 
                  ? `No customers match "${searchParams.search}"`
                  : 'No customers assigned to you yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
