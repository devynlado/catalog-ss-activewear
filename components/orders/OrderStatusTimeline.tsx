'use client';

import { Check, Clock, Package, Truck, Home, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineStep {
  label: string;
  date?: string | null;
  active: boolean;
  completed: boolean;
  icon: React.ReactNode;
}

interface OrderStatusTimelineProps {
  status: string;
  createdAt?: string | null;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  awaiting_purchasing: 1,
  ordered: 2,
  in_production: 3,
  partially_shipped: 3.5,
  shipped: 4,
  delivered: 5,
  cancelled: -1,
};

function formatDate(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function OrderStatusTimeline({ status, createdAt, paidAt, shippedAt, deliveredAt }: OrderStatusTimelineProps) {
  const rank = STATUS_RANK[status] ?? 0;
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
        <XCircle className="h-5 w-5 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-800">Order Cancelled</p>
          <p className="text-xs text-red-600">This order has been cancelled.</p>
        </div>
      </div>
    );
  }

  const steps: TimelineStep[] = [
    {
      label: 'Confirmed',
      date: formatDate(paidAt || createdAt),
      completed: rank >= 1,
      active: rank >= 1 && rank < 2,
      icon: <Check className="h-4 w-4" />,
    },
    {
      label: 'Processing',
      date: rank >= 2 ? formatDate(paidAt) : undefined,
      completed: rank >= 3,
      active: rank >= 2 && rank < 3,
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: 'Shipped',
      date: formatDate(shippedAt),
      completed: rank >= 5,
      active: rank >= 3.5 && rank < 5,
      icon: <Truck className="h-4 w-4" />,
    },
    {
      label: 'Delivered',
      date: formatDate(deliveredAt),
      completed: rank >= 5,
      active: false,
      icon: <Home className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                step.completed
                  ? 'border-green-500 bg-green-500 text-white'
                  : step.active
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-stone-200 bg-stone-50 text-slate-400'
              )}
            >
              {step.completed ? <Check className="h-4 w-4" /> : step.icon}
            </div>
            <p className={cn(
              'mt-2 text-xs font-medium text-center',
              step.completed ? 'text-green-700' : step.active ? 'text-brand-700' : 'text-slate-400'
            )}>
              {step.label}
            </p>
            {step.date && (
              <p className="text-[10px] text-slate-400 mt-0.5">{step.date}</p>
            )}
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 flex-1 mx-2 mt-[-1.25rem]',
                step.completed ? 'bg-green-500' : 'bg-stone-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
