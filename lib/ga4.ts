/**
 * Google Analytics 4 Data API – server-side only.
 * Fetches top pages and traffic by channel for the admin analytics dashboard.
 *
 * Required env:
 * - GA4_PROPERTY_ID: your GA4 property ID (numeric, e.g. "123456789")
 * - GA4_SERVICE_ACCOUNT_JSON: full JSON string of the service account key file
 *
 * The service account must have "Viewer" (or "Analyst") access to the GA4 property.
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

export interface PageVisitorRow {
  pagePath: string;
  pageTitle?: string;
  direct: number;
  googleAds: number;
  organicSearch: number;
  organicSocial: number;
  organicShopping: number;
  referral: number;
  paidShopping: number;
  paidSocial: number;
  crossNetwork: number;
  other: number;
  total: number;
}

const CHANNEL_MAP: Record<string, keyof Omit<PageVisitorRow, 'pagePath' | 'pageTitle' | 'total'>> = {
  'Direct': 'direct',
  'Paid Search': 'googleAds',
  'Organic Search': 'organicSearch',
  'Organic Social': 'organicSocial',
  'Organic Shopping': 'organicShopping',
  'Referral': 'referral',
  'Paid Shopping': 'paidShopping',
  'Paid Social': 'paidSocial',
  'Cross-Network': 'crossNetwork',
  'Display': 'other',
  'Video': 'other',
  'Email': 'other',
  'Affiliates': 'other',
  'Audio': 'other',
  'SMS': 'other',
  'Unassigned': 'other',
};

function getClient(): BetaAnalyticsDataClient {
  const json = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const dir = join(tmpdir(), 'ga4-credentials');
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const filePath = join(dir, 'credentials.json');
      writeFileSync(filePath, json, 'utf8');
      process.env.GOOGLE_APPLICATION_CREDENTIALS = filePath;
    } catch (e) {
      console.error('[GA4] Failed to write credentials file:', e);
    }
  } else {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
    if (credPath) {
      let pathToUse = credPath;
      if (!existsSync(credPath)) {
        const relativeToCwd = credPath.replace(/^\/+/, '');
        const fromCwd = resolve(process.cwd(), relativeToCwd);
        if (existsSync(fromCwd)) {
          pathToUse = fromCwd;
          process.env.GOOGLE_APPLICATION_CREDENTIALS = pathToUse;
        }
      }
    }
  }
  return new BetaAnalyticsDataClient();
}

/**
 * Fetch top 20 pages by screen page views with breakdown by session default channel group.
 * Uses one runReport with dimensions: pagePath, pageTitle (optional), sessionDefaultChannelGroup;
 * metric: screenPageViews. Then we aggregate in memory to get top 20 pages and their channel counts.
 */
export async function fetchTopPageVisitorsByChannel(
  propertyId: string,
  limit = 20,
  dateRangeDays = 30
): Promise<PageVisitorRow[]> {
  const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRangeDays);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  const client = getClient();

  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate: startStr, endDate: endStr }],
    dimensions: [
      { name: 'pagePath' },
      { name: 'pageTitle' },
      { name: 'sessionDefaultChannelGroup' },
    ],
    metrics: [{ name: 'screenPageViews' }],
    limit: 10000,
  });

  if (!response.rows || response.rows.length === 0) {
    return [];
  }

  // Aggregate by pagePath: { pagePath, pageTitle?, channel -> count }
  const byPage = new Map<
    string,
    { pageTitle?: string; channels: Record<string, number>; total: number }
  >();

  for (const row of response.rows) {
    const pagePath = row.dimensionValues?.[0]?.value ?? '';
    const pageTitle = row.dimensionValues?.[1]?.value ?? undefined;
    const channelRaw = (row.dimensionValues?.[2]?.value ?? 'Unassigned').trim();
    const columnKey =
      Object.keys(CHANNEL_MAP).find((k) => k.toLowerCase() === channelRaw.toLowerCase()) ?? 'Unassigned';
    const ourKey = CHANNEL_MAP[columnKey] ?? 'other';
    const value = Number(row.metricValues?.[0]?.value ?? 0);
    if (!pagePath) continue;

    const key = pagePath;
    if (!byPage.has(key)) {
      byPage.set(key, { pageTitle, channels: {} as Record<string, number>, total: 0 });
    }
    const entry = byPage.get(key)!;
    entry.channels[ourKey] = (entry.channels[ourKey] ?? 0) + value;
    entry.total += value;
  }

  // Sort by total descending and take top N
  const sorted = [...byPage.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit);

  const result: PageVisitorRow[] = sorted.map(([pagePath, { pageTitle, channels, total }]) => ({
    pagePath,
    pageTitle: pageTitle || undefined,
    direct: channels.direct ?? 0,
    googleAds: channels.googleAds ?? 0,
    organicSearch: channels.organicSearch ?? 0,
    organicSocial: channels.organicSocial ?? 0,
    organicShopping: channels.organicShopping ?? 0,
    referral: channels.referral ?? 0,
    paidShopping: channels.paidShopping ?? 0,
    paidSocial: channels.paidSocial ?? 0,
    crossNetwork: channels.crossNetwork ?? 0,
    other: channels.other ?? 0,
    total,
  }));

  return result;
}

