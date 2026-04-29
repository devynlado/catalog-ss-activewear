'use client';

/**
 * AiMetaInput — custom Sanity Studio input for `metaTitle` / `metaDescription`.
 *
 * Wraps the default string/text input and adds a "Generate 3 suggestions"
 * button that calls our admin-gated API route, which in turn asks Claude for
 * three SEO-tuned candidates. Clicking a suggestion writes it into the field
 * via Sanity's patch API; the editor can still type/edit freely.
 *
 * The component is wired in `sanity/schema/blogArticle.ts` and
 * `sanity/schema/project.ts` via:
 *
 *     defineField({
 *       name: 'metaTitle',
 *       type: 'string',
 *       components: { input: AiMetaInput },
 *     })
 *
 * Field intent (metaTitle vs metaDescription) is auto-detected from the
 * field name. Document type (blogArticle vs project) is read from the form
 * context, so the same component can serve both schemas.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Inline,
  Spinner,
  Stack,
  Text,
} from '@sanity/ui';
import {
  set,
  unset,
  type StringInputProps,
  type TextInputProps,
  useFormValue,
} from 'sanity';

/* ------------------------------------------------------------------ */
/*                              Types                                  */
/* ------------------------------------------------------------------ */

type Kind = 'metaTitle' | 'metaDescription';
type DocType = 'blogArticle' | 'project';

interface Suggestion {
  text: string;
  charCount: number;
}

interface ApiSuccess {
  suggestions: Suggestion[];
}

interface ApiError {
  error: string;
  code: string;
}

/* ------------------------------------------------------------------ */
/*                            Constants                                */
/* ------------------------------------------------------------------ */

const TARGET_LENGTH: Record<Kind, { min: number; max: number; ideal: string }> = {
  metaTitle: { min: 40, max: 60, ideal: '40–60' },
  metaDescription: { min: 120, max: 160, ideal: '120–160' },
};

/* ------------------------------------------------------------------ */
/*                       Portable Text → plain                         */
/* ------------------------------------------------------------------ */

/** Identical to the server-side helper; duplicated here so we don't have
 *  to import server-only code into Studio. */
