import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Sparkles, CreditCard, ExternalLink, Hourglass, CheckCircle, MessageSquare, ArrowRight } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { Button } from '@/components/ui/Button';
import { SalesRepCard } from '@/components/admin/SalesRepCard';
import { CustomerQuoteCard, EmptyQuotesState } from '@/components/dashboard/CustomerQuoteCard';
import { QuickReorderRow } from '@/components/dashboard/QuickReorderRow';

export const metadata = {
  title: 'Dashboard',
  description: 'View your quotes and connect with your rep',
};

interface DashboardPageProps {
  searchParams: { preview?: string };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const isPreviewMode = searchParams.preview === 'true';
  
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { profile } = await getServerProfile();
  
  // Skip redirects in preview mode (for admin testing)
  if (!isPreviewMode) {
    // Redirect sales reps to their dashboard
    if (profile?.role === 'sales_rep') {
      redirect('/dashboard/rep');
    }
    
    // Redirect admins to admin dashboard
    if (profile?.role === 'admin') {
      redirect('/admin');
    }
  }
  
  const firstName = 
    profile?.full_name?.split(' ')[0] || 
    user.user_metadata?.name?.split(' ')[0] ||
    user.user_metadata?.full_name?.split(' ')[0] ||
    'there';
  const isDistributor = profile?.customer_type === 'distributor';
  const verificationStatus = profile?.verification_status;

  // Get user's quotes with unread message counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quotesData } = await supabase
    .from('quotes')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10) as { data: any[] | null };

  // Get unread counts for each quote
  const quotes = await Promise.all(
    (quotesData || []).map(async (quote) => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('quote_id', quote.id)
        .eq('recipient_id', user.id)
        .is('read_at', null);
      
      return {
        ...quote,
        unread_count: count || 0,
      };
    })
  );

  // Get assigned sales rep (or auto-assign one for UI if none exists)
  let assignedRep = null;
  if (profile?.assigned_sales_rep_id) {
    const { data: rep } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url, calendly_url')
      .eq('id', profile.assigned_sales_rep_id)
      .single();
    
    assignedRep = rep;
  } else {
    // Auto-assign a sales rep for UI display (logic to persist this can be added later)
    const { data: availableReps } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url, calendly_url')
      .eq('role', 'sales_rep')
      .limit(1);
    
    if (availableReps && availableReps.length > 0) {
      assignedRep = availableReps[0];
    } else {
      // Mock rep for UI preview when no sales reps exist yet
      assignedRep = {
        id: 'mock-rep',
        full_name: 'Sarah Mitchell',
        email: 'sarah@garmentdecor.com',
        phone: '(855) 942-7636',
        avatar_url: null,
        calendly_url: 'https://calendly.com/garmentdecor',
      };
    }
  }

  // Get recently viewed/quoted products
  const { data: recentProducts } = await supabase
    .from('recently_viewed_products')
    .select('*')
    .eq('user_id', user.id)
    .order('viewed_at', { ascending: false })
    .limit(8);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            {isDistributor && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Trade Partner
              </span>
            )}
          </div>
          <p className="mt-1 text-slate-600">
            {isDistributor 
              ? 'View your quotes and connect with your dedicated account manager.'
              : 'Track your quotes and get personalized support.'
            }
          </p>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Quotes List - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-navy-800">Your Quotes</h2>
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  <Plus className="h-4 w-4" />
                  New Quote
                </Link>
              </div>

              {quotes.length > 0 ? (
                <div className="space-y-3">
                  {quotes.map((quote) => (
                    <CustomerQuoteCard key={quote.id} quote={quote} />
                  ))}
                </div>
              ) : (
                <EmptyQuotesState />
              )}
            </div>
          </div>

          {/* Sidebar - Sales Rep Card */}
          <div className="space-y-4">
            {/* Account Manager */}
            {assignedRep ? (
              <SalesRepCard 
                rep={assignedRep}
                showActions={true}
                showEnhanced={true}
              />
            ) : (
              <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                    <MessageSquare className="h-7 w-7 text-stone-400" />
                  </div>
                  <p className="font-medium text-slate-700">Rep Coming Soon</p>
                  <p className="mt-1 text-sm text-slate-500">
                    A dedicated account manager will be assigned to help you.
                  </p>
                </div>
              </div>
            )}

            {/* Trade Pricing CTA (if not distributor) */}
            {!isDistributor && !verificationStatus && (
              <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 pt-4">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Unlock Savings
                  </h2>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-brand-100 p-2.5 flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-800">Trade Pricing</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        ASI/PPAI members get wholesale rates.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-stone-100 p-4 bg-stone-50/30">
                  <Link href="/dashboard/trade-pricing" className="block">
                    <Button variant="primary" size="sm" className="w-full">
                      Apply Now
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Pending Application Status */}
            {!isDistributor && verificationStatus === 'pending' && (
              <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 pt-4">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Application Status
                  </h2>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-amber-100 p-2.5 flex-shrink-0">
                      <Hourglass className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-800">Under Review</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Your trade pricing application is being reviewed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Approved Status */}
            {isDistributor && (
              <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 pt-4">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Account Status
                  </h2>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-green-100 p-2.5 flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-800">Trade Pricing Active</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Wholesale pricing on all products.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Reorder Row */}
        <div className="mb-8">
          <QuickReorderRow products={recentProducts || []} />
        </div>

        {/* Bottom Banner - Credit Terms */}
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-emerald-100 p-3">
                <CreditCard className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold text-navy-800">Need payment terms?</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Apply for Net 30 terms through our partner. Quick approval, no credit impact.
                </p>
              </div>
            </div>
            <a 
              href="https://app.resolvepay.com/garmentdecor2" 
              target="_blank" 
              rel="noopener noreferrer"
              className="self-start sm:self-center"
            >
              <Button variant="secondary" size="md">
                Apply for Terms
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
