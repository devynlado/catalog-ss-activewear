import { NextRequest, NextResponse } from 'next/server';
import { createArtworkUploadUrl } from '@/lib/artwork-server';
import { validateArtworkMeta } from '@/lib/artwork';
import {
  RATE_LIMITS,
  buildRateLimitHeaders,
  checkRateLimit,
  formatRetryAfter,
  getClientIp,
} from '@/lib/rate-limit';

/**
 * POST /api/quote/artwork/upload
 *
 * Public endpoint used by every lead/quote form to obtain a short-lived
 * Supabase **signed upload URL** for one artwork file. The file bytes are
 * uploaded by the browser directly to storage (never through this function),
 * which keeps us under Vercel's ~4.5MB request-body cap while allowing 20MB
 * artwork.
 *
 * Security: anonymous endpoint, so it is rate-limited per IP and validates
 * file metadata (type/size, SVG rejected) before minting a URL. The file
 * itself is scanned/validated no further here — AV scanning is a possible
 * later enhancement.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const decision = await checkRateLimit(ip, RATE_LIMITS.artworkUpload);
    if (!decision.success) {
      return NextResponse.json(
        {
          error: `Too many uploads right now. Please try again in ${formatRetryAfter(decision.retryAfterSeconds)}.`,
          rateLimited: true,
          retryAfterSeconds: decision.retryAfterSeconds,
        },
        { status: 429, headers: buildRateLimitHeaders(decision) },
      );
    }

    const body = await request.json().catch(() => null);
    const fileName = (body?.fileName ?? '') as string;
    const contentType = (body?.contentType ?? '') as string;
    const size = Number(body?.size ?? 0);

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 },
      );
    }

    const validationError = validateArtworkMeta({
      name: fileName,
      type: contentType,
      size: Number.isFinite(size) ? size : 0,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const target = await createArtworkUploadUrl(fileName);

    return NextResponse.json({
      signedUrl: target.signedUrl,
      token: target.token,
      path: target.path,
    });
  } catch (error) {
    console.error('[artwork/upload] Failed to create signed upload URL:', error);
    // Surface a hint when the bucket hasn't been created yet.
    const message =
      error instanceof Error && /bucket/i.test(error.message)
        ? 'Artwork storage is not configured yet. Please create the "quote-artwork" bucket.'
        : 'Could not prepare the file upload. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
