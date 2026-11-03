/**
 * Promote user(s) to the `admin` role.
 *
 * Admin access to /admin is gated by `profiles.role === 'admin'`
 * (see app/admin/layout.tsx + middleware.ts). Migration 051 blocks role
 * changes from public API sessions (anon/authenticated), so promotions must
 * run from a privileged session. The service_role key qualifies.
 *
 * The target users must already have signed up (the handle_new_user trigger
 * auto-creates their profile row on first signup).
 *
 * Usage:
 *   npx tsx scripts/promote-admin.ts email1@example.com email2@example.com
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
  console.error(
    '\n❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n'
  );
  process.exit(1);
}

const emails = process.argv.slice(2).map((e) => e.trim().toLowerCase()).filter(Boolean);

if (emails.length === 0) {
  console.error('\nUsage: npx tsx scripts/promote-admin.ts <email> [email2 ...]\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\nPromoting ${emails.length} account(s) to admin...\n`);

  for (const email of emails) {
    // Match case-insensitively; profiles.email is stored as provided at signup.
    const { data: existing, error: findErr } = await supabase
      .from('profiles')
      .select('id, email, role')
      .ilike('email', email)
      .maybeSingle();

    if (findErr) {
      console.error(`  ✗ ${email}: lookup failed — ${findErr.message}`);
      continue;
    }

    if (!existing) {
      console.error(
        `  ✗ ${email}: no profile found. Make sure they completed signup at /signup first.`
      );
      continue;
    }

    if (existing.role === 'admin') {
      console.log(`  • ${email}: already admin (no change)`);
      continue;
    }

    const { error: updErr } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', existing.id);

    if (updErr) {
      console.error(`  ✗ ${email}: update failed — ${updErr.message}`);
      continue;
    }

    console.log(`  ✓ ${email}: ${existing.role} → admin`);
  }

  console.log('\nDone.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
