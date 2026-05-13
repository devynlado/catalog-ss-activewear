import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrderSession } from '@/lib/order-session';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

/** Customer-friendly status labels. Admin uses more granular ones internally. */
function mapContactStatus(status: string | null, isSpam: boolean): string {
  if (isSpam) return 'closed';
  switch (status) {
    case 'new':
      return 'received';
    case 'contacted':
      return 'in_progress';
    case 'resolved':
      return 'resolved';
    case 'spam':
      return 'closed';
    default:
      return 'received';
  }
}

function mapQuoteStatus(status: string | null): string {
  switch (status) {
    case 'new':
      return 'received';
    case 'contacted':
      return 'in_progress';
    case 'quoted':
      return 'quoted';
    case 'converted':
      return 'accepted';
    case 'rejected':
    case 'expired':
      return 'closed';
    default:
      return 'received';
  }
}

// Some of the existing `source` strings are slug-y. Soften them for display
// rather than expose internal lead-routing names to customers.
const SOURCE_LABELS: Record<string, string> = {
  orders_inquiry: 'Quote request from My Orders',
  contact_page: 'Contact page',
  portfolio_quote_modal: 'Portfolio inquiry',
  services_page_inquiry_form: 'Services inquiry',
  streetwear: 'Streetwear inquiry',
  'service_screen-printing': 'Screen printing inquiry',
  'service_digital-screen-printing': 'Digital screen printing inquiry',
  'service_embroidery': 'Embroidery inquiry',
  'service_jumbo-screen-printing': 'Jumbo screen printing inquiry',
  'service_retail-finishing': 'Retail finishing inquiry',
  'service_live-screen-printing': 'Live screen printing inquiry',
  'lp_screen-printing': 'Screen printing landing page',
  'lp_embroidery': 'Embroidery landing page',
  'lp_screen-printing_exit_intent': 'Screen printing exit-intent form',
  'lp_embroidery_exit_intent': 'Embroidery exit-intent form',
};

function prettifySource(source: string | null): string {
  if (!source) return 'Contact form';
  if (SOURCE_LABELS[source]) return SOURCE_LABELS[source];
  return source
    .replace(/^lp_/, 'Landing page: ')
    .replace(/^service_/, 'Service: ')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type ContactRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  message: string | null;
  source: string | null;
  status: string | null;
  is_spam: boolean | null;
  quantity: string | null;
  visitor_source: string | null;
  variant: string | null;
  created_at: string;
};

type QuoteRow = {
  id: string;
  quote_id: string;
  customer_name: string | null;
  customer_email: string;
  customer_phone: string | null;
  company: string | null;
  items: unknown;
  decoration: unknown;
  finishing: unknown;
  notes: string | null;
  subtotal: number | null;
  status: string | null;
  created_at: string;
};

export async function GET() {
  const session = await getOrderSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const emailLower = session.email.toLowerCase();

  // Run both lookups in parallel. The admin views these tables case-sensitively
  // but new submissions are usually lowercased on insert; ilike covers both.
  const [contactsRes, quotesRes] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, name, email, phone, company, service, message, source, status, is_spam, quantity, visitor_source, variant, created_at')
      .ilike('email', emailLower)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('quotes')
      .select('id, quote_id, customer_name, customer_email, customer_phone, company, items, decoration, finishing, notes, subtotal, status, created_at')
      .ilike('customer_email', emailLower)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  if (contactsRes.error) {
    console.error('[Orders Inquiries] Contacts query error:', contactsRes.error);
  }
  if (quotesRes.error) {
    console.error('[Orders Inquiries] Quotes query error:', quotesRes.error);
  }

  const contactItems = ((contactsRes.data || []) as ContactRow[]).map((c) => ({
    id: c.id,
    type: 'contact' as const,
    referenceId: c.id.slice(0, 8).toUpperCase(),
    createdAt: c.created_at,
    sourceLabel: prettifySource(c.source),
    sourceRaw: c.source ?? null,
    status: mapContactStatus(c.status, !!c.is_spam),
    summary: buildContactSummary(c),
    quantity: c.quantity ?? null,
    service: c.service ?? null,
    company: c.company ?? null,
    fields: {
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      quantity: c.quantity,
      service: c.service,
      message: c.message,
      visitor_source: c.visitor_source,
    },
    // Quote-specific (null for contacts)
    items: null,
    decoration: null,
    finishing: null,
    subtotal: null,
  }));

  const quoteItems = ((quotesRes.data || []) as QuoteRow[]).map((q) => ({
    id: q.id,
    type: 'quote' as const,
    referenceId: q.quote_id || q.id.slice(0, 8).toUpperCase(),
    createdAt: q.created_at,
    sourceLabel: 'Detailed quote builder',
    sourceRaw: 'quote_builder',
    status: mapQuoteStatus(q.status),
    summary: buildQuoteSummary(q),
    quantity: null,
    service: null,
    company: q.company ?? null,
    fields: {
      name: q.customer_name,
      email: q.customer_email,
      phone: q.customer_phone,
      company: q.company,
      quantity: null,
      service: null,
      message: q.notes,
      visitor_source: null,
    },
    items: q.items,
    decoration: q.decoration,
    finishing: q.finishing,
    subtotal: q.subtotal,
  }));

  const inquiries = [...contactItems, ...quoteItems].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return NextResponse.json({
    inquiries,
    counts: {
      total: inquiries.length,
      contacts: contactItems.length,
      quotes: quoteItems.length,
    },
  });
}

function buildContactSummary(c: ContactRow): string {
  const parts: string[] = [];
  if (c.quantity) parts.push(`${c.quantity} pcs`);
  if (c.service) parts.push(c.service);
  if (parts.length) return parts.join(' · ');
  if (c.message) {
    const trimmed = c.message.trim().replace(/\s+/g, ' ');
    return trimmed.length > 100 ? `${trimmed.slice(0, 100)}…` : trimmed;
  }
  return 'No additional details';
}

function buildQuoteSummary(q: QuoteRow): string {
  const items = Array.isArray(q.items) ? q.items : [];
  const totalUnits = items.reduce((sum: number, item: { quantity?: number }) => {
    return sum + (typeof item?.quantity === 'number' ? item.quantity : 0);
  }, 0);
  const decoration = q.decoration as { type?: string } | null;

  const parts: string[] = [];
  if (items.length) parts.push(`${items.length} item${items.length === 1 ? '' : 's'}`);
  if (totalUnits) parts.push(`${totalUnits} pcs`);
  if (decoration?.type && decoration.type !== 'none') parts.push(decoration.type);

  return parts.length ? parts.join(' · ') : 'Quote details inside';
}
