/**
 * Add missing _key to Image Gallery items on project documents.
 * Run once: npx tsx scripts/fix-portfolio-gallery-keys.ts
 *
 * Env: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { createClient } from 'next-sanity';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  console.error('Missing Sanity env vars (NEXT_PUBLIC_SANITY_*, SANITY_API_WRITE_TOKEN)');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
});

function ensureKey(item: Record<string, unknown>, index: number): Record<string, unknown> {
  if (item._key && typeof item._key === 'string') return item;
  return {
    ...item,
    _key: `gallery-${index}-${Math.random().toString(36).slice(2, 11)}`,
  };
}

async function main() {
  const docs = await client.fetch<
    { _id: string; gallery?: Record<string, unknown>[] }[]
  >(`*[_type == "project" && defined(gallery) && count(gallery) > 0]{ _id, gallery }`);

  if (docs.length === 0) {
    console.log('No projects with gallery found.');
    return;
  }

  console.log(`Found ${docs.length} project(s) with gallery. Adding missing _key...\n`);

  for (const doc of docs) {
    const gallery = doc.gallery;
    if (!Array.isArray(gallery) || gallery.length === 0) continue;

    const needsFix = gallery.some((item) => !(item && typeof item === 'object' && item._key));
    if (!needsFix) {
      console.log(`  Skip ${doc._id} (keys already present)`);
      continue;
    }

    const fixedGallery = gallery.map((item, i) =>
      ensureKey(typeof item === 'object' && item ? { ...item } : { _type: 'image', _key: `gallery-${i}` }, i)
    );

    await client.patch(doc._id).set({ gallery: fixedGallery }).commit();
    console.log(`  Fixed ${doc._id}`);
  }

  console.log('\nDone. Re-open the document in Studio; the warning should be gone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
