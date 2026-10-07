/**
 * Shared artwork-upload constants, validation, and the browser-side upload
 * helper used by every lead/quote form that accepts customer artwork.
 *
 * This module is intentionally free of any server-only imports (no
 * `@supabase/supabase-js`, no service key) so it is safe to bundle into
 * client components. Server-side signed-URL helpers live in
 * `lib/artwork-server.ts`.
 *
 * Flow (see also `app/api/quote/artwork/upload/route.ts`):
 *   1. Browser calls `uploadArtworkFile(file)`.
 *   2. That POSTs file metadata to our API, which returns a short-lived
 *      Supabase **signed upload URL** (the file never passes through our
 *      serverless function — important because Vercel caps request bodies
 *      at ~4.5MB while we allow up to 20MB artwork).
 *   3. The browser PUTs the file directly to Supabase Storage.
 *   4. The returned storage `path` is what we persist + email (as a
 *      time-limited signed download URL generated on the server).
 */

// Private storage bucket that holds customer artwork. Must be created in the
// Supabase dashboard (see docs/ or the setup note) — it is NOT provisioned by
// a SQL migration because buckets live outside the Postgres schema.
export const ARTWORK_BUCKET = 'quote-artwork';

// Accepted MIME types. SVG is intentionally excluded: it can carry embedded
// scripts, and these forms are public/anonymous so we keep the attack surface
// small. Vector production files (AI/EPS) are collected later by the sales
// team over email, not through the public widget.
export const ARTWORK_ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
] as const;

// `accept` attribute hint for the native file picker (extensions).
export const ARTWORK_ACCEPTED_EXT = '.png,.jpg,.jpeg,.webp,.pdf';

export const ARTWORK_MAX_SIZE = 20 * 1024 * 1024; // 20MB
export const ARTWORK_MAX_SIZE_LABEL = '20MB';

// Signed-URL lifetimes. Admin pages mint fresh URLs on every load, so they
// use a short TTL. Email links must still work when the recipient opens the
// message hours/days later, so they get a long TTL. After a link expires the
// admin dashboard remains the permanent source of truth.
export const ARTWORK_ADMIN_URL_TTL = 60 * 60; // 1 hour
export const ARTWORK_EMAIL_URL_TTL = 7 * 24 * 60 * 60; // 7 days

export interface ArtworkFileMeta {
  name: string;
  type: string;
  size: number;
}

/**
 * Validate a candidate artwork file by its metadata. Returns an error string
 * for display, or null when the file is acceptable. Used on both the client
 * (before upload) and the server (before minting a signed URL).
 */
export function validateArtworkMeta(file: ArtworkFileMeta): string | null {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  // Block SVG explicitly with a clear message even if the browser reported a
  // generic type.
  if (type === 'image/svg+xml' || name.endsWith('.svg')) {
    return 'SVG files are not supported. Please use PNG, JPG, WEBP, or PDF.';
  }

  if (!(ARTWORK_ACCEPTED_TYPES as readonly string[]).includes(type)) {
    return 'Unsupported format. Please use PNG, JPG, WEBP, or PDF.';
  }

  if (file.size > ARTWORK_MAX_SIZE) {
    return `"${file.name}" is too large. Maximum size is ${ARTWORK_MAX_SIZE_LABEL}.`;
  }

  return null;
}

/** True when the given MIME type is a previewable image (not a PDF). */
export function isPreviewableImage(type: string | undefined | null): boolean {
  return !!type && type.toLowerCase().startsWith('image/');
}

export interface UploadArtworkResult {
  path: string;
  name: string;
}

/**
 * Browser-side: upload one artwork file to Supabase Storage via a signed
 * upload URL. Resolves with the storage `path` on success, or throws an Error
 * with a user-friendly message on failure.
 *
 * Callers should treat failure as non-fatal (submit the lead/quote anyway)
 * per the product decision: a lead is more valuable than its attachment.
 */
export async function uploadArtworkFile(file: File): Promise<UploadArtworkResult> {
  const validationError = validateArtworkMeta(file);
  if (validationError) {
    throw new Error(validationError);
  }

  // 1) Ask our API for a signed upload URL.
  const signRes = await fetch('/api/quote/artwork/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  if (!signRes.ok) {
    const data = await signRes.json().catch(() => null);
    throw new Error(data?.error || 'Could not prepare the file upload.');
  }

  const { signedUrl, token, path } = (await signRes.json()) as {
    signedUrl: string;
    token?: string;
    path: string;
  };

  // 2) Upload the bytes straight to storage (bypasses our function body limit).
  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      ...(token ? { 'x-upsert': 'true' } : {}),
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error('The file failed to upload. Please try again.');
  }

  return { path, name: file.name };
}

/**
 * Convenience wrapper for forms: upload an optional single artwork file and
 * never throw. Returns the collected storage paths plus a `failed` flag so the
 * caller can submit the lead/quote regardless and tell the team the attachment
 * didn't make it (per the product decision: never lose a lead over a file).
 */
export async function uploadOptionalArtwork(
  file: File | null,
): Promise<{ paths: string[]; failed: boolean }> {
  if (!file) return { paths: [], failed: false };
  try {
    const { path } = await uploadArtworkFile(file);
    return { paths: [path], failed: false };
  } catch {
    return { paths: [], failed: true };
  }
}