/** Row for top US cities demographics table */
export interface CityDemographicsRow {
  city: string;
  newUsers: number;
  returnUsers: number;
  paidSearch: number;
  organicSearch: number;
  organicSocial: number;
  crossNetwork: number;
  averageEngagementTimeSeconds: number;
  totalRevenue: number;
}

/**
 * Fetch top 15 US cities by visitor count with demographics: new users, return users,
 * paid/organic search, organic social, average engagement time, total revenue.
 */
export async function fetchTopUSCitiesDemographics(
  propertyId: string,
  limit = 15,
  dateRangeDays = 30
): Promise<CityDemographicsRow[]> {
  const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRangeDays);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const client = getClient();

  const usaValues = ['United States', 'United States of America', 'USA'];
  const isUSA = (v: string) => usaValues.some((u) => v.toLowerCase().includes(u.toLowerCase()));

  const [report1] = await client.runReport({
    property,
    dateRanges: [{ startDate: startStr, endDate: endStr }],
    dimensions: [{ name: 'city' }, { name: 'country' }],
    metrics: [
      { name: 'newUsers' },
      { name: 'activeUsers' },
      { name: 'averageSessionDuration' },
      { name: 'totalRevenue' },
    ],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 5000,
  });

  let report1Rows = (report1.rows ?? []).filter((r) => {
    const country = (r.dimensionValues?.[1]?.value ?? '').trim();
    return isUSA(country);
  });
  report1Rows = report1Rows.slice(0, limit);

  if (report1Rows.length === 0) {
    return [];
  }

  const topCityNames = new Set(
    report1Rows.map((r) => (r.dimensionValues?.[0]?.value ?? '').trim()).filter(Boolean)
  );

  const [report2] = await client.runReport({
    property,
    dateRanges: [{ startDate: startStr, endDate: endStr }],
    dimensions: [{ name: 'city' }, { name: 'country' }, { name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }],
    limit: 10000,
  });

  const channelByCity: Record<string, { paidSearch: number; organicSearch: number; organicSocial: number; crossNetwork: number }> = {};
  if (report2.rows) {
    for (const row of report2.rows) {
      const country = (row.dimensionValues?.[1]?.value ?? '').trim();
      if (!isUSA(country)) continue;
      const city = (row.dimensionValues?.[0]?.value ?? '').trim();
      if (!topCityNames.has(city)) continue;
      const channel = (row.dimensionValues?.[2]?.value ?? '').trim();
      const sessions = Number(row.metricValues?.[0]?.value ?? 0);
      if (!channelByCity[city]) {
        channelByCity[city] = { paidSearch: 0, organicSearch: 0, organicSocial: 0, crossNetwork: 0 };
      }
      const ch = channelByCity[city];
      if (channel.toLowerCase() === 'paid search') ch.paidSearch += sessions;
      else if (channel.toLowerCase() === 'organic search') ch.organicSearch += sessions;
      else if (channel.toLowerCase() === 'organic social') ch.organicSocial += sessions;
      else if (channel.toLowerCase() === 'cross-network') ch.crossNetwork += sessions;
    }
  }

  return report1Rows.map((row) => {
    const city = (row.dimensionValues?.[0]?.value ?? '').trim() || '(not set)';
    const newUsers = Number(row.metricValues?.[0]?.value ?? 0);
    const activeUsers = Number(row.metricValues?.[1]?.value ?? 0);
    const avgSec = Number(row.metricValues?.[2]?.value ?? 0);
    const revenue = Number(row.metricValues?.[3]?.value ?? 0);
    const channels = channelByCity[city] ?? { paidSearch: 0, organicSearch: 0, organicSocial: 0, crossNetwork: 0 };
    return {
      city,
      newUsers,
      returnUsers: Math.max(0, activeUsers - newUsers),
      paidSearch: channels.paidSearch,
      organicSearch: channels.organicSearch,
      organicSocial: channels.organicSocial,
      crossNetwork: channels.crossNetwork,
      averageEngagementTimeSeconds: Math.round(avgSec),
      totalRevenue: revenue,
    };
  });
}

