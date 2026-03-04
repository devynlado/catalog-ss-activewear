#!/usr/bin/env node

/**
 * Scrapes product data and images from Huili Apparel's Shopify store.
 * Downloads primary product images and generates config data for the streetwear landing page.
 *
 * Usage: node scripts/scrape-huili.mjs
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'https://huili-apparel.com';
const IMG_DIR = 'public/images/streetwear';
const OUTPUT_FILE = 'scripts/huili-products.json';

function slugify(text, maxLen = 60) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen)
    .replace(/-$/, '');
}

function categorize(product) {
  const type = (product.product_type || '').toLowerCase();
  const tags = (product.tags || []).map(t => t.toLowerCase());
  const title = (product.title || '').toLowerCase();

  if (type.includes('hoodie') || tags.includes('hoodie') || title.includes('hoodie') || title.includes('crewneck') || title.includes('zip up')) {
    return 'hoodies';
  }
  if (type.includes('pants') || type.includes('short') ||
      tags.some(t => ['pants', 'shorts', 'joggers', 'sweatpants', 'cargo'].includes(t)) ||
      title.includes('pants') || title.includes('jogger') || title.includes('sweatpant') || title.includes('shorts') || title.includes('cargo')) {
    return 'pants';
  }
  // Default to tshirts for t-shirts, tees, tanks, long sleeves, and anything else
  return 'tshirts';
}

function extractFeatures(product) {
  const title = product.title || '';
  const features = [];
  const checks = [
    [/heavyweight/i, 'Heavyweight'],
    [/acid wash/i, 'Acid Wash'],
    [/vintage.*wash/i, 'Vintage Wash'],
    [/sun\s*fad/i, 'Sun Faded'],
    [/distress/i, 'Distressed'],
    [/oversiz/i, 'Oversized'],
    [/boxy/i, 'Boxy Fit'],
    [/crop/i, 'Cropped'],
    [/raw\s*hem/i, 'Raw Hem'],
    [/puff/i, 'Puff Print'],
    [/rhinestone/i, 'Rhinestone'],
    [/embroidery|embroider/i, 'Embroidery'],
    [/screen\s*print/i, 'Screen Print'],
    [/all\s*over\s*print/i, 'All-Over Print'],
    [/zip\s*up|zipper/i, 'Zip Up'],
    [/pullover/i, 'Pullover'],
    [/wide\s*leg/i, 'Wide Leg'],
    [/flare/i, 'Flared'],
    [/cargo/i, 'Cargo'],
    [/french\s*terry/i, 'French Terry'],
    [/fleece/i, 'Fleece'],
    [/100%\s*cotton/i, '100% Cotton'],
    [/long\s*sleeve/i, 'Long Sleeve'],
    [/double\s*layer/i, 'Double Layer'],
    [/camo/i, 'Camo'],
    [/graphic/i, 'Graphic'],
    [/applique|patch/i, 'Applique/Patch'],
  ];
  for (const [regex, label] of checks) {
    if (regex.test(title)) features.push(label);
  }
  return features.slice(0, 5); // Cap at 5 features
}

function getLowestPrice(product) {
  const prices = product.variants
    .map(v => parseFloat(v.price))
    .filter(p => !isNaN(p) && p < 100); // Exclude the $89-$129 "custom sample" variants
  return prices.length > 0 ? Math.min(...prices) : null;
}

function getSizes(product) {
  const sizeOption = product.options?.find(o =>
    o.name.toLowerCase().includes('size') || o.name === '尺寸'
  );
  if (!sizeOption) return ['S', 'M', 'L', 'XL', '2XL'];
  return sizeOption.values.filter(v => !v.includes('Custom'));
}

async function fetchAllProducts() {
  const allProducts = [];
  let page = 1;

  while (true) {
    const url = `${BASE_URL}/products.json?limit=250&page=${page}`;
    console.log(`Fetching page ${page}...`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch page ${page}: ${res.status}`);
      break;
    }
    const data = await res.json();
    if (!data.products || data.products.length === 0) break;
    allProducts.push(...data.products);
    console.log(`  Got ${data.products.length} products (total: ${allProducts.length})`);
    if (data.products.length < 250) break;
    page++;
  }

  return allProducts;
}

async function downloadImage(url, destPath) {
  try {
    execSync(`curl -sL -o "${destPath}" "${url}"`, { timeout: 30000 });
    return true;
  } catch (e) {
    console.error(`  Failed to download: ${url}`);
    return false;
  }
}

async function main() {
  console.log('=== Huili Apparel Product Scraper ===\n');

  // Fetch all products
  const rawProducts = await fetchAllProducts();
  console.log(`\nTotal raw products: ${rawProducts.length}\n`);

  // Process and deduplicate
  const seenImages = new Set();
  const products = [];

  for (const product of rawProducts) {
    const primaryImage = product.images?.[0];
    if (!primaryImage?.src) {
      console.log(`  Skipping (no image): ${product.title}`);
      continue;
    }

    // Skip duplicate images
    if (seenImages.has(primaryImage.src)) {
      console.log(`  Skipping (duplicate image): ${product.title}`);
      continue;
    }
    seenImages.add(primaryImage.src);

    const price = getLowestPrice(product);
    if (!price) {
      console.log(`  Skipping (no valid price): ${product.title}`);
      continue;
    }

    const category = categorize(product);
    const slug = slugify(product.title);
    const ext = primaryImage.src.includes('.webp') ? 'webp' :
                primaryImage.src.includes('.png') ? 'png' : 'jpg';
    const filename = `${slug}.${ext}`;

    products.push({
      id: slug,
      title: product.title,
      category,
      image: `${category}/${filename}`,
      baseCost: price,
      sizes: getSizes(product),
      features: extractFeatures(product),
      imageUrl: primaryImage.src,
      filename,
    });
  }

  console.log(`\nProcessed ${products.length} unique products:`);
  const counts = { tshirts: 0, hoodies: 0, pants: 0 };
  products.forEach(p => counts[p.category]++);
  console.log(`  T-Shirts: ${counts.tshirts}`);
  console.log(`  Hoodies: ${counts.hoodies}`);
  console.log(`  Pants: ${counts.pants}`);

  // Download images
  console.log('\nDownloading images...');
  let downloaded = 0;
  for (const product of products) {
    const destPath = join(IMG_DIR, product.image);
    if (existsSync(destPath)) {
      console.log(`  Exists: ${product.image}`);
      downloaded++;
      continue;
    }
    const ok = await downloadImage(product.imageUrl, destPath);
    if (ok) {
      downloaded++;
      console.log(`  Downloaded: ${product.image}`);
    }
  }
  console.log(`\nDownloaded ${downloaded}/${products.length} images`);

  // Save product data (without imageUrl for the config)
  const configData = products.map(({ imageUrl, filename, ...rest }) => rest);
  writeFileSync(OUTPUT_FILE, JSON.stringify(configData, null, 2));
  console.log(`\nProduct data saved to ${OUTPUT_FILE}`);

  // Print price ranges per category
  console.log('\nPrice ranges:');
  for (const cat of ['tshirts', 'hoodies', 'pants']) {
    const catProducts = configData.filter(p => p.category === cat);
    if (catProducts.length === 0) continue;
    const prices = catProducts.map(p => p.baseCost);
    console.log(`  ${cat}: $${Math.min(...prices).toFixed(2)} - $${Math.max(...prices).toFixed(2)}`);
  }
}

main().catch(console.error);
