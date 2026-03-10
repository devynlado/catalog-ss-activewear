const COOKIE_NAME = 'gd_attribution';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export interface AttributionData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
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
  const gclid = params.get('gclid');

  if (!utm_source && !gclid) return;

  const data: AttributionData = {};
  if (utm_source) data.utm_source = utm_source;
  if (utm_medium) data.utm_medium = utm_medium;
  if (utm_campaign) data.utm_campaign = utm_campaign;
  if (gclid) data.gclid = gclid;

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
