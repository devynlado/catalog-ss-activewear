/**
 * Helpers for the public LiveChat widget's "visitor context" (Phase 2 #2).
 *
 * These compute the background info we attach to a LiveChat session so the sales
 * rep sees it in the agent app the moment a chat starts:
 *   - acquisition channel (grouped referrer/UTM),
 *   - a breadcrumb of recently visited in-site paths.
 *
 * All state is kept in `sessionStorage` (per-tab, cleared when the tab closes),
 * which matches the notion of "this visit". Everything here is client-only and
 * guards against SSR / disabled storage.
 */

const CHANNEL_KEY = 'gd_lc_channel';
const TRAIL_KEY = 'gd_lc_trail';
// current page + 3 previous = 4 entries retained.
const TRAIL_MAX = 4;

// Acquisition channels, in the exact wording shown to the rep.
export type AcquisitionChannel =
  | 'Google Ads'
  | 'Organic Search'
  | 'Organic Social'
  | 'ChatGPT'
  | 'Direct'
  | 'Referral';

// Host fragments (matched as substrings against the referrer hostname). Order of
// the CHECKS below matters more than the lists — AI is checked before search so
// `gemini.google.com` is not mis-classified as Google search.
const AI_HOSTS = [
  'chatgpt.com',
  'chat.openai.com',
  'openai.com',
  'perplexity.ai',
  'gemini.google.com',
  'bard.google.com',
  'copilot.microsoft.com',
  'claude.ai',
  'poe.com',
];

const SOCIAL_HOSTS = [
  'facebook.com',
  'fb.com',
  'instagram.com',
  't.co',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'linkedin.com',
  'lnkd.in',
  'pinterest.',
  'reddit.com',
  'youtube.com',
  'youtu.be',
  'snapchat.com',
  'threads.net',
];

const SEARCH_HOSTS = [
  'google.',
  'bing.com',
  'yahoo.',
  'duckduckgo.com',
  'ecosia.org',
  'baidu.com',
  'yandex.',
  'ask.com',
  'aol.com',
];

// utm_source values that map onto our grouped channels.
const AI_SOURCES = ['chatgpt', 'openai', 'perplexity', 'gemini', 'bard', 'copilot', 'claude'];
const SOCIAL_SOURCES = [
  'facebook',
  'instagram',
  'tiktok',
  'linkedin',
  'twitter',
  'x',
  'pinterest',
  'reddit',
  'youtube',
  'snapchat',
];

function hostMatches(host: string, fragments: string[]): boolean {
  if (!host) return false;
  return fragments.some((f) => host.includes(f));
}

function refHostname(): string {
  if (typeof document === 'undefined' || !document.referrer) return '';
  try {
    return new URL(document.referrer).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Classify the current acquisition source into one of the six grouped channels.
 * Evaluated against the URL params + document.referrer of the *current* page;
 * callers should cache the first result for the session (see getAcquisitionChannel).
 */
function detectChannel(): AcquisitionChannel {
  if (typeof window === 'undefined') return 'Direct';

  const params = new URLSearchParams(window.location.search);
  const utmSource = (params.get('utm_source') || '').toLowerCase();
  const utmMedium = (params.get('utm_medium') || '').toLowerCase();

  // 1) Paid (Google Ads) — click ids or paid-search mediums win outright.
  const hasAdClickId =
    params.has('gclid') ||
    params.has('gad_source') ||
    params.has('gclsrc') ||
    params.has('wbraid') ||
    params.has('gbraid');
  const paidMediums = ['cpc', 'ppc', 'paid', 'paidsearch', 'paid_search', 'paid-search'];
  if (hasAdClickId || paidMediums.includes(utmMedium)) {
    return 'Google Ads';
  }

  const host = refHostname();
  const ownHost = window.location.hostname.toLowerCase();
  const isInternalRef = !host || host === ownHost || host.endsWith(`.${ownHost}`);

  // 2) AI assistants — all grouped under the "ChatGPT" label (checked first so
  //    AI subdomains of search providers aren't swallowed by search detection).
  if (hostMatches(host, AI_HOSTS) || AI_SOURCES.includes(utmSource)) {
    return 'ChatGPT';
  }

  // 3) Organic social.
  if (hostMatches(host, SOCIAL_HOSTS) || utmMedium === 'social' || SOCIAL_SOURCES.includes(utmSource)) {
    return 'Organic Social';
  }

  // 4) Organic search.
  if (hostMatches(host, SEARCH_HOSTS) || utmMedium === 'organic') {
    return 'Organic Search';
  }

  // 5) No usable external referrer.
  if (isInternalRef) {
    // Tagged with a campaign but not matched above → treat as referral, else direct.
    return utmSource ? 'Referral' : 'Direct';
  }

  // 6) Any other external site.
  return 'Referral';
}

/**
 * The visit's acquisition channel, captured once (first-touch) and reused for
 * the rest of the session — referrer/UTM are only reliable on the landing page.
 */
export function getAcquisitionChannel(): AcquisitionChannel {
  try {
    const cached = sessionStorage.getItem(CHANNEL_KEY);
    if (cached) return cached as AcquisitionChannel;
  } catch {
    /* storage unavailable */
  }
  const channel = detectChannel();
  try {
    sessionStorage.setItem(CHANNEL_KEY, channel);
  } catch {
    /* storage unavailable */
  }
  return channel;
}

/** Append a visited path to the per-tab breadcrumb (dedupes consecutive repeats). */
export function recordPath(path: string): void {
  if (!path) return;
  try {
    const raw = sessionStorage.getItem(TRAIL_KEY);
    const trail: string[] = raw ? JSON.parse(raw) : [];
    if (trail[trail.length - 1] === path) return;
    trail.push(path);
    while (trail.length > TRAIL_MAX) trail.shift();
    sessionStorage.setItem(TRAIL_KEY, JSON.stringify(trail));
  } catch {
    /* storage unavailable */
  }
}

/** The up-to-3 paths visited before the current one (oldest → newest). */
export function getPreviousPaths(): string[] {
  try {
    const raw = sessionStorage.getItem(TRAIL_KEY);
    const trail: string[] = raw ? JSON.parse(raw) : [];
    // Drop the current (last) entry, keep the 3 most recent before it.
    return trail.slice(0, -1).slice(-3);
  } catch {
    return [];
  }
}
