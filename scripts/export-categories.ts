/**
 * Export all SS Activewear categories to CSV
 * 
 * Run with: npx tsx scripts/export-categories.ts
 * 
 * Output: data/ss-categories.csv
 */

import * as fs from 'fs';
import * as path from 'path';

// Load env vars
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = 'https://api.ssactivewear.com/v2';
const USERNAME = process.env.SS_USERNAME;
const API_KEY = process.env.SS_API_KEY;

if (!USERNAME || !API_KEY) {
  console.error('Missing SS_USERNAME or SS_API_KEY in .env.local');
  process.exit(1);
}

// ============================================
// DETECTION PATTERNS (copied from category-taxonomy.ts)
// ============================================
type CategoryType = 'main' | 'subcategory' | 'attribute' | 'guide' | 'unknown';
type AttributeGroup = 
  | 'weight' | 'fit' | 'sleeve' | 'collar' | 'material' | 'gender' | 'feature' | 'tag' | 'ply'
  // New groups from CSV
  | 'treatment' | 'structure' | 'panel' | 'closure' | 'zipper' | 'pattern' | 'sustainable' | 'style';

interface Category {
  id: number;
  name: string;
}

// Main navigation category IDs (known)
const MAIN_CATEGORY_IDS = new Set([21, 9, 52, 15, 11, 384, 102, 53]);

