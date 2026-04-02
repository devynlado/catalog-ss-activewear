import Link from 'next/link';
import { ArrowLeft, Search, Package, MessageCircle } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { OrderCard } from './OrderCard';
import { OrderFilters } from './OrderFilters';
import { Pagination } from './Pagination';

export const metadata = {
  title: 'Orders',
  description: 'Manage customer orders',
};

const PER_PAGE = 25;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; payment?: string; search?: string; page?: string };
}) {
  const supabase = await createSupabaseServerClient();

  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const from = (currentPage - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const applyFilters = (q: any) => {
    if (searchParams.status && searchParams.status !== 'all') {
      q = q.eq('status', searchParams.status);
    } else if (!searchParams.status || searchParams.status === 'all') {
      q = q.neq('status', 'pending');
    }
    if (searchParams.payment && searchParams.payment !== 'all') {
      q = q.eq('payment_status', searchParams.payment);
    }
    if (searchParams.search) {
      q = q.or(
        `order_number.ilike.%${searchParams.search}%,customer_name.ilike.%${searchParams.search}%,customer_email.ilike.%${searchParams.search}%,po_number.ilike.%${searchParams.search}%,company.ilike.%${searchParams.search}%`
      );
    }
    return q;
  };

  // Fetch filtered count
  let countQuery = supabase.from('orders').select('*', { count: 'exact', head: true });
  countQuery = applyFilters(countQuery);
  const { count: filteredCount } = await countQuery;
  const totalFiltered = filteredCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));

  // Fetch paginated orders
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  query = applyFilters(query);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await query.range(from, to) as { data: any[] | null };

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

  // Fetch unread chat counts for displayed orders
  const orderIds = (orders || []).map((o: { id: string }) => o.id);
  let chatUnreadMap: Record<string, number> = {};
  if (orderIds.length > 0) {
    const { data: unreadRows } = await supabase
      .from('order_chat_messages')
      .select('order_id')
      .in('order_id', orderIds)
      .eq('sender_type', 'customer')
      .is('read_at', null) as { data: { order_id: string }[] | null };

    if (unreadRows) {
      for (const row of unreadRows) {
        chatUnreadMap[row.order_id] = (chatUnreadMap[row.order_id] || 0) + 1;
      }
    }
  }

  // Total unread chat messages for the badge on "Customer Chat" link
  const { count: totalChatUnread } = await supabase
    .from('order_chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_type', 'customer')
    .is('read_at', null);

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

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
              Orders
            </h1>
            <p className="mt-1 text-slate-600">
              View and manage customer orders, update statuses, and add tracking.
            </p>
          </div>
          <Link
            href="/admin/chat"
            className="relative flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50 shadow-sm transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-brand-500" />
            Customer Chat
            {(totalChatUnread ?? 0) > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                {totalChatUnread}
              </span>
            )}
          </Link>
        </div>

        <OrderFilters
          currentStatus={searchParams.status || 'all'}
          currentSearch={searchParams.search || ''}
          statusCounts={statusCounts}
        />

        {/* Top Pagination */}
        {orders && orders.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalFiltered}
              perPage={PER_PAGE}
            />
          </div>
        )}

        <div className="mt-4 space-y-4">
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <OrderCard key={order.id} order={order} unreadChatCount={chatUnreadMap[order.id] || 0} />
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

        {/* Bottom Pagination */}
        {orders && orders.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalFiltered}
              perPage={PER_PAGE}
            />
          </div>
        )}
      </div>
    </div>
  );
}
