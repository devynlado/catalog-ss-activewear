'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MessagesSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────

type InquiryStatus = 'received' | 'in_progress' | 'quoted' | 'accepted' | 'resolved' | 'closed';

interface InquiryFields {
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  quantity: string | null;
  service: string | null;
  message: string | null;
  visitor_source: string | null;
}

interface QuoteItem {
  styleName?: string;
  brandName?: string;
  colorName?: string;
  sizeName?: string;
  quantity?: number;
  unitPrice?: number;
}

interface QuoteDecoration {
  type?: string;
  colors?: number;
  locations?: string[];
  stitchCount?: string;
  description?: string;
}

interface Inquiry {
  id: string;
  type: 'contact' | 'quote';
  referenceId: string;
  createdAt: string;
  sourceLabel: string;
  sourceRaw: string | null;
  status: InquiryStatus;
  summary: string;
  quantity: string | null;
  service: string | null;
  company: string | null;
  fields: InquiryFields;
  items: QuoteItem[] | null;
  decoration: QuoteDecoration | null;
  finishing: string[] | null;
  subtotal: number | null;
}

// ── Status badge styles ─────────────────────────────────────────────────

const STATUS_LABEL: Record<InquiryStatus, string> = {
  received: 'Received',
  in_progress: 'In progress',
  quoted: 'Quoted',
  accepted: 'Accepted',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_STYLES: Record<InquiryStatus, string> = {
  received: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  quoted: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200',
  accepted: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  closed: 'bg-stone-100 text-slate-500 ring-1 ring-inset ring-stone-200',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

// ── Page ─────────────────────────────────────────────────────────────────

export function InquiriesClient() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/orders/inquiries')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { inquiries: Inquiry[] }) => {
        if (cancelled) return;
        setInquiries(data.inquiries || []);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Could not load your submissions. Please refresh.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className="space-y-6">
        <Header count={0} />
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
            <Inbox className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="text-base font-semibold text-navy-800">No inquiries yet</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Anytime you fill out a contact form or request a quote, it will show up here so you
            can come back to the details.
          </p>
          <Link
            href="/orders/request-quote"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Request a quote
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header count={inquiries.length} />
      <ul className="space-y-3">
        {inquiries.map((inquiry) => (
          <InquiryRow
            key={`${inquiry.type}:${inquiry.id}`}
            inquiry={inquiry}
            expanded={expandedId === `${inquiry.type}:${inquiry.id}`}
            onToggle={() =>
              setExpandedId(
                expandedId === `${inquiry.type}:${inquiry.id}` ? null : `${inquiry.type}:${inquiry.id}`
              )
            }
          />
        ))}
      </ul>
    </div>
  );
}

function Header({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-navy-800 sm:text-2xl">
          <MessagesSquare className="h-5 w-5 text-brand-500" />
          My Inquiries
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything you have submitted — contact forms, quote requests, and project inquiries.
        </p>
      </div>
      {count > 0 && (
        <span className="hidden rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline">
          {count} {count === 1 ? 'entry' : 'entries'}
        </span>
      )}
    </div>
  );
}

// ── Row ──────────────────────────────────────────────────────────────────

function InquiryRow({
  inquiry,
  expanded,
  onToggle,
}: {
  inquiry: Inquiry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const TypeIcon = inquiry.type === 'quote' ? FileText : MessagesSquare;

  return (
    <li className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-stone-50 sm:gap-4 sm:px-5"
      >
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            inquiry.type === 'quote'
              ? 'bg-purple-50 text-purple-600'
              : 'bg-brand-50 text-brand-600'
          )}
        >
          <TypeIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-navy-800">{inquiry.sourceLabel}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', STATUS_STYLES[inquiry.status])}>
              {STATUS_LABEL[inquiry.status]}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            <span className="font-mono">{inquiry.referenceId}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            {formatDate(inquiry.createdAt)}
          </p>
          <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">{inquiry.summary}</p>
        </div>

        <span className="shrink-0 text-slate-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {expanded && <InquiryDetail inquiry={inquiry} />}
    </li>
  );
}

