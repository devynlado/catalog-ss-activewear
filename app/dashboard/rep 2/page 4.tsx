import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Users, FileText, MessageSquare, Clock, ArrowRight, Phone, Mail, Calendar, ChevronRight } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { Badge } from '@/components/ui/Badge';

export const metadata = {
  title: 'Sales Rep Dashboard',
  description: 'Manage your assigned customers and quotes',
};

const statusConfig = {
  new: { label: 'New', variant: 'warning' as const },
  contacted: { label: 'Contacted', variant: 'info' as const },
  quoted: { label: 'Quoted', variant: 'brand' as const },
  converted: { label: 'Converted', variant: 'success' as const },
  closed: { label: 'Closed', variant: 'default' as const },
};

interface SalesRepDashboardPageProps {
  searchParams: { preview?: string };
}

export default async function SalesRepDashboardPage({ searchParams }: SalesRepDashboardPageProps) {
  const isPreviewMode = searchParams.preview === 'true';
  
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { profile } = await getServerProfile();
  
  // Skip redirects in preview mode (for admin testing)
  if (!isPreviewMode) {
    // Security: Only sales reps can access this page
    if (!profile || profile.role !== 'sales_rep') {
      // Admins go to admin dashboard, customers go to regular dashboard
      if (profile?.role === 'admin') {
        redirect('/admin');
      }
      redirect('/dashboard');
    }
  }

  const firstName = profile.full_name?.split(' ')[0] || 'there';

  // Get assigned customers
  const { data: assignedCustomers, count: totalCustomers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('assigned_sales_rep_id', user.id)
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .limit(5);

  // Get assigned quotes
  const { data: assignedQuotes, count: totalQuotes } = await supabase
    .from('quotes')
    .select('*', { count: 'exact' })
    .eq('assigned_sales_rep_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get new quotes count
  const { count: newQuotesCount } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_sales_rep_id', user.id)
    .eq('status', 'new');

  // Get unread messages count
  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .is('read_at', null);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-slate-600">
            Here&apos;s an overview of your assigned customers and quotes.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/rep/customers"
            className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-blue-300"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">{totalCustomers || 0}</p>
                <p className="text-sm text-slate-600">Assigned Customers</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/rep/quotes"
            className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-purple-300"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">{totalQuotes || 0}</p>
                <p className="text-sm text-slate-600">Assigned Quotes</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/rep/quotes?status=new"
            className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-amber-300"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-amber-100 p-3">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">{newQuotesCount || 0}</p>
                <p className="text-sm text-slate-600">New Quotes</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/rep/messages"
            className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-green-300"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">{unreadMessages || 0}</p>
                <p className="text-sm text-slate-600">Unread Messages</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Quotes */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy-800">Recent Quotes</h2>
              <Link 
                href="/dashboard/rep/quotes"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            </div>

            {assignedQuotes && assignedQuotes.length > 0 ? (
              <div className="space-y-3">
                {assignedQuotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/admin/quotes/${quote.id}`}
                    className="flex items-center gap-4 rounded-lg border border-stone-100 p-3 transition-colors hover:bg-stone-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">{quote.quote_id}</span>
                        <Badge variant={statusConfig[quote.status as keyof typeof statusConfig]?.variant || 'default'} className="text-xs">
                          {statusConfig[quote.status as keyof typeof statusConfig]?.label || quote.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate font-medium text-slate-700">
                        {quote.company || quote.customer_name}
                      </p>
                      <p className="text-sm text-slate-500">
                        ${quote.subtotal?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FileText className="mx-auto h-10 w-10 text-stone-300" />
                <p className="mt-2 text-sm text-slate-500">No quotes assigned yet</p>
              </div>
            )}
          </div>

          {/* Assigned Customers */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy-800">Your Customers</h2>
              <Link 
                href="/dashboard/rep/customers"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            </div>

            {assignedCustomers && assignedCustomers.length > 0 ? (
              <div className="space-y-3">
                {assignedCustomers.map((customer) => {
                  const initials = customer.full_name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || customer.email[0].toUpperCase();

                  return (
                    <div
                      key={customer.id}
                      className="flex items-center gap-3 rounded-lg border border-stone-100 p-3"
                    >
                      {customer.avatar_url ? (
                        <Image
                          src={customer.avatar_url}
                          alt={customer.full_name || 'Customer'}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-700">
                          {customer.full_name || customer.email}
                        </p>
                        <p className="text-sm text-slate-500">{customer.company || customer.email}</p>
                      </div>
                      <div className="flex gap-1">
                        {customer.phone && (
                          <a
                            href={`tel:${customer.phone}`}
                            className="rounded-lg p-2 text-slate-400 hover:bg-stone-100 hover:text-slate-600"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                        <a
                          href={`mailto:${customer.email}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-stone-100 hover:text-slate-600"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Users className="mx-auto h-10 w-10 text-stone-300" />
                <p className="mt-2 text-sm text-slate-500">No customers assigned yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Calendly Link */}
        {profile.calendly_url && (
          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-navy-800">Your Booking Link</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Share this link with customers to schedule calls.
                </p>
              </div>
              <a
                href={profile.calendly_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                <Calendar className="h-4 w-4" />
                Open Calendly
              </a>
            </div>
            <div className="mt-3 rounded-lg bg-stone-50 p-3">
              <code className="text-sm text-slate-600 break-all">{profile.calendly_url}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
