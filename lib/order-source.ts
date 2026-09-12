// Shared "visitor source" (attribution channel) classifier for orders.
//
// A single source of truth used by:
//   - app/admin/orders/OrderCard.tsx  -> render the source badge
//   - app/admin/orders/page.tsx       -> filter orders by visitor source
//
// The classifier derives a channel from the attribution columns that already
// live on the `orders` table (utm_source / utm_medium / gclid / referrer).

export interface OrderAttribution {
  utm_source?: string | null;
  utm_medium?: string | null;
  gclid?: string | null;
  referrer?: string | null;
}

// Granular channel key used for the badge. `null`-source orders resolve to
// 'direct'.
export type OrderSourceKey =
  | 'google_ads'
  | 'organic_search'
  | 'ai'
  | 'social'
  | 'referral'
  | 'email'
  | 'direct'
  | 'other';

export interface OrderSource {
  key: OrderSourceKey;
  label: string;
  color: string;
}

// Filter values exposed in the admin UI (`?source=` query param). These group
// the granular keys above into the buckets the business cares about.
export type OrderSourceFilter =
  | 'organic_search'
  | 'google_ads'
  | 'referral'
  | 'direct'
  | 'ai'
  | 'others';

export const orderSourceFilterOptions: { id: '' | OrderSourceFilter; label: string }[] = [
  { id: '', label: 'All Sources' },
  { id: 'organic_search', label: 'Organic Search' },
  { id: 'google_ads', label: 'Google Ads' },
  { id: 'referral', label: 'Referral' },
  { id: 'direct', label: 'Direct' },
  { id: 'ai', label: 'ChatGPT / AI' },
  { id: 'others', label: 'Others' },
];

const SEARCH_ENGINES = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex'];
const SOCIAL_NETWORKS = ['facebook', 'instagram', 'tiktok', 'twitter', 'linkedin', 'pinterest', 'youtube', 'reddit', 'x.com'];
const AI_CHATBOTS = ['chatgpt', 'chat.openai', 'openai', 'perplexity', 'gemini', 'copilot', 'claude.ai'];

function domainFromUrl(url: string): string {
  try { return new URL(url).hostname.replace('www.', '').toLowerCase(); }
  catch { return url.toLowerCase(); }
}

/**
 * Classify an order into a visitor-source channel for display (badge).
 * Always returns a value; orders with no attribution resolve to 'direct'.
 */
export function classifyOrderSource(order: OrderAttribution): OrderSource {
  const src = (order.utm_source || '').toLowerCase();
  const med = (order.utm_medium || '').toLowerCase();

  if (order.gclid || med === 'cpc' || med === 'ppc' || med === 'paid')
    return { key: 'google_ads', label: 'Google Ads', color: 'bg-blue-100 text-blue-700' };
  if (med === 'ai' || AI_CHATBOTS.some(ai => src.includes(ai)))
    return { key: 'ai', label: 'ChatGPT / AI', color: 'bg-teal-100 text-teal-700' };
  if (med === 'organic' || src === 'google' || src === 'bing' || src === 'yahoo')
    return { key: 'organic_search', label: 'Organic Search', color: 'bg-green-100 text-green-700' };
  if (med === 'social' || SOCIAL_NETWORKS.includes(src))
    return { key: 'social', label: 'Social', color: 'bg-purple-100 text-purple-700' };
  if (med === 'referral')
    return { key: 'referral', label: 'Referral', color: 'bg-amber-100 text-amber-700' };
  if (med === 'email')
    return { key: 'email', label: 'Email', color: 'bg-sky-100 text-sky-700' };
  if (src || med)
    return { key: 'other', label: src || med, color: 'bg-stone-100 text-stone-600' };

  // Fallback: classify using referrer domain when no UTM/gclid data.
  if (order.referrer) {
    const domain = domainFromUrl(order.referrer);
    if (AI_CHATBOTS.some(ai => domain.includes(ai)))
      return { key: 'ai', label: 'ChatGPT / AI', color: 'bg-teal-100 text-teal-700' };
    if (SEARCH_ENGINES.some(se => domain.includes(se)))
      return { key: 'organic_search', label: 'Organic Search', color: 'bg-green-100 text-green-700' };
    if (SOCIAL_NETWORKS.some(sn => domain.includes(sn)))
      return { key: 'social', label: 'Social', color: 'bg-purple-100 text-purple-700' };
    return { key: 'referral', label: 'Referral', color: 'bg-amber-100 text-amber-700' };
  }

  return { key: 'direct', label: 'Direct', color: 'bg-stone-100 text-stone-500' };
}

/**
 * Does an order match the selected visitor-source filter?
 * The 'others' bucket captures social / email / uncategorized channels.
 *
 * Uses the stored `visitor_source` key when present (populated at write time /
 * backfilled), falling back to live classification for safety.
 */
export function matchesSourceFilter(
  order: OrderAttribution & { visitor_source?: string | null },
  filter: string,
): boolean {
  if (!filter) return true;
  const key = order.visitor_source || classifyOrderSource(order).key;

  switch (filter as OrderSourceFilter) {
    case 'organic_search': return key === 'organic_search';
    case 'google_ads': return key === 'google_ads';
    case 'referral': return key === 'referral';
    case 'direct': return key === 'direct';
    case 'ai': return key === 'ai';
    case 'others': return key === 'social' || key === 'email' || key === 'other';
    default: return true;
  }
}

/**
 * Maps a UI filter value to the stored `visitor_source` keys it should match,
 * for building a server-side (indexed) Supabase query.
 *
 * `includeNull` is true for 'direct' so orders that predate attribution (and
 * therefore have no stored key) are still treated as Direct — consistent with
 * how the OrderCard badge renders no-attribution orders.
 */
export function sourceFilterKeys(
  filter: string,
): { keys: OrderSourceKey[]; includeNull: boolean } | null {
  switch (filter as OrderSourceFilter) {
    case 'organic_search': return { keys: ['organic_search'], includeNull: false };
    case 'google_ads': return { keys: ['google_ads'], includeNull: false };
    case 'referral': return { keys: ['referral'], includeNull: false };
    case 'ai': return { keys: ['ai'], includeNull: false };
    case 'direct': return { keys: ['direct'], includeNull: true };
    case 'others': return { keys: ['social', 'email', 'other'], includeNull: false };
    default: return null;
  }
}
