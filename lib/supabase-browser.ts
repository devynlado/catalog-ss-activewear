import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

// ============================================
// BROWSER CLIENT (for client components)
// ============================================

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Skip Navigator LockManager (avoids 10s timeouts / orphaned locks from Strict Mode, multi-tab, HMR)
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    }
  );
}

// ============================================
// AUTH HELPER FUNCTIONS (Client-side)
// ============================================

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * Sign in with Google OAuth
 * Redirects to Google, then back to your callback URL
 */
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || `${window.location.origin}/api/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  return { data, error };
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string, 
  password: string, 
  metadata?: { full_name?: string; phone?: string; company?: string }
) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
  return { data, error };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

/**
 * Update password (after reset or while logged in)
 */
export async function updatePassword(newPassword: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}

/**
 * Get the current session (client-side)
 */
export async function getSession() {
  const supabase = createSupabaseBrowserClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

/**
 * Get the current user (client-side)
 */
export async function getUser() {
  const supabase = createSupabaseBrowserClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * Get the user's profile (client-side)
 */
export async function getProfile() {
  const supabase = createSupabaseBrowserClient();
  
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

/**
 * Update the user's profile
 */
export async function updateProfile(updates: {
  full_name?: string;
  phone?: string;
  company?: string;
  avatar_url?: string;
  notification_preferences?: {
    email_new_message?: boolean;
    email_quote_status?: boolean;
    email_marketing?: boolean;
  };
}) {
  const supabase = createSupabaseBrowserClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { profile: null, error: userError };
  }
  
  // Use type assertion to handle the update
  const { data: profile, error: profileError } = await (supabase
    .from('profiles') as any)
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();
    
  return { profile, error: profileError };
}

// ============================================
// TYPE EXPORTS
// ============================================

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
