/**
 * Sync SS Activewear categories to Supabase database
 * 
 * Run with: npx tsx scripts/sync-categories.ts
 * 
 * This script:
 * 1. Fetches all 767 categories from SS Activewear API
 * 2. Classifies each category (main, subcategory, attribute, guide)
 * 3. Assigns attribute groups (sleeve, material, weight, etc.)
 * 4. Upserts to the categories table in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { MAIN_CATEGORIES, SUB_CATEGORIES } from '../lib/category-taxonomy';
import type { Database } from '../lib/database.types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// SS Activewear API credentials
const SS_USERNAME = process.env.SS_USERNAME || '22831';
const SS_API_KEY = process.env.SS_API_KEY || '49da4fac-9f11-4d7d-8f26-fefaeb28fb14';

interface SSCategory {
  categoryID: number;
  name: string;
  image: string;
}

type CategoryType = 'main' | 'subcategory' | 'attribute' | 'guide';
type AttributeGroup = 'sleeve' | 'collar' | 'material' | 'weight' | 'fit' | 'gender' | 
                      'treatment' | 'feature' | 'sustainable' | 'structure' | 'panel' | 
                      'closure' | 'zipper' | 'pattern' | 'tag' | 'ply';

interface ClassifiedCategory {
  id: number;
  name: string;
  type: CategoryType;
  attribute_group: AttributeGroup | null;
  parent_id: number | null;
  slug: string | null;
  display_order: number;
  is_active: boolean;
}

// Classification patterns
const GUIDE_PATTERNS = [
  /Guide/i,
  /Playbook/i,
  /^20\d{2}\s/i,  // Year-prefixed (2025 Fleece)
  /Lifestyle.*Market/i,
  /What's New/i,
  /^Sale\s?-/i,
  /Silo\s/i,
  /Spotlight/i,
  /Ready\s/i,
  /Corporate\s/i,
];

const ATTRIBUTE_PATTERNS: { pattern: RegExp; group: AttributeGroup }[] = [
  // Weight (oz ranges)
  { pattern: /^\d+-?\d*\.?\d*\s*oz/i, group: 'weight' },
  { pattern: /oz and over$/i, group: 'weight' },
  { pattern: /^Heavy \(/i, group: 'weight' },
  { pattern: /^Light \(/i, group: 'weight' },
  
  // Ply
  { pattern: /^\d+-Ply$/i, group: 'ply' },
  
  // Sleeve
  { pattern: /^Short Sleeves?$/i, group: 'sleeve' },
  { pattern: /^Long Sleeves?$/i, group: 'sleeve' },
  { pattern: /^Sleeveless$/i, group: 'sleeve' },
  { pattern: /^3\/4 Sleeves?$/i, group: 'sleeve' },
  { pattern: /^Cap Sleeves?$/i, group: 'sleeve' },
  
  // Collar
  { pattern: /^Crewneck$/i, group: 'collar' },
  { pattern: /^V-Neck$/i, group: 'collar' },
  { pattern: /^Henley$/i, group: 'collar' },
  { pattern: /^Scoop Neck$/i, group: 'collar' },
  { pattern: /^Mock Neck$/i, group: 'collar' },
  
  // Fit
  { pattern: /^Fitted$/i, group: 'fit' },
  { pattern: /^Relaxed$/i, group: 'fit' },
  { pattern: /^Cropped$/i, group: 'fit' },
  { pattern: /^Flowy$/i, group: 'fit' },
  { pattern: /^Oversized$/i, group: 'fit' },
  { pattern: /^Slim Fit$/i, group: 'fit' },
  
  // Material
  { pattern: /^100% Cotton$/i, group: 'material' },
  { pattern: /^Cotton$/i, group: 'material' },
  { pattern: /^Polyester$/i, group: 'material' },
  { pattern: /^Triblends?$/i, group: 'material' },
  { pattern: /^CVC$/i, group: 'material' },
  { pattern: /^Ringspun$/i, group: 'material' },
  { pattern: /^Performance$/i, group: 'material' },
  { pattern: /^Pique$/i, group: 'material' },
  { pattern: /^French Terry$/i, group: 'material' },
  
  // Gender/Age
  { pattern: /^Mens?$/i, group: 'gender' },
  { pattern: /^Womens?$/i, group: 'gender' },
  { pattern: /^Unisex$/i, group: 'gender' },
  { pattern: /^Youth$/i, group: 'gender' },
  { pattern: /^Kids?$/i, group: 'gender' },
  { pattern: /^Infants?$/i, group: 'gender' },
  { pattern: /^Toddler$/i, group: 'gender' },
  { pattern: /^Mens? & Unisex$/i, group: 'gender' },
  { pattern: /^Infants? & Toddlers?$/i, group: 'gender' },
  { pattern: /^Adult$/i, group: 'gender' },
  
  // Treatment
  { pattern: /^Garment Dyed$/i, group: 'treatment' },
  { pattern: /^Pigment Dyed$/i, group: 'treatment' },
  { pattern: /^Tie Dye/i, group: 'treatment' },
  { pattern: /^Acid Wash/i, group: 'treatment' },
  { pattern: /^Vintage Wash$/i, group: 'treatment' },
  { pattern: /^Stone Wash/i, group: 'treatment' },
  { pattern: /^Preshrunk$/i, group: 'treatment' },
  
  // Features
  { pattern: /^Hooded$/i, group: 'feature' },
  { pattern: /^Pockets?$/i, group: 'feature' },
  { pattern: /^Thumbholes?$/i, group: 'feature' },
  { pattern: /^Tagless$/i, group: 'tag' },
  { pattern: /^Tear Away$/i, group: 'tag' },
  { pattern: /^Moisture/i, group: 'feature' },
  
  // Zipper
  { pattern: /^Full[- ]?Zips?$/i, group: 'zipper' },
  { pattern: /^Quarter[- ]?Zips?$/i, group: 'zipper' },
  { pattern: /^Half[- ]?Zips?$/i, group: 'zipper' },
  
  // Structure (Headwear)
  { pattern: /^Structured$/i, group: 'structure' },
  { pattern: /^Unstructured$/i, group: 'structure' },
  { pattern: /^Soft[- ]?Structured$/i, group: 'structure' },
  { pattern: /^Low Profile$/i, group: 'structure' },
  { pattern: /^Mid Profile$/i, group: 'structure' },
  { pattern: /^High Profile$/i, group: 'structure' },
  
  // Panel (Headwear)
  { pattern: /^Five[- ]?Panel/i, group: 'panel' },
  { pattern: /^Six[- ]?Panel/i, group: 'panel' },
  { pattern: /^5[- ]?Panel/i, group: 'panel' },
  { pattern: /^6[- ]?Panel/i, group: 'panel' },
  
  // Closure (Headwear)
  { pattern: /^Snapback$/i, group: 'closure' },
  { pattern: /^Adjustable$/i, group: 'closure' },
  { pattern: /^Hook and Loop$/i, group: 'closure' },
  { pattern: /^Velcro$/i, group: 'closure' },
  { pattern: /^Buckle$/i, group: 'closure' },
  
  // Sustainable
  { pattern: /^Organic$/i, group: 'sustainable' },
  { pattern: /^Recycled$/i, group: 'sustainable' },
  { pattern: /^Sustainable/i, group: 'sustainable' },
  { pattern: /^Eco[- ]?Friendly$/i, group: 'sustainable' },
  
  // Pattern
  { pattern: /^Camouflage$/i, group: 'pattern' },
  { pattern: /^Heather/i, group: 'pattern' },
];

// Slugify a category name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Classify a single category
function classifyCategory(cat: SSCategory): ClassifiedCategory {
  const id = cat.categoryID;
  const name = cat.name.trim();
  
  // Check if it's a main category
  if (MAIN_CATEGORIES[id]) {
    return {
      id,
      name: MAIN_CATEGORIES[id].name,
      type: 'main',
      attribute_group: null,
      parent_id: null,
      slug: MAIN_CATEGORIES[id].slug,
      display_order: MAIN_CATEGORIES[id].order,
      is_active: true,
    };
  }
  
  // Check if it's in our SUB_CATEGORIES mapping
  if (SUB_CATEGORIES[id]) {
    const subCat = SUB_CATEGORIES[id];
    return {
      id,
      name: subCat.name,
      type: subCat.isProductType ? 'subcategory' : 'attribute',
      attribute_group: subCat.isProductType ? null : determineAttributeGroup(subCat.name),
      parent_id: subCat.parentId === 0 ? null : subCat.parentId,
      slug: subCat.slug,
      display_order: 0,
      is_active: true,
    };
  }
  
  // Check if it's a guide
  for (const pattern of GUIDE_PATTERNS) {
    if (pattern.test(name)) {
      return {
        id,
        name,
        type: 'guide',
        attribute_group: null,
        parent_id: null,
        slug: slugify(name),
        display_order: 0,
        is_active: true,
      };
    }
  }
  
  // Check if it's an attribute
  for (const { pattern, group } of ATTRIBUTE_PATTERNS) {
    if (pattern.test(name)) {
      return {
        id,
        name,
        type: 'attribute',
        attribute_group: group,
        parent_id: null,
        slug: slugify(name),
        display_order: 0,
        is_active: true,
      };
    }
  }
  
  // Default: subcategory
  return {
    id,
    name,
    type: 'subcategory',
    attribute_group: null,
    parent_id: null,
    slug: slugify(name),
    display_order: 0,
    is_active: true,
  };
}

// Determine attribute group from name
function determineAttributeGroup(name: string): AttributeGroup | null {
  for (const { pattern, group } of ATTRIBUTE_PATTERNS) {
    if (pattern.test(name)) {
      return group;
    }
  }
  return null;
}

// Fetch categories from SS Activewear
async function fetchSSCategories(): Promise<SSCategory[]> {
  console.log('Fetching categories from SS Activewear API...');
  
  const response = await fetch('https://api.ssactivewear.com/v2/categories/', {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${SS_USERNAME}:${SS_API_KEY}`).toString('base64'),
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }
  
  const categories = await response.json() as SSCategory[];
  console.log(`Fetched ${categories.length} categories`);
  return categories;
}

// Main sync function
async function syncCategories() {
  console.log('Starting category sync...\n');
  
  // Fetch categories
  const ssCategories = await fetchSSCategories();
  
  // Classify all categories
  const classified = ssCategories.map(classifyCategory);
  
  // Count by type
  const counts = {
    main: 0,
    subcategory: 0,
    attribute: 0,
    guide: 0,
  };
  
  for (const cat of classified) {
    counts[cat.type]++;
  }
  
  console.log('\nClassification Summary:');
  console.log(`  Main categories: ${counts.main}`);
  console.log(`  Subcategories: ${counts.subcategory}`);
  console.log(`  Attributes: ${counts.attribute}`);
  console.log(`  Guides: ${counts.guide}`);
  console.log(`  Total: ${classified.length}\n`);
  
  // Upsert to database - insert parent categories first to satisfy foreign keys
  console.log('Upserting to database...');
  
  // Separate into categories without parent_id (insert first) and with parent_id (insert second)
  const noParent = classified.filter(c => c.parent_id === null);
  const withParent = classified.filter(c => c.parent_id !== null);
  
  console.log(`  ${noParent.length} categories without parent, ${withParent.length} with parent`);
  
  const batchSize = 100;
  let inserted = 0;
  
  // First pass: categories without parent_id
  for (let i = 0; i < noParent.length; i += batchSize) {
    const batch = noParent.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('categories')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error upserting no-parent batch:`, error);
    } else {
      inserted += batch.length;
    }
  }
  console.log(`  Inserted ${inserted} categories without parent`);
  
  // Second pass: categories with parent_id
  for (let i = 0; i < withParent.length; i += batchSize) {
    const batch = withParent.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('categories')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error upserting with-parent batch:`, error);
    } else {
      inserted += batch.length;
      console.log(`  Upserted ${inserted}/${classified.length} categories`);
    }
  }
  
  console.log(`\nSync complete! ${inserted} categories upserted.`);
  
  // Output summary of main categories for verification
  console.log('\n=== MAIN CATEGORIES ===');
  const mainCats = classified.filter(c => c.type === 'main').sort((a, b) => a.display_order - b.display_order);
  for (const cat of mainCats) {
    console.log(`  ${cat.id}: ${cat.name} (/${cat.slug})`);
  }
  
  // Output summary of attribute groups
  console.log('\n=== ATTRIBUTE GROUPS ===');
  const attrByGroup = new Map<string, ClassifiedCategory[]>();
  for (const cat of classified.filter(c => c.type === 'attribute')) {
    const group = cat.attribute_group || 'other';
    if (!attrByGroup.has(group)) {
      attrByGroup.set(group, []);
    }
    attrByGroup.get(group)!.push(cat);
  }
  
  for (const [group, attrs] of attrByGroup) {
    console.log(`  ${group}: ${attrs.length} attributes`);
  }
}

// Run sync
syncCategories().catch(console.error);
