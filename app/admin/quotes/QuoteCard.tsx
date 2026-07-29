'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Layers,
  Mail,
  MapPin,
  Package,
  Palette,
  Phone,
  Shirt,
  Sparkles,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  blankSummary,
  decorationMethodsSummary,
  isProjectItem,
  isProjectQuote,
  projectFacts,
  totalEstimatedPieces,
  type AnyQuoteItem,
  type LegacyQuoteLineItem,
  type QuoteProjectItem,
} from './project-item-helpers';

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
  items: AnyQuoteItem[];
  decoration?: QuoteDecoration | null;
  finishing?: string[] | null;
  notes?: string | null;
  subtotal: number;
  status: 'new' | 'contacted' | 'quoted' | 'converted' | 'closed';
  created_at: string;
  visitor_source?: string | null;
}

// Visitor-source channel pill colors (mirrors /admin/contacts).
const VISITOR_SOURCE_COLORS: Record<string, string> = {
  'Direct': 'bg-slate-100 text-slate-700',
  'Google Ads': 'bg-blue-100 text-blue-800',
  'Organic Search': 'bg-green-100 text-green-800',
  'Organic Social': 'bg-purple-100 text-purple-800',
  'Organic Shopping': 'bg-teal-100 text-teal-800',
  'Referral': 'bg-amber-100 text-amber-800',
  'Cross-network': 'bg-indigo-100 text-indigo-800',
  'Other': 'bg-stone-100 text-stone-700',
  'Untracked': 'bg-stone-50 text-stone-400 border border-dashed border-stone-300',
};

const statusConfig = {
  new: { label: 'New', variant: 'warning' as const },
  contacted: { label: 'Contacted', variant: 'info' as const },
  quoted: { label: 'Quoted', variant: 'brand' as const },
  converted: { label: 'Converted', variant: 'success' as const },
  closed: { label: 'Closed', variant: 'default' as const },
};

// Legacy cart-based decoration.type → label. Project-shape items carry
// their own `decorationLabel` so we don't need this branch for them.
const legacyDecorationLabels: Record<string, string> = {
  none: 'No Decoration',
  screen: 'Screen Print',
  jumbo: 'Jumbo Screen Print',
  embroidery: 'Embroidery',
  digital: 'Digital Print',
};

