import { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './supabase-server';

/**
 * Admin audit log helper.
 *
 * Goals:
 * - Single point of truth for "an admin/sales_rep did something."
 * - Captures actor (snapshotted name + role), action key, generic summary
 *   (no customer/lead PII), resource link, IP, and user-agent.
 * - Detects bursts (e.g. mass-deletes) and flags the row for follow-up.
 * - Never breaks the caller's request: every failure path is swallowed
 *   and logged to the server console.
 *
 * Callers:
 *   await logAdminActivity(request, {
 *     action: 'order.status_changed',
 *     resourceType: 'order',
 *     resourceId: orderId,
 *     summary: `changed an order status from ${from} to ${to}`,
 *   });
 *
 * The helper resolves the current user from the request cookies, skips
 * silently if the user is not admin/sales_rep, and writes via the service
 * role (which bypasses RLS — the live table has no INSERT policy).
 */

export type AdminAuditActorRole = 'admin' | 'sales_rep';

export interface AdminAuditActor {
  id: string;
  full_name: string | null;
  /**
   * Optional. When provided, used as a fallback display name if `full_name`
   * is null/empty. The helper will also look this up from `profiles` when
   * needed, so callers don't have to thread it through.
   */
  email?: string | null;
  role: AdminAuditActorRole;
}

export interface LogAdminActivityInput {
  /** Stable machine key. Convention: '<resource>.<verb>'. */
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  /**
   * Human-readable, generic summary describing the action.
   * MUST NOT include customer/lead names or emails. Order numbers,
   * coupon codes, and similar non-personal identifiers are fine.
   */
  summary: string;
  /**
   * Override the auto-resolved actor. Used by the sign-in/sign-out
   * endpoints which already know who the user is.
   */
  actor?: AdminAuditActor | null;
}

const BURST_THRESHOLD = 30;
const BURST_WINDOW_SECONDS = 60;

let _serviceClient: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      'admin-audit: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing'
    );
  }

  _serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _serviceClient;
}

function getClientIp(request?: NextRequest | Request | null): string | null {
  if (!request) return null;
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  return null;
}

function getUserAgent(request?: NextRequest | Request | null): string | null {
  if (!request) return null;
  return request.headers.get('user-agent') ?? null;
}

async function resolveActorFromRequest(): Promise<AdminAuditActor | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', user.id)
      .single<{ id: string; full_name: string | null; email: string | null; role: string }>();

    if (!profile) return null;
    if (profile.role !== 'admin' && profile.role !== 'sales_rep') return null;

    return {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email ?? user.email ?? null,
      role: profile.role as AdminAuditActorRole,
    };
  } catch (err) {
    console.error('[admin-audit] resolveActorFromRequest failed:', err);
    return null;
  }
}

/**
 * Compute the best display name to snapshot for this actor. Priority:
 *   1. `actor.full_name` (trimmed, non-empty)
 *   2. local-part of `actor.email` (e.g. "septiani" from "septiani@…")
 *   3. one-shot DB lookup against `profiles` for full_name + email
 *   4. literal "Unknown user" as last resort
 */
async function resolveDisplayName(
  service: SupabaseClient,
  actor: AdminAuditActor
): Promise<string> {
  const fromName = (actor.full_name ?? '').trim();
  if (fromName) return fromName;

  const fromEmail = (actor.email ?? '').trim();
  if (fromEmail) return fromEmail.split('@')[0] || fromEmail;

  // Last resort: look up the profile ourselves. Only happens when the
  // caller passed an actor literal without email AND full_name was empty.
  try {
    const { data } = await service
      .from('profiles')
      .select('full_name, email')
      .eq('id', actor.id)
      .single<{ full_name: string | null; email: string | null }>();

    if (data) {
      const name = (data.full_name ?? '').trim();
      if (name) return name;
      const email = (data.email ?? '').trim();
      if (email) return email.split('@')[0] || email;
    }
  } catch {
    // ignore — we'll fall through to the literal below
  }

  return 'Unknown user';
}

/**
 * Detect if the actor has performed many actions in a short window.
 * Returns the alert reason string when triggered, otherwise null.
 */
async function detectBurst(
  service: SupabaseClient,
  actorId: string
): Promise<string | null> {
  try {
    const since = new Date(
      Date.now() - BURST_WINDOW_SECONDS * 1000
    ).toISOString();

    const { count, error } = await service
      .from('admin_activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('actor_id', actorId)
      .gte('created_at', since);

    if (error) return null;
    if ((count ?? 0) >= BURST_THRESHOLD) {
      return `burst_${BURST_THRESHOLD + 1}_in_${BURST_WINDOW_SECONDS}s`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Log an admin/sales_rep action. Never throws.
 *
 * Pass the originating `NextRequest` (or `Request`) when available so we
 * can capture IP and user-agent for forensic review. Pass `null` for
 * background jobs that are not tied to an HTTP request.
 */
export async function logAdminActivity(
  request: NextRequest | Request | null,
  input: LogAdminActivityInput
): Promise<void> {
  try {
    const actor =
      input.actor !== undefined ? input.actor : await resolveActorFromRequest();

    // No actor and no override → not an admin/sales_rep action; skip silently.
    // (We could log anonymous attempts, but per current scope we focus on
    //  staff actions only.)
    if (!actor) return;

    const service = getServiceClient();

    const [alertReason, displayName] = await Promise.all([
      detectBurst(service, actor.id),
      resolveDisplayName(service, actor),
    ]);

    const { error } = await service.from('admin_activity_log').insert({
      actor_id: actor.id,
      actor_name: displayName,
      actor_role: actor.role,
      action: input.action,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      summary: input.summary,
      ip_address: getClientIp(request),
      user_agent: getUserAgent(request),
      is_alert: alertReason !== null,
      alert_reason: alertReason,
    });

    if (error) {
      console.error('[admin-audit] insert failed:', error);
    }
  } catch (err) {
    console.error('[admin-audit] logAdminActivity threw:', err);
  }
}

/**
 * Convenience for callers that have already resolved the user/profile and
 * just want to write the row. Skips the cookie round-trip.
 */
export async function logAdminActivityWithActor(
  request: NextRequest | Request | null,
  actor: AdminAuditActor,
  input: Omit<LogAdminActivityInput, 'actor'>
): Promise<void> {
  return logAdminActivity(request, { ...input, actor });
}
