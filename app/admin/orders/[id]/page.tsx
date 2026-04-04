import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, PenTool, User, Building2, Mail, Phone, MapPin, CreditCard, ExternalLink, Download } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Badge } from '@/components/ui/Badge';
import { OrderStatusActions } from './OrderStatusActions';
import { ShippingForm } from './ShippingForm';
import { ActualShippingCostEditor } from './ActualShippingCostEditor';
import { OrderActivityLog } from './OrderActivityLog';
import { OrderRefundUI } from './OrderRefundUI';
import { ResendShippedEmail } from './ResendShippedEmail';
import { SSActivewearSection } from './SSActivewearSection';
import { SSActivityLog } from './SSActivityLog';
import { OrderChat } from './OrderChat';
import { ChatNotificationBanner } from './ChatNotificationBanner';

export const metadata = {
  title: 'Order Details',
  description: 'View and manage order details',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'brand' | 'info' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  awaiting_purchasing: { label: 'Awaiting Purchasing', variant: 'brand' },
  ordered: { label: 'Ordered', variant: 'info' },
  in_production: { label: 'In Production', variant: 'brand' },
  partially_shipped: { label: 'Partially Shipped', variant: 'brand' },
  shipped: { label: 'Shipped', variant: 'success' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
};

const WAREHOUSE_LABELS: Record<string, string> = {
  ss_activewear: 'SS Activewear',
  los_angeles_apparel: 'LA Apparel',
  as_colour: 'AS Colour',
};

function formatDecoLabel(item: { decorationType?: string; packageName?: string }): string {
  const type = item.decorationType
    ? item.decorationType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '';
  const name = item.packageName || '';
  if (type && name) return `${type} - ${name}`;
  return type || name || 'Decoration Service';
}

const paymentConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'brand' | 'info' }> = {
  pending: { label: 'Unpaid', variant: 'warning' },
  processing: { label: 'Processing', variant: 'info' },
  paid: { label: 'Paid', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
  refunded: { label: 'Refunded', variant: 'default' },
};

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single() as { data: any; error: any };

  if (error || !order) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allItems: any[] = Array.isArray(order.items) ? order.items : [];
  const items = allItems.filter((item: any) => item.type !== 'decoration');
  const decorationItems = allItems.filter((item: any) => item.type === 'decoration');

  // Fetch order shipments
  const { data: shipments } = await supabase
    .from('order_shipments')
    .select('*')
    .eq('order_id', order.id)
    .order('shipment_index', { ascending: true });

  // Fetch refund payments for this order (amount + created_at for activity log backfill)
  const { data: refundPayments } = await supabase
    .from('payments')
    .select('amount, created_at')
    .eq('order_id', order.id)
    .eq('type', 'refund')
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false });

  // Fetch SS Activewear orders for this order
  const { data: ssOrders } = await supabase
    .from('ss_orders')
    .select('*')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true });
  const refunds = (refundPayments ?? []) as { amount: number; created_at?: string }[];
  const totalRefunded = refunds.reduce((sum, p) => sum + Number(p.amount), 0);
  const lastRefundedAt = refunds[0]?.created_at ?? null;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shippingAddr = order.shipping_address as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const billingAddr = order.billing_address as any;

  const createdDate = new Date(order.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const status = statusConfig[order.status] || statusConfig.pending;
  const payment = paymentConfig[order.payment_status] || paymentConfig.pending;

  const stripeUrl = order.stripe_payment_intent_id
    ? `https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`
    : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin/orders"
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
                {order.order_number}
              </h1>
              <Badge variant={payment.variant}>{payment.label}</Badge>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Placed {createdDate}
            </p>
          </div>

          <OrderStatusActions
            orderId={order.id}
            currentStatus={order.status}
            hasTracking={!!order.tracking_number}
          />
        </div>

        <ChatNotificationBanner
          orderId={order.id}
          customerName={order.customer_name || 'Customer'}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Customer */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-800">Customer</h2>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-600">
                  {(order.customer_name || order.customer_email)?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-navy-800">
                    {order.customer_name || 'Guest'}
                  </h3>
                  <div className="mt-2 space-y-1">
                    {order.company && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {order.company}
                      </div>
                    )}
                    <a
                      href={`mailto:${order.customer_email}`}
                      className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                    >
                      <Mail className="h-4 w-4" />
                      {order.customer_email}
                    </a>
                    {order.customer_phone && (
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                      >
                        <Phone className="h-4 w-4" />
                        {order.customer_phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-800">
                Products ({items.length})
              </h2>
              <div className="space-y-3">
                {items.map((item: any, index: number) => {
                  const name = item.packageDisplayName
                    || `${item.brandName || ''} ${item.styleName || item.productTitle || ''}`.trim()
                    || 'Item';
                  const price = item.discountedPrice ?? item.unitPrice ?? 0;

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 rounded-lg border border-stone-100 bg-stone-50 p-4"
                    >
                      <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                        <Package className="h-6 w-6 text-stone-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800">{name}</p>
                        <p className="text-sm text-slate-500">
                          {[item.colorName, item.sizeName].filter(Boolean).join(' \u00B7 ')}
                        </p>
                        <p className="text-sm text-slate-600">
                          Qty: {item.quantity} &times; ${price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-navy-800">
                          ${(price * (item.quantity || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {decorationItems.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-base font-semibold text-navy-800">
                    Decoration Services ({decorationItems.length})
                  </h3>
                  <div className="space-y-3">
                    {decorationItems.map((item: any, index: number) => (
                      <div
                        key={`deco-${index}`}
                        className="flex items-center gap-4 rounded-lg border border-brand-200 bg-brand-50 p-4"
                      >
                        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                          <PenTool className="h-6 w-6 text-brand-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-brand-800">
                            {formatDecoLabel(item)}
                          </p>
                          <p className="text-sm text-brand-600">
                            {item.quantity} pcs &times; ${Number(item.unitPrice || 0).toFixed(2)}/ea
                          </p>
                          {item.setupFee > 0 && (
                            <p className="text-xs text-brand-500">
                              Setup fee: ${Number(item.setupFee).toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-brand-800">
                            ${Number(item.totalPrice || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2 border-t border-stone-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Subtotal ({totalQuantity} pcs)</span>
                  <span className="text-slate-800">${order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Tax</span>
                  <span className="text-slate-800">${order.tax_amount?.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="text-slate-800">
                    {order.shipping_cost === 0 ? 'FREE' : `$${order.shipping_cost?.toFixed(2)}`}
                  </span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Discount</span>
                    <span className="text-green-600">-${order.discount_amount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-stone-200 pt-2">
                  <span className="text-lg font-semibold text-navy-800">Total</span>
                  <span className="text-xl font-bold text-navy-800">${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Addresses */}
            {(shippingAddr || billingAddr) && (
              <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-navy-800">Addresses</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {shippingAddr && (
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        Shipping
                      </h3>
                      <div className="rounded-lg bg-stone-50 p-4 text-sm text-slate-600">
                        {[shippingAddr.firstName, shippingAddr.lastName].filter(Boolean).join(' ') && (
                          <p className="font-medium text-slate-800">
                            {[shippingAddr.firstName, shippingAddr.lastName].filter(Boolean).join(' ')}
                          </p>
                        )}
                        {shippingAddr.company && <p>{shippingAddr.company}</p>}
                        <p>{shippingAddr.address1 || shippingAddr.address || shippingAddr.street}</p>
                        {shippingAddr.address2 && <p>{shippingAddr.address2}</p>}
                        <p>
                          {shippingAddr.city}, {shippingAddr.state} {shippingAddr.zipCode || shippingAddr.zip}
                        </p>
                      </div>
                    </div>
                  )}
                  {billingAddr && (
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        Billing
                      </h3>
                      <div className="rounded-lg bg-stone-50 p-4 text-sm text-slate-600">
                        {[billingAddr.firstName, billingAddr.lastName].filter(Boolean).join(' ') && (
                          <p className="font-medium text-slate-800">
                            {[billingAddr.firstName, billingAddr.lastName].filter(Boolean).join(' ')}
                          </p>
                        )}
                        {billingAddr.company && <p>{billingAddr.company}</p>}
                        <p>{billingAddr.address1 || billingAddr.address || billingAddr.street}</p>
                        {billingAddr.address2 && <p>{billingAddr.address2}</p>}
                        <p>
                          {billingAddr.city}, {billingAddr.state} {billingAddr.zipCode || billingAddr.zip}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-800">Payment</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status</span>
                  <Badge variant={payment.variant}>{payment.label}</Badge>
                </div>
                {order.payment_method && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Method</span>
                    <span className="text-sm font-medium text-slate-800">
                      {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
                    </span>
                  </div>
                )}
                {order.po_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">PO Number</span>
                    <span className="text-sm font-medium text-slate-800">{order.po_number}</span>
                  </div>
                )}
                {order.paid_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Paid</span>
                    <span className="text-sm text-slate-800">
                      {new Date(order.paid_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                {totalRefunded > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Refunded</span>
                    <span className="text-sm font-medium text-red-600">
                      -${totalRefunded.toFixed(2)}
                    </span>
                  </div>
                )}
                {order.coupon_code && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Coupon</span>
                    <span className="text-sm font-mono font-medium text-slate-800">{order.coupon_code}</span>
                  </div>
                )}
                {stripeUrl && (
                  <a
                    href={stripeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View in Stripe Dashboard
                  </a>
                )}
              </div>
            </div>

            {/* Refund Management */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-800">Refund Management</h2>
              <OrderRefundUI
                orderId={order.id}
                orderNumber={order.order_number}
                total={Number(order.total)}
                totalRefunded={totalRefunded}
                items={items}
                paymentStatus={order.payment_status}
                stripeChargeId={order.stripe_charge_id ?? null}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Shipping & Tracking */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-800">Shipping &amp; Tracking</h2>
              {shipments && shipments.length > 1 ? (
                <div className="space-y-4">
                  {shipments.map((shipment: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div key={shipment.id} className={`${idx > 0 ? 'border-t border-stone-200 pt-4' : ''}`}>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Shipment {idx + 1} — {WAREHOUSE_LABELS[shipment.warehouse] || shipment.warehouse}
                      </p>
                      {shipment.tracking_number ? (
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-slate-500">Carrier</p>
                            <p className="text-sm font-medium text-slate-800">
                              {shipment.carrier?.toUpperCase() || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Tracking</p>
                            <p className="break-all text-sm font-medium text-slate-800">{shipment.tracking_number}</p>
                          </div>
                          {shipment.shipped_at && (
                            <div>
                              <p className="text-xs font-medium text-slate-500">Shipped</p>
                              <p className="text-sm text-slate-800">
                                {new Date(shipment.shipped_at).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Awaiting tracking</p>
                      )}
                    </div>
                  ))}
                  {/* Show form for unshipped shipments */}
                  {shipments.some((s: any) => !s.tracking_number) && ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div className="border-t border-stone-200 pt-4">
                      <ShippingForm orderId={order.id} shipments={shipments} />
                    </div>
                  )}
                  <div className="border-t border-stone-200 pt-3">
                    <ActualShippingCostEditor
                      orderId={order.id}
                      currentValue={order.actual_shipping_cost != null ? Number(order.actual_shipping_cost) : null}
                      shippingCharged={Number(order.shipping_cost) || 0}
                    />
                  </div>
                </div>
              ) : order.tracking_number ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Carrier</p>
                    <p className="text-sm font-medium text-slate-800">
                      {order.carrier?.toUpperCase() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Tracking Number</p>
                    <p className="break-all text-sm font-medium text-slate-800">{order.tracking_number}</p>
                  </div>
                  {order.shipped_at && (
                    <div>
                      <p className="text-xs font-medium text-slate-500">Shipped</p>
                      <p className="text-sm text-slate-800">
                        {new Date(order.shipped_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  <div className="border-t border-stone-200 pt-3">
                    <ActualShippingCostEditor
                      orderId={order.id}
                      currentValue={order.actual_shipping_cost != null ? Number(order.actual_shipping_cost) : null}
                      shippingCharged={Number(order.shipping_cost) || 0}
                    />
                  </div>
                </div>
              ) : (
                <ShippingForm orderId={order.id} shipments={shipments || undefined} />
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-800">Quick Actions</h2>
              <div className="space-y-2">
                <a
                  href={`/api/orders/${order.order_number}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-2 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-stone-50"
                >
                  <Download className="h-4 w-4" />
                  Download Invoice
                </a>
                <a
                  href={`mailto:${order.customer_email}`}
                  className="flex w-full items-center gap-2 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-stone-50"
                >
                  <Mail className="h-4 w-4" />
                  Email Customer
                </a>
                {order.tracking_number && order.customer_email && (
                  <ResendShippedEmail
                    orderId={order.id}
                    customerEmail={order.customer_email}
                  />
                )}
              </div>
            </div>

            {/* Customer Chat */}
            <OrderChat
              orderId={order.id}
              customerName={order.customer_name || 'Customer'}
              customerEmail={order.customer_email}
            />

            {/* SS Activewear Section */}
            <SSActivewearSection
              orderId={order.id}
              orderStatus={order.status}
              ssAutoOrderFailed={order.ss_auto_order_failed ?? false}
              ssAutoOrderError={order.ss_auto_order_error ?? null}
              ssOrders={(ssOrders || []) as any[]}
            />

            {/* SS Activewear Activity Log */}
            <SSActivityLog orderId={order.id} />

            {/* Activity Log */}
            <OrderActivityLog
              orderId={order.id}
              orderCreatedAt={order.created_at}
              adminNote={order.admin_note ?? null}
              orderSummary={{
                created_at: order.created_at,
                status: order.status,
                payment_status: order.payment_status,
                paid_at: order.paid_at ?? null,
                shipped_at: order.shipped_at ?? null,
                tracking_number: order.tracking_number ?? null,
                carrier: order.carrier ?? null,
                order_number: order.order_number ?? null,
                refunded_at: lastRefundedAt,
                total_refunded: totalRefunded > 0 ? totalRefunded : undefined,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
