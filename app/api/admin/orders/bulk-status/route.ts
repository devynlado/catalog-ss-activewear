import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { logAdminActivity, type AdminAuditActor } from '@/lib/admin-audit';

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  awaiting_purchasing: 'Awaiting Purchasing',
  ordered: 'Ordered',
  in_production: 'In Production',
  partially_shipped: 'Partially Shipped',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// Statuses that bulk actions are allowed to set. `shipped`/`delivered` are
// intentionally excluded (shipping needs per-order tracking + emails), and so
// are the earlier lifecycle states.
const BULK_TARGET_STATUSES = ['ordered', 'in_production', 'cancelled'] as const;
type BulkTargetStatus = (typeof BULK_TARGET_STATUSES)[number];

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  awaiting_purchasing: 1,
  ordered: 2,
  in_production: 3,
  partially_shipped: 3.5,
  shipped: 4,
  delivered: 5,
  cancelled: 99,
};

// Cap batch size to avoid oversized payloads / long-running requests.
const MAX_BATCH = 100;

function getServiceSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

type OrderRow = {
  id: string;
  order_number: string | null;
  status: string;
  payment_status: string | null;
  stripe_charge_id: string | null;
};

type OrderResult = {
  id: string;
  order_number: string | null;
  outcome: 'updated' | 'skipped';
  reason?: string;
};

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const status = body?.status as string | undefined;
  const rawIds = Array.isArray(body?.orderIds) ? (body.orderIds as unknown[]) : null;

  if (!status || !BULK_TARGET_STATUSES.includes(status as BulkTargetStatus)) {
    return NextResponse.json(
      { error: `Invalid or unsupported bulk status. Allowed: ${BULK_TARGET_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }
  const targetStatus = status as BulkTargetStatus;

  if (!rawIds || rawIds.length === 0) {
    return NextResponse.json({ error: 'No orders selected' }, { status: 400 });
  }

  // De-duplicate + keep only string ids.
  const orderIds = Array.from(
    new Set(rawIds.filter((v): v is string => typeof v === 'string' && v.length > 0))
  );

  if (orderIds.length === 0) {
    return NextResponse.json({ error: 'No valid order ids provided' }, { status: 400 });
  }
  if (orderIds.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Too many orders selected (max ${MAX_BATCH} per request)` },
      { status: 400 }
    );
  }

  const serviceSupabase = getServiceSupabase();

  const { data: orders, error: fetchError } = await serviceSupabase
    .from('orders')
    .select('id, order_number, status, payment_status, stripe_charge_id')
    .in('id', orderIds) as { data: OrderRow[] | null; error: unknown };

  if (fetchError) {
    console.error('[bulk-status] fetch failed:', fetchError);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }

  const orderMap = new Map<string, OrderRow>((orders || []).map((o) => [o.id, o]));

  const results: OrderResult[] = [];
  const eligible: OrderRow[] = [];

  const targetRank = STATUS_ORDER[targetStatus] ?? 0;

  for (const id of orderIds) {
    const order = orderMap.get(id);
    if (!order) {
      results.push({ id, order_number: null, outcome: 'skipped', reason: 'Order not found' });
      continue;
    }

    // Already at the target status → nothing to do.
    if (order.status === targetStatus) {
      results.push({
        id,
        order_number: order.order_number,
        outcome: 'skipped',
        reason: `Already ${ORDER_STATUS_LABELS[targetStatus] ?? targetStatus}`,
      });
      continue;
    }

    if (targetStatus === 'cancelled') {
      // Business rule: shipped/delivered orders cannot be bulk-cancelled.
      if (order.status === 'shipped' || order.status === 'delivered') {
        results.push({
          id,
          order_number: order.order_number,
          outcome: 'skipped',
          reason: `Cannot cancel a ${ORDER_STATUS_LABELS[order.status] ?? order.status} order`,
        });
        continue;
      }
    } else {
      // Forward-only for non-cancel transitions.
      const currentRank = STATUS_ORDER[order.status] ?? 0;
      if (targetRank <= currentRank) {
        results.push({
          id,
          order_number: order.order_number,
          outcome: 'skipped',
          reason: `Cannot move ${ORDER_STATUS_LABELS[order.status] ?? order.status} to ${
            ORDER_STATUS_LABELS[targetStatus] ?? targetStatus
          }`,
        });
        continue;
      }
    }

    eligible.push(order);
  }

  if (eligible.length > 0) {
    const eligibleIds = eligible.map((o) => o.id);

    const updates: Record<string, unknown> = { status: targetStatus };
    if (targetStatus === 'ordered') {
      updates.ordered_at = new Date().toISOString();
    }

    const { error: updateError } = await serviceSupabase
      .from('orders')
      .update(updates)
      .in('id', eligibleIds);

    if (updateError) {
      console.error('[bulk-status] update failed:', updateError);
      return NextResponse.json({ error: 'Failed to update orders' }, { status: 500 });
    }

    // Per-order activity rows (best-effort; do not fail the request on error).
    const activityRows = eligible.map((o) => ({
      order_id: o.id,
      user_id: user.id,
      activity_type: 'status_change',
      details: { from: o.status, to: targetStatus },
    }));
    const { error: activityError } = await serviceSupabase
      .from('order_activities')
      .insert(activityRows);
    if (activityError) {
      console.error('[bulk-status] activity insert failed:', activityError);
    }

    eligible.forEach((o) =>
      results.push({ id: o.id, order_number: o.order_number, outcome: 'updated' })
    );

    // Single summary audit entry for the whole batch.
    const actor: AdminAuditActor = {
      id: profile.id,
      full_name: profile.full_name,
      role: profile.role as 'admin' | 'sales_rep',
    };
    await logAdminActivity(request, {
      action: 'order.bulk_status_changed',
      resourceType: 'order',
      resourceId: null,
      summary: `bulk changed the status of ${eligible.length} order(s) to ${
        ORDER_STATUS_LABELS[targetStatus] ?? targetStatus
      }`,
      actor,
    });
  }

  // Preserve the caller's original ordering in the response.
  const orderIndex = new Map(orderIds.map((id, i) => [id, i]));
  results.sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));

  const updatedCount = results.filter((r) => r.outcome === 'updated').length;
  const skippedCount = results.length - updatedCount;

  // When cancelling, surface which just-cancelled orders were paid so the UI
  // can remind the admin to process those refunds manually.
  let paidCancelledOrders: Array<{ id: string; order_number: string | null }> = [];
  if (targetStatus === 'cancelled') {
    const updatedIds = new Set(
      results.filter((r) => r.outcome === 'updated').map((r) => r.id)
    );
    paidCancelledOrders = eligible
      .filter((o) => updatedIds.has(o.id) && o.payment_status === 'paid')
      .map((o) => ({ id: o.id, order_number: o.order_number }));
  }

  return NextResponse.json({
    results,
    summary: { updated: updatedCount, skipped: skippedCount },
    paidCancelledOrders,
  });
}
