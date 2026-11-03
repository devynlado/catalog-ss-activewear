/**
 * Set / reset a user's password via the Admin API (service_role).
 *
 * Useful when a dev-created account won't accept its password (e.g. the signup
 * didn't persist it, or you just forgot it). Also ensures the email is
 * confirmed so the account can log in immediately.
 *
 * Usage:
 *   # set a specific password
 *   npx tsx scripts/set-password.ts email@example.com "YourNewPassw0rd!"
 *
 *   # or omit the password to generate a strong random one (printed once)
 *   npx tsx scripts/set-password.ts email@example.com
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('\n❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n');
  process.exit(1);
}

const email = (process.argv[2] ?? '').trim().toLowerCase();
let password = process.argv[3];

if (!email) {
  console.error('\nUsage: npx tsx scripts/set-password.ts <email> [password]\n');
  process.exit(1);
}

let generated = false;
if (!password) {
  // base64url ~16 bytes -> strong, URL-safe, no ambiguous quoting issues.
  password = randomBytes(16).toString('base64url');
  generated = true;
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(target: string) {
  const perPage = 1000;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < perPage) break;
  }
  return null;
}

async function main() {
  const user = await findUserByEmail(email);
  if (!user) {
    console.error(`\nNo auth user found for ${email}. Did they complete /signup?\n`);
    process.exit(1);
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });

  if (error) {
    console.error(`\n✗ Failed to set password for ${email}: ${error.message}\n`);
    process.exit(1);
  }

  console.log(`\n✓ Password updated for ${email}`);
  if (generated) {
    console.log(`\n  Temporary password: ${password}`);
    console.log('  Log in with it, then change it from your account settings.\n');
  } else {
    console.log('  Log in with the password you provided.\n');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
