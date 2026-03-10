import Link from 'next/link';
import { ArrowLeft, Search, Package } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { OrderCard } from './OrderCard';
import { OrderFilters } from './OrderFilters';

export const metadata = {
  title: 'Orders',
  description: 'Manage customer orders',
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; payment?: string; search?: string };
}) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status);
  } else if (!searchParams.status || searchParams.status === 'all') {
    query = query.neq('status', 'pending');
  }

  if (searchParams.payment && searchParams.payment !== 'all') {
    query = query.eq('payment_status', searchParams.payment);
  }

  if (searchParams.search) {
    query = query.or(
      `order_number.ilike.%${searchParams.search}%,customer_name.ilike.%${searchParams.search}%,customer_email.ilike.%${searchParams.search}%,po_number.ilike.%${searchParams.search}%,company.ilike.%${searchParams.search}%`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await query.limit(50) as { data: any[] | null };

  const { count: allCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'pending');

  const { count: awaitingPurchasingCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'awaiting_purchasing');

  const { count: orderedCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ordered');

  const { count: shippedCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'shipped');

  const { count: deliveredCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'delivered');

  const { count: pendingCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const statusCounts = {
    all: allCount || 0,
    pending: pendingCount || 0,
    awaiting_purchasing: awaitingPurchasingCount || 0,
    ordered: orderedCount || 0,
    shipped: shippedCount || 0,
    delivered: deliveredCount || 0,
  };

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

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Orders
          </h1>
          <p className="mt-1 text-slate-600">
            View and manage customer orders, update statuses, and add tracking.
          </p>
        </div>

        <OrderFilters
          currentStatus={searchParams.status || 'all'}
          currentSearch={searchParams.search || ''}
          statusCounts={statusCounts}
        />

        <div className="mt-6 space-y-4">
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                {searchParams.search ? (
                  <Search className="h-8 w-8 text-stone-400" />
                ) : (
                  <Package className="h-8 w-8 text-stone-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-navy-800">No orders found</h3>
              <p className="mt-1 text-sm text-slate-600">
                {searchParams.search
                  ? `No orders match "${searchParams.search}"`
                  : 'No orders in this category yet.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
