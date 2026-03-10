import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getDateRange(period: string, from?: string, to?: string) {
  const now = new Date();
  let startDate: Date;
  let endDate = now;

  switch (period) {
    case '7d':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '90d':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      break;
    case 'custom':
      startDate = from ? new Date(from) : new Date(now.setDate(now.getDate() - 30));
      endDate = to ? new Date(to) : new Date();
      break;
    case '30d':
    default:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
  }

  return { startDate, endDate };
}

function getPriorPeriod(startDate: Date, endDate: Date) {
  const duration = endDate.getTime() - startDate.getTime();
  const priorEnd = new Date(startDate.getTime() - 1);
  const priorStart = new Date(priorEnd.getTime() - duration);
  return { priorStart, priorEnd };
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const period = params.get('period') || '30d';
  const { startDate, endDate } = getDateRange(period, params.get('from') || undefined, params.get('to') || undefined);
  const { priorStart, priorEnd } = getPriorPeriod(startDate, endDate);

  const serviceSupabase = getServiceSupabase();

  // Fetch paid orders for current period
  const { data: currentOrders } = await serviceSupabase
    .from('orders')
    .select('id, order_number, created_at, total, subtotal, total_cogs, shipping_cost, actual_shipping_cost, stripe_fee, tax_amount, discount_amount, items, metadata, customer_name, company, cogs_source, status, utm_source')
    .eq('payment_status', 'paid')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  // Fetch paid orders for prior period (for trend comparison)
  const { data: priorOrders } = await serviceSupabase
    .from('orders')
    .select('id, total, subtotal, total_cogs, shipping_cost, actual_shipping_cost, stripe_fee')
    .eq('payment_status', 'paid')
    .gte('created_at', priorStart.toISOString())
    .lte('created_at', priorEnd.toISOString());

  // Fetch refunds for current period orders
  const orderIds = (currentOrders || []).map(o => o.id);
  let refundMap: Record<string, number> = {};
  if (orderIds.length > 0) {
    const { data: refunds } = await serviceSupabase
      .from('payments')
      .select('order_id, amount')
      .in('order_id', orderIds)
      .eq('type', 'refund')
      .eq('status', 'succeeded');
    for (const r of refunds || []) {
      refundMap[r.order_id] = (refundMap[r.order_id] || 0) + Number(r.amount);
    }
  }

  // Fetch ad spend for current period
  const { data: adSpendEntries } = await serviceSupabase
    .from('ad_spend_entries')
    .select('date, spend, impressions, clicks, platform')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Fetch ad spend for prior period
  const { data: priorAdSpend } = await serviceSupabase
    .from('ad_spend_entries')
    .select('spend')
    .gte('date', priorStart.toISOString().split('T')[0])
    .lte('date', priorEnd.toISOString().split('T')[0]);

  // Fetch orders missing shipping cost (operational widget)
  const { data: missingShippingOrders } = await serviceSupabase
    .from('orders')
    .select('id, order_number, created_at, total, customer_name, company, status, shipping_cost')
    .eq('payment_status', 'paid')
    .in('status', ['shipped', 'delivered'])
    .is('actual_shipping_cost', null)
    .order('created_at', { ascending: false })
    .limit(20);

  const orders = currentOrders || [];
  const prior = priorOrders || [];

  // ---- Compute KPIs ----
  let totalRevenue = 0;
  let totalCogs = 0;
  let totalStripeFees = 0;
  let totalShippingCharged = 0;
  let totalActualShipping = 0;
  let actualShippingCount = 0;
  let totalRefunds = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderRows: any[] = [];

  for (const order of orders) {
    const revenue = Number(order.total);
    const cogs = Number(order.total_cogs) || 0;
    const stripeFee = Number(order.stripe_fee) || 0;
    const shippingCharged = Number(order.shipping_cost) || 0;
    const actualShipping = order.actual_shipping_cost != null ? Number(order.actual_shipping_cost) : null;
    const refunded = refundMap[order.id] || 0;
    const netRevenue = revenue - refunded;
    const shippingDelta = actualShipping !== null ? shippingCharged - actualShipping : 0;
    const netProfit = netRevenue - cogs - (actualShipping ?? 0) - stripeFee + shippingCharged;
    // Net profit = revenue - refunds - cogs - actualShipping - stripeFee
    // But shipping charged is already part of revenue, so:
    // netProfit = (subtotal + shippingCharged + tax - discount) - refunds - cogs - actualShipping - stripeFee
    // Simpler: netProfit = netRevenue - cogs - (actualShipping ?? shippingCharged) - stripeFee
    const trueNetProfit = netRevenue - cogs - (actualShipping ?? shippingCharged) - stripeFee;
    const margin = netRevenue > 0 ? (trueNetProfit / netRevenue) * 100 : 0;

    totalRevenue += netRevenue;
    totalCogs += cogs;
    totalStripeFees += stripeFee;
    totalShippingCharged += shippingCharged;
    totalRefunds += refunded;
    if (actualShipping !== null) {
      totalActualShipping += actualShipping;
      actualShippingCount++;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata = order.metadata as any;
    const orderType = metadata?.order_type || 'cart';

    orderRows.push({
      id: order.id,
      orderNumber: order.order_number,
      createdAt: order.created_at,
      customerName: order.customer_name || order.company || 'Guest',
      revenue: netRevenue,
      cogs,
      stripeFee,
      shippingCharged,
      actualShipping,
      shippingDelta: actualShipping !== null ? shippingCharged - actualShipping : null,
      netProfit: trueNetProfit,
      margin: Math.round(margin * 10) / 10,
      orderType,
      cogsSource: order.cogs_source,
      utmSource: order.utm_source,
      refunded,
    });
  }

  const grossProfit = totalRevenue - totalCogs;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const shippingDeltaTotal = totalShippingCharged - totalActualShipping;
  const netProfit = totalRevenue - totalCogs - totalActualShipping - totalStripeFees
    + (actualShippingCount > 0 ? totalShippingCharged : 0)
    - (actualShippingCount === 0 ? totalShippingCharged : 0);
  // Simplified: net profit using actual shipping where available
  const trueNetProfit = totalRevenue - totalCogs
    - (actualShippingCount > 0 ? totalActualShipping : totalShippingCharged)
    - totalStripeFees;
  const netMargin = totalRevenue > 0 ? (trueNetProfit / totalRevenue) * 100 : 0;
  const aov = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Prior period KPIs for comparison
  let priorRevenue = 0;
  let priorCogs = 0;
  for (const order of prior) {
    priorRevenue += Number(order.total);
    priorCogs += Number(order.total_cogs) || 0;
  }
  const priorGrossProfit = priorRevenue - priorCogs;
  const priorGrossMargin = priorRevenue > 0 ? (priorGrossProfit / priorRevenue) * 100 : 0;
  const priorAov = prior.length > 0 ? priorRevenue / prior.length : 0;

  // Ad spend totals — split by campaign type
  const allAdEntries = adSpendEntries || [];
  const pmaxEntries = allAdEntries.filter(e => (e.platform || '').includes('pmax'));
  const searchEntries = allAdEntries.filter(e => (e.platform || '').includes('search'));

  const totalAdSpend = allAdEntries.reduce((s, e) => s + Number(e.spend), 0);
  const totalImpressions = allAdEntries.reduce((s, e) => s + (e.impressions || 0), 0);
  const totalClicks = allAdEntries.reduce((s, e) => s + (e.clicks || 0), 0);

  const pmaxSpend = pmaxEntries.reduce((s, e) => s + Number(e.spend), 0);
  const pmaxImpressions = pmaxEntries.reduce((s, e) => s + (e.impressions || 0), 0);
  const pmaxClicks = pmaxEntries.reduce((s, e) => s + (e.clicks || 0), 0);
  const pmaxRoas = pmaxSpend > 0 ? totalRevenue / pmaxSpend : null;
  const profitAfterPmax = trueNetProfit - pmaxSpend;

  const searchSpend = searchEntries.reduce((s, e) => s + Number(e.spend), 0);
  const searchImpressions = searchEntries.reduce((s, e) => s + (e.impressions || 0), 0);
  const searchClicks = searchEntries.reduce((s, e) => s + (e.clicks || 0), 0);
  const searchCpc = searchClicks > 0 ? searchSpend / searchClicks : null;

  const roas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : null;
  const profitAfterAds = trueNetProfit - totalAdSpend;

  const priorTotalAdSpend = (priorAdSpend || []).reduce((s, e) => s + Number(e.spend), 0);
  const priorRoas = priorTotalAdSpend > 0 ? priorRevenue / priorTotalAdSpend : null;

  // ---- Cost breakdown percentages ----
  const costBreakdown = totalRevenue > 0 ? {
    cogsPercent: Math.round((totalCogs / totalRevenue) * 1000) / 10,
    shippingPercent: Math.round(((actualShippingCount > 0 ? totalActualShipping : totalShippingCharged) / totalRevenue) * 1000) / 10,
    stripePercent: Math.round((totalStripeFees / totalRevenue) * 1000) / 10,
    profitPercent: Math.round((trueNetProfit / totalRevenue) * 1000) / 10,
  } : { cogsPercent: 0, shippingPercent: 0, stripePercent: 0, profitPercent: 0 };

  // ---- Daily series for chart ----
  const dailyMap: Record<string, { revenue: number; cogs: number; profit: number; orders: number; adSpend: number; pmaxSpend: number; searchSpend: number }> = {};

  for (const order of orders) {
    const day = order.created_at.split('T')[0];
    if (!dailyMap[day]) dailyMap[day] = { revenue: 0, cogs: 0, profit: 0, orders: 0, adSpend: 0, pmaxSpend: 0, searchSpend: 0 };
    const rev = Number(order.total) - (refundMap[order.id] || 0);
    const cogs = Number(order.total_cogs) || 0;
    dailyMap[day].revenue += rev;
    dailyMap[day].cogs += cogs;
    dailyMap[day].profit += rev - cogs;
    dailyMap[day].orders++;
  }

  for (const entry of allAdEntries) {
    const day = entry.date;
    if (!dailyMap[day]) dailyMap[day] = { revenue: 0, cogs: 0, profit: 0, orders: 0, adSpend: 0, pmaxSpend: 0, searchSpend: 0 };
    const spend = Number(entry.spend);
    dailyMap[day].adSpend += spend;
    if ((entry.platform || '').includes('pmax')) {
      dailyMap[day].pmaxSpend += spend;
    } else if ((entry.platform || '').includes('search')) {
      dailyMap[day].searchSpend += spend;
    }
  }

  const dailySeries = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      cogs: Math.round(data.cogs * 100) / 100,
      profit: Math.round(data.profit * 100) / 100,
      orders: data.orders,
      adSpend: Math.round(data.adSpend * 100) / 100,
      pmaxSpend: Math.round(data.pmaxSpend * 100) / 100,
      searchSpend: Math.round(data.searchSpend * 100) / 100,
    }));

  // ---- By order type breakdown ----
  const cartOrders = orderRows.filter(o => o.orderType === 'cart');
  const packageOrders = orderRows.filter(o => o.orderType === 'package');

  const byOrderType = {
    cart: {
      count: cartOrders.length,
      revenue: cartOrders.reduce((s, o) => s + o.revenue, 0),
      cogs: cartOrders.reduce((s, o) => s + o.cogs, 0),
      profit: cartOrders.reduce((s, o) => s + o.netProfit, 0),
      avgMargin: cartOrders.length > 0
        ? cartOrders.reduce((s, o) => s + o.margin, 0) / cartOrders.length
        : 0,
    },
    package: {
      count: packageOrders.length,
      revenue: packageOrders.reduce((s, o) => s + o.revenue, 0),
      cogs: packageOrders.reduce((s, o) => s + o.cogs, 0),
      profit: packageOrders.reduce((s, o) => s + o.netProfit, 0),
      avgMargin: packageOrders.length > 0
        ? packageOrders.reduce((s, o) => s + o.margin, 0) / packageOrders.length
        : 0,
    },
  };

  // ---- By source breakdown ----
  const googleOrders = orderRows.filter(o => o.utmSource === 'google');
  const organicOrders = orderRows.filter(o => !o.utmSource);

  const bySource = {
    google: {
      count: googleOrders.length,
      revenue: googleOrders.reduce((s, o) => s + o.revenue, 0),
      profit: googleOrders.reduce((s, o) => s + o.netProfit, 0),
    },
    organic: {
      count: organicOrders.length,
      revenue: organicOrders.reduce((s, o) => s + o.revenue, 0),
      profit: organicOrders.reduce((s, o) => s + o.netProfit, 0),
    },
  };

  // ---- Response ----
  return NextResponse.json({
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),

    kpis: {
      revenue: Math.round(totalRevenue * 100) / 100,
      cogs: Math.round(totalCogs * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossMargin: Math.round(grossMargin * 10) / 10,
      netProfit: Math.round(trueNetProfit * 100) / 100,
      netMargin: Math.round(netMargin * 10) / 10,
      orders: orders.length,
      aov: Math.round(aov * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      stripeFees: Math.round(totalStripeFees * 100) / 100,
      shippingCharged: Math.round(totalShippingCharged * 100) / 100,
      actualShipping: Math.round(totalActualShipping * 100) / 100,
      actualShippingCount,
      adSpend: Math.round(totalAdSpend * 100) / 100,
      roas: roas !== null ? Math.round(roas * 100) / 100 : null,
      profitAfterAds: Math.round(profitAfterAds * 100) / 100,
      impressions: totalImpressions,
      clicks: totalClicks,
    },

    pmax: {
      spend: Math.round(pmaxSpend * 100) / 100,
      roas: pmaxRoas !== null ? Math.round(pmaxRoas * 100) / 100 : null,
      profitAfterAds: Math.round(profitAfterPmax * 100) / 100,
      impressions: pmaxImpressions,
      clicks: pmaxClicks,
    },

    search: {
      spend: Math.round(searchSpend * 100) / 100,
      impressions: searchImpressions,
      clicks: searchClicks,
      cpc: searchCpc !== null ? Math.round(searchCpc * 100) / 100 : null,
    },

    priorPeriod: {
      revenue: Math.round(priorRevenue * 100) / 100,
      cogs: Math.round(priorCogs * 100) / 100,
      grossProfit: Math.round(priorGrossProfit * 100) / 100,
      grossMargin: Math.round(priorGrossMargin * 10) / 10,
      orders: prior.length,
      aov: Math.round(priorAov * 100) / 100,
      adSpend: Math.round(priorTotalAdSpend * 100) / 100,
      roas: priorRoas !== null ? Math.round(priorRoas * 100) / 100 : null,
    },

    costBreakdown,
    dailySeries,
    byOrderType,
    bySource,

    orders: orderRows.slice(0, 50),

    missingShippingCost: (missingShippingOrders || []).map(o => ({
      id: o.id,
      orderNumber: o.order_number,
      createdAt: o.created_at,
      total: Number(o.total),
      customerName: o.customer_name || o.company || 'Guest',
      status: o.status,
      shippingCharged: Number(o.shipping_cost) || 0,
    })),
  });
}