const DETECTION_PATTERNS: { pattern: RegExp; type: CategoryType; attributeGroup?: AttributeGroup }[] = [
  // Weight/thickness attributes (e.g., "10-10.9 oz", "14 oz and over")
  { pattern: /^\d+-?\d*\.?\d*\s*oz/i, type: 'attribute', attributeGroup: 'weight' },
  { pattern: /oz and over$/i, type: 'attribute', attributeGroup: 'weight' },
  { pattern: /under \d+ oz/i, type: 'attribute', attributeGroup: 'weight' },
  
  // Ply attributes (e.g., "1-Ply", "2-Ply")
  { pattern: /^\d+-Ply$/i, type: 'attribute', attributeGroup: 'ply' },
  
  // Fit attributes
  { pattern: /^(Fitted|Relaxed|Slim Fit|Regular Fit|Athletic Fit|Flowy|Cropped|Oversized)$/i, type: 'attribute', attributeGroup: 'fit' },
  
  // Collar/neckline attributes
  { pattern: /^(Crewneck|V-Neck|Henley|Scoop Neck|Mock Neck|Turtleneck|Polo Collar|Deep V-Neck)$/i, type: 'attribute', attributeGroup: 'collar' },
  
  // Sleeve attributes
  { pattern: /^(Short Sleeves?|Long Sleeves?|Sleeveless|3\/4 Sleeves?|Cap Sleeves?|Raglan)$/i, type: 'attribute', attributeGroup: 'sleeve' },
  
  // Material attributes
  { pattern: /^100% Cotton/i, type: 'attribute', attributeGroup: 'material' },
  { pattern: /^(Cotton|Polyester|Tri-Blend|CVC|Ringspun|Organic|Fleece|Jersey|Performance)/i, type: 'attribute', attributeGroup: 'material' },
  
  // Gender/age attributes
  { pattern: /^(Mens?|Womens?|Unisex|Youth|Kids?|Infants?|Toddler|Girls?|Boys?|Adult)$/i, type: 'attribute', attributeGroup: 'gender' },
  { pattern: /^(Mens? & Unisex|Infants? & Toddlers?)$/i, type: 'attribute', attributeGroup: 'gender' },
  
  // Feature attributes
  { pattern: /^(Hooded|Pockets?|Full-Zip|Half-Zip|Quarter-Zip|Pullover|Thumbholes?)$/i, type: 'attribute', attributeGroup: 'feature' },
  { pattern: /^(Tagless|Tear Away|Moisture.?Wicking|Anti-?Microbial|UV Protection|Side.?Seam|Tube|Tubular)$/i, type: 'attribute', attributeGroup: 'tag' },
  
  // Treatment attributes (from CSV)
  { pattern: /^(Garment.?Dyed|Pigment.?Dyed|Acid.?Washed|Tie.?Dye|Mineral.?Wash|Stone.?Wash|Vintage)/i, type: 'attribute', attributeGroup: 'treatment' },
  
  // Structure attributes (headwear)
  { pattern: /^(Structured|Unstructured|Soft-?Structured|Low.?Profile|Mid.?Profile|High.?Profile)/i, type: 'attribute', attributeGroup: 'structure' },
  
  // Panel count (headwear)
  { pattern: /^[456]-Panel$/i, type: 'attribute', attributeGroup: 'panel' },
  
  // Closure types (headwear)
  { pattern: /^(Snapback|Adjustable|Fitted|Flexfit|Stretch.?Fit|Velcro|Buckle)/i, type: 'attribute', attributeGroup: 'closure' },
  
  // Zipper types
  { pattern: /^(Full.?Zip|Half.?Zip|Quarter.?Zip|1\/4.?Zip|Zip.?Up)/i, type: 'attribute', attributeGroup: 'zipper' },
  
  // Pattern/print attributes
  { pattern: /^(Camo|Camouflage|Plaid|Stripes?|Striped|Heather|Solid|Tie.?Dye|Animal)/i, type: 'attribute', attributeGroup: 'pattern' },
  
  // Sustainable attributes
  { pattern: /^(Sustainable|Eco|Recycled|Organic|Repreve|Ocean|Earth)/i, type: 'attribute', attributeGroup: 'sustainable' },
  
  // Style attributes
  { pattern: /^(Safety|Hi.?Vis|Workwear|Activewear|Athletic|Casual|Fashion)/i, type: 'attribute', attributeGroup: 'style' },
  
  // Marketing guides (hide these from main navigation)
  { pattern: /Guide/i, type: 'guide' },
  { pattern: /Playbook/i, type: 'guide' },
  { pattern: /^20\d{2}\s/i, type: 'guide' },
  { pattern: /Lifestyle.*Market/i, type: 'guide' },
  { pattern: /What's New/i, type: 'guide' },
  { pattern: /^Sale\s?-/i, type: 'guide' },
  { pattern: /Silo\s/i, type: 'guide' },
  { pattern: /New Arrival/i, type: 'guide' },
  { pattern: /Best Seller/i, type: 'guide' },
  { pattern: /Featured/i, type: 'guide' },
  { pattern: /Coming Soon/i, type: 'guide' },
];

function classifyCategory(category: Category): { type: CategoryType; attributeGroup?: AttributeGroup } {
  // Check if it's a main navigation category
  if (MAIN_CATEGORY_IDS.has(category.id)) {
    return { type: 'main' };
  }

  // Apply smart detection patterns
  for (const { pattern, type, attributeGroup } of DETECTION_PATTERNS) {
    if (pattern.test(category.name)) {
      return { type, attributeGroup };
    }
  }

  // Default: treat as subcategory
  return { type: 'subcategory' };
}

async function fetchCategories(): Promise<Category[]> {
  const auth = Buffer.from(`${USERNAME}:${API_KEY}`).toString('base64');
  
  console.log('Fetching categories from SS Activewear API...');
  
  const response = await fetch(`${BASE_URL}/categories/`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as Category[];
  console.log(`Fetched ${data.length} categories`);
  
  return data;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function main() {
  try {
    const categories = await fetchCategories();
    
    // Sort by ID for easier review
    categories.sort((a, b) => a.id - b.id);
    
    // Build CSV content
    const header = 'ID,Name,DetectedType,DetectedGroup,Notes';
    const rows = categories.map(cat => {
      const classification = classifyCategory(cat);
      return [
        cat.id.toString(),
        escapeCSV(cat.name),
        classification.type,
        classification.attributeGroup || '',
        '', // Empty notes column for manual annotation
      ].join(',');
    });
    
    const csvContent = [header, ...rows].join('\n');
    
    // Write to file
    const outputPath = path.join(process.cwd(), 'data', 'ss-categories.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf-8');
    
    console.log(`\nExported to: ${outputPath}`);
    
    // Print summary
    const summary = {
      total: categories.length,
      main: 0,
      subcategory: 0,
      attribute: 0,
      guide: 0,
    };
    
    const attributeGroups: Record<string, number> = {};
    
    for (const cat of categories) {
      const classification = classifyCategory(cat);
      summary[classification.type as keyof typeof summary]++;
      
      if (classification.attributeGroup) {
        attributeGroups[classification.attributeGroup] = (attributeGroups[classification.attributeGroup] || 0) + 1;
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total categories: ${summary.total}`);
    console.log(`- Main: ${summary.main}`);
    console.log(`- Subcategories: ${summary.subcategory}`);
    console.log(`- Attributes: ${summary.attribute}`);
    console.log(`- Guides: ${summary.guide}`);
    
    console.log('\n=== ATTRIBUTE GROUPS ===');
    Object.entries(attributeGroups)
      .sort(([,a], [,b]) => b - a)
      .forEach(([group, count]) => {
        console.log(`- ${group}: ${count}`);
      });
    
    // Show first 20 unclassified subcategories for review
    const unclassified = categories
      .map(cat => ({ ...cat, ...classifyCategory(cat) }))
      .filter(c => c.type === 'subcategory')
      .slice(0, 30);
    
    console.log('\n=== SAMPLE UNCLASSIFIED (subcategory) ===');
    unclassified.forEach(cat => {
      console.log(`  ${cat.id}: ${cat.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
