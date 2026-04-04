'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Loader2, Package, Truck, MapPin,
  ExternalLink, FileText, Receipt,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline';
import { OrderChatWidget } from '@/components/orders/OrderChatWidget';

interface OrderItem {
  sku: string;
  styleId?: number;
  styleName: string;
  brandName: string;
  productTitle: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  discountedPrice: number | null;
  imageUrl: string;
  packageType?: string | null;
  packageDisplayName?: string | null;
}

interface Shipment {
  warehouse: string;
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: unknown;
  expectedDeliveryDate: string | null;
  deliveryStatus: string | null;
  lastCheckpointLocation: string | null;
  lastCheckpointMessage: string | null;
  lastCheckpointAt: string | null;
}

interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface Activity {
  type: string;
  details: Record<string, unknown>;
  createdAt: string;
}

interface OrderDetail {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  expectedDeliveryDate: string | null;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number | null;
  total: number;
  couponCode: string | null;
  shippingAddress: ShippingAddress | null;
  carrier: string | null;
  trackingNumber: string | null;
  customerName: string | null;
  customerEmail: string;
  company: string | null;
  poNumber: string | null;
  notes: string | null;
}

const CARRIER_TRACKING: Record<string, string> = {
  'UPS': 'https://www.ups.com/track?tracknum=',
  'USPS': 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  'FedEx': 'https://www.fedex.com/fedextrack/?trknbr=',
  'DHL': 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
};

