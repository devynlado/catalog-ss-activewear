/**
 * Populate product_categories junction table
 * 
 * This script fetches category associations for all products in the database
 * and populates the product_categories junction table.
 * 
 * Run with: npx tsx scripts/populate-product-categories.ts
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// SS Activewear API
const SS_USERNAME = process.env.SS_USERNAME || '22831';
const SS_API_KEY = process.env.SS_API_KEY || '49da4fac-9f11-4d7d-8f26-fefaeb28fb14';

interface SSStyle {
  styleID: number;
  categories: string; // Comma-separated category IDs
}

async function fetchStyleCategories(styleIds: number[]): Promise<SSStyle[]> {
  const idsParam = styleIds.join(',');
  
  const response = await fetch(`https://api.ssactivewear.com/v2/styles/?styleID=${idsParam}`, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${SS_USERNAME}:${SS_API_KEY}`).toString('base64'),
    },
  });
  
  if (!response.ok) {
    throw new Error(`SS API error: ${response.status}`);
  }
  
  return response.json();
}

async function populateProductCategories() {
  console.log('Populating product_categories table...\n');
  
  // Get all product style IDs from database
  const { data: products, error } = await supabase
    .from('products')
    .select('style_id')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  
  if (!products || products.length === 0) {
    console.log('No products found in database');
    return;
  }
  
  console.log(`Found ${products.length} products in database\n`);
  
  const styleIds = products.map(p => p.style_id);
  const BATCH_SIZE = 50;
  let totalLinked = 0;
  let totalProducts = 0;
  
  // Process in batches
  for (let i = 0; i < styleIds.length; i += BATCH_SIZE) {
    const batch = styleIds.slice(i, i + BATCH_SIZE);
    
    try {
      // Fetch style data with categories from SS API
      const styles = await fetchStyleCategories(batch);
      
      // Collect all product_categories entries
      const productCategories: { style_id: number; category_id: number }[] = [];
      
      for (const style of styles) {
        if (style.categories) {
          const categoryIds = style.categories
            .split(',')
            .map(id => parseInt(id.trim(), 10))
            .filter(id => !isNaN(id) && id > 0);
          
          for (const categoryId of categoryIds) {
            productCategories.push({
              style_id: style.styleID,
              category_id: categoryId,
            });
          }
          
          totalProducts++;
        }
      }
      
      // Upsert to database
      if (productCategories.length > 0) {
        const { error: upsertError } = await supabase
          .from('product_categories')
          .upsert(productCategories, { onConflict: 'style_id,category_id' });
        
        if (upsertError) {
          console.warn(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: Some category links failed -`, upsertError.message);
        }
        
        totalLinked += productCategories.length;
      }
      
      console.log(`  Processed ${Math.min(i + BATCH_SIZE, styleIds.length)}/${styleIds.length} products (${totalLinked} category links)`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err: any) {
      console.error(`  Batch error:`, err.message);
    }
  }
  
  console.log(`\n✓ Complete! ${totalProducts} products linked to ${totalLinked} category associations`);
  
  // Show some stats
  const { data: stats } = await supabase
    .from('product_categories')
    .select('category_id', { count: 'exact' });
  
  console.log(`\nTotal rows in product_categories: ${stats?.length || 0}`);
  
  // Show top categories by product count
  const { data: topCategories } = await supabase.rpc('get_category_product_counts');
  
  if (topCategories) {
    console.log('\nTop categories by product count:');
    // Just show that it worked - the RPC might not exist yet
  }
}

populateProductCategories().catch(console.error);
