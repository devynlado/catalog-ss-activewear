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
      useCdn: typeof window !== 'undefined',
    })
  : null;
