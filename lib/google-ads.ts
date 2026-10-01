/**
 * Google Data Manager API — server-side offline conversion helper.
 *
 * Reports qualified leads back to Google Ads as offline (click-based)
 * conversions, and "retracts" them (restates value to 0) when a lead is
 * later marked as spam.
 *
 * NOTE (2026): Google closed the legacy Google Ads API
 * `ConversionUploadService.UploadClickConversions` to *new* integrations
 * (error: CUSTOMER_NOT_ALLOWLISTED_FOR_THIS_FEATURE). New integrations must
 * use the Data Manager API instead:
 *   POST https://datamanager.googleapis.com/v1/events:ingest
 * Docs: https://developers.google.com/data-manager/api
 *
 * Retraction caveat: the Data Manager API does NOT support true retraction
 * (removing the conversion / zeroing its count). It only supports
 * *restatement*: re-sending an event with the same transactionId for the same
 * conversion action overrides the recorded value. We restate the value to 0,
 * which neutralizes value-based bidding, but the conversion *count* remains.
 * (See https://developers.google.com/data-manager/api/devguides/events/google-ads/conversion-adjustments)
 *
 * Auth: OAuth2 refresh token must be generated with the scope
 *   https://www.googleapis.com/auth/datamanager
 * and the "Data Manager API" must be enabled in the Google Cloud project that
 * issued the OAuth credentials. No developer token is required.
 *
 * Required env (server-only — never expose to the client):
 *   GADS_CLIENT_ID
 *   GADS_CLIENT_SECRET
 *   GADS_REFRESH_TOKEN                    (must include the datamanager scope)
 *   GADS_CUSTOMER_ID                      (digits, e.g. 9062484793)
 *   GADS_QUALIFIED_LEAD_CONVERSION_ACTION (conversion action id, e.g. 7811406613,
 *     or the full resource name customers/<cid>/conversionActions/<id>)
 * Optional env:
 *   GADS_LOGIN_CUSTOMER_ID       (only when operating via a manager account)
 *   GADS_QUALIFIED_LEAD_VALUE    (default 100)
 *   GADS_QUALIFIED_LEAD_CURRENCY (default USD)
 */

const INGEST_URL = 'https://datamanager.googleapis.com/v1/events:ingest';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string;
  /** Numeric conversion action id used as productDestinationId. */
  conversionActionId: string;
  defaultValue: number;
  currency: string;
}

/** Accepts either a raw numeric id or a full conversionActions resource name. */
function toConversionActionId(raw: string): string {
  const trimmed = raw.trim();
  // If it's a resource name, take the last path segment.
  const last = trimmed.split('/').pop() || trimmed;
  return last.replace(/[^0-9]/g, '');
}

function getConfig(): GoogleAdsConfig | null {
  const clientId = process.env.GADS_CLIENT_ID;
  const clientSecret = process.env.GADS_CLIENT_SECRET;
  const refreshToken = process.env.GADS_REFRESH_TOKEN;
  const customerId = (process.env.GADS_CUSTOMER_ID || '').replace(/[^0-9]/g, '');
  const conversionActionId = toConversionActionId(
    process.env.GADS_QUALIFIED_LEAD_CONVERSION_ACTION || ''
  );

  if (!clientId || !clientSecret || !refreshToken || !customerId || !conversionActionId) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    refreshToken,
    customerId,
    loginCustomerId:
      (process.env.GADS_LOGIN_CUSTOMER_ID || '').replace(/[^0-9]/g, '') || undefined,
    conversionActionId,
    defaultValue: Number(process.env.GADS_QUALIFIED_LEAD_VALUE || '100'),
    currency: process.env.GADS_QUALIFIED_LEAD_CURRENCY || 'USD',
  };
}

/** True when all required env vars are present. */
export function isGoogleAdsConfigured(): boolean {
  return getConfig() !== null;
}

async function getAccessToken(cfg: GoogleAdsConfig): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: cfg.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error('Token response missing access_token');
  return json.access_token;
}