/** Node in the path tree from homepage (up to 3 levels) */
export interface PathTreeNode {
  path: string;
  sessions: number;
  children?: PathTreeNode[];
}

/**
 * Three-level path tree from homepage: top N from /, then top M from each of those, then top K from each level-2.
 * Uses landingPage + pagePath: sessions where landing = X and pagePath = Y gives "from X, visited Y".
 */
export async function fetchHomepagePathTree(
  propertyId: string,
  level1Count = 7,
  level2CountPerNode = 4,
  level3CountPerNode = 3,
  dateRangeDays = 30
): Promise<PathTreeNode> {
  const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRangeDays);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const client = getClient();

  const [report1] = await client.runReport({
    property,
    dateRanges: [{ startDate: startStr, endDate: endStr }],
    dimensions: [{ name: 'landingPage' }, { name: 'pagePath' }],
    metrics: [{ name: 'sessions' }],
    limit: 10000,
  });

  const rows = report1.rows ?? [];
  const homeRows = rows.filter((r) => {
    const landing = (r.dimensionValues?.[0]?.value ?? '').trim();
    return landing === '/' || landing === '(not set)';
  });

  const fromHome = homeRows
    .filter((r) => (r.dimensionValues?.[1]?.value ?? '').trim() !== '/')
    .map((r) => ({
      path: (r.dimensionValues?.[1]?.value ?? '').trim() || '(not set)',
      sessions: Number(r.metricValues?.[0]?.value ?? 0),
    }))
    .reduce<Record<string, number>>((acc, { path, sessions }) => {
      acc[path] = (acc[path] ?? 0) + sessions;
      return acc;
    }, {});

  const level1Entries = Object.entries(fromHome)
    .sort((a, b) => b[1] - a[1])
    .slice(0, level1Count);
  const level1Paths = level1Entries.map(([p]) => p);

  const fromLevel1: Record<string, Array<{ path: string; sessions: number }>> = {};
  for (const landing of level1Paths) {
    fromLevel1[landing] = [];
  }
  for (const r of rows) {
    const landing = (r.dimensionValues?.[0]?.value ?? '').trim();
    const pagePath = (r.dimensionValues?.[1]?.value ?? '').trim();
    if (!level1Paths.includes(landing) || pagePath === landing) continue;
    const sessions = Number(r.metricValues?.[0]?.value ?? 0);
    fromLevel1[landing].push({ path: pagePath || '(not set)', sessions });
  }
  for (const landing of level1Paths) {
    const list = fromLevel1[landing]
      .reduce<Record<string, number>>((acc, { path, sessions }) => {
        acc[path] = (acc[path] ?? 0) + sessions;
        return acc;
      }, {});
    fromLevel1[landing] = Object.entries(list)
      .sort((a, b) => b[1] - a[1])
      .slice(0, level2CountPerNode)
      .map(([path, sessions]) => ({ path, sessions }));
  }

  const level2Paths = level1Paths.flatMap((p) => (fromLevel1[p] ?? []).map((x) => x.path));
  const fromLevel2: Record<string, Array<{ path: string; sessions: number }>> = {};
  for (const landing of level2Paths) {
    fromLevel2[landing] = [];
  }
  for (const r of rows) {
    const landing = (r.dimensionValues?.[0]?.value ?? '').trim();
    const pagePath = (r.dimensionValues?.[1]?.value ?? '').trim();
    if (!level2Paths.includes(landing) || pagePath === landing) continue;
    const sessions = Number(r.metricValues?.[0]?.value ?? 0);
    fromLevel2[landing].push({ path: pagePath || '(not set)', sessions });
  }
  for (const landing of level2Paths) {
    const list = fromLevel2[landing]
      .reduce<Record<string, number>>((acc, { path, sessions }) => {
        acc[path] = (acc[path] ?? 0) + sessions;
        return acc;
      }, {});
    fromLevel2[landing] = Object.entries(list)
      .sort((a, b) => b[1] - a[1])
      .slice(0, level3CountPerNode)
      .map(([path, sessions]) => ({ path, sessions }));
  }

  const rootRow = homeRows.find((r) => (r.dimensionValues?.[1]?.value ?? '').trim() === '/');
  const totalHomeSessions = rootRow ? Number(rootRow.metricValues?.[0]?.value ?? 0) : 0;

  const children: PathTreeNode[] = level1Entries.map(([path, sessions]) => ({
    path,
    sessions,
    children: (fromLevel1[path] ?? []).map(({ path: p, sessions: s }) => ({
      path: p,
      sessions: s,
      children: (fromLevel2[p] ?? []).map(({ path: p3, sessions: s3 }) => ({ path: p3, sessions: s3 })),
    })),
  }));

  return {
    path: '/',
    sessions: totalHomeSessions,
    children,
  };
}

