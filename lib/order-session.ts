import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export interface CustomerInfo {
  name: string | null;
  company: string | null;
  phone: string | null;
}

export interface OrderSession {
  email: string;
  sessionToken: string;
  customer: CustomerInfo;
}

/**
 * Validate the order_session cookie and return the associated email + customer info.
 * Returns null if the session is invalid or expired.
 */
export async function getOrderSession(): Promise<OrderSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('order_session')?.value;

  if (!sessionToken) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('order_tracking_sessions')
    .select('email, session_token, expires_at')
    .eq('session_token', sessionToken)
    .single();

  if (error || !data) return null;

  if (new Date(data.expires_at) < new Date()) {
    return null;
  }

  // Fetch customer info from the most recent paid order
  const { data: recentOrder } = await supabase
    .from('orders')
    .select('customer_name, company, customer_phone')
    .ilike('customer_email', data.email)
    .neq('payment_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    email: data.email,
    sessionToken: data.session_token,
    customer: {
      name: recentOrder?.customer_name || null,
      company: recentOrder?.company || null,
      phone: recentOrder?.customer_phone || null,
    },
  };
}
