/**
 * AI-powered meta-tag suggestion generator for Sanity Studio.
 *
 * Generates 3 candidate meta titles or meta descriptions for a blog article
 * or portfolio project, optimised for SERP click-through rate. Used by
 * `app/api/admin/sanity/generate-meta/route.ts`, which is in turn called by
 * the `AiMetaInput` custom Studio input.
 *
 * Provider: Anthropic Claude (configurable via `ANTHROPIC_META_MODEL`,
 * defaults to `claude-3-5-haiku-latest`). Cost per call is roughly $0.0005
 * with the body trimmed to ~2,000 chars and 3 suggestions returned.
 */

import Anthropic from '@anthropic-ai/sdk';

export type MetaKind = 'metaTitle' | 'metaDescription';
export type MetaDocumentType = 'blogArticle' | 'project';

export interface SuggestMetaInput {
  kind: MetaKind;
  documentType: MetaDocumentType;
  title: string;
  /** Plain text body — already converted from Portable Text on the client. */
  bodyPlainText: string;
  /** Optional category (blog) or tags (project) — improves keyword targeting. */
  context?: string;
}

export interface MetaSuggestion {
  text: string;
  charCount: number;
}

export interface SuggestMetaSuccess {
  ok: true;
  suggestions: MetaSuggestion[];
}

export interface SuggestMetaFailure {
  ok: false;
  /** Stable error code for the client to switch on. */
  code:
    | 'missing_api_key'
    | 'body_too_short'
    | 'invalid_input'
    | 'upstream_error'
    | 'unparseable_response';
  message: string;
}

export type SuggestMetaResult = SuggestMetaSuccess | SuggestMetaFailure;

/* ------------------------------------------------------------------ */
/*                              Constants                              */
/* ------------------------------------------------------------------ */

// Anthropic retired `claude-3-5-haiku-latest` on 2026-02-19. Current Haiku
// alias is `claude-haiku-4-5` (resolves to claude-haiku-4-5-20251001 as of
// April 2026). Override per-environment via ANTHROPIC_META_MODEL if needed.
const DEFAULT_MODEL = 'claude-haiku-4-5';
const SUGGESTION_COUNT = 3;
const BODY_CHAR_LIMIT = 2_000; // Trim long articles to control token cost.
const MIN_BODY_CHARS = 80; // Below this, generations are mostly hallucinated.
const TITLE_MAX = 100;
const CONTEXT_MAX = 200;

const TARGET_LENGTH: Record<MetaKind, { min: number; max: number }> = {
  metaTitle: { min: 40, max: 60 },
  metaDescription: { min: 120, max: 160 },
};

/* ------------------------------------------------------------------ */
/*                          Portable Text → plain                      */
/* ------------------------------------------------------------------ */

/**
 * Convert Sanity Portable Text blocks to plain text. Handles standard text
 * blocks; image / object blocks are skipped. Kept here as a tiny dependency-
 * free helper so it can also be reused by other server-side code if needed.
 */
export function portableTextToPlain(blocks: unknown): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  for (const block of blocks) {
    if (
      typeof block !== 'object' ||
      block === null ||
      (block as { _type?: unknown })._type !== 'block'
    ) {
      continue;
    }
    const children = (block as { children?: unknown }).children;
    if (!Array.isArray(children)) continue;
    const line = children
      .map((c) => {
        if (typeof c !== 'object' || c === null) return '';
        return typeof (c as { text?: unknown }).text === 'string'
          ? (c as { text: string }).text
          : '';
      })
      .join('');
    if (line.trim().length > 0) parts.push(line);
  }
  return parts.join('\n\n');
}

/* ------------------------------------------------------------------ */
/*                            Prompt builder                           */
/* ------------------------------------------------------------------ */

/**
 * Construct the system + user prompt for Claude. We ask for strict JSON
 * output to make parsing deterministic; if the model adds preamble or
 * commentary we still find the JSON array via regex (see `parseJsonArray`).
 */