/** Sales/funnel metrics by visitor source (channel). */
export interface SalesBySourceRow {
  source: string;
  productsViewed: number;
  addedToCart: number;
  valueAddedToCart: number;
  enteredCheckout: number;
  valueCheckout: number;
  productsPurchased: number;
  totalPurchases: number;
}

const SALES_SOURCE_ORDER = [
  'Paid Search',
  'Organic Search',
  'Organic Social',
  'Organic Shopping',
  'Referral',
  'Cross-Network',
] as const;

const SALES_METRICS_STANDARD = [
  { name: 'itemsViewed' },
  { name: 'itemsAddedToCart' },
  { name: 'itemsCheckedOut' },
  { name: 'itemsPurchased' },
  { name: 'purchaseRevenue' },
] as const;

/** Custom metrics for value at add_to_cart and begin_checkout (GA4 Admin → Custom definitions). */
const SALES_METRICS_WITH_VALUES = [
  ...SALES_METRICS_STANDARD,
  { name: 'customEvent:cart_value' as const },
  { name: 'customEvent:checkout_value' as const },
];

/**
 * Fetch ecommerce funnel metrics by session channel (visitor source).
 * Uses GA4: itemsViewed, itemsAddedToCart, itemsCheckedOut, itemsPurchased, purchaseRevenue.
 * If custom metrics cart_value and checkout_value exist, also returns valueAddedToCart and valueCheckout.
 */
