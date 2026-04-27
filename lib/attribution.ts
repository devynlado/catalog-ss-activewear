const COOKIE_NAME = 'gd_attribution';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export type VisitorSource =
  | 'Direct'
  | 'Google Ads'
  | 'Organic Search'
  | 'Organic Social'
  | 'Organic Shopping'
  | 'Referral'
  | 'Cross-network'
  | 'Other';

export interface AttributionData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  referrer?: string;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Captures UTM params and gclid from the current URL on first visit.
 * Stores as a first-touch 30-day cookie — does NOT overwrite if already set.
 * Call this once on app mount (e.g., in root layout client component).
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;

  // First-touch: don't overwrite existing attribution
  if (getCookie(COOKIE_NAME)) return;

  const params = new URLSearchParams(window.location.search);
  const utm_source = params.get('utm_source');
  const utm_medium = params.get('utm_medium');
  const utm_campaign = params.get('utm_campaign');
  const utm_term = params.get('utm_term');
  const utm_content = params.get('utm_content');
  const gclid = params.get('gclid');

  const referrer = document.referrer || '';

  if (!utm_source && !gclid && !referrer) return;

  const data: AttributionData = {};
  if (utm_source) data.utm_source = utm_source;
  if (utm_medium) data.utm_medium = utm_medium;
  if (utm_campaign) data.utm_campaign = utm_campaign;
  if (utm_term) data.utm_term = utm_term;
  if (utm_content) data.utm_content = utm_content;
  if (gclid) data.gclid = gclid;
  if (referrer) data.referrer = referrer;

  setCookie(COOKIE_NAME, JSON.stringify(data), COOKIE_MAX_AGE);
}

/**
 * Reads the stored attribution data from the cookie.
 * Returns empty object if no attribution data exists.
 */
export function getAttribution(): AttributionData {
  if (typeof window === 'undefined') return {};

  const raw = getCookie(COOKIE_NAME);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as AttributionData;
  } catch {
    return {};
  }
}

const SEARCH_ENGINES = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex'];
const SOCIAL_NETWORKS = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'pinterest', 'youtube', 'reddit', 'threads', 'x.com'];

function domainFromUrl(url: string): string {
  try { return new URL(url).hostname.replace('www.', '').toLowerCase(); }
  catch { return ''; }
}

/**
 * Classifies the visitor's traffic source into a GA4-style channel label.
 * Uses first-touch attribution data (UTM params, gclid, referrer).
 */
export function getVisitorSource(): VisitorSource {
  const attr = getAttribution();
  const medium = (attr.utm_medium || '').toLowerCase();
  const source = (attr.utm_source || '').toLowerCase();
  const referrerDomain = attr.referrer ? domainFromUrl(attr.referrer) : '';

  if (attr.gclid) return 'Google Ads';
  if (medium === 'cpc' || medium === 'ppc' || medium === 'paid') return 'Google Ads';
  if (medium === 'cross-network') return 'Cross-network';

  if (medium === 'organic' && source.includes('shopping')) return 'Organic Shopping';
  if (attr.utm_campaign?.toLowerCase().includes('shopping') && medium === 'organic') return 'Organic Shopping';

  if (medium === 'organic' || medium === 'organic search') return 'Organic Search';
  if (source && SEARCH_ENGINES.some(se => source.includes(se)) && !medium) return 'Organic Search';

  if (medium === 'social' || medium === 'organic social') return 'Organic Social';
  if (source && SOCIAL_NETWORKS.some(sn => source.includes(sn))) return 'Organic Social';

  if (source || medium) return 'Other';

  if (referrerDomain) {
    if (SEARCH_ENGINES.some(se => referrerDomain.includes(se))) return 'Organic Search';
    if (SOCIAL_NETWORKS.some(sn => referrerDomain.includes(sn))) return 'Organic Social';
    if (referrerDomain.includes('shopping.google')) return 'Organic Shopping';
    return 'Referral';
  }

  return 'Direct';
}
