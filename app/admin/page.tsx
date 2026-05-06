import Link from 'next/link';
import { Users, FileText, ShieldCheck, TrendingUp, Clock, Eye, Package, PackageSearch, Tag, Filter, Zap, Star, Mail, MessageSquareText, MessageCircle } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { RecentActivity } from '@/components/admin/RecentActivity';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Manage orders, customers, quotes, and verification requests',
};

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { profile } = await getServerProfile();
  const isAdmin = profile?.role === 'admin';

  // Get stats (run independent queries in parallel)
  const [
    { count: quotesCount },
    { count: contactsCount },
    { count: unreadChatCount },
    { count: totalOrders },
    { count: activeOrders },
  ] = await Promise.all([
    supabase.from('quotes').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('is_spam', false),
    supabase.from('order_chat_messages').select('*', { count: 'exact', head: true }).eq('sender_type', 'customer').is('read_at', null),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['awaiting_purchasing', 'ordered', 'in_production']),
  ]);

  // Total leads = quotes + contact form entries
  const totalLeads = (quotesCount ?? 0) + (contactsCount ?? 0);

  // Count unique customers by email from orders (matches /admin/customers logic)
  const { data: customerEmails } = await supabase
    .from('orders')
    .select('customer_email')
    .neq('payment_status', 'pending') as { data: { customer_email: string }[] | null };
  const totalCustomers = new Set((customerEmails || []).map(r => r.customer_email?.toLowerCase()).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-slate-600">
            Manage orders, customers, quotes, and verifications.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Link
            href="/admin/orders"
            className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-brand-300"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-brand-100 p-3">
                <Package className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">{totalOrders || 0}</p>
                <p className="text-sm text-slate-600">Total Orders</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/orders?status=confirmed"
            className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-amber-300"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-amber-100 p-3">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">{activeOrders || 0}</p>
                <p className="text-sm text-slate-600">Active Orders</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/customers"
            className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-blue-300"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">{totalCustomers || 0}</p>
                <p className="text-sm text-slate-600">Total Customers</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/contacts"
            className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-purple-300"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">{totalLeads}</p>
                <p className="text-sm text-slate-600">Total Leads</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/chat"
            className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-red-300"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-red-100 p-3">
                <MessageCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">{unreadChatCount ?? 0}</p>
                <p className="text-sm text-slate-600">Unread Chat</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Management Links */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy-800">Management</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/admin/orders"
                className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <Package className="h-5 w-5 text-brand-500" />
                <span className="font-medium text-slate-700">Orders</span>
              </Link>
              <Link
                href="/admin/customers"
                className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <Users className="h-5 w-5 text-brand-500" />
                <span className="font-medium text-slate-700">Customers</span>
              </Link>
              <Link
                href="/admin/quotes"
                className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <FileText className="h-5 w-5 text-brand-500" />
                <span className="font-medium text-slate-700">Quotes</span>
              </Link>
              <Link
                href="/admin/verifications"
                className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <ShieldCheck className="h-5 w-5 text-brand-500" />
                <span className="font-medium text-slate-700">Verifications</span>
              </Link>
              <Link
                href="/admin/quick-quote"
                className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <Zap className="h-5 w-5 text-brand-500" />
                <span className="font-medium text-slate-700">Quick Quote</span>
              </Link>
              <Link
                href="/admin/coupons"
                className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <Tag className="h-5 w-5 text-brand-500" />
                <span className="font-medium text-slate-700">Coupons</span>
              </Link>
              <Link
                href="/admin/reviews"
                className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <Star className="h-5 w-5 text-brand-500" />
                <span className="font-medium text-slate-700">Reviews</span>
              </Link>
              <Link
                href="/admin/review-invites"
                className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <Mail className="h-5 w-5 text-brand-500" />
                <span className="font-medium text-slate-700">Review Invitations</span>
              </Link>
              <Link
                href="/admin/contacts"
                className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <MessageSquareText className="h-5 w-5 text-brand-500" />
                <span className="font-medium text-slate-700">Contact Leads</span>
              </Link>
              <Link
                href="/admin/chat"
                className="relative flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <MessageCircle className="h-5 w-5 text-brand-500" />
                <span className="font-medium text-slate-700">Customer Chat</span>
                {(unreadChatCount ?? 0) > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {unreadChatCount! > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/admin/products"
                    className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    <PackageSearch className="h-5 w-5 text-brand-500" />
                    <span className="font-medium text-slate-700">Product Management</span>
                  </Link>
                  <Link
                    href="/admin/analytics"
                    className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    <TrendingUp className="h-5 w-5 text-brand-500" />
                    <span className="font-medium text-slate-700">Analytics</span>
                  </Link>
                  <Link
                    href="/admin/sales-funnel"
                    className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    <Filter className="h-5 w-5 text-brand-500" />
                    <span className="font-medium text-slate-700">Sales Funnel</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivity limit={15} />
        </div>

        {/* Dev Tools - Preview Dashboards */}
        <div className="mt-6 rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-600 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview Dashboards
            <span className="text-xs font-normal text-slate-400">(Dev Tools)</span>
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Preview how other user roles see their dashboards.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/dashboard?preview=true"
              className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="rounded-full bg-blue-100 p-2">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <span className="font-medium text-slate-700">Customer Dashboard</span>
                <p className="text-xs text-slate-400">View as customer</p>
              </div>
            </Link>
            <Link
              href="/dashboard/rep?preview=true"
              className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-4 transition-colors hover:border-purple-300 hover:bg-purple-50"
            >
              <div className="rounded-full bg-purple-100 p-2">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <span className="font-medium text-slate-700">Sales Rep Dashboard</span>
                <p className="text-xs text-slate-400">View as sales rep</p>
              </div>
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 p-4"
            >
              <div className="rounded-full bg-brand-100 p-2">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <span className="font-medium text-slate-700">Admin Dashboard</span>
                <p className="text-xs text-slate-400">Current view</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
