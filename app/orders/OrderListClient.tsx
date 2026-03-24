'use client';

import { useState, useEffect } from 'react';
import { OrderCard } from '@/components/orders/OrderCard';
import { Package, Loader2, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderSummary {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  productCount: number;
  firstItemImage: string | null;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  hasCoupon: boolean;
}

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled';

const FILTER_TABS: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Package className="h-3.5 w-3.5" /> },
  { key: 'active', label: 'Active', icon: <Truck className="h-3.5 w-3.5" /> },
  { key: 'delivered', label: 'Delivered', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { key: 'cancelled', label: 'Cancelled', icon: <XCircle className="h-3.5 w-3.5" /> },
];

const ACTIVE_STATUSES = ['confirmed', 'awaiting_purchasing', 'ordered', 'in_production', 'partially_shipped', 'shipped'];

export function OrderListClient() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => {
    fetch('/api/orders/history')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => setOrders(data.orders || []))
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  const filtered = orders.filter(o => {
    if (filter === 'active') return ACTIVE_STATUSES.includes(o.status);
    if (filter === 'delivered') return o.status === 'delivered';
    if (filter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  const counts = {
    all: orders.length,
    active: orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-stone-100 p-1">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              filter === tab.key
                ? 'bg-white text-navy-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.icon}
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={cn(
                'ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                filter === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-stone-200 text-slate-500'
              )}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <OrderCard
              key={order.orderNumber}
              orderNumber={order.orderNumber}
              status={order.status}
              paymentStatus={order.paymentStatus}
              total={order.total}
              itemCount={order.itemCount}
              productCount={order.productCount}
              createdAt={order.createdAt}
              carrier={order.carrier}
              trackingNumber={order.trackingNumber}
            />
          ))}
        </div>
      )}
    </div>
  );
}