export async function fetchSalesByVisitorSource(
  propertyId: string,
  dateRangeDays = 30
): Promise<SalesBySourceRow[]> {
  const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRangeDays);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const client = getClient();

  const dimensionFilter = {
    orGroup: {
      expressions: [
        { filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { matchType: 'EXACT', value: 'Paid Search' } } },
        { filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { matchType: 'EXACT', value: 'Organic Search' } } },
        { filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { matchType: 'EXACT', value: 'Organic Social' } } },
        { filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { matchType: 'EXACT', value: 'Organic Shopping' } } },
        { filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { matchType: 'EXACT', value: 'Referral' } } },
        { filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { matchType: 'EXACT', value: 'Cross-Network' } } },
      ],
    },
  };

  type ReportResult = Awaited<ReturnType<BetaAnalyticsDataClient['runReport']>>[0];
  let report: ReportResult;

  try {
    const [r] = await client.runReport({
      property,
      dateRanges: [{ startDate: startStr, endDate: endStr }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      dimensionFilter,
      metrics: [...SALES_METRICS_WITH_VALUES],
      limit: 20,
    });
    report = r;
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
    const isMetricError =
      msg.includes('metric') || msg.includes('invalid') || msg.includes('customevent') || msg.includes('400');
    if (!isMetricError) throw err;
    const [r] = await client.runReport({
      property,
      dateRanges: [{ startDate: startStr, endDate: endStr }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      dimensionFilter,
      metrics: [...SALES_METRICS_STANDARD],
      limit: 20,
    });
    report = r;
  }

  const bySource = new Map<string, SalesBySourceRow>();
  for (const label of SALES_SOURCE_ORDER) {
    bySource.set(label, {
      source: label === 'Paid Search' ? 'Paid search (Google Ads)' : label === 'Cross-Network' ? 'Cross-network' : label,
      productsViewed: 0,
      addedToCart: 0,
      valueAddedToCart: 0,
      enteredCheckout: 0,
      valueCheckout: 0,
      productsPurchased: 0,
      totalPurchases: 0,
    });
  }

  const hasValueMetrics = report.metricHeaders?.some(
    (h) => h.name === 'customEvent:cart_value' || h.name === 'customEvent:checkout_value'
  );
  const idx = {
    productsViewed: report.metricHeaders?.findIndex((h) => h.name === 'itemsViewed') ?? 0,
    addedToCart: report.metricHeaders?.findIndex((h) => h.name === 'itemsAddedToCart') ?? 1,
    enteredCheckout: report.metricHeaders?.findIndex((h) => h.name === 'itemsCheckedOut') ?? 2,
    productsPurchased: report.metricHeaders?.findIndex((h) => h.name === 'itemsPurchased') ?? 3,
    totalPurchases: report.metricHeaders?.findIndex((h) => h.name === 'purchaseRevenue') ?? 4,
    valueAddedToCart: report.metricHeaders?.findIndex((h) => h.name === 'customEvent:cart_value') ?? 5,
    valueCheckout: report.metricHeaders?.findIndex((h) => h.name === 'customEvent:checkout_value') ?? 6,
  };

  for (const row of report.rows ?? []) {
    const channel = (row.dimensionValues?.[0]?.value ?? '').trim();
    if (!channel) continue;
    const displaySource = channel === 'Paid Search' ? 'Paid search (Google Ads)' : channel === 'Cross-Network' ? 'Cross-network' : channel;
    const mv = row.metricValues ?? [];
    const get = (i: number) => (i >= 0 && mv[i] ? Number(mv[i].value ?? 0) : 0);
    bySource.set(channel, {
      source: displaySource,
      productsViewed: Math.round(get(idx.productsViewed)),
      addedToCart: Math.round(get(idx.addedToCart)),
      valueAddedToCart: hasValueMetrics ? get(idx.valueAddedToCart) : 0,
      enteredCheckout: Math.round(get(idx.enteredCheckout)),
      valueCheckout: hasValueMetrics ? get(idx.valueCheckout) : 0,
      productsPurchased: Math.round(get(idx.productsPurchased)),
      totalPurchases: get(idx.totalPurchases),
    });
  }

  return SALES_SOURCE_ORDER.map((label) => bySource.get(label)!);
}

/** Row for CTA-to-Contact report: top pages that send traffic to /contact and their contact-page actions */
export interface ContactCTARow {
  sourcePage: string;
  contactPageViews: number;
  formSubmissions: number;
  phoneClicks: number;
  emailClicks: number;
  locationClicks: number;
}

/**
 * Normalize GA4 pageReferrer to a path for same-origin (pathname only). External referrers return empty or host.
 */
function referrerToSourcePath(referrer: string): string {
  if (!referrer || !referrer.trim()) return '(direct)';
  try {
    const u = new URL(referrer);
    return u.pathname || '/';
  } catch {
    return referrer;
  }
}

/**
 * Fetch top 20 pages that send the most visitors to /contact, plus their actions on the contact page.
 * Uses: (1) pagePath + pageReferrer for contact page views, (2) events contact_form_submit, contact_phone_click,
 * contact_email_click, contact_location_click with custom dimension contact_source_page (create in GA4 if needed).
 */
export async function fetchContactCTAReport(
  propertyId: string,
  limit = 20,
  dateRangeDays = 30
): Promise<ContactCTARow[]> {
  const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRangeDays);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const client = getClient();

  const [viewsReport] = await client.runReport({
    property,
    dateRanges: [{ startDate: startStr, endDate: endStr }],
    dimensions: [{ name: 'pageReferrer' }],
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: { matchType: 'EXACT', value: '/contact' },
      },
    },
    metrics: [{ name: 'screenPageViews' }],
    limit: 10000,
  });

  const viewsByPath = new Map<string, number>();
  for (const row of viewsReport.rows ?? []) {
    const referrer = (row.dimensionValues?.[0]?.value ?? '').trim();
    const path = referrerToSourcePath(referrer);
    const views = Number(row.metricValues?.[0]?.value ?? 0);
    viewsByPath.set(path, (viewsByPath.get(path) ?? 0) + views);
  }

  const topPaths = [...viewsByPath.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([p]) => p);

  const eventCounts = new Map<string, { form: number; phone: number; email: number; location: number }>();
  for (const p of topPaths) {
    eventCounts.set(p, { form: 0, phone: 0, email: 0, location: 0 });
  }

  try {
    const [eventsReport] = await client.runReport({
      property,
      dateRanges: [{ startDate: startStr, endDate: endStr }],
      dimensions: [
        { name: 'customEvent:contact_source_page' },
        { name: 'eventName' },
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              orGroup: {
                expressions: [
                  { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'contact_form_submit' } } },
                  { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'contact_phone_click' } } },
                  { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'contact_email_click' } } },
                  { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'contact_location_click' } } },
                ],
              },
            },
          ],
        },
      },
      metrics: [{ name: 'eventCount' }],
      limit: 10000,
    });

    for (const row of eventsReport.rows ?? []) {
      const sourcePage = (row.dimensionValues?.[0]?.value ?? '').trim() || '(not set)';
      const eventName = (row.dimensionValues?.[1]?.value ?? '').trim();
      const count = Number(row.metricValues?.[0]?.value ?? 0);
      const entry = eventCounts.get(sourcePage);
      if (!entry) continue;
      if (eventName === 'contact_form_submit') entry.form += count;
      else if (eventName === 'contact_phone_click') entry.phone += count;
      else if (eventName === 'contact_email_click') entry.email += count;
      else if (eventName === 'contact_location_click') entry.location += count;
    }
  } catch {
    // Custom dimension or events not set up yet; keep zeros
  }

  return topPaths.map((sourcePage) => {
    const events = eventCounts.get(sourcePage) ?? { form: 0, phone: 0, email: 0, location: 0 };
    return {
      sourcePage,
      contactPageViews: viewsByPath.get(sourcePage) ?? 0,
      formSubmissions: events.form,
      phoneClicks: events.phone,
      emailClicks: events.email,
      locationClicks: events.location,
    };
  });
}

