/**
 * ShipStation V2 API client for live shipping rate lookups.
 * Uses POST /v2/rates/estimate with api-key auth.
 * UPS Ground rates only — picks the highest ground rate,
 * enforces a $10 minimum floor, then applies an $8 markup.
 * Caches results in memory for 1 hour.
 * Falls back to flat rates ($15/$25) on any failure.
 */

import {
  SHIPPING_MARKUP,
  MIN_RATE_FLOOR,
  FLAT_RATE_FALLBACK,
  type LiveShippingRate,
} from './shipping';

// ── Config ─────────────────────────────────────────────────────────────────

const SHIPSTATION_BASE = 'https://api.shipstation.com';
const TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CARRIER_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getApiKey(): string {
  return process.env.SHIPSTATION_API_KEY || '';
}

// ── Carrier Discovery ──────────────────────────────────────────────────────
// Fetched once and cached for 24 h so rate requests can include carrier_ids.

let carrierIdsCache: { ids: string[]; expiresAt: number } | null = null;

async function getCarrierIds(): Promise<string[]> {
  if (carrierIdsCache && Date.now() < carrierIdsCache.expiresAt) {
    return carrierIdsCache.ids;
  }

  try {
    const res = await fetch(`${SHIPSTATION_BASE}/v2/carriers`, {
      headers: { 'api-key': getApiKey() },
    });
    if (!res.ok) {
      console.error(`[ShipStation V2] Carrier list failed: ${res.status}`);
      return carrierIdsCache?.ids || [];
    }
    const data = await res.json();
    const ids: string[] = (data.carriers || []).map((c: { carrier_id: string }) => c.carrier_id);
    carrierIdsCache = { ids, expiresAt: Date.now() + CARRIER_CACHE_TTL_MS };
    console.log(`[ShipStation V2] Discovered ${ids.length} carriers:`, ids);
    return ids;
  } catch (err) {
    console.error('[ShipStation V2] Carrier discovery error:', err);
    return carrierIdsCache?.ids || [];
  }
}

// ── In-Memory Cache ────────────────────────────────────────────────────────

interface CacheEntry {
  rates: LiveShippingRate[];
  expiresAt: number;
}

const rateCache = new Map<string, CacheEntry>();

function getCacheKey(originZip: string, destZip: string, weightOz: number): string {
  return `${originZip}:${destZip}:${Math.ceil(weightOz)}`;
}

function getCachedRates(key: string): LiveShippingRate[] | null {
  const entry = rateCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    rateCache.delete(key);
    return null;
  }
  return entry.rates;
}

