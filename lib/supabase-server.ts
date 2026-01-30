import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './database.types';

// ============================================
// SERVER CLIENT (for server components, API routes, server actions)
// ============================================

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

// ============================================
// SERVER-SIDE AUTH FUNCTIONS
// ============================================

/**
 * Get the current user from server-side (for server components, API routes)
 */
export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * Get the current session from server-side
 */
export async function getServerSession() {
  const supabase = await createSupabaseServerClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

/**
 * Get the user's profile from the database (server-side)
 */
export async function getServerProfile(): Promise<{ 
  profile: Database['public']['Tables']['profiles']['Row'] | null; 
  error: Error | null;
}> {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { profile: null, error: userError };
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return { profile, error: profileError };
}

// ============================================
// ROLE CHECK FUNCTIONS
// ============================================

type UserRole = 'customer' | 'sales_rep' | 'admin';

/**
 * Check if the current user has a specific role (server-side)
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const { profile, error } = await getServerProfile();
  if (error || !profile) return false;
  return (profile as { role: UserRole }).role === role;
}

/**
 * Check if the current user is an admin (server-side)
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Check if the current user is a sales rep (server-side)
 */
export async function isSalesRep(): Promise<boolean> {
  const { profile, error } = await getServerProfile();
  if (error || !profile) return false;
  const userRole = (profile as { role: UserRole }).role;
  return userRole === 'sales_rep' || userRole === 'admin';
}

// ============================================
// TYPE EXPORTS
// ============================================

export type Profile = Database['public']['Tables']['profiles']['Row'];