/** Event columns for Lead by Visitor Source table (GA4 event names) */
const LEAD_EVENT_NAMES = [
  'page_view',
  'session_start',
  'first_visit',
  'user_engagement',
  'form_start',
  'form_submit',
  'generate_lead',
  'open_decoration_modal',
  'click',
  'add_decoration',
  'phone_click',
  'custom_quote_request',
] as const;

/** Display order and label for visitor sources in Lead by Visitor Source (Other is aggregated separately) */
const LEAD_SOURCE_ORDER: { ga4Channel: string; label: string }[] = [
  { ga4Channel: 'Direct', label: 'Direct' },
  { ga4Channel: 'Paid Search', label: 'Google Ads' },
  { ga4Channel: 'Organic Search', label: 'Organic search' },
  { ga4Channel: 'Organic Social', label: 'Organic Social' },
  { ga4Channel: 'Organic Shopping', label: 'Organic Shopping' },
  { ga4Channel: 'Referral', label: 'Referral' },
  { ga4Channel: 'Cross-Network', label: 'Cross-network' },
];

export interface LeadBySourceRow {
  source: string;
  allEvents: number;
  page_view: number;
  session_start: number;
  first_visit: number;
  user_engagement: number;
  form_start: number;
  form_submit: number;
  generate_lead: number;
  open_decoration_modal: number;
  click: number;
  add_decoration: number;
  phone_click: number;
  custom_quote_request: number;
}

/**
 * Map GA4 sessionDefaultChannelGroup to our lead source label (Other = everything not in the list).
 */
function leadChannelToLabel(channel: string): string {
  const found = LEAD_SOURCE_ORDER.find((s) => s.ga4Channel === channel);
  if (found) return found.label;
  return 'Other';
}

/**
 * Fetch event counts by visitor source (session channel) for the Lead by Visitor Source table.
 */
