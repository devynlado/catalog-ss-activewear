#!/usr/bin/env node

/**
 * Generates lib/streetwear-config.ts from the curated expanded product JSON.
 * Produces clean human-readable titles with an "em-dash descriptor" format.
 *
 * Usage: node scripts/gen-config.mjs
 */

import { readFileSync, writeFileSync } from 'fs';

const INPUT = 'scripts/curated-expanded.json';
const OUTPUT = 'lib/streetwear-config.ts';

const raw = JSON.parse(readFileSync(INPUT, 'utf-8'));

function makeNiceTitle(product) {
  const t = product.title;
  const feats = product.features || [];

  const garment = detectGarment(t, product.category);
  const descriptors = [];

  const descMap = [
    ['Heavyweight', /heavyweight/i],
    ['Acid Wash', /acid.wash/i],
    ['Vintage Wash', /vintage.*wash/i],
    ['Sun Faded', /sun.?fad/i],
    ['Distressed', /distress/i],
    ['Oversized', /oversiz/i],
    ['Boxy Fit', /boxy/i],
    ['Cropped', /crop/i],
    ['Raw Hem', /raw.?hem/i],
    ['Puff Print', /puff/i],
    ['Rhinestone', /rhinestone/i],
    ['Embroidered', /embroidery|embroider/i],
    ['Screen Printed', /screen.?print/i],
    ['All-Over Print', /all.?over.?print/i],
    ['Zip Up', /zip.?up|zipper/i],
    ['Pullover', /pullover/i],
    ['Wide Leg', /wide.?leg/i],
    ['Flared', /flare/i],
    ['Cargo', /cargo/i],
    ['French Terry', /french.?terry/i],
    ['Fleece', /fleece/i],
    ['100% Cotton', /100%.?cotton/i],
    ['Long Sleeve', /long.?sleeve/i],
    ['Double Layer', /double.?layer/i],
    ['Camo', /\bcamo\b/i],
    ['Graphic', /graphic/i],
    ['Appliqué', /applique|patch/i],
    ['Color Block', /color.?block/i],
    ['Spliced', /splice/i],
    ['Varsity', /varsity/i],
    ['Bomber', /bomber/i],
    ['Windbreaker', /windbreaker/i],
    ['Denim', /denim/i],
    ['Corduroy', /corduroy/i],
    ['Mesh', /\bmesh\b/i],
    ['Nylon', /nylon/i],
    ['Woven', /woven/i],
    ['Detachable', /detach/i],
    ['Drawstring', /drawstring/i],
    ['Elastic Waist', /elastic.?waist/i],
  ];

  for (const [label, regex] of descMap) {
    if (regex.test(t)) descriptors.push(label);
    if (descriptors.length >= 2) break;
  }

  if (descriptors.length === 0 && feats.length > 0) {
    descriptors.push(feats[0]);
  }

  const suffix = descriptors.length > 0 ? ` — ${descriptors.join(', ')}` : '';
  return `${garment}${suffix}`;
}

function detectGarment(title, category) {
  const t = title.toLowerCase();

  if (category === 'outerwear') {
    if (/varsity/i.test(t)) return 'Varsity Jacket';
    if (/bomber/i.test(t)) return 'Bomber Jacket';
    if (/windbreaker/i.test(t)) return 'Windbreaker';
    if (/coach/i.test(t)) return 'Coach Jacket';
    if (/denim/i.test(t)) return 'Denim Jacket';
    if (/puffer/i.test(t)) return 'Puffer Jacket';
    return 'Jacket';
  }

  if (category === 'shorts') {
    if (/mesh/i.test(t)) return 'Mesh Shorts';
    if (/cargo/i.test(t)) return 'Cargo Shorts';
    if (/basketball/i.test(t)) return 'Basketball Shorts';
    if (/board/i.test(t)) return 'Board Shorts';
    if (/sweat/i.test(t)) return 'Sweat Shorts';
    return 'Shorts';
  }

  if (category === 'pants') {
    if (/cargo/i.test(t)) return 'Cargo Pants';
    if (/jogger/i.test(t)) return 'Joggers';
    if (/sweatpant/i.test(t) || /sweat\s*pant/i.test(t)) return 'Sweatpants';
    if (/track/i.test(t)) return 'Track Pants';
    if (/flare/i.test(t)) return 'Flare Pants';
    if (/wide.?leg/i.test(t)) return 'Wide Leg Pants';
    return 'Pants';
  }

  if (category === 'hoodies') {
    if (/crewneck/i.test(t)) return 'Crewneck Sweatshirt';
    if (/zip.?up/i.test(t) || /zipper/i.test(t)) return 'Zip Up Hoodie';
    if (/tracksuit/i.test(t) || /two.?piece/i.test(t)) return 'Tracksuit Set';
    return 'Pullover Hoodie';
  }

  if (/long.?sleeve/i.test(t)) return 'Long Sleeve Tee';
  if (/tank/i.test(t)) return 'Tank Top';
  if (/polo/i.test(t)) return 'Polo';
  return 'Heavyweight Tee';
}

