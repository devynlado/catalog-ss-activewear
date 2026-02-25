'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Package, User, Building2, Mail, Phone, MapPin, Truck, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface OrderItem {
  sku?: string;
  styleName?: string;
  productTitle?: string;
  productName?: string;
  brandName?: string;
  colorName?: string;
  sizeName?: string;
  quantity: number;
  unitPrice?: number;
  discountedPrice?: number;
  imageUrl?: string;
  // Package order fields
  packageType?: string;
  packageDisplayName?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_email: string;
  customer_phone: string | null;
  company: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  po_number: string | null;
  tracking_number: string | null;
  carrier: string | null;
  shipping_address: Record<string, string> | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'brand' | 'info' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  in_production: { label: 'In Production', variant: 'brand' },
  shipped: { label: 'Shipped', variant: 'info' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
};

const paymentConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'brand' | 'info' }> = {
  pending: { label: 'Unpaid', variant: 'warning' },
  processing: { label: 'Processing', variant: 'info' },
  paid: { label: 'Paid', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
  refunded: { label: 'Refunded', variant: 'default' },
};

export function OrderCard({ order }: { order: Order }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const createdDate = new Date(order.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const createdTime = new Date(order.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const status = statusConfig[order.status] || statusConfig.pending;
  const payment = paymentConfig[order.payment_status] || paymentConfig.pending;

  const shippingAddr = order.shipping_address;
  const addressLine = shippingAddr
    ? [shippingAddr.city, shippingAddr.state].filter(Boolean).join(', ')
    : null;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div
        className="flex cursor-pointer items-center gap-4 p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-stone-100">
          <Package className="h-5 w-5 text-stone-500" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">{order.order_number}</span>
            <span className="text-slate-300">&middot;</span>
            <span className="text-xs text-slate-500">{createdDate} {createdTime}</span>
          </div>
          <h3 className="mt-0.5 truncate font-semibold text-navy-800">
            {order.company || order.customer_name || order.customer_email}
          </h3>
          <p className="text-sm text-slate-600">
            {itemCount} item{itemCount !== 1 ? 's' : ''} &middot; {totalQuantity} pcs
            {order.po_number && <> &middot; PO: {order.po_number}</>}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <Badge variant={payment.variant} size="sm">{payment.label}</Badge>
            <Badge variant={status.variant} size="sm">{status.label}</Badge>
          </div>
          <span className="text-lg font-semibold text-navy-800">
            ${order.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </span>
        </div>

        <div className="flex-shrink-0 text-slate-400">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-stone-100 bg-stone-50 p-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-navy-800">Customer</h4>
              <div className="space-y-2">
                {order.customer_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="h-4 w-4 text-slate-400" />
                    {order.customer_name}
                  </div>
                )}
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

            <div>
              <h4 className="mb-3 text-sm font-semibold text-navy-800">Shipping</h4>
              <div className="space-y-2">
                {addressLine && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {addressLine}
                  </div>
                )}
                {order.tracking_number && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Truck className="h-4 w-4 text-slate-400" />
                    {order.carrier?.toUpperCase() || 'Carrier'}: {order.tracking_number}
                  </div>
                )}
                {order.payment_method && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="mb-3 text-sm font-semibold text-navy-800">Items ({itemCount})</h4>
            <div className="space-y-2">
              {items.slice(0, 5).map((item, index) => {
                const name = item.packageDisplayName
                  || `${item.brandName || ''} ${item.styleName || item.productTitle || ''}`.trim()
                  || 'Item';
                const price = item.discountedPrice ?? item.unitPrice ?? 0;

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg bg-white p-3 border border-stone-200"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{name}</p>
                      <p className="text-xs text-slate-500">
                        {[item.colorName, item.sizeName].filter(Boolean).join(' \u00B7 ')}
                        {' \u00B7 '}Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">
                        ${(price * (item.quantity || 0)).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        ${price.toFixed(2)}/ea
                      </p>
                    </div>
                  </div>
                );
              })}
              {items.length > 5 && (
                <p className="text-center text-xs text-slate-500">
                  +{items.length - 5} more item{items.length - 5 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-4">
            <div className="text-sm text-slate-600">
              Subtotal: ${order.subtotal?.toFixed(2)} &middot; Tax: ${order.tax_amount?.toFixed(2)} &middot; Shipping: ${order.shipping_cost?.toFixed(2)}
            </div>
            <span className="text-lg font-bold text-navy-800">
              ${order.total?.toFixed(2)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-200 pt-4">
            <Link
              href={`/admin/orders/${order.id}`}
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Manage Order
            </Link>
            <a
              href={`mailto:${order.customer_email}`}
              className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email Customer
            </a>
            {order.customer_phone && (
              <a
                href={`tel:${order.customer_phone}`}
                className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