function getTrackingUrl(carrier: string | null, trackingNumber: string | null): string | null {
  if (!carrier || !trackingNumber) return null;
  const baseUrl = Object.entries(CARRIER_TRACKING).find(
    ([key]) => carrier.toLowerCase().includes(key.toLowerCase())
  )?.[1];
  return baseUrl ? `${baseUrl}${trackingNumber}` : null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function OrderDetailClient({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/orders/${orderNumber}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setOrder(data.order);
        setShipments(data.shipments || []);
        setActivities(data.activities || []);
      })
      .catch(() => setError('Failed to load order details'))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error || 'Order not found'}</p>
        <Link href="/orders" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="space-y-6">
      {/* Back link + order number header */}
      <div>
        <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 transition-colors mb-3">
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-bold text-navy-800">{order.orderNumber}</h2>
          <div className="flex items-center gap-2">
            <a
              href={`/api/orders/${orderNumber}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-stone-50 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Invoice
            </a>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
      </div>

      {/* Status timeline */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-navy-800 mb-4">Order Status</h3>
        <OrderStatusTimeline
          status={order.status}
          createdAt={order.createdAt}
          paidAt={order.paidAt}
          shippedAt={order.shippedAt}
          deliveredAt={order.deliveredAt}
        />
      </div>

      {/* Expected delivery date */}
      {order.expectedDeliveryDate && order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <Truck className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-800">Expected Delivery</p>
              <p className="text-lg font-bold text-brand-700">
                {new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tracking info */}
      {(order.trackingNumber || shipments.length > 0) && (
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Tracking
          </h3>
          {shipments.length > 0 ? (
            <div className="space-y-3">
              {shipments.map((s, i) => {
                const url = getTrackingUrl(s.carrier, s.trackingNumber);
                return (
                  <div key={i} className="rounded-lg bg-stone-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          Shipment {i + 1} {s.warehouse ? `(${s.warehouse})` : ''}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {s.carrier || 'Unknown carrier'} &middot; {s.trackingNumber || 'No tracking yet'}
                        </p>
                      </div>
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {/* Live checkpoint info */}
                    {s.lastCheckpointMessage && (
                      <div className="mt-2 border-t border-stone-200 pt-2">
                        <p className="text-xs font-medium text-slate-600">{s.deliveryStatus || 'In Transit'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.lastCheckpointMessage}</p>
                        {s.lastCheckpointLocation && (
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {s.lastCheckpointLocation}
                          </p>
                        )}
                      </div>
                    )}
                    {s.expectedDeliveryDate && !s.deliveredAt && (
                      <p className="text-xs text-brand-600 mt-1.5 font-medium">
                        Expected: {new Date(s.expectedDeliveryDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : order.trackingNumber ? (
            <div className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {order.carrier || 'Carrier'} &middot; {order.trackingNumber}
                </p>
              </div>
              {getTrackingUrl(order.carrier, order.trackingNumber) && (
                <a href={getTrackingUrl(order.carrier, order.trackingNumber)!} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Items */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-navy-800 mb-4 flex items-center gap-2">
          <Package className="h-4 w-4" />
          Items ({order.items.length})
        </h3>
        <div className="divide-y divide-stone-100">
          {order.items.map((item, i) => {
            const effectivePrice = item.discountedPrice ?? item.unitPrice;
            const lineTotal = effectivePrice * item.quantity;

            return (
              <div key={i} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                {item.imageUrl ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                    <Image src={item.imageUrl} alt={item.productTitle || item.styleName} fill className="object-contain p-1" sizes="64px" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50">
                    <Package className="h-6 w-6 text-slate-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-800 truncate">
                    {item.brandName} {item.styleName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {item.productTitle || item.packageDisplayName}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    {item.colorName && <span>{item.colorName}</span>}
                    {item.colorName && item.sizeName && <span>&middot;</span>}
                    {item.sizeName && <span>{item.sizeName}</span>}
                    <span>&middot;</span>
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-navy-800">${lineTotal.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">${effectivePrice.toFixed(2)} each</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price breakdown + Shipping address */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Price breakdown */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Order Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-700">${order.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shipping</span>
              <span className="text-slate-700">
                {order.shippingCost === 0 ? 'Free' : `$${order.shippingCost?.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tax</span>
              <span className="text-slate-700">${order.taxAmount?.toFixed(2)}</span>
            </div>
            {order.discountAmount && order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-green-600">
                  Discount {order.couponCode && <span className="text-xs">({order.couponCode})</span>}
                </span>
                <span className="text-green-600">-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-stone-200 pt-2 flex justify-between">
              <span className="font-semibold text-navy-800">Total</span>
              <span className="font-bold text-lg text-brand-600">${order.total?.toFixed(2)}</span>
            </div>
          </div>
          {order.poNumber && (
            <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-slate-500">
              <span className="font-medium">PO Number:</span> {order.poNumber}
            </div>
          )}
          {order.paymentStatus === 'refunded' && (
            <Badge variant="error" className="mt-3">
              Refunded
            </Badge>
          )}
        </div>

        {/* Shipping address */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Shipping Address
          </h3>
          {addr ? (
            <div className="text-sm text-slate-600 space-y-1">
              {(addr.firstName || addr.lastName) && (
                <p className="font-medium text-slate-700">{addr.firstName} {addr.lastName}</p>
              )}
              {addr.company && <p>{addr.company}</p>}
              {addr.address && <p>{addr.address}</p>}
              {addr.apartment && <p>{addr.apartment}</p>}
              {(addr.city || addr.state || addr.zipCode) && (
                <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zipCode}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Address not available</p>
          )}
        </div>
      </div>

      {/* Activity timeline */}
      {activities.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-800 mb-4">Activity</h3>
          <div className="relative space-y-4 pl-6 before:absolute before:left-[9px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-stone-200">
            {activities
              .filter(a => !['system_error', 'note'].includes(a.type))
              .map((activity, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-6 top-1 h-[18px] w-[18px] rounded-full border-2 border-stone-200 bg-white" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {formatActivityType(activity.type)}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(activity.createdAt)}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Floating chat widget */}
      <OrderChatWidget
        orderNumber={orderNumber}
        customerName={order.customerName}
        customerEmail={order.customerEmail}
      />
    </div>
  );
}

function formatActivityType(type: string): string {
  const labels: Record<string, string> = {
    created: 'Order created',
    payment_processing: 'Payment processing',
    payment_received: 'Payment received',
    payment_failed: 'Payment failed',
    confirmed: 'Order confirmed',
    awaiting_purchasing: 'Order confirmed — preparing for shipment',
    ordered: 'Supplier order placed',
    status_change: 'Status updated',
    shipped: 'Order shipped',
    delivered: 'Order delivered',
    refunded: 'Refund issued',
    cancelled: 'Order cancelled',
    email_sent: 'Confirmation email sent',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