/** The Google Ads destination all our events target. */
function buildDestination(cfg: GoogleAdsConfig): Record<string, unknown> {
  const dest: Record<string, unknown> = {
    operatingAccount: { accountType: 'GOOGLE_ADS', accountId: cfg.customerId },
    productDestinationId: cfg.conversionActionId,
  };
  if (cfg.loginCustomerId) {
    dest.loginAccount = { accountType: 'GOOGLE_ADS', accountId: cfg.loginCustomerId };
  }
  return dest;
}

interface IngestEventsResponse {
  requestId?: string;
  fieldWarnings?: unknown[];
}

async function ingestEvents(
  cfg: GoogleAdsConfig,
  accessToken: string,
  events: Record<string, unknown>[],
  validateOnly = false
): Promise<IngestEventsResponse> {
  const res = await fetch(INGEST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      destinations: [buildDestination(cfg)],
      events,
      validateOnly,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as IngestEventsResponse & {
    error?: unknown;
  };
  if (!res.ok) {
    throw new Error(`events:ingest failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

export interface UploadQualifiedLeadParams {
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  /** Stable id used to later adjust/retract this conversion. Use the contact id. */
  orderId: string;
  /** Overrides the default per-lead value from env. */
  value?: number;
  /** Defaults to now. */
  conversionDateTime?: Date;
  /** For testing — validate the request without applying it. */
  validateOnly?: boolean;
}

function buildAdIdentifiers(p: {
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
}): Record<string, string> {
  const ids: Record<string, string> = {};
  if (p.gclid) ids.gclid = p.gclid;
  else if (p.gbraid) ids.gbraid = p.gbraid;
  else if (p.wbraid) ids.wbraid = p.wbraid;
  return ids;
}

/**
 * Upload one qualified-lead conversion keyed by the Google click id.
 * Returns the conversionDateTime used (for auditing).
 */
export async function uploadQualifiedLead(
  params: UploadQualifiedLeadParams
): Promise<{ conversionDateTime: string; requestId?: string }> {
  const cfg = getConfig();
  if (!cfg) throw new Error('Google Ads is not configured (missing env vars)');

  const adIdentifiers = buildAdIdentifiers(params);
  if (Object.keys(adIdentifiers).length === 0) {
    throw new Error('No Google click id (gclid/gbraid/wbraid) on this lead');
  }

  const accessToken = await getAccessToken(cfg);
  const eventTimestamp = (params.conversionDateTime ?? new Date()).toISOString();

  const event: Record<string, unknown> = {
    adIdentifiers,
    transactionId: params.orderId,
    eventTimestamp,
    conversionValue: params.value ?? cfg.defaultValue,
    currency: cfg.currency,
    eventSource: 'WEB',
  };

  const resp = await ingestEvents(cfg, accessToken, [event], params.validateOnly);
  return { conversionDateTime: eventTimestamp, requestId: resp.requestId };
}

/**
 * "Retract" a previously-uploaded qualified-lead conversion by restating its
 * value to 0 (Data Manager API has no true retraction). Matched by the same
 * transactionId (the contact id) for the same conversion action.
 *
 * Caveat: this zeroes the value (removing its influence on value-based
 * bidding) but the conversion *count* remains recorded.
 */
export async function retractQualifiedLead(params: {
  orderId: string;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  adjustmentDateTime?: Date;
  validateOnly?: boolean;
}): Promise<{ requestId?: string }> {
  const cfg = getConfig();
  if (!cfg) throw new Error('Google Ads is not configured (missing env vars)');

  const accessToken = await getAccessToken(cfg);
  const eventTimestamp = (params.adjustmentDateTime ?? new Date()).toISOString();

  const event: Record<string, unknown> = {
    // Restatement is matched by transactionId + destination; identifiers are
    // optional but included when available for robustness.
    adIdentifiers: buildAdIdentifiers(params),
    transactionId: params.orderId,
    eventTimestamp,
    conversionValue: 0,
    currency: cfg.currency,
    eventSource: 'WEB',
  };

  const resp = await ingestEvents(cfg, accessToken, [event], params.validateOnly);
  return { requestId: resp.requestId };
}
