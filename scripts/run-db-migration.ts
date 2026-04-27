/**
 * Run database migration directly via Supabase
 * 
 * Run with: npx tsx scripts/run-db-migration.ts
 * 
 * Requires DATABASE_URL in .env.local
 * Get it from: Supabase Dashboard > Settings > Database > Connection string
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('\n⚠️  DATABASE_URL not found in .env.local\n');
  console.log('To get your database URL:');
  console.log('1. Go to https://supabase.com/dashboard/project/baizhdosawppxbiighxz/settings/database');
  console.log('2. Scroll to "Connection string"');
  console.log('3. Copy the "URI" connection string');
  console.log('4. Add to .env.local: DATABASE_URL=postgresql://...\n');
  console.log('Or run the migration manually in SQL Editor.');
  process.exit(1);
}

async function runMigration() {
  console.log('Connecting to database...\n');
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✓ Connected to database\n');
    
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/002_categories.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Running migration...\n');
    
    // Execute the entire migration
    await client.query(migrationSql);
    
    console.log('✓ Migration completed successfully!\n');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('categories', 'attribute_groups', 'product_categories')
    `);
    
    console.log('Created tables:');
    for (const row of result.rows) {
      console.log(`  ✓ ${row.table_name}`);
    }
    
    // Check attribute_groups was seeded
    const attrGroups = await client.query('SELECT COUNT(*) FROM attribute_groups');
    console.log(`\nSeeded ${attrGroups.rows[0].count} attribute groups`);
    
    client.release();
  } catch (err: any) {
    console.error('Migration error:', err.message);
    
    // Check if it's a "already exists" error (which is fine)
    if (err.message.includes('already exists')) {
      console.log('\n✓ Tables already exist - migration previously completed');
    } else {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
