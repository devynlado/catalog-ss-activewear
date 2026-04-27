import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Lazy-initialized client-side Supabase client (limited permissions)
let _supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient() {
  if (!_supabaseClient) {
    _supabaseClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabaseClient;
}

// Legacy export for backwards compatibility (lazy getter)
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    return (getSupabaseClient() as any)[prop];
  }
});

// Server-side Supabase client (full permissions)
export function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Type exports for convenience
export type { Database } from './database.types';
