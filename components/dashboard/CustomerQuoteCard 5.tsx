import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface QuoteItem {
  id?: string;
  styleName?: string;
  brandName?: string;
  imageUrl?: string;
  quantity?: number;
}

interface CustomerQuoteCardProps {
  quote: {
    id: string;
    quote_id: string;
    status: 'new' | 'contacted' | 'quoted' | 'converted' | 'closed';
    items: QuoteItem[];
    subtotal: number;
    created_at: string;
    unread_count?: number;
  };
}

const statusConfig = {
  new: { label: 'Submitted', variant: 'warning' as const, description: 'Awaiting review' },
  contacted: { label: 'In Progress', variant: 'info' as const, description: 'Rep is working on it' },
  quoted: { label: 'Quote Ready', variant: 'brand' as const, description: 'View your pricing' },
  converted: { label: 'Ordered', variant: 'success' as const, description: 'Order placed' },
  closed: { label: 'Closed', variant: 'default' as const, description: 'Quote expired' },
};

export function CustomerQuoteCard({ quote }: CustomerQuoteCardProps) {
  const items = Array.isArray(quote.items) ? quote.items : [];
  const itemCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const firstItem = items[0];
  
  const status = statusConfig[quote.status] || statusConfig.new;
  
  const createdDate = new Date(quote.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const hasUnread = (quote.unread_count || 0) > 0;

  return (
    <Link
      href={`/dashboard/quotes/${quote.id}`}
      className="group flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
    >
      {/* Product Thumbnail */}
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
        {firstItem?.imageUrl ? (
          <Image
            src={firstItem.imageUrl}
            alt={firstItem.styleName || 'Product'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-6 w-6 text-stone-400" />
          </div>
        )}
        
        {/* Unread Badge - positioned on thumbnail */}
        {hasUnread && (
          <div className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-bold text-white shadow-sm">
            {quote.unread_count}
          </div>
        )}
      </div>

      {/* Quote Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">{quote.quote_id}</span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">{createdDate}</span>
        </div>
        
        <div className="mt-1 flex items-center gap-2">
          <Badge variant={status.variant} className="text-xs">
            {status.label}
          </Badge>
          {hasUnread && (
            <span className="flex items-center gap-1 text-xs text-brand-600">
              <MessageSquare className="h-3 w-3" />
              New message
            </span>
          )}
        </div>
        
        <p className="mt-1 text-sm text-slate-600">
          {itemCount} item{itemCount !== 1 ? 's' : ''} • {totalQuantity} pcs • ${quote.subtotal?.toLocaleString() || '0'}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
    </Link>
  );
}

// Empty state for when user has no quotes
export function EmptyQuotesState() {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
      <Package className="mx-auto h-12 w-12 text-stone-400" />
      <h3 className="mt-4 font-semibold text-navy-800">No quotes yet</h3>
      <p className="mt-1 text-sm text-slate-600">
        Start building your first quote from our catalog.
      </p>
      <Link
        href="/catalog"
        className="mt-4 inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Browse Catalog
      </Link>
    </div>
  );
}