function portableTextToPlain(blocks: unknown): string {
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
/*                             Component                               */
/* ------------------------------------------------------------------ */

export function AiMetaInput(props: StringInputProps | TextInputProps) {
  const { onChange, renderDefault, path } = props;

  // Resolve which kind of suggestion to ask for from the field's path.
  // NOTE: we cannot rely on `props.schemaType.name` here — for inline
  // `defineField({ name: 'metaTitle', type: 'string' })` schemas, that
  // returns the underlying type name (`'string'` or `'text'`), not the
  // field name. The path's last segment is always the field name itself
  // and is the only stable way to discriminate between the two fields.
  const fieldName =
    path.length > 0 ? String(path[path.length - 1]) : '';
  const kind: Kind =
    fieldName === 'metaTitle' ? 'metaTitle' : 'metaDescription';

  // Sibling-field reads — these update live as the editor types into the
  // body / title fields, and include unsaved draft content.
  const docType = useFormValue(['_type']) as string | undefined;
  const titleValue = useFormValue(['title']);
  const blogBody = useFormValue(['body']);
  const projectLongDesc = useFormValue(['longDescription']);
  const projectShortDesc = useFormValue(['shortDescription']);
  const tags = useFormValue(['tags']);

  const documentType: DocType =
    docType === 'project' ? 'project' : 'blogArticle';

  // Resolve body source per document type. Projects often have a thin
  // `longDescription` (the Portable Text version is optional), so fall
  // back to `shortDescription` so generation still works for those.
  const bodyPlainText = useMemo(() => {
    if (documentType === 'project') {
      const long = portableTextToPlain(projectLongDesc);
      if (long.trim().length > 0) return long;
      return typeof projectShortDesc === 'string' ? projectShortDesc : '';
    }
    return portableTextToPlain(blogBody);
  }, [documentType, blogBody, projectLongDesc, projectShortDesc]);

  // Build a small context string from tags — it nudges keyword targeting
  // without dominating the prompt.
  const contextString = useMemo(() => {
    if (!Array.isArray(tags)) return undefined;
    const cleaned = tags
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim())
      .filter(Boolean);
    return cleaned.length > 0 ? cleaned.join(', ') : undefined;
  }, [tags]);

  // ---- Local UI state ---------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);

  const titleString = typeof titleValue === 'string' ? titleValue : '';
  const target = TARGET_LENGTH[kind];

  // Disable generation if we can't form a useful prompt yet. The server
  // will also reject `body_too_short`, but we may as well prevent the call.
  const cannotGenerateReason = useMemo(() => {
    if (titleString.trim().length === 0) {
      return 'Add a title before generating suggestions.';
    }
    if (bodyPlainText.replace(/\s+/g, ' ').trim().length < 80) {
      return documentType === 'project'
        ? 'Add a Long Description (or Short Description) before generating.'
        : 'Add some article content before generating.';
    }
    return null;
  }, [titleString, bodyPlainText, documentType]);

  /* ---- Actions ------------------------------------------------------- */

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/sanity/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Same-origin: Studio is mounted at /studio in the Next.js app,
        // so Supabase auth cookies travel with the request automatically.
        credentials: 'same-origin',
        body: JSON.stringify({
          kind,
          documentType,
          title: titleString,
          bodyPlainText,
          context: contextString,
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(
          errBody?.error || `Generation failed (${res.status} ${res.statusText})`,
        );
      }

      const data = (await res.json()) as ApiSuccess;
      if (!data.suggestions || data.suggestions.length === 0) {
        throw new Error('No suggestions were returned. Try again.');
      }
      setSuggestions(data.suggestions);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [kind, documentType, titleString, bodyPlainText, contextString]);

  const apply = useCallback(
    (text: string) => {
      onChange(text.length > 0 ? set(text) : unset());
      setSuggestions(null);
      setError(null);
    },
    [onChange],
  );

  const dismiss = useCallback(() => {
    setSuggestions(null);
    setError(null);
  }, []);

  /* ---- Render -------------------------------------------------------- */

  return (
    <Stack space={3}>
      {renderDefault(props)}

      <Card padding={3} radius={2} shadow={1} tone="primary">
        <Stack space={3}>
          {/* Header */}
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">
              ✨ AI suggestions
            </Text>
            <Badge tone="primary" mode="outline" fontSize={0}>
              {target.ideal} chars
            </Badge>
            <Box flex={1} />
            <Text size={0} muted>
              {kind === 'metaTitle' ? 'Meta Title' : 'Meta Description'}
            </Text>
          </Flex>

          {/* Error banner */}
          {error && (
            <Card padding={3} radius={2} tone="critical" border>
              <Stack space={2}>
                <Text size={1} weight="medium">
                  Could not generate suggestions
                </Text>
                <Text size={1}>{error}</Text>
              </Stack>
            </Card>
          )}

          {/* Pre-flight: tell the editor why the button is disabled */}
          {!suggestions && cannotGenerateReason && !error && (
            <Text size={1} muted>
              {cannotGenerateReason}
            </Text>
          )}

          {/* Generate button (initial state) */}
          {!suggestions && (
            <Inline space={2}>
              <Button
                text={loading ? 'Generating…' : 'Generate 3 suggestions'}
                onClick={generate}
                disabled={loading || !!cannotGenerateReason}
                tone="primary"
                mode="default"
                icon={loading ? Spinner : undefined}
              />
              {loading && (
                <Text size={1} muted>
                  Asking Claude — usually 2–3 seconds.
                </Text>
              )}
            </Inline>
          )}

          {/* Suggestion list */}
          {suggestions && suggestions.length > 0 && (
            <Stack space={2}>
              {suggestions.map((s, i) => {
                const inRange =
                  s.charCount >= target.min && s.charCount <= target.max;
                return (
                  <Card
                    key={i}
                    padding={3}
                    radius={2}
                    shadow={1}
                    tone="default"
                    style={{ cursor: 'pointer' }}
                    onClick={() => apply(s.text)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        apply(s.text);
                      }
                    }}
                  >
                    <Stack space={2}>
                      <Flex align="flex-start" gap={2}>
                        <Badge
                          tone="primary"
                          mode="outline"
                          fontSize={0}
                          style={{ flexShrink: 0 }}
                        >
                          {i + 1}
                        </Badge>
                        <Text size={1} style={{ lineHeight: 1.5 }}>
                          {s.text}
                        </Text>
                      </Flex>
                      <Flex gap={2} align="center">
                        <Badge
                          tone={inRange ? 'positive' : 'caution'}
                          fontSize={0}
                        >
                          {s.charCount} chars
                        </Badge>
                        <Text size={0} muted>
                          Click to use
                        </Text>
                      </Flex>
                    </Stack>
                  </Card>
                );
              })}

              {/* Footer actions */}
              <Inline space={2}>
                <Button
                  text={loading ? 'Regenerating…' : 'Regenerate'}
                  onClick={generate}
                  disabled={loading}
                  mode="ghost"
                  tone="primary"
                  icon={loading ? Spinner : undefined}
                />
                <Button
                  text="Dismiss"
                  onClick={dismiss}
                  mode="ghost"
                  tone="default"
                />
              </Inline>
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
