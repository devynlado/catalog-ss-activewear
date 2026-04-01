import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getShipStationRates } from '@/lib/shipstation';
import {
  getItemWarehouse,
  WAREHOUSE_ORIGIN_ZIP,
  GARMENT_DECOR_ZIP,
  FLAT_RATE_FALLBACK,
  type Warehouse,
  type LiveShippingRate,
  type LiveRatesResponse,
} from '@/lib/shipping';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface RateRequestItem {
  sku: string;
  quantity: number;
  styleId: number;
}

interface RateRequestBody {
  destinationZip: string;
  items: RateRequestItem[];
  hasDecoration?: boolean;
}

/**
 * POST /api/shipping/rates
 * Returns live shipping rates from ShipStation for the given destination and items.
 */
export async function POST(request: NextRequest) {
  try {
    const body: RateRequestBody = await request.json();
    const { destinationZip, items, hasDecoration } = body;

    if (!destinationZip || !/^\d{5}$/.test(destinationZip)) {
      return NextResponse.json({ error: 'Valid 5-digit zip code required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Look up piece_weight for all SKUs in one batch
    const skus = items.map(i => i.sku).filter(Boolean);
    const { data: skuRows } = await supabase
      .from('product_skus')
      .select('sku, piece_weight, style_id')
      .in('sku', skus);

    const weightMap = new Map<string, number>();
    const styleMap = new Map<string, number>();
    for (const row of skuRows || []) {
      weightMap.set(row.sku, Number(row.piece_weight) || 0);
      styleMap.set(row.sku, row.style_id);
    }

    // 2. Group items by warehouse and calculate total weight per group
    interface WarehouseGroup {
      warehouse: Warehouse;
      totalWeightLbs: number;
    }
    const groupMap = new Map<Warehouse, number>();

    for (const item of items) {
      const styleId = styleMap.get(item.sku) ?? item.styleId;
      const wh = getItemWarehouse(styleId);
      const pieceWeight = weightMap.get(item.sku) || 0.5; // fallback 0.5 lb if missing
      const itemWeight = pieceWeight * item.quantity;
      groupMap.set(wh, (groupMap.get(wh) || 0) + itemWeight);
    }

    const warehouseGroups: WarehouseGroup[] = Array.from(groupMap.entries()).map(
      ([warehouse, totalWeightLbs]) => ({ warehouse, totalWeightLbs })
    );

    // Sort by weight desc — heaviest group is primary
    warehouseGroups.sort((a, b) => b.totalWeightLbs - a.totalWeightLbs);

    // 3. Fetch rates for each warehouse group (in parallel)
    const ratePromises = warehouseGroups.map(async (group) => {
      const originZip = hasDecoration
        ? GARMENT_DECOR_ZIP
        : WAREHOUSE_ORIGIN_ZIP[group.warehouse];

      const rates = await getShipStationRates(
        originZip,
        destinationZip,
        group.totalWeightLbs,
      );

      return { warehouse: group.warehouse, rates, weightLbs: group.totalWeightLbs };
    });

    const groupResults = await Promise.all(ratePromises);

    // 4. Aggregate rates across warehouse groups
    // For multi-warehouse orders, sum the standard rates and sum the express rates
    let standardTotal = 0;
    let expressTotal = 0;
    let standardCarrier: string | null = null;
    let expressCarrier: string | null = null;
    let isLive = true;

    for (const gr of groupResults) {
      const std = gr.rates.find(r => r.method === 'standard');
      const exp = gr.rates.find(r => r.method === 'express');
      if (std) {
        standardTotal += std.price;
        if (!standardCarrier && std.carrier) standardCarrier = std.carrier;
        if (!std.isLive) isLive = false;
      }
      if (exp) {
        expressTotal += exp.price;
        if (!expressCarrier && exp.carrier) expressCarrier = exp.carrier;
        if (!exp.isLive) isLive = false;
      }
    }

    standardTotal = Math.round(standardTotal * 100) / 100;
    expressTotal = Math.round(expressTotal * 100) / 100;

    const rates: LiveShippingRate[] = [
      {
        method: 'standard',
        price: standardTotal,
        estimatedDays: [3, 7],
        carrier: standardCarrier,
        isLive,
      },
      {
        method: 'express',
        price: expressTotal,
        estimatedDays: [1, 3],
        carrier: expressCarrier,
        isLive,
      },
    ];

    const response: LiveRatesResponse = {
      rates,
      fallback: !isLive,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[Shipping Rates API] Error:', err);
    return NextResponse.json({
      rates: FLAT_RATE_FALLBACK,
      fallback: true,
    } satisfies LiveRatesResponse);
  }
}
