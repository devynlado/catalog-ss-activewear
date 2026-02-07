/**
 * Check Otto Cap product images in the database
 * Run with: node scripts/check-otto-images.js
 */

const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkOttoImages() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('\n=== Checking Otto Cap Products in Database ===\n');
  
  // Check products table
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('style_id, style_name, brand_name, primary_image_url, is_active')
    .eq('supplier', 'otto_cap')
    .limit(10);
  
  if (prodError) {
    console.error('Error querying products:', prodError.message);
  } else {
    console.log(`Found ${products?.length || 0} Otto Cap products (showing first 10):\n`);
    products?.forEach(p => {
      const imgStatus = p.primary_image_url 
        ? (p.primary_image_url.startsWith('http') ? '✓ Valid URL' : '✗ Invalid: ' + p.primary_image_url.substring(0, 30))
        : '✗ Empty';
      console.log(`  Style ${p.style_name}: ${imgStatus}`);
    });
  }
  
  // Check product_colors table
  console.log('\n--- Product Colors ---\n');
  const { data: colors, error: colorError } = await supabase
    .from('product_colors')
    .select('id, style_id, color_name, swatch_image, front_image, back_image, side_image')
    .eq('supplier', 'otto_cap')
    .limit(10);
  
  if (colorError) {
    console.error('Error querying colors:', colorError.message);
  } else {
    console.log(`Found ${colors?.length || 0} Otto Cap colors (showing first 10):\n`);
    colors?.forEach(c => {
      console.log(`  Color ${c.id}:`);
      console.log(`    swatch: ${c.swatch_image ? (c.swatch_image.startsWith('http') ? '✓' : '✗ ' + c.swatch_image.substring(0, 20)) : '(empty)'}`);
      console.log(`    front:  ${c.front_image ? (c.front_image.startsWith('http') ? '✓' : '✗ ' + c.front_image.substring(0, 20)) : '(empty)'}`);
      console.log(`    back:   ${c.back_image ? '✓' : '(empty)'}`);
      console.log(`    side:   ${c.side_image ? '✓' : '(empty)'}`);
    });
  }
  
  // Count total Otto Cap products
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('supplier', 'otto_cap');
  
  const { count: totalColors } = await supabase
    .from('product_colors')
    .select('*', { count: 'exact', head: true })
    .eq('supplier', 'otto_cap');
  
  const { count: totalSkus } = await supabase
    .from('product_skus')
    .select('*', { count: 'exact', head: true })
    .eq('supplier', 'otto_cap');
  
  console.log('\n--- Totals ---');
  console.log(`  Products: ${totalProducts || 0}`);
  console.log(`  Colors: ${totalColors || 0}`);
  console.log(`  SKUs: ${totalSkus || 0}`);
  
  // Check for invalid image URLs
  const { data: invalidImages } = await supabase
    .from('product_colors')
    .select('id, front_image')
    .eq('supplier', 'otto_cap')
    .not('front_image', 'like', 'http%')
    .not('front_image', 'is', null)
    .limit(5);
  
  if (invalidImages && invalidImages.length > 0) {
    console.log('\n--- Invalid front_image values found ---');
    invalidImages.forEach(c => {
      console.log(`  ${c.id}: "${c.front_image}"`);
    });
  }
  
  console.log('\nDone!');
}

checkOttoImages().catch(console.error);