export async function fetchLeadsByVisitorSource(
  propertyId: string,
  dateRangeDays = 30
): Promise<LeadBySourceRow[]> {
  const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRangeDays);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const client = getClient();

  const [report] = await client.runReport({
    property,
    dateRanges: [{ startDate: startStr, endDate: endStr }],
    dimensions: [
      { name: 'sessionDefaultChannelGroup' },
      { name: 'eventName' },
    ],
    metrics: [{ name: 'eventCount' }],
    limit: 100000,
  });

  const bySource = new Map<
    string,
    { allEvents: number; events: Record<string, number> }
  >();
  for (const { label } of LEAD_SOURCE_ORDER) {
    bySource.set(label, { allEvents: 0, events: {} });
  }
  bySource.set('Other', { allEvents: 0, events: {} });

  for (const row of report.rows ?? []) {
    const channel = (row.dimensionValues?.[0]?.value ?? '').trim();
    const eventName = (row.dimensionValues?.[1]?.value ?? '').trim();
    const count = Number(row.metricValues?.[0]?.value ?? 0);
    const sourceLabel = leadChannelToLabel(channel || 'Unassigned');
    let entry = bySource.get(sourceLabel);
    if (!entry) {
      entry = { allEvents: 0, events: {} };
      bySource.set(sourceLabel, entry);
    }
    entry.allEvents += count;
    entry.events[eventName] = (entry.events[eventName] ?? 0) + count;
  }

  const eventKeys = [...LEAD_EVENT_NAMES];
  const rows: LeadBySourceRow[] = LEAD_SOURCE_ORDER.map(({ label }) => {
    const entry = bySource.get(label)!;
    const row: LeadBySourceRow = {
      source: label,
      allEvents: entry.allEvents,
      page_view: 0,
      session_start: 0,
      first_visit: 0,
      user_engagement: 0,
      form_start: 0,
      form_submit: 0,
      generate_lead: 0,
      open_decoration_modal: 0,
      click: 0,
      add_decoration: 0,
      phone_click: 0,
      custom_quote_request: 0,
    };
    for (const key of eventKeys) {
      (row as Record<string, number>)[key] = entry.events[key] ?? 0;
    }
    return row;
  });

  const otherEntry = bySource.get('Other')!;
  rows.push({
    source: 'Other',
    allEvents: otherEntry.allEvents,
    page_view: otherEntry.events['page_view'] ?? 0,
    session_start: otherEntry.events['session_start'] ?? 0,
    first_visit: otherEntry.events['first_visit'] ?? 0,
    user_engagement: otherEntry.events['user_engagement'] ?? 0,
    form_start: otherEntry.events['form_start'] ?? 0,
    form_submit: otherEntry.events['form_submit'] ?? 0,
    generate_lead: otherEntry.events['generate_lead'] ?? 0,
    open_decoration_modal: otherEntry.events['open_decoration_modal'] ?? 0,
    click: otherEntry.events['click'] ?? 0,
    add_decoration: otherEntry.events['add_decoration'] ?? 0,
    phone_click: otherEntry.events['phone_click'] ?? 0,
    custom_quote_request: otherEntry.events['custom_quote_request'] ?? 0,
  });

  const totalRow: LeadBySourceRow = {
    source: 'Total',
    allEvents: rows.reduce((s, r) => s + r.allEvents, 0),
    page_view: rows.reduce((s, r) => s + r.page_view, 0),
    session_start: rows.reduce((s, r) => s + r.session_start, 0),
    first_visit: rows.reduce((s, r) => s + r.first_visit, 0),
    user_engagement: rows.reduce((s, r) => s + r.user_engagement, 0),
    form_start: rows.reduce((s, r) => s + r.form_start, 0),
    form_submit: rows.reduce((s, r) => s + r.form_submit, 0),
    generate_lead: rows.reduce((s, r) => s + r.generate_lead, 0),
    open_decoration_modal: rows.reduce((s, r) => s + r.open_decoration_modal, 0),
    click: rows.reduce((s, r) => s + r.click, 0),
    add_decoration: rows.reduce((s, r) => s + r.add_decoration, 0),
    phone_click: rows.reduce((s, r) => s + r.phone_click, 0),
    custom_quote_request: rows.reduce((s, r) => s + r.custom_quote_request, 0),
  };
  rows.push(totalRow);

  return rows;
}

/** Page paths for the Page Engagement table (display order) */
const PAGE_ENGAGEMENT_PATHS = [
  '/',
  '/services/screen-printing',
  '/services/embroidery',
  '/services/jumbo-screen-printing',
  '/services/puff-screen-printing',
  '/services/rush',
  '/services/digital-screen-printing',
  '/services/simulated-process',
  '/services/retail-finishing',
  '/packages',
  '/services/large-orders',
  '/services/live-screen-printing',
  '/pricing',
  '/contact',
  '/locations/hollywood',
  '/locations/orange-county',
  '/locations/santa-barbara',
] as const;

export interface PageEngagementRow {
  pagePath: string;
  views: number;
  activeUsers: number;
  viewsPerUser: number;
  averageEngagementTimeSeconds: number;
  click: number;
  form_submit: number;
  generate_lead: number;
}

/**
 * Fetch page-level engagement metrics for a fixed list of paths.
 * Uses: (1) pagePath + screenPageViews, activeUsers, averageEngagementTimeSeconds;
 * (2) pagePath + eventName for click, form_submit, generate_lead event counts.
 */
