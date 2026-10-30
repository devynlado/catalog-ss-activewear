'use client';

import { useState } from 'react';
import {
  Search,
  Loader2,
  Download,
  FileText,
  Mail,
  Phone,
  Building2,
  Package,
  Palette,
  Shirt,
  Layers,
  Sparkles,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  blankSummary,
  projectFacts,
  isProjectItem,
  isProjectQuote,
  type AnyQuoteItem,
  type QuoteProjectItem,
  type LegacyQuoteLineItem,
} from '@/app/admin/quotes/project-item-helpers';

// ── Types (mirror /api/dashboard/rep/search response) ───────────────────────

interface ArtworkMeta {
  path: string;
  name: string;
  isImage: boolean;
}

interface RepQuote {
  id: string;
  quote_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  company: string | null;
  items: AnyQuoteItem[];
  decoration: unknown;
  finishing: string[] | null;
  decoration_methods: string[] | null;
  notes: string | null;
  subtotal: number | null;
  status: string;
  created_at: string;
}

interface RepLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  message: string;
  quantity: string | null;
  status: string;
  is_spam: boolean;
  created_at: string;
  artwork: ArtworkMeta[];
}

interface SearchResponse {
  email: string;
  quotes: RepQuote[];
  leads: RepLead[];
  counts: { quotes: number; leads: number };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  quoted: 'bg-purple-50 text-purple-700 border-purple-200',
  converted: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  spam: 'bg-red-50 text-red-700 border-red-200',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ── Orange download button ──────────────────────────────────────────────────

function DownloadArtworkButton({ path, name }: { path: string; name: string }) {
  const href = `/api/dashboard/rep/artwork?path=${encodeURIComponent(path)}`;
  return (
    <div className="flex items-center gap-2">
      <FileText className="h-4 w-4 flex-shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
        {name}
      </span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-600"
      >
        <Download className="h-3.5 w-3.5" />
        Download Artwork
      </a>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
        STATUS_STYLES[status] || STATUS_STYLES.closed,
      )}
    >
      {status}
    </span>
  );
}

// ── Project block (mirrors /admin/quotes detail layout) ─────────────────────

function ProjectBlock({ project }: { project: QuoteProjectItem }) {
  const facts = projectFacts(project);
  const artworkName =
    project.artworkName ||
    (project.artworkPath ? project.artworkPath.split('/').pop() : null) ||
    'artwork';

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50/40 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {project.index + 1}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Project {project.index + 1} — {project.decorationLabel}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            ≈ {project.estimatedQuantity} pieces (low estimate)
          </p>
        </div>
        <Sparkles className="ml-auto h-5 w-5 text-brand-400" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Blank */}
        <div className="rounded-md bg-white p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Blank
          </p>
          <div className="mt-1.5 flex items-start gap-2 text-sm text-slate-700">
            <Shirt className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
            <span className="min-w-0 break-words">{blankSummary(project)}</span>
          </div>
        </div>

        {/* Decoration + method-specific facts (quantity, # colors, locations, ...) */}
        <div className="rounded-md bg-white p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Decoration
          </p>
          <div className="mt-1.5 flex items-start gap-2 text-sm text-slate-700">
            <Layers className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
            <span>{project.decorationLabel}</span>
          </div>
          <dl className="mt-2 grid gap-x-4 gap-y-1">
            {facts.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-2 text-xs"
              >
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-medium text-slate-700">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Design notes */}
      {project.designNotes && (
        <div className="mt-3 rounded-md bg-white p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Design notes
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
            {project.designNotes}
          </p>
        </div>
      )}

      {/* Per-project artwork */}
      {project.artworkPath && (
        <div className="mt-3 rounded-md bg-white p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Customer artwork
          </p>
          <DownloadArtworkButton
            path={project.artworkPath}
            name={artworkName}
          />
        </div>
      )}
    </div>
  );
}

// Legacy (non-project) line item fallback.
function LegacyItemRow({ item }: { item: LegacyQuoteLineItem }) {
  const title =
    [item.brandName, item.styleName].filter(Boolean).join(' ') || 'Item';
  const details = [item.colorName, item.sizeName].filter(Boolean).join(' / ');
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-stone-100 px-3 py-2 text-sm">
      <span className="min-w-0 truncate text-slate-700">
        {title}
        {details ? <span className="text-slate-400"> — {details}</span> : null}
      </span>
      {typeof item.quantity === 'number' && (
        <span className="flex-shrink-0 text-xs text-slate-500">
          {item.quantity.toLocaleString()} pcs
        </span>
      )}
    </li>
  );
}