function makeId(title) {
  return title
    .toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-$/, '');
}

const CATS_ORDER = ['tshirts', 'hoodies', 'shorts', 'pants', 'outerwear'];
const CAT_LABELS = {
  tshirts: 'T-Shirts',
  hoodies: 'Hoodies & Crewnecks',
  shorts: 'Shorts',
  pants: 'Pants & Joggers',
  outerwear: 'Outerwear',
};

const seenIds = new Set();
const allProducts = [];

for (const cat of CATS_ORDER) {
  const items = raw[cat] || [];
  for (const item of items) {
    const title = makeNiceTitle(item);
    let id = makeId(title);
    let suffix = 1;
    while (seenIds.has(id)) {
      id = `${makeId(title)}-${++suffix}`;
    }
    seenIds.add(id);

    allProducts.push({
      id,
      title,
      category: cat,
      image: item.image,
      baseCost: item.baseCost,
      sizes: item.sizes,
      features: item.features,
    });
  }
}

let ts = `export type StreetWearCategory = 'tshirts' | 'hoodies' | 'shorts' | 'pants' | 'outerwear';

export interface StreetWearProduct {
  id: string;
  title: string;
  category: StreetWearCategory;
  image: string;
  baseCost: number;
  sizes: string[];
  features: string[];
}

export const VOLUME_TIERS = [
  { qty: 50, markup: 1.6, label: '50 pcs' },
  { qty: 100, markup: 1.5, label: '100 pcs' },
  { qty: 250, markup: 1.4, label: '250 pcs' },
] as const;

export type TierQty = (typeof VOLUME_TIERS)[number]['qty'];

export function getTierPrice(baseCost: number, tierQty: TierQty): number {
  const tier = VOLUME_TIERS.find((t) => t.qty === tierQty)!;
  return Math.ceil(baseCost * tier.markup * 100) / 100;
}

export function getAllTierPrices(baseCost: number) {
  return VOLUME_TIERS.map((tier) => ({
    qty: tier.qty,
    label: tier.label,
    unitPrice: Math.ceil(baseCost * tier.markup * 100) / 100,
  }));
}

export function getProductsByCategory(category: StreetWearCategory) {
  return STREETWEAR_PRODUCTS.filter((p) => p.category === category);
}

export const INITIAL_VISIBLE = 12;

export const CATEGORIES: {
  id: StreetWearCategory;
  name: string;
  description: string;
}[] = [
`;

for (const cat of CATS_ORDER) {
  const desc = {
    tshirts: 'Heavyweight tees, boxy fits, vintage washes, and more',
    hoodies: 'Pullover and zip-up hoodies, crewnecks, and tracksuits',
    shorts: 'Sweat shorts, mesh shorts, cargo shorts, and athletic styles',
    pants: 'Joggers, sweatpants, cargo pants, wide leg, and track pants',
    outerwear: 'Varsity jackets, bombers, windbreakers, and more',
  };
  ts += `  { id: '${cat}', name: '${CAT_LABELS[cat]}', description: '${desc[cat]}' },\n`;
}

ts += `];\n\nexport const STREETWEAR_PRODUCTS: StreetWearProduct[] = [\n`;

for (const cat of CATS_ORDER) {
  const catProducts = allProducts.filter(p => p.category === cat);
  ts += `  // ── ${CAT_LABELS[cat]} ${'─'.repeat(55 - CAT_LABELS[cat].length)}\n`;
  for (const p of catProducts) {
    ts += `  {\n`;
    ts += `    id: '${p.id}',\n`;
    ts += `    title: '${p.title.replace(/'/g, "\\'")}',\n`;
    ts += `    category: '${p.category}',\n`;
    ts += `    image: '${p.image}',\n`;
    ts += `    baseCost: ${p.baseCost},\n`;
    ts += `    sizes: [${p.sizes.map(s => `'${s}'`).join(', ')}],\n`;
    ts += `    features: [${p.features.map(f => `'${f.replace(/'/g, "\\'")}'`).join(', ')}],\n`;
    ts += `  },\n`;
  }
}

ts += `];\n`;

writeFileSync(OUTPUT, ts);
console.log(`Generated ${OUTPUT} with ${allProducts.length} products across ${CATS_ORDER.length} categories`);
for (const cat of CATS_ORDER) {
  console.log(`  ${CAT_LABELS[cat]}: ${allProducts.filter(p => p.category === cat).length}`);
}
