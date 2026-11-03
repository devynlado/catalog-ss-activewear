/**
 * Mark user email(s) as confirmed (bypass the signup confirmation email).
 *
 * Supabase blocks login with "Email not confirmed" until the user clicks the
 * confirmation link. During local dev that email often never arrives, so this
 * uses the Admin API (service_role) to confirm the address directly.
 *
 * Usage:
 *   npx tsx scripts/confirm-email.ts email1@example.com [email2 ...]
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
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

const emails = process.argv.slice(2).map((e) => e.trim().toLowerCase()).filter(Boolean);

if (emails.length === 0) {
  console.error('\nUsage: npx tsx scripts/confirm-email.ts <email> [email2 ...]\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email: string) {
  // Paginate through auth users to find a case-insensitive email match.
  const perPage = 1000;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < perPage) break;
  }
  return null;
}

async function main() {
  console.log(`\nConfirming ${emails.length} email(s)...\n`);

  for (const email of emails) {
    try {
      const user = await findUserByEmail(email);
      if (!user) {
        console.error(`  ✗ ${email}: no auth user found. Did they complete /signup?`);
        continue;
      }

      if (user.email_confirmed_at) {
        console.log(`  • ${email}: already confirmed (no change)`);
        continue;
      }

      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

      if (error) {
        console.error(`  ✗ ${email}: update failed — ${error.message}`);
        continue;
      }

      console.log(`  ✓ ${email}: confirmed`);
    } catch (err: any) {
      console.error(`  ✗ ${email}: ${err.message ?? err}`);
    }
  }

  console.log('\nDone.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
