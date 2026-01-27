/**
 * Analyze SS Activewear categories and map to current menu structure
 * Run with: npx tsx scripts/analyze-categories.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Current mega menu items from Header.tsx - what we need to validate
const CURRENT_MENU_ITEMS = {
  'T-Shirts (21)': {
    'By Style': [
      { name: 'Core T-Shirts', expectedSlug: 'core-tshirts' },
      { name: 'Fashion T-Shirts', expectedSlug: 'fashion-tshirts' },
      { name: 'Tank Tops', expectedSlug: 'tank-tops' },
      { name: 'Long Sleeve Tees', expectedSlug: 'long-sleeve' },
    ],
    'By Sleeve': [
      { name: 'Short Sleeve', expectedSlug: 'short-sleeve' },
      { name: 'Long Sleeve', expectedSlug: 'long-sleeve' },
      { name: 'Sleeveless', expectedSlug: 'sleeveless' },
      { name: '3/4 Sleeve', expectedSlug: '3-4-sleeve' },
    ],
    'By Collar': [
      { name: 'Crewneck', expectedSlug: 'crewneck' },
      { name: 'V-Neck', expectedSlug: 'v-neck' },
    ],
    'By Material': [
      { name: '100% Cotton', expectedSlug: 'cotton' },
      { name: 'Polyester', expectedSlug: 'polyester' },
      { name: 'Tri-Blend', expectedSlug: 'tri-blend' },
      { name: 'Performance', expectedSlug: 'performance' },
    ],
  },
  'Sweatshirts (9)': {
    'By Style': [
      { name: 'Hoodies', expectedSlug: 'hoodies' },
      { name: 'Crewnecks', expectedSlug: 'crewneck-sweatshirts' },
      { name: 'Full-Zip', expectedSlug: 'full-zip' },
      { name: 'Quarter-Zip', expectedSlug: 'quarter-zip' },
      { name: 'Pullover', expectedSlug: 'pullover' },
    ],
    'By Weight': [
      { name: 'Lightweight', expectedSlug: 'lightweight' },
      { name: 'Midweight', expectedSlug: 'midweight' },
      { name: 'Heavyweight', expectedSlug: 'heavyweight' },
    ],
  },
  'Polos (52)': {
    'By Sleeve': [
      { name: 'Short Sleeve', expectedSlug: 'short-sleeve' },
      { name: 'Long Sleeve', expectedSlug: 'long-sleeve' },
    ],
    'By Material': [
      { name: 'Cotton', expectedSlug: 'cotton' },
      { name: 'Performance', expectedSlug: 'performance' },
      { name: 'Pique', expectedSlug: 'pique' },
    ],
  },
  'Jackets (15)': {
    'By Style': [
      { name: 'Lightweight Jackets', expectedSlug: 'lightweight' },
      { name: 'Vests', expectedSlug: 'vests' },
      { name: 'Windbreakers', expectedSlug: 'windbreakers' },
      { name: 'Soft Shells', expectedSlug: 'soft-shell' },
      { name: 'Rain Coats', expectedSlug: 'rain-coats' },
      { name: 'Puffer Jackets', expectedSlug: 'puffer' },
      { name: 'Fleece Jackets', expectedSlug: 'fleece' },
    ],
    'By Feature': [
      { name: 'Full-Zip', expectedSlug: 'full-zip' },
      { name: 'Quarter-Zip', expectedSlug: 'quarter-zip' },
      { name: 'Hooded', expectedSlug: 'hooded' },
    ],
  },
  'Headwear (11)': {
    'By Style': [
      { name: 'Trucker Hats', expectedSlug: 'trucker-hats' },
      { name: 'Dad Caps', expectedSlug: 'dad-caps' },
      { name: 'Snapbacks', expectedSlug: 'snapbacks' },
      { name: 'Fitted Caps', expectedSlug: 'fitted-caps' },
      { name: 'Bucket Hats', expectedSlug: 'bucket-hats' },
      { name: 'Beanies', expectedSlug: 'beanies' },
      { name: 'Visors', expectedSlug: 'visors' },
      { name: 'Flat Bills', expectedSlug: 'flat-bills' },
    ],
    'By Structure': [
      { name: 'Structured', expectedSlug: 'structured' },
      { name: 'Unstructured', expectedSlug: 'unstructured' },
      { name: 'Soft-Structured', expectedSlug: 'soft-structured' },
      { name: '5-Panel', expectedSlug: '5-panel' },
      { name: '6-Panel', expectedSlug: '6-panel' },
    ],
    'By Closure': [
      { name: 'Snapback', expectedSlug: 'snapbacks' },
      { name: 'Adjustable', expectedSlug: 'adjustable' },
      { name: 'Hook and Loop', expectedSlug: 'hook-and-loop' },
    ],
  },
  'Bottoms (384)': {
    'By Style': [
      { name: 'Shorts', expectedSlug: 'shorts' },
      { name: 'Sweatpants', expectedSlug: 'sweatpants' },
      { name: 'Leggings', expectedSlug: 'leggings' },
      { name: 'Pants', expectedSlug: 'pants' },
    ],
    'By Gender': [
      { name: 'Mens & Unisex', expectedSlug: 'mens-unisex' },
      { name: 'Womens', expectedSlug: 'womens' },
      { name: 'Youth', expectedSlug: 'youth' },
    ],
  },
  'Bags (102)': {
    'By Style': [
      { name: 'Backpacks', expectedSlug: 'backpacks' },
      { name: 'Tote Bags', expectedSlug: 'tote-bags' },
      { name: 'Duffel Bags', expectedSlug: 'duffel-bags' },
      { name: 'Cooler Bags', expectedSlug: 'cooler-bags' },
      { name: 'Drawstring Bags', expectedSlug: 'drawstring-bags' },
      { name: 'Messenger Bags', expectedSlug: 'messenger-bags' },
    ],
  },
  'Accessories (53)': {
    'By Type': [
      { name: 'Scarves', expectedSlug: 'scarves' },
      { name: 'Blankets', expectedSlug: 'blankets' },
      { name: 'Towels', expectedSlug: 'towels' },
      { name: 'Aprons', expectedSlug: 'aprons' },
      { name: 'Bandanas', expectedSlug: 'bandanas' },
      { name: 'Gloves', expectedSlug: 'gloves' },
      { name: 'Socks', expectedSlug: 'socks' },
    ],
  },
  'Womens (13)': {
    'By Category': [
      { name: 'T-Shirts', expectedSlug: 't-shirts' },
      { name: 'Tank Tops', expectedSlug: 'tank-tops' },
      { name: 'Sweatshirts', expectedSlug: 'sweatshirts' },
      { name: 'Polos', expectedSlug: 'polos' },
      { name: 'Bottoms', expectedSlug: 'bottoms' },
    ],
    'By Fit': [
      { name: 'Fitted', expectedSlug: 'fitted' },
      { name: 'Relaxed', expectedSlug: 'relaxed' },
      { name: 'Cropped', expectedSlug: 'cropped' },
      { name: 'Flowy', expectedSlug: 'flowy' },
    ],
  },
  'Workwear (49)': {
    'By Style': [
      { name: 'Safety Vests', expectedSlug: 'safety-vests' },
      { name: 'Hi-Vis', expectedSlug: 'hi-vis' },
      { name: 'Work Jackets', expectedSlug: 'work-jackets' },
      { name: 'Work Pants', expectedSlug: 'work-pants' },
    ],
    'By Feature': [
      { name: 'ANSI Class 2', expectedSlug: 'ansi-class-2' },
      { name: 'ANSI Class 3', expectedSlug: 'ansi-class-3' },
    ],
  },
};

// Fetch categories from SS Activewear
async function fetchCategories(): Promise<Array<{ categoryID: number; name: string }>> {
  const username = process.env.SS_USERNAME || '22831';
  const apiKey = process.env.SS_API_KEY || '49da4fac-9f11-4d7d-8f26-fefaeb28fb14';
  
  const response = await fetch('https://api.ssactivewear.com/v2/categories/', {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${username}:${apiKey}`).toString('base64'),
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }
  
  return response.json();
}

// Find best matching category for a menu item name
function findCategoryMatch(
  name: string,
  categories: Array<{ categoryID: number; name: string }>
): { categoryID: number; name: string; matchType: 'exact' | 'partial' | 'none' } | null {
  // Normalize for comparison
  const normalized = name.toLowerCase().trim();
  
  // Try exact match first
  const exact = categories.find(c => c.name.toLowerCase().trim() === normalized);
  if (exact) {
    return { ...exact, matchType: 'exact' };
  }
  
  // Try partial match (category name contains our name or vice versa)
  const partial = categories.find(c => {
    const catName = c.name.toLowerCase().trim();
    return catName.includes(normalized) || normalized.includes(catName);
  });
  if (partial) {
    return { ...partial, matchType: 'partial' };
  }
  
  // Try alternative names
  const alternatives: Record<string, string[]> = {
    'short sleeve': ['short sleeves'],
    'long sleeve': ['long sleeves'],
    'sleeveless': ['sleeveless', 'tank tops'],
    '3/4 sleeve': ['3/4 sleeves'],
    'crewneck': ['crewneck', 'crew neck'],
    'v-neck': ['v-neck', 'vneck'],
    'tri-blend': ['triblends', 'tri-blend', 'triblend'],
    'hoodies': ['hooded', 'pullover hoodie'],
    'crewnecks': ['crewneck', 'crew neck'],
    'full-zip': ['full-zips', 'full zip'],
    'quarter-zip': ['quarter-zips', '1/4 zip'],
    'lightweight': ['lightweight'],
    'midweight': ['midweight'],
    'heavyweight': ['heavyweight'],
    'pique': ['pique'],
    'vests': ['vests', 'vest'],
    'windbreakers': ['windbreakers', 'windbreaker'],
    'soft shells': ['soft shell', 'softshell'],
    'rain coats': ['rain coats', 'raincoat', 'rainwear'],
    'puffer jackets': ['puffer', 'insulated'],
    'trucker hats': ['trucker', 'trucker hats'],
    'dad caps': ['dad caps', 'dad hats', 'unstructured cap'],
    'snapbacks': ['snapback', 'snap back'],
    'fitted caps': ['fitted', 'fitted caps'],
    'bucket hats': ['bucket', 'bucket hats'],
    'beanies': ['beanies', 'beanie', 'knit'],
    'visors': ['visors', 'visor'],
    'flat bills': ['flat bill', 'flat bills'],
    'structured': ['structured'],
    'unstructured': ['unstructured'],
    'soft-structured': ['soft-structured', 'soft structured'],
    '5-panel': ['five-panel', '5-panel', 'five panel'],
    '6-panel': ['six-panel', '6-panel', 'six panel'],
    'adjustable': ['adjustable'],
    'hook and loop': ['hook and loop', 'velcro'],
    'shorts': ['shorts'],
    'sweatpants': ['sweatpants', 'joggers'],
    'leggings': ['leggings'],
    'pants': ['pants'],
    'backpacks': ['backpacks', 'backpack'],
    'tote bags': ['tote bags', 'tote'],
    'duffel bags': ['duffel', 'duffle'],
    'cooler bags': ['cooler', 'coolers'],
    'drawstring bags': ['drawstring', 'cinch'],
    'messenger bags': ['messenger'],
    'scarves': ['scarves', 'scarf'],
    'blankets': ['blankets', 'blanket'],
    'towels': ['towels', 'towel'],
    'aprons': ['aprons', 'apron'],
    'bandanas': ['bandanas', 'bandana'],
    'gloves': ['gloves', 'glove'],
    'socks': ['socks', 'sock'],
    'safety vests': ['safety vests', 'safety vest', 'hi-vis vest'],
    'hi-vis': ['high visibility', 'hi-vis', 'hi vis'],
    'ansi class 2': ['ansi class 2', 'class 2'],
    'ansi class 3': ['ansi class 3', 'class 3'],
    'cropped': ['cropped', 'crop'],
    'flowy': ['flowy'],
    'relaxed': ['relaxed'],
    'fitted': ['fitted'],
    'core t-shirts': ['core t-shirts'],
    'fashion t-shirts': ['fashion t-shirts'],
    'tank tops': ['tank tops', 'tanks', 'sleeveless'],
    '100% cotton': ['100% cotton', 'cotton'],
    'polyester': ['polyester', '100% polyester'],
    'performance': ['performance', 'moisture-wicking'],
    'cotton': ['cotton', '100% cotton'],
    'pullover': ['pullover', 'pullovers'],
    'fleece jackets': ['fleece jacket', 'fleece'],
    'hooded': ['hooded', 'hood'],
    'work jackets': ['work jacket', 'workwear jacket'],
    'work pants': ['work pants', 'workwear pants'],
  };
  
  const alts = alternatives[normalized] || [];
  for (const alt of alts) {
    const match = categories.find(c => {
      const catName = c.name.toLowerCase().trim();
      return catName === alt || catName.includes(alt) || alt.includes(catName);
    });
    if (match) {
      return { ...match, matchType: 'partial' };
    }
  }
  
  return null;
}

async function main() {
  console.log('Fetching SS Activewear categories...\n');
  const categories = await fetchCategories();
  console.log(`Found ${categories.length} categories\n`);
  
  // Classify categories by type
  const mainCategories: typeof categories = [];
  const attributes: typeof categories = [];
  const guides: typeof categories = [];
  const other: typeof categories = [];
  
  for (const cat of categories) {
    const name = cat.name.toLowerCase();
    
    // Guide patterns
    if (name.includes('guide') || name.includes('playbook') || /^20\d{2}\s/.test(cat.name) || 
        name.includes('lifestyle') || name.includes("what's new") || name.includes('silo')) {
      guides.push(cat);
    }
    // Weight patterns
    else if (/^\d+-?\d*\.?\d*\s*oz/i.test(cat.name) || /oz and over$/i.test(name)) {
      attributes.push(cat);
    }
    // Common attributes
    else if (['short sleeves', 'long sleeves', 'sleeveless', '3/4 sleeves', 'crewneck', 'v-neck',
              'cotton', 'polyester', 'triblends', 'heavyweight', 'midweight', 'lightweight',
              'structured', 'unstructured', 'adjustable', 'fitted', 'relaxed', 'oversized',
              'organic', 'recycled', 'sustainable', 'tagless', 'moisture-wicking',
              'garment dyed', 'pigment dyed', 'acid washed', 'tie dyed'].some(a => name.includes(a))) {
      attributes.push(cat);
    }
    else {
      other.push(cat);
    }
  }
  
  // Output results
  const results: Record<string, any> = {
    summary: {
      totalCategories: categories.length,
      guides: guides.length,
      attributes: attributes.length,
      other: other.length,
    },
    menuMapping: {} as Record<string, any>,
  };
  
  console.log('='.repeat(80));
  console.log('MENU ITEM MAPPING ANALYSIS');
  console.log('='.repeat(80));
  
  let validCount = 0;
  let invalidCount = 0;
  
  for (const [mainCat, groups] of Object.entries(CURRENT_MENU_ITEMS)) {
    console.log(`\n### ${mainCat}`);
    results.menuMapping[mainCat] = {};
    
    for (const [groupName, items] of Object.entries(groups)) {
      console.log(`\n  ${groupName}:`);
      results.menuMapping[mainCat][groupName] = [];
      
      for (const item of items) {
        const match = findCategoryMatch(item.name, categories);
        const result = {
          menuName: item.name,
          slug: item.expectedSlug,
          categoryID: match?.categoryID || null,
          ssName: match?.name || null,
          matchType: match?.matchType || 'none',
          status: match ? '✓ VALID' : '✗ NOT FOUND',
        };
        
        results.menuMapping[mainCat][groupName].push(result);
        
        if (match) {
          console.log(`    ✓ ${item.name} → ID: ${match.categoryID} (${match.name}) [${match.matchType}]`);
          validCount++;
        } else {
          console.log(`    ✗ ${item.name} → NOT FOUND`);
          invalidCount++;
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal menu items: ${validCount + invalidCount}`);
  console.log(`Valid mappings: ${validCount}`);
  console.log(`Missing mappings: ${invalidCount}`);
  console.log(`\nTotal SS categories: ${categories.length}`);
  console.log(`- Guides: ${guides.length}`);
  console.log(`- Attributes: ${attributes.length}`);
  console.log(`- Other: ${other.length}`);
  
  // Save full results to JSON
  const outputPath = path.join(process.cwd(), 'data', 'category-mapping-analysis.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nFull results saved to: ${outputPath}`);
  
  // Save categories lookup
  const lookupPath = path.join(process.cwd(), 'data', 'ss-categories-lookup.json');
  const lookup = categories.reduce((acc, cat) => {
    acc[cat.categoryID] = cat.name;
    return acc;
  }, {} as Record<number, string>);
  fs.writeFileSync(lookupPath, JSON.stringify(lookup, null, 2));
  console.log(`Category lookup saved to: ${lookupPath}`);
  
  // List categories that might be useful but aren't in menu
  console.log('\n' + '='.repeat(80));
  console.log('POTENTIALLY USEFUL CATEGORIES NOT IN CURRENT MENU');
  console.log('='.repeat(80));
  
  const usefulPatterns = [
    'tank', 'hoodie', 'pullover', 'quarter', 'zip', 'beanie', 'cap', 'hat',
    'shorts', 'pants', 'jacket', 'vest', 'polo', 'tote', 'backpack', 'bag'
  ];
  
  const potentiallyUseful = other.filter(cat => {
    const name = cat.name.toLowerCase();
    return usefulPatterns.some(p => name.includes(p)) && 
           !name.includes('guide') && !name.includes('playbook');
  }).slice(0, 30);
  
  for (const cat of potentiallyUseful) {
    console.log(`  ${cat.categoryID}: ${cat.name}`);
  }
}

main().catch(console.error);
