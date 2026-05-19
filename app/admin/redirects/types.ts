/**
 * Shared client-side types for /admin/redirects. Mirror the JSON shape
 * returned by the corresponding API routes so each tab component can
 * type-narrow without duplicating the contract.
 */

export type TargetType = 'product' | 'category' | 'gone';

export interface RedirectTargetProduct {
  style_id: number;
  style_name: string;
  brand_name: string;
  title_optimized: string | null;
  title_raw: string | null;
  slug: string | null;
  is_active: boolean;
  manually_hidden: boolean;
}

export interface RedirectRow {
  id: string;
  from_path: string;
  target_type: TargetType;
  to_product_id: number | null;
  to_url: string | null;
  status_code: number;
  promote_to_301_at: string | null;
  is_active: boolean;
  notes: string | null;
  hits: number;
  last_hit_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  target_product: RedirectTargetProduct | null;
}

export interface NotFoundPathRow {
  path: string;
  hits: number;
  is_bot: boolean;
  first_seen: string;
  last_seen: string;
  last_referrer: string | null;
  last_user_agent: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolution_type: 'redirect' | 'ignored' | null;
  resolution_redirect_id: string | null;
}

export type HistoryAction =
  | 'created'
  | 'updated'
  | 'activated'
  | 'deactivated'
  | 'promoted'
  | 'deleted'
  | 'imported';

export interface HistoryRow {
  id: string;
  redirect_id: string;
  from_path: string;
  action: HistoryAction;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: any;
  changed_at: string;
  changed_by: string | null;
  changed_by_name: string | null;
}
