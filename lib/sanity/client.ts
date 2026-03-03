import { createClient } from 'next-sanity';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';

const missing = !projectId || !dataset;
const SANITY_ERROR = 'Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET';

/** Real client when env is set; dummy that throws on use when env is missing (so build succeeds without Sanity). */
export const client = missing
  ? (new Proxy({} as ReturnType<typeof createClient>, {
      get() {
        throw new Error(SANITY_ERROR);
      },
    }))
  : createClient({
      projectId: projectId!,
      dataset: dataset!,
      apiVersion,
      useCdn: typeof window !== 'undefined',
    });
