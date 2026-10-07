/**
 * Server-only helpers for the customer-artwork storage bucket.
 *
 * Keep all `@supabase/supabase-js` + service-key usage here so the client-safe
 * constants in `lib/artwork.ts` never pull the service key into a browser
 * bundle. Import this module only from route handlers and server components.
 */

import { createClient } from '@supabase/supabase-js';
import {
  ARTWORK_BUCKET,
  ARTWORK_ADMIN_URL_TTL,
  isPreviewableImage,
} from './artwork';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Both names exist in this codebase; prefer SERVICE_KEY (used by
  // createServerSupabaseClient + the other upload routes) and fall back to
  // SERVICE_ROLE_KEY (used by the admin API routes).
  const key =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase service credentials are not configured.');
  }
  return createClient(url, key);
}

export interface ArtworkUploadTarget {
  signedUrl: string;
  token: string;
  path: string;
}

/**
 * Create a signed upload URL for a new artwork file. The caller (browser) then
 * PUTs the bytes directly to `signedUrl`. Returns the storage `path` that must
 * be persisted.
 */
export async function createArtworkUploadUrl(
  fileName: string,
): Promise<ArtworkUploadTarget> {
  const supabase = getServiceSupabase();

  const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';
  const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'bin';
  // Group by day for easy manual browsing/cleanup in the Supabase dashboard.
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const path = `${day}/${crypto.randomUUID()}.${safeExt}`;

  const { data, error } = await supabase.storage
    .from(ARTWORK_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create signed upload URL');
  }

  return { signedUrl: data.signedUrl, token: data.token, path };
}

export interface ArtworkLink {
  path: string;
  url: string | null;
  name: string;
  isImage: boolean;
}

/** Derive a friendly display name from a storage path. */
function nameFromPath(path: string): string {
  return path.split('/').pop() || path;
}

/** Guess whether a stored path points at a previewable image (by extension). */
function pathIsImage(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
}

/**
 * Generate time-limited signed download URLs for a list of artwork paths.
 * Never throws — any path that fails to sign comes back with `url: null` so a
 * single bad path can't break an admin page or an email send.
 */
export async function getArtworkLinks(
  paths: Array<string | null | undefined> | null | undefined,
  expiresIn: number = ARTWORK_ADMIN_URL_TTL,
): Promise<ArtworkLink[]> {
  const clean = (paths ?? []).filter(
    (p): p is string => typeof p === 'string' && p.length > 0,
  );
  if (clean.length === 0) return [];

  const supabase = getServiceSupabase();

  const links = await Promise.all(
    clean.map(async (path): Promise<ArtworkLink> => {
      const base: ArtworkLink = {
        path,
        url: null,
        name: nameFromPath(path),
        isImage: pathIsImage(path),
      };
      try {
        const { data, error } = await supabase.storage
          .from(ARTWORK_BUCKET)
          .createSignedUrl(path, expiresIn);
        if (error || !data) return base;
        return { ...base, url: data.signedUrl };
      } catch {
        return base;
      }
    }),
  );

  return links;
}

/** Single-path convenience wrapper around {@link getArtworkLinks}. */
export async function getArtworkLink(
  path: string | null | undefined,
  expiresIn: number = ARTWORK_ADMIN_URL_TTL,
): Promise<ArtworkLink | null> {
  const [link] = await getArtworkLinks([path], expiresIn);
  return link ?? null;
}

/**
 * Admin helper: given a list of items that each may carry an `artworkPath`,
 * return copies enriched with a fresh signed URL + display metadata. Used by
 * the /admin/quotes server components so client components never need the
 * service key. Never throws.
 */
export async function enrichItemsWithArtwork<T extends object>(
  items: T[],
): Promise<
  Array<
    T & { artworkUrl: string | null; artworkName: string | null; artworkIsImage: boolean }
  >
> {
  const pathOf = (i: T): string | null => {
    const p = (i as { artworkPath?: string | null }).artworkPath;
    return typeof p === 'string' && p.length > 0 ? p : null;
  };
  const paths = items
    .map(pathOf)
    .filter((p): p is string => p !== null);
  const links = paths.length
    ? await getArtworkLinks(paths, ARTWORK_ADMIN_URL_TTL)
    : [];
  const byPath = new Map(links.map((l) => [l.path, l]));
  return items.map((i) => {
    const path = pathOf(i);
    const link = path ? byPath.get(path) : undefined;
    return {
      ...i,
      artworkUrl: link?.url ?? null,
      artworkName: link?.name ?? null,
      artworkIsImage: link?.isImage ?? false,
    };
  });
}

export { isPreviewableImage };
