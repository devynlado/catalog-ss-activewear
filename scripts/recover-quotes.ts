/**
 * One-off recovery: re-insert /quote submissions that were emailed to the
 * sales team but never saved to the `quotes` table.
 *
 * BACKGROUND
 * ----------
 * On 2026-09-12 the quote submit handler started writing `quotes.decoration_methods`
 * before that column existed in production (migration 046 wasn't applied yet).
 * Because the insert never checked `.error`, every quote silently failed to
 * persist while the Resend notification/confirmation emails still went out.
 * Result: no new rows in `quotes` (and nothing in /admin/quotes) from 2026-09-11
 * onward, even though the team kept receiving quote emails.
 *
 * This script reconstructs the missing rows from the *team notification* emails
 * ("New Quote Request - QT-… - …"), whose plaintext body is produced by
 * generateProjectQuoteNotificationText() and is therefore stable to parse. Rows
 * are re-created with the ORIGINAL quote_id and the email's original date so
 * reporting/trends stay accurate.
 *
 * TWO SOURCES
 * -----------
 *  A) Local folder of exported emails (default here — no Resend access needed):
 *       --dir=./quote-emails
 *     Supports .eml (recommended: keeps the original Date + decodes MIME/
 *     quoted-printable), .mbox (Google Takeout), and .txt (pasted plaintext).
 *     Export from info@garmentdecor.com — e.g. Gmail → "Download message" (.eml).
 *
 *  B) Resend API (only if you have a FULL-ACCESS key from the SAME account that
 *     sent the emails): set RESEND_READ_API_KEY in .env.local and omit --dir.
 *
 * SAFETY
 * ------
 * - DRY RUN by default: prints what it *would* insert and changes nothing.
 * - Pass --commit to actually write.
 * - Idempotent: upserts on the unique quote_id with ignoreDuplicates, and skips
 *   any quote_id already present in the table (e.g. your test submit today).
 *
 * USAGE
 * -----
 *   npx tsx scripts/recover-quotes.ts --dir=./quote-emails             # dry run
 *   npx tsx scripts/recover-quotes.ts --dir=./quote-emails --verbose   # + JSON
 *   npx tsx scripts/recover-quotes.ts --dir=./quote-emails --commit    # write
 *   npx tsx scripts/recover-quotes.ts --since=2026-09-11 --dir=...      # filter
 *
 * ENV (.env.local): NEXT_PUBLIC_SUPABASE_URL,
 *   SUPABASE_SERVICE_KEY (falls back to SUPABASE_SERVICE_ROLE_KEY),
 *   RESEND_READ_API_KEY (only for the Resend source).
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { promises as fs } from 'fs';
import path from 'path';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { deriveQuoteDecorationMethods } from '../lib/quote-form-options';

// ---------------------------------------------------------------------------
// Flags & env
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const VERBOSE = args.includes('--verbose');
const sinceArg = args.find((a) => a.startsWith('--since='))?.split('=')[1];
const SINCE = new Date(`${sinceArg ?? '2026-09-11'}T00:00:00Z`);
const DIR = args.find((a) => a.startsWith('--dir='))?.split('=')[1];
// Last-resort fixed date for created_at (YYYY-MM-DD). Only used when neither the
// quote_id nor the email header yields a date. Stamped at noon UTC.
const createdAtArg = args.find((a) => a.startsWith('--created-at='))?.split('=')[1];
const CREATED_AT_OVERRIDE = createdAtArg
  ? new Date(`${createdAtArg}T12:00:00Z`).toISOString()
  : null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
// Listing/reading emails via API needs a FULL-ACCESS (read-enabled) Resend key,
// from the SAME account that sent them. Only used when --dir is not provided.
const RESEND_API_KEY =
  process.env.RESEND_READ_API_KEY || process.env.RESEND_API_KEY;

if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
if (!SERVICE_KEY) {
  throw new Error(
    'Missing SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.local',
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Team notification subject shape (app/api/quote/submit/route.ts):
//   `New Quote Request - ${quoteId} - ${contact.name}`
const SUBJECT_PREFIX = 'New Quote Request - ';

// ---------------------------------------------------------------------------
// Reverse label maps — mirror the (non-exported) label maps in
// lib/emails/quote-project-emails.tsx and lib/quote-form-options.ts so we can
// turn the human-readable email back into canonical ids.
// ---------------------------------------------------------------------------
const DECOR_NAME_TO_ID: Record<string, string> = {
  'Screen Printing': 'screen-printing',
  Embroidery: 'embroidery',
  'Digital Screen Printing': 'digital',
  'Jumbo Print': 'jumbo',
  Finishing: 'finishing',
};
const LOCATION_ID: Record<string, string> = {
  Front: 'front',
  Back: 'back',
  'Left Sleeve': 'left-sleeve',
  'Right Sleeve': 'right-sleeve',
};
const STITCH_ID: Record<string, string> = {
  'Under 5,000 stitches': 'under5k',
  '5,000 - 7,500 stitches': '5k-7.5k',
  '7,500 - 10,000 stitches': '7.5k-10k',
  'Over 10,000 stitches': 'over10k',
};
const FINISHING_ID: Record<string, string> = {
  'Fold & Bag (Shirts)': 'fold-bag-shirts',
  'Fold & Bag (Fleece)': 'fold-bag-fleece',
  'Hang Tags': 'hang-tags',
  'Barcode / UPC': 'barcode',
  'Sewn Woven Labels': 'sewing-woven-labels',
};
const CATEGORY_ID: Record<string, string> = {
  'T-Shirts': 'tshirts',
  Sweatshirts: 'sweatshirts',
  Polos: 'polos',
  Headwear: 'headwear',
  Jackets: 'jackets',
  Bags: 'bags',
  Accessories: 'accessories',
  'Not sure — asked for a recommendation': 'unsure',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SerializedProject {
  type: 'project';
  index: number;
  blankSource: 'own' | 'catalog';
  blankOwnDescription: string | null;
  catalogCategory: string | null;
  catalogProduct: {
    styleId: number;
    styleName: string;
    brandName: string;
    slug: string;
  } | null;
  decorationMethod: string;
  decorationLabel: string;
  quantityTier: string | null;
  estimatedQuantity: number;
  colors: number | null;
  locations: string[] | null;
  isDark: boolean;
  isFleece: boolean;
  stitchCount: string | null;
  numLocations: number | null;
  finishingQuantity: number | null;
  finishingServices: string[] | null;
  designNotes: string | null;
}

interface ParsedQuote {
  quoteId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  company: string | null;
  eventDate: string | null;
  message: string | null;
  projects: SerializedProject[];
}

// A normalized email from either source: plaintext body + best-known metadata.
interface SourceRecord {
  label: string; // filename or subject, for logging
  createdAtIso: string | null; // original send date if known
  text: string; // plaintext body to parse
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
// The quote_id is `QT-${Date.now().toString(36).toUpperCase()}` (see
// app/api/quote/submit/route.ts), so the exact original submission time is
// embedded in it. Decode base36 → ms → Date. Returns null if it doesn't look
// like a plausible timestamp.
function dateFromQuoteId(quoteId: string): string | null {
  const m = quoteId.match(/^QT-([0-9A-Za-z]+)$/);
  if (!m) return null;
  const ms = parseInt(m[1].toLowerCase(), 36);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  if (y < 2020 || y > 2035) return null; // sanity bound
  return d.toISOString();
}

function lowBoundFromTier(tier: string): number {
  const first = tier.split('-')[0]?.replace(/\D/g, '');
  const n = parseInt(first ?? '0', 10);
  return Number.isFinite(n) ? n : 0;
}

function mapList(raw: string, table: Record<string, string>): string[] | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '—') return null;
  const out = trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((label) => table[label] ?? label);
  return out.length ? out : null;
}

// ---------------------------------------------------------------------------
// Minimal MIME / .eml decoding (no extra deps)
// ---------------------------------------------------------------------------
function decodeQuotedPrintable(input: string): string {
  const noSoft = input.replace(/=\r?\n/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < noSoft.length; i++) {
    const c = noSoft[i];
    if (c === '=') {
      const hex = noSoft.substr(i + 1, 2);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(noSoft.charCodeAt(i));
  }
  return Buffer.from(bytes).toString('utf8');
}

function decodeCTE(body: string, cte: string): string {
  if (cte === 'quoted-printable') return decodeQuotedPrintable(body);
  if (cte === 'base64')
    return Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf8');
  return body; // 7bit / 8bit / binary / none
}

function splitHeadersBody(raw: string): { headerBlock: string; body: string } {
  const m = raw.match(/\r?\n\r?\n/);
  if (!m || m.index === undefined) return { headerBlock: '', body: raw };
  return {
    headerBlock: raw.slice(0, m.index),
    body: raw.slice(m.index + m[0].length),
  };
}

function parseHeaders(headerBlock: string): Record<string, string> {
  const unfolded = headerBlock.replace(/\r?\n[ \t]+/g, ' ');
  const map: Record<string, string> = {};
  for (const line of unfolded.split(/\r?\n/)) {
    const m = line.match(/^([^:]+):\s?(.*)$/);
    if (m) map[m[1].toLowerCase()] = m[2];
  }
  return map;
}

// Recursively extract the text/plain body of a MIME entity. Returns null when
// only text/html (or nothing parseable) is present.
function entityText(raw: string): string | null {
  const { headerBlock, body } = splitHeadersBody(raw);
  const h = parseHeaders(headerBlock);
  const ct = (h['content-type'] ?? 'text/plain').toLowerCase();

  if (ct.includes('multipart/')) {
    const bm = (h['content-type'] ?? '').match(/boundary="?([^";]+)"?/i);
    if (!bm) return null;
    const marker = `--${bm[1]}`;
    const segs = body.split(marker).slice(1);
    for (let seg of segs) {
      if (seg.startsWith('--')) break; // closing boundary
      seg = seg.replace(/^\r?\n/, '');
      const t = entityText(seg);
      if (t != null) return t;
    }
    return null;
  }
  if (ct.includes('text/plain')) {
    return decodeCTE(body, (h['content-transfer-encoding'] ?? '').toLowerCase());
  }
  return null; // text/html or other
}

function looksLikeMime(content: string): boolean {
  if (!/\r?\n\r?\n/.test(content)) return false;
  return /^(Received|Delivered-To|Return-Path|Message-ID|MIME-Version|Content-Type|Date|Subject|From|To):/im.test(
    content.slice(0, 4000),
  );
}

// Turn one raw message (eml/plaintext) into a SourceRecord.
function messageToRecord(label: string, raw: string): SourceRecord {
  if (looksLikeMime(raw)) {
    const { headerBlock } = splitHeadersBody(raw);
    const h = parseHeaders(headerBlock);
    const text = entityText(raw) ?? '';
    const dateHdr = h['date'];
    let iso: string | null = null;
    if (dateHdr) {
      const d = new Date(dateHdr);
      if (!Number.isNaN(d.getTime())) iso = d.toISOString();
    }
    return { label, createdAtIso: iso, text };
  }
  // Plain text paste — no headers, no reliable date.
  return { label, createdAtIso: null, text: raw };
}

// Split an mbox file into individual messages.
function splitMbox(content: string): string[] {
  const parts = content.split(/\r?\n(?=From )/);
  return parts
    .map((p) => p.replace(/^From [^\n]*\r?\n/, ''))
    .filter((p) => p.trim().length > 0);
}

// ---------------------------------------------------------------------------
// Notification text parsing
// ---------------------------------------------------------------------------
function parseProjectBlock(
  headerLabel: string,
  body: string,
  index: number,
): SerializedProject {
  const decorationLabel = headerLabel.trim();
  const decorationMethod = DECOR_NAME_TO_ID[decorationLabel] ?? decorationLabel;

  const facts: Record<string, string> = {};
  let designNotes: string | null = null;

  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*Design notes:\s*$/.test(line)) {
      const noteLines: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        if (/^\s{2,}\S/.test(lines[j]) || lines[j].trim() === '') {
          noteLines.push(lines[j].replace(/^\s{4}/, ''));
        } else {
          break;
        }
      }
      designNotes = noteLines.join('\n').trim() || null;
      break; // design notes is always last in the block
    }
    const m = line.match(/^\s{2}([^:]+):\s?(.*)$/);
    if (m) facts[m[1].trim()] = m[2].trim();
  }

  // --- Blank source ---
  let blankSource: 'own' | 'catalog' = 'catalog';
  let blankOwnDescription: string | null = null;
  let catalogCategory: string | null = null;
  let catalogProduct: SerializedProject['catalogProduct'] = null;

  const blank = facts['Blank'] ?? '';
  if (blank.startsWith('Customer supplies blanks')) {
    blankSource = 'own';
    const dash = blank.split('—');
    blankOwnDescription = dash.length > 1 ? dash.slice(1).join('—').trim() : null;
  } else if (blank.startsWith('From catalog category:')) {
    blankSource = 'catalog';
    const label = blank.replace('From catalog category:', '').trim();
    catalogCategory = CATEGORY_ID[label] ?? label;
  } else if (blank.startsWith('From catalog:')) {
    blankSource = 'catalog';
    const m = blank.match(
      /^From catalog:\s*(.+?)\s*\((https?:\/\/[^)]*\/product\/([^)]+))\)/,
    );
    if (m) {
      catalogProduct = {
        styleId: 0,
        styleName: m[1].trim(),
        brandName: '',
        slug: decodeURIComponent(m[3].trim()),
      };
    } else {
      catalogProduct = {
        styleId: 0,
        styleName: blank.replace('From catalog:', '').trim(),
        brandName: '',
        slug: '',
      };
    }
  } else if (blank.startsWith('From catalog')) {
    blankSource = 'catalog';
  }

  // --- Quantity / finishing ---
  let quantityTier: string | null = null;
  let estimatedQuantity = 0;
  let finishingQuantity: number | null = null;
  let finishingServices: string[] | null = null;

  const qty = facts['Quantity'] ?? '';
  if (decorationMethod === 'finishing') {
    const n = parseInt(qty.replace(/\D/g, ''), 10);
    finishingQuantity = Number.isFinite(n) ? n : 0;
    estimatedQuantity = finishingQuantity ?? 0;
    finishingServices = mapList(facts['Services'] ?? '', FINISHING_ID);
  } else if (qty && qty !== '—') {
    quantityTier = qty.replace(/pieces\s*$/i, '').trim();
    estimatedQuantity = lowBoundFromTier(quantityTier);
  }

  // --- Method-specific facts ---
  const colors = facts['# Colors']
    ? parseInt(facts['# Colors'].replace(/\D/g, ''), 10) || null
    : null;
  const locations = facts['Locations']
    ? mapList(facts['Locations'], LOCATION_ID)
    : null;
  const isDark = Boolean(facts['Garment']);
  const isFleece = Boolean(facts['Fabric']);
  const stitchCount = facts['Stitch count']
    ? STITCH_ID[facts['Stitch count']] ?? facts['Stitch count']
    : null;
  const numLocations = facts['# Locations']
    ? parseInt(facts['# Locations'].replace(/\D/g, ''), 10) || null
    : null;

  return {
    type: 'project',
    index,
    blankSource,
    blankOwnDescription,
    catalogCategory,
    catalogProduct,
    decorationMethod,
    decorationLabel,
    quantityTier,
    estimatedQuantity,
    colors,
    locations,
    isDark,
    isFleece,
    stitchCount,
    numLocations,
    finishingQuantity,
    finishingServices,
    designNotes,
  };
}

function parseNotificationText(text: string): ParsedQuote | null {
  const t = text.replace(/\r\n/g, '\n');
  const idMatch = t.match(/NEW QUOTE REQUEST\s*-\s*(QT-[A-Z0-9]+)/i);
  if (!idMatch) return null; // not the project-form notification we expect
  const quoteId = idMatch[1];

  const grab = (label: string): string | null => {
    const m = t.match(new RegExp(`^${label}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : null;
  };

  const customerName = grab('Name') ?? '';
  const customerEmail = grab('Email') ?? '';
  const customerPhone = grab('Phone');
  const company = grab('Company');
  const eventDate = grab('Need-by');

  let message: string | null = null;
  const noteMatch = t.match(/CUSTOMER NOTE:\n([\s\S]*?)\n+PROJECT 1 /);
  if (noteMatch) message = noteMatch[1].trim() || null;

  const projects: SerializedProject[] = [];
  const blockRe =
    /PROJECT\s+(\d+)\s+—\s+(.+?)\n([\s\S]*?)(?=\nPROJECT\s+\d+\s+—\s|\n-{3,}\n|$)/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(t)) !== null) {
    const idx = parseInt(m[1], 10) - 1;
    projects.push(
      parseProjectBlock(m[2], m[3], Number.isFinite(idx) ? idx : projects.length),
    );
  }

  if (!customerEmail || !customerName || projects.length === 0) return null;

  return {
    quoteId,
    customerName,
    customerEmail,
    customerPhone,
    company,
    eventDate,
    message,
    projects,
  };
}

// ---------------------------------------------------------------------------
// Source A: local folder of exported emails
// ---------------------------------------------------------------------------
async function loadFromDir(dir: string): Promise<SourceRecord[]> {
  const abs = path.resolve(dir);
  const entries = await fs.readdir(abs, { withFileTypes: true });
  const records: SourceRecord[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!['.eml', '.txt', '.mbox', '.msg'].includes(ext)) continue;
    const full = path.join(abs, entry.name);
    const content = await fs.readFile(full, 'utf8');

    if (ext === '.mbox') {
      const msgs = splitMbox(content);
      msgs.forEach((msg, i) =>
        records.push(messageToRecord(`${entry.name}#${i + 1}`, msg)),
      );
    } else {
      records.push(messageToRecord(entry.name, content));
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Source B: Resend API (requires a read-enabled key)
// ---------------------------------------------------------------------------
async function loadFromResend(): Promise<SourceRecord[]> {
  if (!RESEND_API_KEY) {
    throw new Error(
      'No source: provide --dir=<folder of exported emails>, or set ' +
        'RESEND_READ_API_KEY (full-access key from the sending account).',
    );
  }
  const resend = new Resend(RESEND_API_KEY);

  // List notification emails newest → older until before SINCE.
  const summaries: Array<{ id: string; subject: string; created_at: string }> = [];
  let after: string | undefined;
  let stop = false;
  for (let page = 0; page < 100 && !stop; page++) {
    const opts: { limit: number; after?: string } = { limit: 100 };
    if (after) opts.after = after;
    const { data, error } = await resend.emails.list(opts);
    if (error) {
      const err = error as { name?: string; message?: string };
      if (err.name === 'restricted_api_key') {
        throw new Error(
          'Resend key is sending-only and cannot list emails. Use --dir with ' +
            'exported emails instead, or set a Full-access RESEND_READ_API_KEY.',
        );
      }
      throw new Error(`Resend list failed: ${JSON.stringify(error)}`);
    }
    const items = (data?.data ?? []) as Array<{
      id: string;
      subject?: string | null;
      created_at?: string | null;
    }>;
    if (items.length === 0) break;
    for (const e of items) {
      const created = e.created_at ? new Date(e.created_at.replace(' ', 'T')) : null;
      if (created && created < SINCE) {
        stop = true;
        break;
      }
      if ((e.subject ?? '').startsWith(SUBJECT_PREFIX)) {
        summaries.push({
          id: e.id,
          subject: e.subject ?? '',
          created_at: e.created_at ?? '',
        });
      }
    }
    if (!(data as { has_more?: boolean } | null)?.has_more) break;
    after = items[items.length - 1]?.id;
    if (!after) break;
  }

  const records: SourceRecord[] = [];
  for (const s of summaries) {
    const { data: full, error } = await resend.emails.get(s.id);
    if (error || !full) continue;
    const text = (full as { text?: string | null }).text ?? '';
    const iso = s.created_at
      ? new Date(s.created_at.replace(' ', 'T')).toISOString()
      : null;
    records.push({ label: s.subject || s.id, createdAtIso: iso, text });
  }
  return records;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const source = DIR ? `folder "${DIR}"` : 'Resend API';
  console.log('='.repeat(72));
  console.log(`Quote recovery — ${COMMIT ? 'COMMIT (will write)' : 'DRY RUN (no writes)'}`);
  console.log(`Source: ${source}`);
  console.log(`Since : ${SINCE.toISOString()} (applies to Resend source)`);
  console.log('='.repeat(72));

  // 1) Existing quote_ids so we never duplicate.
  const existing = new Set<string>();
  {
    const { data, error } = await supabase.from('quotes').select('quote_id');
    if (error) throw new Error(`Failed to read existing quotes: ${error.message}`);
    for (const r of data ?? []) existing.add((r as { quote_id: string }).quote_id);
  }
  console.log(`Existing quotes in DB: ${existing.size}`);

  // 2) Acquire raw email records from the chosen source.
  const records = DIR ? await loadFromDir(DIR) : await loadFromResend();
  console.log(`Email records read: ${records.length}`);

  const toInsert: Array<{
    row: Record<string, unknown>;
    parsed: ParsedQuote;
    dateSource: 'quote_id' | 'email' | 'override' | 'now()';
  }> = [];
  const skippedExisting: string[] = [];
  const unparseable: string[] = [];
  const seen = new Set<string>();

  // 3) Parse each record.
  for (const rec of records) {
    const parsed = rec.text ? parseNotificationText(rec.text) : null;
    if (!parsed) {
      unparseable.push(rec.label);
      continue;
    }
    if (seen.has(parsed.quoteId)) continue; // de-dupe within this run
    seen.add(parsed.quoteId);
    if (existing.has(parsed.quoteId)) {
      skippedExisting.push(parsed.quoteId);
      continue;
    }

    const decorationMethods = deriveQuoteDecorationMethods(parsed.projects, null);
    const row: Record<string, unknown> = {
      quote_id: parsed.quoteId,
      customer_name: parsed.customerName,
      customer_email: parsed.customerEmail,
      customer_phone: parsed.customerPhone,
      company: parsed.company,
      items: parsed.projects,
      decoration: null,
      finishing: null,
      notes: parsed.message,
      subtotal: 0,
      status: 'new',
      visitor_source: null,
      decoration_methods: decorationMethods.length ? decorationMethods : null,
    };
    // Timestamp priority: the quote_id encodes the exact submit time, so it wins.
    // Then the email header date, then a manual --created-at, then DB now().
    const fromId = dateFromQuoteId(parsed.quoteId);
    const createdAtIso = fromId ?? rec.createdAtIso ?? CREATED_AT_OVERRIDE ?? null;
    const dateSource: 'quote_id' | 'email' | 'override' | 'now()' = fromId
      ? 'quote_id'
      : rec.createdAtIso
        ? 'email'
        : CREATED_AT_OVERRIDE
          ? 'override'
          : 'now()';
    if (createdAtIso) {
      row.created_at = createdAtIso;
      row.updated_at = createdAtIso;
    }

    toInsert.push({ row, parsed, dateSource });
  }

  // 4) Report.
  console.log('');
  console.log(`Ready to recover : ${toInsert.length}`);
  console.log(
    `Already in DB    : ${skippedExisting.length}` +
      (skippedExisting.length ? ` (${skippedExisting.join(', ')})` : ''),
  );
  console.log(
    `Unparseable      : ${unparseable.length}` +
      (unparseable.length ? ` (${unparseable.join(' | ')})` : ''),
  );
  console.log('');

  for (const { row, parsed, dateSource } of toInsert) {
    const methods = (row.decoration_methods as string[] | null)?.join(', ') ?? '—';
    const when = row.created_at ? String(row.created_at).slice(0, 10) : 'now()';
    const flag = dateSource === 'now()' ? '  ⚠ no date available — will default to now()' : `  (date: ${dateSource})`;
    console.log(
      `• ${row.quote_id}  ${when}  ${parsed.customerName} <${parsed.customerEmail}>  ` +
        `[${parsed.projects.length} project(s): ${methods}]${flag}`,
    );
    if (VERBOSE) console.log(JSON.stringify(row, null, 2));
  }

  // 5) Write (only with --commit).
  if (!COMMIT) {
    console.log('');
    console.log('DRY RUN complete. Re-run with --commit to insert these rows.');
    return;
  }
  if (toInsert.length === 0) {
    console.log('Nothing to insert.');
    return;
  }

  console.log('');
  console.log(`Inserting ${toInsert.length} quote(s)…`);
  let ok = 0;
  let failed = 0;
  for (const { row } of toInsert) {
    const { error } = await supabase
      .from('quotes')
      .upsert(row, { onConflict: 'quote_id', ignoreDuplicates: true });
    if (error) {
      failed++;
      console.error(`  ✗ ${row.quote_id}: ${error.message}`);
    } else {
      ok++;
      console.log(`  ✓ ${row.quote_id}`);
    }
  }
  console.log('');
  console.log(`Done. Inserted/kept: ${ok}, failed: ${failed}.`);
}

main().catch((err) => {
  console.error('Recovery failed:', err);
  process.exit(1);
});
