/**
 * ShipStation API client for live shipping rate lookups.
 * Fetches carrier rates, maps them to Standard/Express tiers,
 * applies an $8 markup, and caches results in memory for 1 hour.
 * Falls back to flat rates ($15/$25) on any failure.
 */

import {
  SHIPPING_MARKUP,
  FLAT_RATE_FALLBACK,
  type LiveShippingRate,
} from './shipping';

// ── Config ─────────────────────────────────────────────────────────────────

const SHIPSTATION_BASE = 'https://ssapi.shipstation.com';
const TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getAuthHeader(): string {
  const key = process.env.SHIPSTATION_API_KEY || '';
  const secret = process.env.SHIPSTATION_API_SECRET || '';
  return `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`;
}

// ── In-Memory Cache ────────────────────────────────────────────────────────

interface CacheEntry {
  rates: LiveShippingRate[];
  expiresAt: number;
}

const rateCache = new Map<string, CacheEntry>();

function getCacheKey(originZip: string, destZip: string, weightOz: number): string {
  const roundedOz = Math.ceil(weightOz);
  return `${originZip}:${destZip}:${roundedOz}`;
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

// ── ShipStation API Types ──────────────────────────────────────────────────

interface SSRateRequest {
  carrierCode: string;
  fromPostalCode: string;
  toPostalCode: string;
  toCountry: string;
  weight: { value: number; units: 'ounces' };
  dimensions?: { length: number; width: number; height: number; units: 'inches' };
  residential: boolean;
}

interface SSRateResponse {
  serviceName: string;
  serviceCode: string;
  shipmentCost: number;
  otherCost: number;
}

// ── Service Classification ─────────────────────────────────────────────────

const GROUND_KEYWORDS = ['ground', 'home delivery', 'surepost', 'parcel select', 'retail ground', 'priority mail -'];
const EXPRESS_KEYWORDS = ['2nd day', '2day', 'express', '2-day', 'priority overnight', 'standard overnight', 'priority mail express'];

function classifyService(serviceName: string): 'standard' | 'express' | null {
  const lower = serviceName.toLowerCase();

  for (const kw of EXPRESS_KEYWORDS) {
    if (lower.includes(kw)) return 'express';
  }

  for (const kw of GROUND_KEYWORDS) {
    if (lower.includes(kw)) return 'standard';
  }

  return null;
}

// ── Core Rate Fetch ────────────────────────────────────────────────────────

const CARRIER_CODES = ['ups', 'fedex'];

async function fetchCarrierRates(
  carrierCode: string,
  originZip: string,
  destZip: string,
  weightOz: number,
): Promise<SSRateResponse[]> {
  const body: SSRateRequest = {
    carrierCode,
    fromPostalCode: originZip,
    toPostalCode: destZip,
    toCountry: 'US',
    weight: { value: weightOz, units: 'ounces' },
    residential: true,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${SHIPSTATION_BASE}/shipments/getrates`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[ShipStation] ${carrierCode} rate request failed: ${res.status} ${res.statusText}`);
      return [];
    }

    return await res.json();
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.error(`[ShipStation] ${carrierCode} rate request timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.error(`[ShipStation] ${carrierCode} rate request error:`, err);
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getShipStationRates(
  originZip: string,
  destZip: string,
  weightLbs: number,
): Promise<LiveShippingRate[]> {
  if (!process.env.SHIPSTATION_API_KEY || !process.env.SHIPSTATION_API_SECRET) {
    console.warn('[ShipStation] Missing API credentials, using flat-rate fallback');
    return FLAT_RATE_FALLBACK;
  }

  const weightOz = Math.max(Math.ceil(weightLbs * 16), 1);
  const cacheKey = getCacheKey(originZip, destZip, weightOz);

  const cached = getCachedRates(cacheKey);
  if (cached) return cached;

  try {
    const allResponses = await Promise.all(
      CARRIER_CODES.map(code => fetchCarrierRates(code, originZip, destZip, weightOz))
    );

    const allRates = allResponses.flat();
    if (allRates.length === 0) {
      console.warn('[ShipStation] No rates returned from any carrier, using flat-rate fallback');
      return FLAT_RATE_FALLBACK;
    }

    const standardRates: { cost: number; name: string; carrier: string }[] = [];
    const expressRates: { cost: number; name: string; carrier: string }[] = [];

    for (const rate of allRates) {
      const totalCost = rate.shipmentCost + (rate.otherCost || 0);
      if (totalCost <= 0) continue;

      const tier = classifyService(rate.serviceName);
      if (!tier) continue;

      const carrierLabel = rate.serviceCode?.startsWith('ups') ? 'UPS'
        : rate.serviceCode?.startsWith('fedex') ? 'FedEx'
        : rate.serviceName.split(' ')[0];

      const entry = { cost: totalCost, name: rate.serviceName, carrier: carrierLabel };
      if (tier === 'standard') standardRates.push(entry);
      else expressRates.push(entry);
    }

    const result: LiveShippingRate[] = [];

    if (standardRates.length > 0) {
      standardRates.sort((a, b) => a.cost - b.cost);
      const cheapest = standardRates[0];
      result.push({
        method: 'standard',
        price: Math.round((cheapest.cost + SHIPPING_MARKUP) * 100) / 100,
        estimatedDays: [3, 7],
        carrier: `${cheapest.carrier} ${cheapest.name.split(' ').slice(1).join(' ')}`.trim(),
        isLive: true,
      });
    }

    if (expressRates.length > 0) {
      expressRates.sort((a, b) => a.cost - b.cost);
      const cheapest = expressRates[0];
      result.push({
        method: 'express',
        price: Math.round((cheapest.cost + SHIPPING_MARKUP) * 100) / 100,
        estimatedDays: [1, 3],
        carrier: `${cheapest.carrier} ${cheapest.name.split(' ').slice(1).join(' ')}`.trim(),
        isLive: true,
      });
    }

    if (result.length === 0) {
      console.warn('[ShipStation] Could not classify any rates into Standard/Express, using fallback');
      return FLAT_RATE_FALLBACK;
    }

    // If only one tier returned, fill the other from flat rates
    if (!result.find(r => r.method === 'standard')) {
      result.push(FLAT_RATE_FALLBACK[0]);
    }
    if (!result.find(r => r.method === 'express')) {
      result.push(FLAT_RATE_FALLBACK[1]);
    }

    setCachedRates(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[ShipStation] Unexpected error fetching rates:', err);
    return FLAT_RATE_FALLBACK;
  }
}
