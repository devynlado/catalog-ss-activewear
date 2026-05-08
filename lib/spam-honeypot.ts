/**
 * Honeypot anti-spam helpers.
 *
 * The pattern: every public form ships a hidden `website` field. Real users
 * never see or fill it (it's `display:none`, `aria-hidden`, `tabindex=-1`).
 * Dumb spambots fill every input on the page, so a non-empty value here is
 * a strong signal the submission is automated.
 *
 * On the server we DO NOT 4xx those submissions — that gives the bot
 * feedback ("oh, this field broke me, let me try a different approach").
 * Instead we mirror the same silent-200 pattern already used by the
 * `blocked_emails` filter in /api/contact: pretend success, drop the data
 * (or store it tagged as spam). The bot operator gets no signal and won't
 * adapt.
 *
 * This is paired with Cloudflare Turnstile (lib/turnstile.ts) which catches
 * smarter bots that don't blindly fill every field. Honeypot covers the
 * dumb bottom of the funnel for free.
 */

/**
 * The HTML name attribute used on the hidden field. We deliberately pick a
 * plausible-looking name like "website" so naive bots fill it; using
 * "honeypot" or "do_not_fill" would be a giveaway and modern scrapers do
 * skip those.
 *
 * Keep this constant — changing it means every existing client + server
 * must update in lockstep, otherwise you'll silently drop legitimate
 * submissions that still send the old field name.
 */
export const HONEYPOT_FIELD_NAME = 'website' as const;

/**
 * Generic "any object" type for incoming form bodies. We accept a wide
 * shape because the helper is used from many endpoints with different
 * payloads, and we only care about the one field.
 */
type FormBodyShape = Record<string, unknown> | null | undefined;

/**
 * True if the honeypot field is present and non-empty in the request body.
 * False otherwise — including when the field is missing entirely (legitimate
 * older clients won't have the field at all and we must accept those).
 */
export function isHoneypotTriggered(body: FormBodyShape): boolean {
  if (!body || typeof body !== 'object') return false;
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD_NAME];
  if (typeof value !== 'string') return false;
  return value.trim().length > 0;
}
