import { createClient, type SanityClient } from 'next-sanity';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';

if (!projectId || !dataset) {
  console.warn('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET — Sanity features disabled');
}

export const client: SanityClient | null = projectId && dataset
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      // Use Sanity's cached CDN (apicdn.sanity.io) on both server and client.
      // Gallery/portfolio content is published and pages use ISR
      // (`revalidate`), so the slightly-stale CDN is the right trade-off and is
      // much faster than hitting the live API on every server render.
      useCdn: true,
    })
  : null;