function QuoteCardRO({ quote }: { quote: RepQuote }) {
  const items = quote.items || [];
  const asProjects = isProjectQuote(items);
  const methods = quote.decoration_methods?.length
    ? quote.decoration_methods
    : quote.finishing || [];

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-navy-800">
            {quote.quote_id}
          </span>
          <StatusBadge status={quote.status} />
        </div>
        <span className="text-xs text-slate-500">
          {formatDate(quote.created_at)}
        </span>
      </div>

      <div className="grid gap-1.5 text-sm text-slate-600 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          {quote.company || quote.customer_name}
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          {quote.customer_email}
        </div>
        {quote.customer_phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-400" />
            {quote.customer_phone}
          </div>
        )}
        {typeof quote.subtotal === 'number' && quote.subtotal > 0 && (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-400" />
            Est. ${quote.subtotal.toLocaleString()}
          </div>
        )}
      </div>

      {methods.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {methods.map((m, i) => (
            <span
              key={`${m}-${i}`}
              className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Quote-level request/notes (e.g. delivery requirements) */}
      {quote.notes && (
        <p className="mt-3 whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-sm text-slate-600">
          {quote.notes}
        </p>
      )}

      {/* Projects — one detailed block per project, artwork attached to its own project */}
      {items.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {asProjects
              ? `Projects (${items.length})`
              : `Items (${items.length})`}
          </p>

          {asProjects ? (
            <div className="space-y-3">
              {items.map((it, i) =>
                isProjectItem(it) ? (
                  <ProjectBlock key={i} project={it} />
                ) : null,
              )}
            </div>
          ) : (
            <ul className="space-y-1.5">
              {items.map((it, i) => (
                <LegacyItemRow key={i} item={it as LegacyQuoteLineItem} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function LeadCardRO({ lead }: { lead: RepLead }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-navy-800">
            {lead.name}
          </span>
          <StatusBadge status={lead.status} />
          {lead.is_spam && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              <AlertTriangle className="h-3 w-3" />
              spam
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500">
          {formatDate(lead.created_at)}
        </span>
      </div>

      <div className="grid gap-1.5 text-sm text-slate-600 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          {lead.email}
        </div>
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-400" />
            {lead.phone}
          </div>
        )}
        {lead.company && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            {lead.company}
          </div>
        )}
        {lead.service && (
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-slate-400" />
            {lead.service}
            {lead.quantity ? ` — ${lead.quantity}` : ''}
          </div>
        )}
      </div>

      {lead.message && (
        <p className="mt-3 whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-sm text-slate-600">
          {lead.message}
        </p>
      )}

      {lead.artwork.length > 0 && (
        <div className="mt-4 space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Customer Artwork
          </p>
          {lead.artwork.map((a) => (
            <DownloadArtworkButton key={a.path} path={a.path} name={a.name} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main client ─────────────────────────────────────────────────────────────

export function RepSearchClient() {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);

  const runSearch = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid client email.');
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dashboard/rep/search?email=${encodeURIComponent(trimmed)}`,
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Lookup failed. Please try again.');
      }
      setData(json as SearchResponse);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.');
      setData(null);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch();
  };

  const totalResults = (data?.counts.quotes || 0) + (data?.counts.leads || 0);

  return (
    <div>
      {/* Search field */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Search quote by client email..."
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-stone-300 bg-white pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {hasSearched && !error && data && (
        <div className="mt-8">
          {totalResults === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
              <Inbox className="mx-auto h-10 w-10 text-stone-300" />
              <h3 className="mt-3 text-lg font-semibold text-navy-800">
                No records found
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                No quotes or leads matched{' '}
                <span className="font-medium">{data.email}</span>.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <p className="text-sm text-slate-500">
                Found {data.counts.quotes} quote
                {data.counts.quotes === 1 ? '' : 's'} and {data.counts.leads}{' '}
                lead{data.counts.leads === 1 ? '' : 's'} for{' '}
                <span className="font-medium text-slate-700">{data.email}</span>.
              </p>

              {data.quotes.length > 0 && (
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-navy-800">
                    Quotes ({data.quotes.length})
                  </h2>
                  <div className="space-y-4">
                    {data.quotes.map((q) => (
                      <QuoteCardRO key={q.id} quote={q} />
                    ))}
                  </div>
                </section>
              )}

              {data.leads.length > 0 && (
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-navy-800">
                    Leads ({data.leads.length})
                  </h2>
                  <div className="space-y-4">
                    {data.leads.map((l) => (
                      <LeadCardRO key={l.id} lead={l} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {/* Idle state */}
      {!hasSearched && !error && (
        <div className="mt-8 rounded-xl border border-dashed border-stone-300 bg-white/50 p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-3 text-sm text-slate-500">
            Enter a client&apos;s email above to view their quotes and leads.
          </p>
        </div>
      )}
    </div>
  );
}