function setCachedRates(key: string, rates: LiveShippingRate[]): void {
  if (rateCache.size > 5000) {
    const oldest = rateCache.keys().next().value;
    if (oldest) rateCache.delete(oldest);
  }
  rateCache.set(key, { rates, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── ShipStation V2 Types ───────────────────────────────────────────────────

interface SSV2RateEstimateRequest {
  from_country_code: string;
  from_postal_code: string;
  from_city_locality: string;
  from_state_province: string;
  to_country_code: string;
  to_postal_code: string;
  to_city_locality: string;
  to_state_province: string;
  weight: { value: number; unit: 'pound' | 'ounce' };
  dimensions?: { unit: 'inch'; length: number; width: number; height: number };
  confirmation: 'none';
  address_residential_indicator: 'yes' | 'no' | 'unknown';
  ship_date: string;
  carrier_ids?: string[];
}

interface SSV2RateEstimateResponse {
  rate_type: string;
  carrier_id: string;
  shipping_amount: { currency: string; amount: number };
  insurance_amount: { currency: string; amount: number };
  confirmation_amount: { currency: string; amount: number };
  other_amount: { currency: string; amount: number };
  tax_amount?: { currency: string; amount: number } | null;
  zone: number | null;
  package_type: string | null;
  delivery_days: number | null;
  guaranteed_service: boolean;
  estimated_delivery_date: string | null;
  carrier_delivery_days: string | null;
  ship_date: string | null;
  negotiated_rate: boolean;
  service_type: string;
  service_code: string;
  trackable: boolean;
  carrier_code: string;
  carrier_nickname: string;
  carrier_friendly_name: string;
  validation_status: string;
  warning_messages: string[];
  error_messages: string[];
}

// Flat-rate envelopes/boxes have fixed pricing regardless of destination
// and are physically too small for garment shipments — exclude them.
const EXCLUDED_PACKAGE_TYPES = new Set([
  'flat_rate_envelope',
  'flat_rate_padded_envelope',
  'flat_rate_legal_envelope',
  'small_flat_rate_box',
  'medium_flat_rate_box',
  'large_flat_rate_box',
  'thick_envelope',
]);

// ── Service Classification ─────────────────────────────────────────────────
// UPS Ground rates only — no USPS, FedEx, or air/expedited services.

const UPS_GROUND_CODES = [
  'ups_ground', 'ups_3_day_select', 'ups_ground_saver',
];

function isUpsCarrier(rate: SSV2RateEstimateResponse): boolean {
  const code = (rate.carrier_code || rate.carrier_friendly_name || '').toLowerCase();
  return code.includes('ups') && !code.includes('usps');
}

function isGroundService(serviceCode: string): boolean {
  const code = serviceCode.toLowerCase();
  if (UPS_GROUND_CODES.includes(code)) return true;
  return code.includes('ground') || code.includes('ground_saver');
}

// ── Core Rate Fetch ────────────────────────────────────────────────────────

export interface RateOrigin {
  zip: string;
  city: string;
  state: string;
}

export interface RateDestination {
  zip: string;
  city: string;
  state: string;
}

async function fetchRateEstimates(
  origin: RateOrigin,
  destination: RateDestination,
  weightLbs: number,
): Promise<SSV2RateEstimateResponse[]> {
  const carrierIds = await getCarrierIds();
  if (carrierIds.length === 0) {
    console.warn('[ShipStation V2] No carriers available for rate estimate');
    return [];
  }

  const shipDate = new Date();
  shipDate.setDate(shipDate.getDate() + 1);

  const body: SSV2RateEstimateRequest = {
    from_country_code: 'US',
    from_postal_code: origin.zip,
    from_city_locality: origin.city,
    from_state_province: origin.state,
    to_country_code: 'US',
    to_postal_code: destination.zip,
    to_city_locality: destination.city,
    to_state_province: destination.state,
    weight: { value: weightLbs, unit: 'pound' },
    confirmation: 'none',
    address_residential_indicator: 'yes',
    ship_date: shipDate.toISOString(),
    carrier_ids: carrierIds,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${SHIPSTATION_BASE}/v2/rates/estimate`, {
      method: 'POST',
      headers: {
        'api-key': getApiKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[ShipStation V2] Rate estimate failed: ${res.status} ${res.statusText}`, errText);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.error(`[ShipStation V2] Rate estimate timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.error('[ShipStation V2] Rate estimate error:', err);
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getShipStationRates(
  origin: RateOrigin,
  destination: RateDestination,
  weightLbs: number,
): Promise<LiveShippingRate[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[ShipStation V2] Missing API key, using flat-rate fallback');
    return FLAT_RATE_FALLBACK;
  }

  const weightRounded = Math.max(Math.ceil(weightLbs * 10) / 10, 0.1);
  const cacheKey = getCacheKey(origin.zip, destination.zip, weightRounded * 16);

  const cached = getCachedRates(cacheKey);
  if (cached) return cached;

  try {
    const estimates = await fetchRateEstimates(origin, destination, weightRounded);

    if (estimates.length === 0) {
      console.warn('[ShipStation V2] No rate estimates returned, using flat-rate fallback');
      return FLAT_RATE_FALLBACK;
    }

    const groundRates: { cost: number; carrier: string; days: number | null; code: string }[] = [];

    for (const rate of estimates) {
      if (rate.error_messages?.length > 0) continue;
      if (rate.package_type && EXCLUDED_PACKAGE_TYPES.has(rate.package_type)) continue;
      if (!isUpsCarrier(rate)) continue;
      if (!isGroundService(rate.service_code)) continue;

      const totalCost =
        (rate.shipping_amount?.amount || 0) +
        (rate.other_amount?.amount || 0) +
        (rate.confirmation_amount?.amount || 0);

      if (totalCost <= 0) continue;

      const carrierLabel = rate.carrier_friendly_name || rate.carrier_code || 'UPS';
      groundRates.push({
        cost: totalCost,
        carrier: carrierLabel,
        days: rate.delivery_days,
        code: rate.service_code,
      });
    }

    console.log(`[ShipStation V2] Found ${groundRates.length} UPS Ground rates:`,
      groundRates.map(r => `${r.code} $${r.cost.toFixed(2)}`));

    const result: LiveShippingRate[] = [];

    if (groundRates.length > 0) {
      groundRates.sort((a, b) => b.cost - a.cost);
      const highest = groundRates[0];
      const baseCost = Math.max(highest.cost, MIN_RATE_FLOOR);
      result.push({
        method: 'standard',
        price: Math.round((baseCost + SHIPPING_MARKUP) * 100) / 100,
        estimatedDays: highest.days ? [highest.days, highest.days + 2] : [3, 7],
        carrier: highest.carrier,
        isLive: true,
      });
    }

    if (result.length === 0) {
      console.warn('[ShipStation V2] No UPS Ground rates found, using fallback');
      return FLAT_RATE_FALLBACK;
    }

    if (!result.find(r => r.method === 'standard')) {
      result.push(FLAT_RATE_FALLBACK[0]);
    }

    setCachedRates(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[ShipStation V2] Unexpected error:', err);
    return FLAT_RATE_FALLBACK;
  }
}
