'use client';

import Link from 'next/link';
import { ChevronRight, Package, Truck, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface OrderCardProps {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  productCount: number;
  createdAt: string;
  carrier?: string | null;
  trackingNumber?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'brand' | 'info'; icon: React.ReactNode }> = {
  pending: { label: 'Pending', variant: 'default', icon: <Clock className="h-3.5 w-3.5" /> },
  confirmed: { label: 'Confirmed', variant: 'info', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  awaiting_purchasing: { label: 'Confirmed', variant: 'info', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  ordered: { label: 'Processing', variant: 'brand', icon: <Package className="h-3.5 w-3.5" /> },
  in_production: { label: 'In Production', variant: 'brand', icon: <Package className="h-3.5 w-3.5" /> },
  partially_shipped: { label: 'Partially Shipped', variant: 'warning', icon: <Truck className="h-3.5 w-3.5" /> },
  shipped: { label: 'Shipped', variant: 'warning', icon: <Truck className="h-3.5 w-3.5" /> },
  delivered: { label: 'Delivered', variant: 'success', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  cancelled: { label: 'Cancelled', variant: 'error', icon: <XCircle className="h-3.5 w-3.5" /> },
};

export function OrderCard({
  orderNumber,
  status,
  paymentStatus,
  total,
  itemCount,
  productCount,
  createdAt,
  carrier,
  trackingNumber,
}: OrderCardProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isRefunded = paymentStatus === 'refunded';
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/orders/${orderNumber}`}
      className="block rounded-xl border border-stone-200 bg-white p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-navy-800">{orderNumber}</h3>
            <Badge variant={isRefunded ? 'error' : config.variant} size="sm">
              <span className="flex items-center gap-1">
                {isRefunded ? <AlertCircle className="h-3.5 w-3.5" /> : config.icon}
                {isRefunded ? 'Refunded' : config.label}
              </span>
            </Badge>
          </div>

          <p className="text-xs text-slate-500">{date}</p>

          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span>{productCount} {productCount === 1 ? 'product' : 'products'}</span>
            <span className="text-stone-300">|</span>
            <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            {trackingNumber && carrier && (
              <>
                <span className="text-stone-300">|</span>
                <span className="text-brand-600 font-medium">{carrier}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-base font-bold text-navy-800">${total?.toFixed(2)}</p>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </Link>
  );
}
