import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import {
  suggestMeta,
  type MetaKind,
  type MetaDocumentType,
  type SuggestMetaResult,
} from '@/lib/ai/metaSuggestions';

/**
 * POST /api/admin/sanity/generate-meta
 *
 * Generates 3 candidate meta titles or meta descriptions for a Sanity
 * document, optimised for SERP click-through rate. Used by the
 * `AiMetaInput` custom input rendered inside Sanity Studio.
 *
 * Auth: Sanity Studio is mounted at `/studio` in the same Next.js app,
 * which means same-origin cookies — we can reuse the existing Supabase
 * admin guard pattern (matching `app/api/admin/analytics/...`).
 *
 * Body shape:
 *   {
 *     kind: 'metaTitle' | 'metaDescription',
 *     documentType: 'blogArticle' | 'project',
 *     title: string,
 *     bodyPlainText: string,   // already converted from Portable Text in the client
 *     context?: string         // optional category/tags for keyword targeting
 *   }
 *
 * Success response: 200 { suggestions: [{ text, charCount }, ...] }
 * Failure responses use stable codes the client switches on (see below).
 */

interface GenerateMetaBody {
  kind?: unknown;
  documentType?: unknown;
  title?: unknown;
  bodyPlainText?: unknown;
  context?: unknown;
}

/** Map an internal failure code to an HTTP status. */
function statusFor(result: Extract<SuggestMetaResult, { ok: false }>): number {
  switch (result.code) {
    case 'invalid_input':
    case 'body_too_short':
      return 400;
    case 'missing_api_key':
      return 503;
    case 'upstream_error':
    case 'unparseable_response':
      return 502;
    default:
      return 500;
  }
}

export async function POST(request: NextRequest) {
  // ---- Auth ---------------------------------------------------------------
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Please log in.', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required.', code: 'FORBIDDEN' },
      { status: 403 },
    );
  }

  // ---- Parse body ---------------------------------------------------------
  let body: GenerateMetaBody;
  try {
    body = (await request.json()) as GenerateMetaBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_JSON' },
      { status: 400 },
    );
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json(
      { error: 'Body must be an object', code: 'INVALID_INPUT' },
      { status: 400 },
    );
  }

  // ---- Generate -----------------------------------------------------------
  const result = await suggestMeta({
    kind: body.kind as MetaKind,
    documentType: body.documentType as MetaDocumentType,
    title: typeof body.title === 'string' ? body.title : '',
    bodyPlainText:
      typeof body.bodyPlainText === 'string' ? body.bodyPlainText : '',
    context: typeof body.context === 'string' ? body.context : undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, code: result.code.toUpperCase() },
      { status: statusFor(result) },
    );
  }

  return NextResponse.json({
    suggestions: result.suggestions,
  });
}
