import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/lib/database.types';
import { OrderRefundUI } from './OrderRefundUI';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Order Details',
  description: 'View order details',
};

/** Format address for display. Supports checkout shape (firstName, lastName, address, apartment, city, state, zipCode) and legacy keys. */
function formatAddress(addr: Record<string, unknown> | null): string {
  if (!addr || typeof addr !== 'object') return '—';
  const name =
    [addr.firstName, addr.lastName].filter(Boolean).join(' ') ||
    (addr.name as string) ||
    '';
  const street =
    (addr.address as string) ||
    (addr.street as string) ||
    (addr.address_line1 as string) ||
    (addr.addressLine1 as string) ||
    '';
  const apartment = (addr.apartment as string) || (addr.address_line2 as string) || '';
  const city = (addr.city as string) || '';
  const state = (addr.state as string) || '';
  const zip =
    (addr.zipCode as string) ||
    (addr.postal_code as string) ||
    (addr.postalCode as string) ||
    (addr.zip as string) ||
    '';
  const country = (addr.country as string) || '';
  const company = (addr.company as string) || '';

  const parts: string[] = [];
  if (name) parts.push(name);
  if (company) parts.push(company);
  if (street) parts.push(street);
  if (apartment) parts.push(apartment);
  const cityStateZip = [city, state, zip].filter(Boolean).join(', ');
  if (cityStateZip) parts.push(cityStateZip);
  if (country) parts.push(country);

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
  const items = rawItems.map((item, index) => {
    const qty = Number(item.quantity ?? 0);
    const unitPrice = Number(item.discountedPrice ?? item.unitPrice ?? 0);
    const name = [item.styleName, item.brandName, item.colorName, item.sizeName].filter(Boolean).join(' · ') || String(item.sku ?? '—');
    return { index, name, quantity: qty, unitPrice, total: qty * unitPrice };
  });

  const serviceSupabase = createServerSupabaseClient();
  const { data: refundPayments } = await serviceSupabase
    .from('payments')
    .select('amount')
    .eq('order_id', id)
    .eq('type', 'refund');
  const totalRefunded = (refundPayments ?? []).reduce((sum, p) => sum + Number((p as { amount: number }).amount), 0);

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

        <div className="mb-6">
          <p className="text-sm text-slate-600">
            {new Date(orderData.created_at).toLocaleString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
          <p className="mt-1 text-xs text-slate-500 font-mono">{orderData.order_number}</p>
        </div>

        <div className="space-y-6">
          {/* Customer */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-slate-500" />
              Customer
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <p className="text-slate-500">Name</p>
                <p className="font-medium text-slate-900">{orderData.customer_name || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500">Email</p>
                <p className="font-medium text-slate-900">{orderData.customer_email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500">Phone</p>
                <p className="font-medium text-slate-900">{orderData.customer_phone || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500">Company</p>
                <p className="font-medium text-slate-900">{orderData.company || '—'}</p>
              </div>
            </div>
          </section>

          {/* Shipping & Billing address — same container, 2 columns */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-navy-800 mb-4">Shipping address</h2>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                  {formatAddress(shippingAddr)}
                </pre>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy-800 mb-4">Billing address</h2>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                  {formatAddress(billingAddr)}
                </pre>
              </div>
            </div>
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
                  {items.map((item) => (
                    <tr key={item.index} className="border-b border-stone-100">
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
            <h2 className="text-lg font-bold text-navy-800 mb-4">Totals</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>{formatPrice(Number(orderData.subtotal))}</span></div>
              {Number(orderData.shipping_cost) > 0 && <div className="flex justify-between"><span className="text-slate-600">Shipping</span><span>{formatPrice(Number(orderData.shipping_cost))}</span></div>}
              {Number(orderData.tax_amount) > 0 && <div className="flex justify-between"><span className="text-slate-600">Tax</span><span>{formatPrice(Number(orderData.tax_amount))}</span></div>}
              {Number(orderData.discount_amount) > 0 && <div className="flex justify-between"><span className="text-slate-600">Discount</span><span className="text-green-600">-{formatPrice(Number(orderData.discount_amount))}</span></div>}
              {orderData.coupon_code && <div className="flex justify-between"><span className="text-slate-600">Coupon</span><span className="font-mono">{orderData.coupon_code}</span></div>}
              <div className="flex justify-between pt-2 border-t border-stone-200 font-bold text-base"><span>Total</span><span>{formatPrice(Number(orderData.total))}</span></div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Payment: {orderData.payment_status} · Status: {orderData.status}</p>
          </section>

          {/* Refund */}
          <OrderRefundUI
            orderId={orderData.id}
            orderNumber={orderData.order_number}
            orderTotal={Number(orderData.total)}
            paymentStatus={orderData.payment_status}
            items={items}
            totalRefunded={totalRefunded}
            hasStripeCharge={Boolean(orderData.stripe_charge_id)}
          />
        </div>
      </div>
    </div>
  );
}
