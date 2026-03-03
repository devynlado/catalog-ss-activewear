import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/lib/database.types';

export const metadata = {
  title: 'Order Details',
  description: 'View order details',
};

function formatAddress(addr: Record<string, unknown> | null): string {
  if (!addr || typeof addr !== 'object') return '—';
  const parts = [
    addr.name,
    addr.street || addr.address_line1 || addr.addressLine1,
    [addr.city, addr.state, addr.postal_code || addr.postalCode || addr.zip].filter(Boolean).join(', '),
    addr.country,
  ].filter(Boolean);
  return parts.length ? parts.join('\n') : '—';
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    notFound();
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !order) notFound();
  const orderData = order as Order;

  const shippingAddr = orderData.shipping_address as Record<string, unknown> | null;
  const billingAddr = orderData.billing_address as Record<string, unknown> | null;
  const rawItems = (orderData.items as Array<Record<string, unknown>>) ?? [];
  const items = rawItems.map((item) => {
    const qty = Number(item.quantity ?? 0);
    const unitPrice = Number(item.discountedPrice ?? item.unitPrice ?? 0);
    const name = [item.styleName, item.brandName, item.colorName, item.sizeName].filter(Boolean).join(' · ') || String(item.sku ?? '—');
    return { name, quantity: qty, unitPrice, total: qty * unitPrice };
  });

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

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Order {orderData.order_number}
          </h1>
          <p className="mt-1 text-slate-600">
            Placed {new Date(orderData.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="space-y-6">
          {/* Customer */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy-800 mb-4">Customer</h2>
            <dl className="grid gap-2 text-sm">
              <div><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{orderData.customer_name || '—'}</dd></div>
              <div><dt className="text-slate-500">Email</dt><dd className="font-medium text-slate-900">{orderData.customer_email}</dd></div>
              {orderData.customer_phone && <div><dt className="text-slate-500">Phone</dt><dd className="font-medium text-slate-900">{orderData.customer_phone}</dd></div>}
              {orderData.company && <div><dt className="text-slate-500">Company</dt><dd className="font-medium text-slate-900">{orderData.company}</dd></div>}
            </dl>
          </section>

          {/* Shipping address */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy-800 mb-4">Shipping address</h2>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
              {formatAddress(shippingAddr)}
            </pre>
          </section>

          {/* Billing address */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy-800 mb-4">Billing address</h2>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
              {formatAddress(billingAddr)}
            </pre>
          </section>

          {/* Line items */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy-800 mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-slate-500">
                    <th className="pb-2 pr-4">Product</th>
                    <th className="pb-2 pr-4 text-right">Qty</th>
                    <th className="pb-2 pr-4 text-right">Unit price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-stone-100">
                      <td className="py-3 pr-4 font-medium text-slate-900">{item.name}</td>
                      <td className="py-3 pr-4 text-right">{item.quantity}</td>
                      <td className="py-3 pr-4 text-right">{formatPrice(item.unitPrice)}</td>
                      <td className="py-3 text-right font-medium">{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Totals */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy-800 mb-4">Totals</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd>{formatPrice(Number(orderData.subtotal))}</dd></div>
              {Number(orderData.shipping_cost) > 0 && <div className="flex justify-between"><dt className="text-slate-600">Shipping</dt><dd>{formatPrice(Number(orderData.shipping_cost))}</dd></div>}
              {Number(orderData.tax_amount) > 0 && <div className="flex justify-between"><dt className="text-slate-600">Tax</dt><dd>{formatPrice(Number(orderData.tax_amount))}</dd></div>}
              {Number(orderData.discount_amount) > 0 && <div className="flex justify-between"><dt className="text-slate-600">Discount</dt><dd className="text-green-600">-{formatPrice(Number(orderData.discount_amount))}</dd></div>}
              {orderData.coupon_code && <div className="flex justify-between"><dt className="text-slate-600">Coupon</dt><dd className="font-mono">{orderData.coupon_code}</dd></div>}
              <div className="flex justify-between pt-2 border-t border-stone-200 font-semibold text-base"><dt>Total</dt><dd>{formatPrice(Number(orderData.total))}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">Payment: {orderData.payment_status} · Status: {orderData.status}</p>
          </section>

          {/* Refund note */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
            <strong>Refunds:</strong> To process refunds for this order, merge or deploy the <strong>Refund</strong> branch so the refund UI and API are available on this site.
          </div>
        </div>
      </div>
    </div>
  );
}