// ── Detail (expanded) ────────────────────────────────────────────────────

function InquiryDetail({ inquiry }: { inquiry: Inquiry }) {
  return (
    <div className="border-t border-stone-100 bg-stone-50/40 p-4 sm:p-5">
      <div className="grid gap-5 md:grid-cols-2">
        {/* Identity */}
        <DetailGroup title="Submitted as">
          <FieldRow label="Name" value={inquiry.fields.name} />
          <FieldRow label="Email" value={inquiry.fields.email} />
          <FieldRow label="Phone" value={inquiry.fields.phone} />
          <FieldRow label="Company" value={inquiry.fields.company} />
        </DetailGroup>

        {/* What they asked for */}
        <DetailGroup title="Project details">
          <FieldRow label="Estimated qty" value={inquiry.fields.quantity} />
          <FieldRow label="Service" value={inquiry.fields.service} />
          {inquiry.type === 'quote' && inquiry.decoration?.type && inquiry.decoration.type !== 'none' && (
            <>
              <FieldRow label="Decoration" value={inquiry.decoration.type} />
              {typeof inquiry.decoration.colors === 'number' && (
                <FieldRow label="Colors" value={String(inquiry.decoration.colors)} />
              )}
              {Array.isArray(inquiry.decoration.locations) && inquiry.decoration.locations.length > 0 && (
                <FieldRow label="Locations" value={inquiry.decoration.locations.join(', ')} />
              )}
              {inquiry.decoration.stitchCount && (
                <FieldRow label="Stitch count" value={inquiry.decoration.stitchCount} />
              )}
            </>
          )}
          {Array.isArray(inquiry.finishing) && inquiry.finishing.length > 0 && (
            <FieldRow label="Finishing" value={inquiry.finishing.join(', ')} />
          )}
          {typeof inquiry.subtotal === 'number' && inquiry.subtotal > 0 && (
            <FieldRow label="Garment subtotal" value={formatPrice(inquiry.subtotal)} />
          )}
        </DetailGroup>
      </div>

      {/* Message */}
      {inquiry.fields.message && (
        <div className="mt-5">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Your message
          </p>
          <div className="whitespace-pre-wrap rounded-lg border border-stone-200 bg-white p-3 text-sm text-slate-700">
            {inquiry.fields.message}
          </div>
        </div>
      )}

      {/* Quote items table */}
      {inquiry.type === 'quote' && Array.isArray(inquiry.items) && inquiry.items.length > 0 && (
        <div className="mt-5">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Items requested ({inquiry.items.length})
          </p>
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Product</th>
                  <th className="px-3 py-2 font-semibold">Color / Size</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="hidden px-3 py-2 text-right font-semibold sm:table-cell">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inquiry.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-slate-800">
                      <div className="font-medium">{item.styleName || '—'}</div>
                      {item.brandName && (
                        <div className="text-[11px] text-slate-500">{item.brandName}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {[item.colorName, item.sizeName].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums text-slate-800">
                      {item.quantity ?? '—'}
                    </td>
                    <td className="hidden px-3 py-2 text-right text-slate-600 sm:table-cell">
                      {typeof item.unitPrice === 'number' ? formatPrice(item.unitPrice) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-4 text-xs text-slate-500">
        <span>
          Submitted via <strong className="text-slate-700">{inquiry.sourceLabel}</strong>
          {inquiry.fields.visitor_source && (
            <>
              <span className="mx-1.5 text-slate-300">·</span>
              channel: {inquiry.fields.visitor_source}
            </>
          )}
        </span>
        <Link
          href="/orders/request-quote"
          className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
        >
          Request another quote
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <dl className="space-y-1">{children}</dl>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <dt className="w-24 shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate text-slate-800">{value}</dd>
    </div>
  );
}
