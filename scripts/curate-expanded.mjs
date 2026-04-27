#!/usr/bin/env node

/**
 * Re-categorises the scraped Huili product data into 5 categories
 * (tshirts, hoodies, shorts, pants, outerwear) and picks up to
 * PER_CAT products per category, sorted by feature richness + price variety.
 *
 * Usage: node scripts/curate-expanded.mjs
 * Output: scripts/curated-expanded.json  (used to generate streetwear-config.ts)
 */

import { readFileSync, writeFileSync } from 'fs';

const PER_CAT = 30;
const INPUT = 'scripts/huili-products.json';
const OUTPUT = 'scripts/curated-expanded.json';

const raw = JSON.parse(readFileSync(INPUT, 'utf-8'));

function recategorize(product) {
  const t = product.title.toLowerCase();

  if (/jacket|varsity|bomber|windbreaker|coach\s*jacket|parka/i.test(t)) return 'outerwear';
  if (/\bshorts?\b/i.test(t) && !/short\s*sleeve/i.test(t)) return 'shorts';
  if (/hoodie|crewneck|zip\s*up|pullover\s*sweat/i.test(t)) return 'hoodies';
  if (/jogger|sweatpant|track\s*pant|cargo\s*pant|wide\s*leg.*pant|flare.*pant|pants/i.test(t)) return 'pants';

  return product.category;
}

function cleanTitle(title) {
  return title
    .replace(/\bCustom\b/gi, '')
    .replace(/\bMen'?s?\b/gi, '')
    .replace(/\bWomen'?s?\b/gi, '')
    .replace(/\bUnisex\b/gi, '')
    .replace(/\bScreen Print(ing|ed)?\b/gi, '')
    .replace(/\bEmbroidery\s*Logo\b/gi, '')
    .replace(/\bCustom\s*Logo\s*Print(ed)?\b/gi, '')
    .replace(/\bStreet\s*wear\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function shortTitle(title, category) {
  let clean = cleanTitle(title);
  const words = clean.split(/\s+/);
  if (words.length > 8) clean = words.slice(0, 8).join(' ');
  return clean;
}

const buckets = { tshirts: [], hoodies: [], shorts: [], pants: [], outerwear: [] };

for (const p of raw) {
  const cat = recategorize(p);
  if (!buckets[cat]) continue;

  buckets[cat].push({
    ...p,
    category: cat,
    _featureCount: (p.features || []).length,
  });
}

console.log('Category counts (raw):');
for (const [k, v] of Object.entries(buckets)) {
  console.log(`  ${k}: ${v.length}`);
}

function pickBest(products, limit) {
  const sorted = [...products].sort((a, b) => {
    if (b._featureCount !== a._featureCount) return b._featureCount - a._featureCount;
    return a.baseCost - b.baseCost;
  });

  const picked = [];
  const seenPrices = new Set();

  for (const p of sorted) {
    if (picked.length >= limit) break;
    const priceKey = Math.round(p.baseCost);
    if (seenPrices.size > 3 && seenPrices.has(priceKey) && picked.length > limit / 2) continue;
    seenPrices.add(priceKey);
    picked.push(p);
  }

  return picked;
}

const result = {};
for (const [cat, products] of Object.entries(buckets)) {
  const picked = pickBest(products, PER_CAT);
  result[cat] = picked.map(({ _featureCount, ...rest }) => ({
    ...rest,
    shortTitle: shortTitle(rest.title, cat),
  }));
  console.log(`  ${cat}: picked ${result[cat].length}`);
}

writeFileSync(OUTPUT, JSON.stringify(result, null, 2));
console.log(`\nSaved to ${OUTPUT}`);

console.log('\nPrice ranges:');
for (const [cat, items] of Object.entries(result)) {
  const prices = items.map(p => p.baseCost);
  console.log(`  ${cat}: $${Math.min(...prices).toFixed(2)} - $${Math.max(...prices).toFixed(2)} (${items.length} items)`);
}
