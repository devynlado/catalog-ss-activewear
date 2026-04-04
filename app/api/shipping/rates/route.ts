import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getShipStationRates } from '@/lib/shipstation';
import {
  getItemWarehouse,
  WAREHOUSE_ORIGIN,
  GARMENT_DECOR_ORIGIN,
  WAREHOUSE_CONFIG,
  FLAT_RATE_FALLBACK,
  type Warehouse,
  type LiveShippingRate,
  type LiveRatesResponse,
  type WarehouseLiveRates,
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
  destinationCity?: string;
  destinationState?: string;
  items: RateRequestItem[];
  hasDecoration?: boolean;
}

/**
 * POST /api/shipping/rates
 * Returns live shipping rates from ShipStation V2 for the given destination and items.
 */
export async function POST(request: NextRequest) {
  try {
    const body: RateRequestBody = await request.json();
    const { destinationZip, destinationCity, destinationState, items, hasDecoration } = body;

    if (!destinationZip || !/^\d{5}$/.test(destinationZip)) {
      return NextResponse.json({ error: 'Valid 5-digit zip code required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array required' }, { status: 400 });
    }

    const destination = {
      zip: destinationZip,
      city: destinationCity || '',
      state: destinationState || '',
    };

    const supabase = getServiceSupabase();

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

    interface WarehouseGroup {
      warehouse: Warehouse;
      totalWeightLbs: number;
    }
    const groupMap = new Map<Warehouse, number>();

    for (const item of items) {
      const styleId = styleMap.get(item.sku) ?? item.styleId;
      const wh = getItemWarehouse(styleId);
      const pieceWeight = weightMap.get(item.sku) || 0.5;
      const itemWeight = pieceWeight * item.quantity;
      groupMap.set(wh, (groupMap.get(wh) || 0) + itemWeight);
    }

    const warehouseGroups: WarehouseGroup[] = Array.from(groupMap.entries()).map(
      ([warehouse, totalWeightLbs]) => ({ warehouse, totalWeightLbs })
    );
    warehouseGroups.sort((a, b) => b.totalWeightLbs - a.totalWeightLbs);

    const ratePromises = warehouseGroups.map(async (group) => {
      const origin = hasDecoration
        ? GARMENT_DECOR_ORIGIN
        : WAREHOUSE_ORIGIN[group.warehouse];

      const rates = await getShipStationRates(origin, destination, group.totalWeightLbs);
      return { warehouse: group.warehouse, rates, weightLbs: group.totalWeightLbs };
    });

    const groupResults = await Promise.all(ratePromises);

    let standardTotal = 0;
    let expressTotal = 0;
    let standardCarrier: string | null = null;
    let expressCarrier: string | null = null;
    let isLive = true;

    const warehouseRates: WarehouseLiveRates[] = [];

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

      warehouseRates.push({
        warehouse: gr.warehouse,
        label: WAREHOUSE_CONFIG[gr.warehouse]?.shortLabel || gr.warehouse,
        rates: gr.rates,
      });
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

    const response: LiveRatesResponse = { rates, warehouseRates, fallback: !isLive };
    return NextResponse.json(response);
  } catch (err) {
    console.error('[Shipping Rates API] Error:', err);
    return NextResponse.json({
      rates: FLAT_RATE_FALLBACK,
      warehouseRates: [],
      fallback: true,
    } satisfies LiveRatesResponse);
  }
}
