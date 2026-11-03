/**
 * Inspect an auth user: confirmation state, providers/identities, timestamps.
 *
 * Usage:
 *   npx tsx scripts/inspect-user.ts email@example.com
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('\n❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n');
  process.exit(1);
}

const email = (process.argv[2] ?? '').trim().toLowerCase();
if (!email) {
  console.error('\nUsage: npx tsx scripts/inspect-user.ts <email>\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const perPage = 1000;
  let user: any = null;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (user || data.users.length < perPage) break;
  }

  if (!user) {
    console.error(`\nNo auth user found for ${email}\n`);
    process.exit(1);
  }

  console.log('\n--- auth user ---');
  console.log('id:               ', user.id);
  console.log('email:            ', user.email);
  console.log('email_confirmed_at:', user.email_confirmed_at ?? '(not confirmed)');
  console.log('created_at:       ', user.created_at);
  console.log('last_sign_in_at:  ', user.last_sign_in_at ?? '(never)');
  console.log('providers:        ', (user.app_metadata?.providers ?? user.app_metadata?.provider ?? '[]'));
  console.log(
    'identities:       ',
    (user.identities ?? []).map((i: any) => i.provider).join(', ') || '(none)'
  );
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
