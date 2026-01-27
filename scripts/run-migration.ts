/**
 * Run database migration for category system
 * 
 * Run with: npx tsx scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Supabase client with service key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running category system migration...\n');
  
  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/002_categories.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split into individual statements (rough split on semicolons)
  // This is a simplified approach - for complex migrations use Supabase CLI
  const statements = migrationSql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\n/g, ' ');
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // Try direct query for simple statements
        const { error: directError } = await supabase.from('_exec').select().limit(0);
        
        // If exec_sql doesn't exist, inform user to run manually
        if (error.message.includes('function') || error.message.includes('does not exist')) {
          console.log(`\n⚠️  Cannot execute SQL directly via API.`);
          console.log(`\nPlease run the migration manually:`);
          console.log(`1. Go to your Supabase dashboard`);
          console.log(`2. Open SQL Editor`);
          console.log(`3. Paste and run the contents of: supabase/migrations/002_categories.sql`);
          console.log(`\nAlternatively, use Supabase CLI: supabase db push`);
          return;
        }
        
        console.log(`  ✗ Statement ${i + 1}: ${preview}...`);
        console.log(`    Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`  ✓ Statement ${i + 1}: ${preview}...`);
        successCount++;
      }
    } catch (err: any) {
      console.log(`  ✗ Statement ${i + 1}: ${preview}...`);
      console.log(`    Error: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`\nMigration complete: ${successCount} succeeded, ${errorCount} failed`);
}

// Check if tables exist
async function checkTables() {
  console.log('Checking if tables exist...\n');
  
  const tables = ['categories', 'attribute_groups', 'product_categories'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`  ✗ ${table}: does not exist`);
      } else {
        console.log(`  ? ${table}: ${error.message}`);
      }
    } else {
      console.log(`  ✓ ${table}: exists`);
    }
  }
}

async function main() {
  await checkTables();
  console.log('\n');
  
  // Try to run migration
  // await runMigration();
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Run the migration SQL in Supabase Dashboard > SQL Editor');
  console.log('   File: supabase/migrations/002_categories.sql');
  console.log('\n2. Then run category sync:');
  console.log('   npx tsx scripts/sync-categories.ts');
}

main().catch(console.error);
