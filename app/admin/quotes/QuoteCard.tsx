'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Package, Palette, MapPin, Calendar, User, Building2, Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface QuoteItem {
  id: string;
  styleName: string;
  brandName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

interface QuoteDecoration {
  type: string;
  colors?: number;
  locations?: string[];
  stitchCount?: string;
}

interface Quote {
  id: string;
  quote_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  company?: string | null;
  items: QuoteItem[];
  decoration?: QuoteDecoration | null;
  finishing?: string[] | null;
  notes?: string | null;
  subtotal: number;
  status: 'new' | 'contacted' | 'quoted' | 'converted' | 'closed';
  created_at: string;
}

const statusConfig = {
  new: { label: 'New', variant: 'warning' as const },
  contacted: { label: 'Contacted', variant: 'info' as const },
  quoted: { label: 'Quoted', variant: 'brand' as const },
  converted: { label: 'Converted', variant: 'success' as const },
  closed: { label: 'Closed', variant: 'default' as const },
};

const decorationLabels: Record<string, string> = {
  none: 'No Decoration',
  screen: 'Screen Print',
  jumbo: 'Jumbo Screen Print',
  embroidery: 'Embroidery',
  digital: 'Digital Print',
};

export function QuoteCard({ quote }: { quote: Quote }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const items = Array.isArray(quote.items) ? quote.items : [];
  const itemCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const firstItem = items[0];
  
  const createdDate = new Date(quote.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const decoration = quote.decoration;
  const decorationType = decoration?.type ? decorationLabels[decoration.type] || decoration.type : null;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Main Row - Always Visible */}
      <div 
        className="flex cursor-pointer items-center gap-4 p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Product Image */}
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
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
        </div>

        {/* Quote Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">{quote.quote_id}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">{createdDate}</span>
          </div>
          <h3 className="mt-0.5 truncate font-semibold text-navy-800">
            {quote.company || quote.customer_name}
          </h3>
          <p className="text-sm text-slate-600">
            {itemCount} item{itemCount !== 1 ? 's' : ''} • {totalQuantity} pcs
            {decorationType && ` • ${decorationType}`}
          </p>
        </div>

        {/* Right Side - Price & Status */}
        <div className="flex flex-col items-end gap-2">
          <Badge variant={statusConfig[quote.status].variant}>
            {statusConfig[quote.status].label}
          </Badge>
          <span className="text-lg font-semibold text-navy-800">
            ${quote.subtotal?.toLocaleString() || '0'}
          </span>
        </div>

        {/* Expand Icon */}
        <div className="flex-shrink-0 text-slate-400">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-stone-100 bg-stone-50 p-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Info */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-navy-800">Customer</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="h-4 w-4 text-slate-400" />
                  {quote.customer_name}
                </div>
                {quote.company && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    {quote.company}
                  </div>
                )}
                <a 
                  href={`mailto:${quote.customer_email}`}
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                >
                  <Mail className="h-4 w-4" />
                  {quote.customer_email}
                </a>
                {quote.customer_phone && (
                  <a 
                    href={`tel:${quote.customer_phone}`}
                    className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                  >
                    <Phone className="h-4 w-4" />
                    {quote.customer_phone}
                  </a>
                )}
              </div>
            </div>

            {/* Decoration Info */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-navy-800">Decoration</h4>
              {decoration && decoration.type !== 'none' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Palette className="h-4 w-4 text-slate-400" />
                    {decorationType}
                    {decoration.colors && ` • ${decoration.colors} color${decoration.colors !== 1 ? 's' : ''}`}
                  </div>
                  {decoration.locations && decoration.locations.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {decoration.locations.map(loc => 
                        loc.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                      ).join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No decoration selected</p>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="mt-6">
            <h4 className="mb-3 text-sm font-semibold text-navy-800">Items ({itemCount})</h4>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div 
                  key={item.id || index}
                  className="flex items-center gap-3 rounded-lg bg-white p-3 border border-stone-200"
                >
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-stone-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.styleName || 'Product'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-4 w-4 text-stone-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {item.brandName} {item.styleName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.colorName} • {item.sizeName} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">
                      ${((item.unitPrice || 0) * (item.quantity || 0)).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">
                      ${item.unitPrice?.toFixed(2) || '0.00'}/ea
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-semibold text-navy-800">Notes</h4>
              <p className="rounded-lg bg-white border border-stone-200 p-3 text-sm text-slate-600">
                {quote.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-200 pt-4">
            <Link
              href={`/admin/quotes/${quote.id}`}
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              View Full Details
            </Link>
            <a
              href={`mailto:${quote.customer_email}`}
              className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email Customer
            </a>
            {quote.customer_phone && (
              <a
                href={`tel:${quote.customer_phone}`}
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
