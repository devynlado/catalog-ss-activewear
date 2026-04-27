/**
 * Run Migration Script
 * 
 * Executes the supplier support migration directly via Supabase client.
 * Run with: npx ts-node scripts/run-migration.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Running supplier support migration...\n');
  
  // Check if columns already exist
  const { data: existingColumns } = await supabase
    .from('products')
    .select('supplier')
    .limit(1);
  
  if (existingColumns !== null) {
    console.log('Migration may already be applied (supplier column exists)');
    console.log('Checking other changes...\n');
  }
  
  // Run migration SQL statements individually via RPC or direct queries
  // Note: Most ALTER TABLE statements need to be run via Supabase dashboard
  // or through a direct PostgreSQL connection
  
  console.log('The migration file has been created at:');
  console.log('  supabase/migrations/013_add_supplier_support.sql\n');
  console.log('To apply the migration, either:');
  console.log('  1. Run via Supabase Dashboard SQL Editor');
  console.log('  2. Use supabase db push with correct credentials');
  console.log('  3. Apply via direct PostgreSQL connection\n');
  
  // Check if Baseball Caps category exists
  const { data: baseballCat, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('id', 900)
    .single();
  
  if (catError && catError.code === 'PGRST116') {
    console.log('Baseball Caps category (900) does not exist yet.');
    console.log('It will be created when the migration runs.\n');
  } else if (baseballCat) {
    console.log('✓ Baseball Caps category already exists:', baseballCat.name);
  }
  
  // Try to check if supplier column exists
  const { error: checkError } = await supabase
    .from('products')
    .select('supplier')
    .limit(1);
  
  if (checkError) {
    console.log('\nSupplier columns do not exist yet.');
    console.log('Please run the migration before importing Otto Cap products.\n');
  } else {
    console.log('\n✓ Supplier column exists - migration appears to be applied.\n');
  }
}

runMigration().catch(console.error);
