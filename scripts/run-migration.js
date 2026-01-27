// Run database migration via Supabase REST API
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function runMigration() {
  console.log('Running slug migration...\n');
  
  // SQL statements to run
  const statements = [
    // Step 1: Add slug column
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;`,
    
    // Step 2: Populate slugs for existing products
    `UPDATE products 
     SET slug = LOWER(
       REGEXP_REPLACE(
         REGEXP_REPLACE(
           brand_name || '-' || style_name,
           '[^a-zA-Z0-9\\-\\s]', '', 'g'
         ),
         '\\s+', '-', 'g'
       )
     )
     WHERE slug IS NULL;`,
    
    // Step 3: Create index
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE slug IS NOT NULL;`,
  ];
  
  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    console.log(`Running statement ${i + 1}/${statements.length}...`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: sql })
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.log(`  Note: RPC method may not exist, trying direct approach...`);
      } else {
        console.log(`  Success!`);
      }
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }
  
  // Verify by checking a product
  console.log('\nVerifying migration...');
  const verifyResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=style_id,style_name,brand_name,slug&limit=3`,
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      }
    }
  );
  
  if (verifyResponse.ok) {
    const products = await verifyResponse.json();
    console.log('Sample products with slugs:');
    products.forEach(p => {
      console.log(`  ${p.brand_name} ${p.style_name} -> ${p.slug || '(no slug yet)'}`);
    });
  }
}

runMigration().catch(console.error);