function buildPrompt(input: SuggestMetaInput): {
  system: string;
  user: string;
} {
  const { kind, documentType, title, bodyPlainText, context } = input;
  const trimmedBody = bodyPlainText.slice(0, BODY_CHAR_LIMIT);
  const target = TARGET_LENGTH[kind];

  const docLabel = documentType === 'blogArticle' ? 'blog article' : 'portfolio case study';

  // Per-kind rules. Distinct angles encourage real variety across the 3
  // suggestions instead of three near-duplicates.
  const kindRules =
    kind === 'metaTitle'
      ? [
          `- Length: between ${target.min} and ${target.max} characters (Google truncates around 60).`,
          '- Front-load the primary keyword inferred from the title and body.',
          '- Be distinct from the page H1 — do NOT echo the article title verbatim.',
          '- May end with " | Garment Decor" only if it fits within the limit.',
          '- Read naturally; never keyword-stuff. Avoid ALL CAPS.',
          // Title Case is non-negotiable for SEO meta titles — sentence case
          // makes them look like body copy in the SERP.
          '- Use Title Case (APA-style): capitalize the first and last word, all major words (nouns, pronouns, verbs, adjectives, adverbs), and any word of 4+ letters. Lowercase short articles, prepositions, and conjunctions (a, an, the, and, but, or, for, nor, on, at, to, from, by, in, of, with, vs) unless they are the first or last word. Capitalize after a colon or em dash. Examples: "How to Choose the Best Polyester for Custom Hoodies", "Screen Printing vs Embroidery: Which Is Right for You?".',
        ]
      : [
          `- Length: between ${target.min} and ${target.max} characters (Google's SERP truncation point).`,
          '- Use active voice. Lead with a specific benefit, outcome, or detail.',
          '- Include the primary keyword naturally (inferred from title and body).',
          '- Match the search intent (informational vs commercial vs how-to).',
          '- Avoid filler ("In this article we will discuss…"), avoid clickbait.',
          '- Avoid echoing the title verbatim. Read like a human wrote it.',
        ];

  const angles =
    kind === 'metaTitle'
      ? [
          '1) Direct/keyword-led — keyword first, brand suffix optional.',
          '2) Benefit-led — promise the outcome the reader wants.',
          '3) Question or list-style — pulls curiosity-driven clicks.',
        ]
      : [
          '1) Benefit-led — "Get [outcome] with [thing]".',
          '2) Specific-detail — concrete numbers, materials, audience, or process.',
          '3) Curiosity / question — frame the reader\'s problem and hint at the answer.',
        ];

  const system = [
    'You are an SEO copywriter for Garment Decor, a B2B custom apparel decoration company in the United States.',
    'You write conversion-optimised meta tags for blog articles and portfolio case studies that win search clicks from teams, schools, and businesses ordering custom garments (screen printing, embroidery, DTG, DTF, heat transfer, sublimation).',
    'Your output is consumed by a server that will JSON.parse it. You MUST return only a JSON array of strings. No preamble. No commentary. No code fences. No markdown.',
  ].join(' ');

  const user = [
    `Write ${SUGGESTION_COUNT} candidate meta ${kind === 'metaTitle' ? 'titles' : 'descriptions'} for the ${docLabel} below.`,
    '',
    'Hard rules — every candidate must satisfy ALL of these:',
    ...kindRules,
    '',
    `Make each of the ${SUGGESTION_COUNT} candidates take a DIFFERENT angle:`,
    ...angles,
    '',
    `Source ${docLabel}:`,
    `Title: ${title}`,
    context ? `Context: ${context}` : '',
    'Body (plain text, may be truncated):',
    '"""',
    trimmedBody,
    '"""',
    '',
    `Return ONLY a JSON array of ${SUGGESTION_COUNT} strings. Example exact format:`,
    '["First candidate.", "Second candidate.", "Third candidate."]',
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}

/* ------------------------------------------------------------------ */
/*                         Response parsing                            */
/* ------------------------------------------------------------------ */

/**
 * Extract a JSON array of strings from the model's response. Tolerant of
 * extra text around the array (we still reject malformed JSON so the caller
 * can return a 502 with a useful error code).
 */
function parseJsonArray(raw: string): string[] | null {
  // Try direct parse first (the prompt asks for raw JSON).
  const direct = tryParseStringArray(raw);
  if (direct) return direct;

  // Fall back: find the first `[ ... ]` substring that parses.
  const match = raw.match(/\[[\s\S]*\]/);
  if (match) {
    return tryParseStringArray(match[0]);
  }
  return null;
}

function tryParseStringArray(raw: string): string[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const all = parsed.every((v) => typeof v === 'string');
    return all ? (parsed as string[]) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*                          Public entry point                         */
/* ------------------------------------------------------------------ */

/**
 * Validate input, call Claude, parse the response into clean suggestions.
 * Never throws — failure modes return a `{ ok: false, code, message }` shape
 * so the route handler can map them to clean HTTP responses.
 */
export async function suggestMeta(input: SuggestMetaInput): Promise<SuggestMetaResult> {
  // ---- Input validation -------------------------------------------------
  if (input.kind !== 'metaTitle' && input.kind !== 'metaDescription') {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'kind must be "metaTitle" or "metaDescription"',
    };
  }
  if (input.documentType !== 'blogArticle' && input.documentType !== 'project') {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'documentType must be "blogArticle" or "project"',
    };
  }
  if (typeof input.title !== 'string' || input.title.trim().length === 0) {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'title is required',
    };
  }
  if (input.title.length > TITLE_MAX) {
    return {
      ok: false,
      code: 'invalid_input',
      message: `title is too long (${input.title.length}; max ${TITLE_MAX})`,
    };
  }
  if (typeof input.bodyPlainText !== 'string') {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'bodyPlainText must be a string',
    };
  }

  const cleanedBody = input.bodyPlainText.replace(/\s+/g, ' ').trim();
  if (cleanedBody.length < MIN_BODY_CHARS) {
    return {
      ok: false,
      code: 'body_too_short',
      message: `Body is too short to generate good suggestions (${cleanedBody.length} chars; need at least ${MIN_BODY_CHARS}). Add more content first.`,
    };
  }

  const cleanedContext =
    typeof input.context === 'string'
      ? input.context.trim().slice(0, CONTEXT_MAX) || undefined
      : undefined;

  // ---- API key check ----------------------------------------------------
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      code: 'missing_api_key',
      message:
        'ANTHROPIC_API_KEY is not set. Add it to your environment to enable AI suggestions.',
    };
  }

  // ---- Build prompt + call ---------------------------------------------
  const { system, user } = buildPrompt({
    ...input,
    bodyPlainText: cleanedBody,
    context: cleanedContext,
  });

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_META_MODEL || DEFAULT_MODEL;

  let raw: string;
  try {
    const response = await client.messages.create({
      model,
      // Generous to let the model explore length, but capped — meta tags
      // are short. With 3 short outputs we shouldn't exceed ~150 tokens.
      max_tokens: 400,
      // Mid-range temperature: enough variety across the 3 angles, not
      // so high that outputs get incoherent.
      temperature: 0.7,
      system,
      messages: [{ role: 'user', content: user }],
    });

    // Concatenate all text blocks (Anthropic returns content as an array).
    raw = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Anthropic error';
    return {
      ok: false,
      code: 'upstream_error',
      message: `Anthropic API call failed: ${message}`,
    };
  }

  // ---- Parse response ---------------------------------------------------
  const parsed = parseJsonArray(raw);
  if (!parsed || parsed.length === 0) {
    return {
      ok: false,
      code: 'unparseable_response',
      message: 'The model returned a response we could not parse as a JSON array of strings.',
    };
  }

  // ---- Normalise + clamp to suggestion count ---------------------------
  const suggestions: MetaSuggestion[] = parsed
    .slice(0, SUGGESTION_COUNT)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 0)
    .map((s) => ({ text: s, charCount: s.length }));

  if (suggestions.length === 0) {
    return {
      ok: false,
      code: 'unparseable_response',
      message: 'The model returned no usable suggestions.',
    };
  }

  return { ok: true, suggestions };
}