export function QuoteCard({ quote }: { quote: Quote }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const items: AnyQuoteItem[] = Array.isArray(quote.items) ? quote.items : [];
  const isProject = isProjectQuote(items);
  const itemCount = items.length;
  const totalQuantity = totalEstimatedPieces(items);

  const createdDate = new Date(quote.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Headline "decoration" label used in the collapsed row.
  const headlineDecoration = isProject
    ? decorationMethodsSummary(items as QuoteProjectItem[])
    : quote.decoration?.type
      ? legacyDecorationLabels[quote.decoration.type] ?? quote.decoration.type
      : null;

  // Thumbnail source — for project quotes we use the first project's catalog
  // product image (if any). Legacy quotes use the first line item.
  const thumbnail: string | undefined = (() => {
    if (isProject) {
      const first = items[0] as QuoteProjectItem | undefined;
      return first?.catalogProduct?.imageUrl;
    }
    return (items[0] as LegacyQuoteLineItem | undefined)?.imageUrl;
  })();

  const legacyDecoration = quote.decoration;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Main Row - Always Visible */}
      <div
        className="flex cursor-pointer items-center gap-4 p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Thumbnail */}
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt="Quote thumbnail"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {isProject ? (
                <Sparkles className="h-6 w-6 text-brand-400" />
              ) : (
                <Package className="h-6 w-6 text-stone-400" />
              )}
            </div>
          )}
        </div>

        {/* Quote Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              {quote.quote_id}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">{createdDate}</span>
            {isProject && (
              <>
                <span className="text-slate-300">•</span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                  Project
                </span>
              </>
            )}
            <span className="text-slate-300">•</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                VISITOR_SOURCE_COLORS[quote.visitor_source || 'Untracked'] ||
                'bg-stone-100 text-stone-700'
              }`}
            >
              {quote.visitor_source || 'Untracked'}
            </span>
          </div>
          <h3 className="mt-0.5 truncate font-semibold text-navy-800">
            {quote.company || quote.customer_name}
          </h3>
          <p className="text-sm text-slate-600">
            {isProject
              ? `${itemCount} project${itemCount !== 1 ? 's' : ''} • ≈ ${totalQuantity} pcs`
              : `${itemCount} item${itemCount !== 1 ? 's' : ''} • ${totalQuantity} pcs`}
            {headlineDecoration && ` • ${headlineDecoration}`}
          </p>
        </div>

        {/* Right Side - Price & Status */}
        <div className="flex flex-col items-end gap-2">
          <Badge variant={statusConfig[quote.status].variant}>
            {statusConfig[quote.status].label}
          </Badge>
          {/* Project quotes don't have a pre-computed subtotal (sales team
              fills it in), so we hide the placeholder $0 for those. */}
          {!isProject && (
            <span className="text-lg font-semibold text-navy-800">
              ${quote.subtotal?.toLocaleString() || '0'}
            </span>
          )}
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
              <h4 className="mb-3 text-sm font-semibold text-navy-800">
                Customer
              </h4>
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

            {/* Decoration Info — only rendered for legacy quotes. Project
                quotes carry per-project decoration inline in the Projects
                section below, so this panel would be duplicative. */}
            {!isProject && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-navy-800">
                  Decoration
                </h4>
                {legacyDecoration && legacyDecoration.type !== 'none' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Palette className="h-4 w-4 text-slate-400" />
                      {headlineDecoration}
                      {legacyDecoration.colors &&
                        ` • ${legacyDecoration.colors} color${legacyDecoration.colors !== 1 ? 's' : ''}`}
                    </div>
                    {legacyDecoration.locations &&
                      legacyDecoration.locations.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {legacyDecoration.locations
                            .map((loc) =>
                              loc
                                .split('-')
                                .map(
                                  (w) => w.charAt(0).toUpperCase() + w.slice(1),
                                )
                                .join(' '),
                            )
                            .join(', ')}
                        </div>
                      )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No decoration selected
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Items / Projects List */}
          <div className="mt-6">
            <h4 className="mb-3 text-sm font-semibold text-navy-800">
              {isProject
                ? `Projects (${itemCount})`
                : `Items (${itemCount})`}
            </h4>
            <div className="space-y-3">
              {items.map((item, index) => {
                if (isProjectItem(item)) {
                  return (
                    <ProjectItemPanel
                      key={index}
                      project={item}
                      displayIndex={index}
                    />
                  );
                }
                return (
                  <LegacyItemPanel
                    key={index}
                    item={item as LegacyQuoteLineItem}
                    displayIndex={index}
                  />
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-semibold text-navy-800">
                Notes
              </h4>
              <p className="rounded-lg border border-stone-200 bg-white p-3 text-sm text-slate-600">
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

// ---------------------------------------------------------------------------
// Panels
// ---------------------------------------------------------------------------

function ProjectItemPanel({
  project,
  displayIndex,
}: {
  project: QuoteProjectItem;
  displayIndex: number;
}) {
  return (
    <div className="rounded-lg border border-brand-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {displayIndex + 1}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {project.decorationLabel}
          </span>
        </div>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
          Project
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Blank
          </p>
          <p className="mt-0.5 flex items-start gap-1.5 text-sm text-slate-700">
            <Shirt className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <span className="break-words">{blankSummary(project)}</span>
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Decoration
          </p>
          <p className="mt-0.5 flex items-start gap-1.5 text-sm text-slate-700">
            <Layers className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <span>{project.decorationLabel}</span>
          </p>
        </div>
      </div>

      <dl className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {projectFacts(project).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2 text-xs">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-700">{value}</dd>
          </div>
        ))}
      </dl>

      {project.designNotes && (
        <div className="mt-3 rounded-md bg-stone-50 p-2.5">
          <p className="text-xs font-medium text-slate-500">Design notes</p>
          <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-700">
            {project.designNotes}
          </p>
        </div>
      )}
    </div>
  );
}

function LegacyItemPanel({
  item,
  displayIndex,
}: {
  item: LegacyQuoteLineItem;
  displayIndex: number;
}) {
  return (
    <div
      key={item.id || displayIndex}
      className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3"
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
  );
}
