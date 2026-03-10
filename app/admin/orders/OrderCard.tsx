'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Package, User, Building2, Mail, Phone, MapPin, Truck, CreditCard, Check, Loader2, MessageSquare, Send } from 'lucide-react';
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
  admin_note?: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'brand' | 'info' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  awaiting_purchasing: { label: 'Awaiting Purchasing', variant: 'brand' },
  ordered: { label: 'Ordered', variant: 'info' },
  in_production: { label: 'In Production', variant: 'brand' },
  shipped: { label: 'Shipped', variant: 'success' },
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

const carriers = [
  { id: 'ups', label: 'UPS' },
  { id: 'fedex', label: 'FedEx' },
  { id: 'usps', label: 'USPS' },
  { id: 'dhl', label: 'DHL' },
  { id: 'other', label: 'Other' },
];

export function OrderCard({ order }: { order: Order }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [carrier, setCarrier] = useState(order.carrier || '');
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [actualShippingCost, setActualShippingCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingSaved, setTrackingSaved] = useState(!!order.tracking_number);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [noteText, setNoteText] = useState(order.admin_note ?? '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const router = useRouter();

  const nextStatusMap: Record<string, { id: string; label: string }> = {
    awaiting_purchasing: { id: 'ordered', label: 'Mark as Ordered' },
    ordered: { id: 'shipped', label: 'Mark as Shipped' },
  };

  const handleStatusAdvance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = nextStatusMap[currentStatus];
    if (!next) return;

    if (next.id === 'shipped' && !trackingSaved) {
      setError('Add tracking info before marking as shipped');
      setTimeout(() => setError(null), 4000);
      return;
    }

    setIsUpdatingStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }
      setCurrentStatus(next.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!noteText.trim() || isSavingNote) return;

    setIsSavingNote(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'note',
          details: { content: noteText.trim() },
        }),
      });
      if (res.ok) {
        setSavedNote(noteText.trim());
        setNoteText('');
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrier || !trackingNumber.trim()) {
      setError('Both carrier and tracking number are required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier,
          tracking_number: trackingNumber.trim(),
          status: 'shipped',
          ...(actualShippingCost ? { actual_shipping_cost: actualShippingCost } : {}),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save tracking');
      }
      setTrackingSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSavingNote(true);
    setSavedNote(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_note: noteText.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save note');
      setSavedNote('saved');
      setNoteText(data.admin_note ?? '');
      setTimeout(() => setSavedNote(null), 2500);
      router.refresh();
    } catch {
      setError('Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  };

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

  const status = statusConfig[currentStatus] || statusConfig.pending;
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
            ${Number(order.total ?? 0).toFixed(2)}
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
              <h4 className="mb-3 text-sm font-semibold text-navy-800">Shipping &amp; Tracking</h4>
              <div className="space-y-2">
                {addressLine && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {addressLine}
                  </div>
                )}
                {order.payment_method && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
                  </div>
                )}
                {trackingSaved ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Truck className="h-4 w-4 text-slate-400" />
                    {(carrier || order.carrier)?.toUpperCase() || 'Carrier'}: {trackingNumber || order.tracking_number}
                  </div>
                ) : (
                  <form onSubmit={handleTrackingSubmit} onClick={(e) => e.stopPropagation()} className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      >
                        <option value="">Carrier</option>
                        {carriers.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Tracking number"
                        className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !carrier || !trackingNumber.trim()}
                        className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                      >
                        {isSubmitting ? '...' : <><Check className="h-3 w-3" /> Ship</>}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={actualShippingCost}
                          onChange={(e) => setActualShippingCost(e.target.value)}
                          placeholder="0.00"
                          className="w-28 rounded-lg border border-stone-200 bg-white py-1.5 pl-5 pr-2.5 text-xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400">Actual shipping cost (optional)</span>
                    </div>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <p className="text-xs text-slate-400">Saves tracking and emails the customer.</p>
                  </form>
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

          <div className="mt-4 border-t border-stone-200 pt-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Internal Note</span>
            </div>
            {savedNote && (
              <div className="mb-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-slate-700">
                &ldquo;{savedNote}&rdquo;
                <span className="ml-1 text-slate-400">— just now</span>
              </div>
            )}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note (e.g. ordered via SS, backordered, etc.)"
                className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <button
                type="submit"
                disabled={isSavingNote || !noteText.trim()}
                className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-stone-50 disabled:opacity-50"
              >
                {isSavingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Save
              </button>
            </form>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-4">
            {nextStatusMap[currentStatus] && (
              <button
                onClick={handleStatusAdvance}
                disabled={isUpdatingStatus}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy-800 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
              >
                {isUpdatingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {nextStatusMap[currentStatus].label}
              </button>
            )}
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
            <div onClick={(e) => e.stopPropagation()} className="w-full border-t border-stone-200 pt-4 mt-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-800">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                Internal note
              </h4>
              <form onSubmit={handleSaveNote} className="grid grid-cols-[8fr_2fr] gap-2 items-center">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add an internal note…"
                  className="min-w-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="submit"
                    disabled={isSavingNote}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isSavingNote ? '...' : <><Check className="h-3 w-3" /> Save</>}
                  </button>
                  {savedNote !== null && <span className="text-xs text-green-600">Saved</span>}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