export async function fetchPageEngagement(
  propertyId: string,
  dateRangeDays = 30
): Promise<PageEngagementRow[]> {
  const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRangeDays);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const client = getClient();

  const pagePathFilter = {
    orGroup: {
      expressions: PAGE_ENGAGEMENT_PATHS.map((path) => ({
        filter: { fieldName: 'pagePath', stringFilter: { matchType: 'EXACT', value: path } },
      })),
    },
  };

  const byPath = new Map<string, PageEngagementRow>();
  for (const path of PAGE_ENGAGEMENT_PATHS) {
    byPath.set(path, {
      pagePath: path,
      views: 0,
      activeUsers: 0,
      viewsPerUser: 0,
      averageEngagementTimeSeconds: 0,
      click: 0,
      form_submit: 0,
      generate_lead: 0,
    });
  }

  let report1: Awaited<ReturnType<BetaAnalyticsDataClient['runReport']>>[0];
  try {
    const [r] = await client.runReport({
      property,
      dateRanges: [{ startDate: startStr, endDate: endStr }],
      dimensions: [{ name: 'pagePath' }],
      dimensionFilter: pagePathFilter,
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'averageEngagementTimeSeconds' },
      ],
      limit: 100,
    });
    report1 = r;
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
    if (msg.includes('invalid') || msg.includes('400')) {
      try {
        const [r] = await client.runReport({
          property,
          dateRanges: [{ startDate: startStr, endDate: endStr }],
          dimensions: [{ name: 'pagePath' }],
          dimensionFilter: pagePathFilter,
          metrics: [
            { name: 'screenPageViews' },
            { name: 'activeUsers' },
            { name: 'userEngagementDuration' },
          ],
          limit: 100,
        });
        report1 = r;
      } catch (err2) {
        const [r] = await client.runReport({
          property,
          dateRanges: [{ startDate: startStr, endDate: endStr }],
          dimensions: [{ name: 'pagePath' }],
          dimensionFilter: pagePathFilter,
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
          limit: 100,
        });
        report1 = r;
      }
    } else {
      throw err;
    }
  }

  const hasAvgEngagement = (report1.metricHeaders ?? []).some(
    (h) => h.name === 'averageEngagementTimeSeconds'
  );
  const hasTotalEngagement = (report1.metricHeaders ?? []).some(
    (h) => h.name === 'userEngagementDuration'
  );
  const idxViews = report1.metricHeaders?.findIndex((h) => h.name === 'screenPageViews') ?? 0;
  const idxUsers = report1.metricHeaders?.findIndex((h) => h.name === 'activeUsers') ?? 1;
  const idxAvgEngagement = report1.metricHeaders?.findIndex((h) => h.name === 'averageEngagementTimeSeconds') ?? 2;
  const idxTotalEngagement = report1.metricHeaders?.findIndex((h) => h.name === 'userEngagementDuration') ?? 2;

  for (const row of report1.rows ?? []) {
    const path = (row.dimensionValues?.[0]?.value ?? '').trim();
    if (!byPath.has(path)) continue;
    const mv = row.metricValues ?? [];
    const get = (i: number) => (i >= 0 && mv[i] ? Number(mv[i].value ?? 0) : 0);
    const views = get(idxViews);
    const activeUsers = get(idxUsers);
    let avgEngagementSeconds = 0;
    if (hasAvgEngagement) {
      avgEngagementSeconds = get(idxAvgEngagement);
    } else if (hasTotalEngagement && activeUsers > 0) {
      const totalSeconds = get(idxTotalEngagement);
      avgEngagementSeconds = totalSeconds / activeUsers;
    }
    byPath.set(path, {
      pagePath: path,
      views,
      activeUsers,
      viewsPerUser: activeUsers > 0 ? Math.round((views / activeUsers) * 100) / 100 : 0,
      averageEngagementTimeSeconds: Math.round(avgEngagementSeconds),
      click: 0,
      form_submit: 0,
      generate_lead: 0,
    });
  }

  try {
    const [report2] = await client.runReport({
      property,
      dateRanges: [{ startDate: startStr, endDate: endStr }],
      dimensions: [{ name: 'pagePath' }, { name: 'eventName' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            pagePathFilter,
            {
              orGroup: {
                expressions: [
                  { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'click' } } },
                  { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'form_submit' } } },
                  { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'generate_lead' } } },
                ],
              },
            },
          ],
        },
      },
      metrics: [{ name: 'eventCount' }],
      limit: 1000,
    });

    for (const row of report2.rows ?? []) {
      const path = (row.dimensionValues?.[0]?.value ?? '').trim();
      const eventName = (row.dimensionValues?.[1]?.value ?? '').trim();
      const count = Number(row.metricValues?.[0]?.value ?? 0);
      const entry = byPath.get(path);
      if (!entry) continue;
      if (eventName === 'click') entry.click += count;
      else if (eventName === 'form_submit') entry.form_submit += count;
      else if (eventName === 'generate_lead') entry.generate_lead += count;
    }
  } catch {
    // Event report optional; keep zeros
  }

  return PAGE_ENGAGEMENT_PATHS.map((path) => byPath.get(path)!);
}
