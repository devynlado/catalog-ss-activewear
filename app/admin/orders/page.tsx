import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/lib/database.types';

export const metadata = {
  title: 'Orders',
  description: 'View and manage orders',
};

export default async function OrdersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, customer_name, subtotal, shipping_cost, tax_amount, discount_amount, total, coupon_code, payment_status, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const ordersList = (orders ?? []) as Order[];
  const orderIds = ordersList.map((o) => o.id);
  const refundMap: Record<string, number> = {};
  if (orderIds.length > 0) {
    const { data: refunds } = await supabase
      .from('payments')
      .select('order_id, amount')
      .in('order_id', orderIds)
      .eq('type', 'refund')
      .eq('status', 'succeeded');
    const refundRows = (refunds ?? []) as { order_id: string; amount: number }[];
    for (const r of refundRows) {
      refundMap[r.order_id] = (refundMap[r.order_id] ?? 0) + Number(r.amount);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">Orders</h1>
          <p className="mt-1 text-slate-600">View order history and details.</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          {!ordersList.length ? (
            <div className="p-12 text-center text-slate-500">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Coupon
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {ordersList.map((order) => {
                    const totalRefunded = refundMap[order.id] ?? 0;
                    const refundLabel =
                      order.payment_status === 'refunded'
                        ? 'Refunded'
                        : totalRefunded > 0
                          ? 'Partially refunded'
                          : order.payment_status;
                    const statusClass =
                      order.payment_status === 'refunded'
                        ? 'bg-stone-200 text-stone-800'
                        : totalRefunded > 0
                          ? 'bg-amber-100 text-amber-800'
                          : order.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : order.payment_status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800';
                    return (
                      <tr key={order.id} className="hover:bg-stone-50">
                        <td className="whitespace-nowrap px-4 py-3">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono text-sm font-medium text-navy-800 hover:text-navy-600 hover:underline"
                          >
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <div>{order.customer_name || '—'}</div>
                          <div className="text-slate-500">{order.customer_email}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-800">
                          {totalRefunded > 0 ? (
                            <span>
                              {formatPrice(Number(order.total))}
                              <span className="text-stone-500"> → {formatPrice(Number(order.total) - totalRefunded)}</span>
                            </span>
                          ) : (
                            formatPrice(Number(order.total))
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {order.discount_amount != null && Number(order.discount_amount) > 0 ? (
                            <span className="text-green-600">-{formatPrice(Number(order.discount_amount))}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {order.coupon_code ? (
                            <span className="font-mono text-slate-700">{order.coupon_code}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                            {refundLabel}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
