import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/lib/database.types';
import { OrderRefundUI } from './OrderRefundUI';

export const metadata = {
  title: 'Order details',
  description: 'View order and issue refunds',
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      'id, order_number, customer_email, customer_name, customer_phone, company, items, subtotal, shipping_cost, tax_amount, discount_amount, total, coupon_code, payment_status, status, stripe_charge_id, created_at, shipping_address'
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    notFound();
  }

  const orderData = order as Order;

  const { data: refundPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('order_id', orderId)
    .eq('type', 'refund')
    .eq('status', 'succeeded');

  const refundRows = (refundPayments ?? []) as { amount: number }[];
  const totalRefunded = refundRows.reduce((sum, p) => sum + Number(p.amount), 0);
  const items = Array.isArray(orderData.items) ? orderData.items : [];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin/orders"
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
              Order {orderData.order_number}
            </h1>
            <p className="mt-1 text-slate-600">
              {new Date(orderData.created_at).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                orderData.payment_status === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : orderData.payment_status === 'refunded'
                    ? 'bg-stone-200 text-stone-800'
                    : orderData.payment_status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
              }`}
            >
              {orderData.payment_status}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700">
              {orderData.status}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-navy-800">
              <Package className="h-5 w-5" />
              Customer
            </h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-stone-500">Name</dt>
                <dd className="font-medium text-slate-800">{orderData.customer_name || '—'}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Email</dt>
                <dd className="font-medium text-slate-800">{orderData.customer_email}</dd>
              </div>
              {orderData.customer_phone && (
                <div>
                  <dt className="text-stone-500">Phone</dt>
                  <dd className="font-medium text-slate-800">{orderData.customer_phone}</dd>
                </div>
              )}
              {orderData.company && (
                <div>
                  <dt className="text-stone-500">Company</dt>
                  <dd className="font-medium text-slate-800">{orderData.company}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy-800">Totals</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd>{formatPrice(Number(orderData.subtotal))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Shipping</dt>
                <dd>{formatPrice(Number(orderData.shipping_cost))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Tax</dt>
                <dd>{formatPrice(Number(orderData.tax_amount))}</dd>
              </div>
              {Number(orderData.discount_amount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <dt>Discount</dt>
                  <dd>-{formatPrice(Number(orderData.discount_amount))}</dd>
                </div>
              )}
              {orderData.coupon_code && (
                <div className="flex justify-between text-stone-500">
                  <dt>Coupon</dt>
                  <dd className="font-mono">{orderData.coupon_code}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-200 pt-3 font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(Number(orderData.total))}</dd>
              </div>
              {totalRefunded > 0 && (
                <>
                  <div className="flex justify-between text-stone-600">
                    <dt>Refunded</dt>
                    <dd>-{formatPrice(totalRefunded)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-stone-200 pt-2 font-semibold text-navy-800">
                    <dt>Net</dt>
                    <dd>{formatPrice(Number(orderData.total) - totalRefunded)}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy-800">Refund</h2>
            <OrderRefundUI
              orderId={orderData.id}
              orderNumber={orderData.order_number}
              total={Number(orderData.total)}
              totalRefunded={totalRefunded}
              items={items as Array<{ sku?: string; styleName?: string; quantity?: number; unitPrice?: number; discountedPrice?: number }>}
              paymentStatus={orderData.payment_status}
              stripeChargeId={orderData.stripe_charge_id}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
