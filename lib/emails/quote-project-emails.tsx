/**
 * Email templates for the project-form /quote flow.
 *
 * Two exports each for the two audiences:
 *   - team notification (HTML + plaintext)
 *   - customer confirmation (HTML + plaintext)
 *
 * Data comes from `serializeProject()` in /api/quote/submit — every field
 * is pre-normalized (human-readable labels, low-bound piece estimates, etc.)
 * so this file has no business logic. If the storage shape changes update
 * SerializedProject below.
 *
 * The legacy cart-based templates in quote-notification.tsx / quote-
 * confirmation.tsx are still used by the legacy /api/quote/submit branch
 * (which serves the QuoteDrawer + /decorate flows). Do not delete them.
 */

import {
  emailWrapper,
  emailHeaderInternal,
  emailFooterInternal,
  emailHeader,
  emailFooter,
  emailAccentCard,
  emailCard,
  EMAIL_COLORS,
  EMAIL_FONTS,
  EMAIL_PREHEADERS,
  COMPANY_INFO,
} from './components';

// -----------------------------------------------------------------------------
// Shape stored in `quotes.items` and consumed by these templates + the admin
// renderer. Keep in sync with `serializeProject` in
// `app/api/quote/submit/route.ts`.
// -----------------------------------------------------------------------------
export interface SerializedProject {
  type: 'project';
  index: number;
  blankSource: 'own' | 'catalog';
  blankOwnDescription: string | null;
  catalogCategory: string | null;
  catalogProduct: {
    styleId: number;
    styleName: string;
    brandName: string;
    slug: string;
    imageUrl?: string;
  } | null;
  decorationMethod: string;
  decorationLabel: string;
  quantityTier: string | null;
  estimatedQuantity: number;
  colors: number | null;
  locations: string[] | null;
  isDark: boolean;
  isFleece: boolean;
  stitchCount: string | null;
  numLocations: number | null;
  finishingQuantity: number | null;
  finishingServices: string[] | null;
  designNotes: string | null;
}

// -----------------------------------------------------------------------------
// Label helpers — kept local so we don't pull the whole options file into an
// email template (this file runs in an edge/node runtime that Resend calls).
// -----------------------------------------------------------------------------
const LOCATION_LABELS: Record<string, string> = {
  front: 'Front',
  back: 'Back',
  'left-sleeve': 'Left Sleeve',
  'right-sleeve': 'Right Sleeve',
};

const STITCH_LABELS: Record<string, string> = {
  under5k: 'Under 5,000 stitches',
  '5k-7.5k': '5,000 - 7,500 stitches',
  '7.5k-10k': '7,500 - 10,000 stitches',
  over10k: 'Over 10,000 stitches',
};

const FINISHING_LABELS: Record<string, string> = {
  'fold-bag-shirts': 'Fold & Bag (Shirts)',
  'fold-bag-fleece': 'Fold & Bag (Fleece)',
  'hang-tags': 'Hang Tags',
  barcode: 'Barcode / UPC',
  'sewing-woven-labels': 'Sewn Woven Labels',
};

const CATEGORY_LABELS: Record<string, string> = {
  tshirts: 'T-Shirts',
  sweatshirts: 'Sweatshirts',
  polos: 'Polos',
  headwear: 'Headwear',
  jackets: 'Jackets',
  bags: 'Bags',
  accessories: 'Accessories',
  unsure: 'Not sure — asked for a recommendation',
};

function joinLocations(locs?: string[] | null): string {
  if (!locs || locs.length === 0) return '—';
  return locs.map((l) => LOCATION_LABELS[l] ?? l).join(', ');
}

function joinFinishing(services?: string[] | null): string {
  if (!services || services.length === 0) return '—';
  return services.map((s) => FINISHING_LABELS[s] ?? s).join(', ');
}

function blankSummaryHtml(p: SerializedProject): string {
  if (p.blankSource === 'own') {
    return `
      <strong style="color: ${EMAIL_COLORS.textDark};">Customer supplies blanks</strong><br/>
      <span style="color: ${EMAIL_COLORS.textBody};">${escapeHtml(p.blankOwnDescription ?? '')}</span>
    `;
  }
  const parts: string[] = [];
  if (p.catalogProduct) {
    parts.push(
      `<strong style="color: ${EMAIL_COLORS.textDark};">${escapeHtml(p.catalogProduct.brandName)} ${escapeHtml(p.catalogProduct.styleName)}</strong>`,
    );
    parts.push(
      `<a href="${COMPANY_INFO.website}/product/${encodeURIComponent(p.catalogProduct.slug)}" style="color: ${EMAIL_COLORS.info}; font-size: 13px;">${COMPANY_INFO.website}/product/${escapeHtml(p.catalogProduct.slug)}</a>`,
    );
  } else if (p.catalogCategory) {
    parts.push(
      `<strong style="color: ${EMAIL_COLORS.textDark};">Category:</strong> ${escapeHtml(CATEGORY_LABELS[p.catalogCategory] ?? p.catalogCategory)}`,
    );
  }
  return parts.join('<br/>');
}

function blankSummaryText(p: SerializedProject): string {
  if (p.blankSource === 'own') {
    return `Customer supplies blanks — ${p.blankOwnDescription ?? ''}`;
  }
  if (p.catalogProduct) {
    return `From catalog: ${p.catalogProduct.brandName} ${p.catalogProduct.styleName} (${COMPANY_INFO.website}/product/${p.catalogProduct.slug})`;
  }
  if (p.catalogCategory) {
    return `From catalog category: ${CATEGORY_LABELS[p.catalogCategory] ?? p.catalogCategory}`;
  }
  return 'From catalog (no selection)';
}

// Method-specific fact list used inside each project card. Returns an array
// of `[label, value]` tuples so both the HTML and text renderers can iterate.
function decorationFacts(p: SerializedProject): Array<[string, string]> {
  const facts: Array<[string, string]> = [
    ['Method', p.decorationLabel],
  ];

  if (p.decorationMethod === 'finishing') {
    facts.push(['Quantity', `${p.finishingQuantity ?? 0} pieces`]);
    facts.push(['Services', joinFinishing(p.finishingServices)]);
  } else {
    facts.push(['Quantity', p.quantityTier ? `${p.quantityTier} pieces` : '—']);
  }

  if (
    p.decorationMethod === 'screen-printing' ||
    p.decorationMethod === 'jumbo'
  ) {
    facts.push(['# Colors', String(p.colors ?? '—')]);
    facts.push(['Locations', joinLocations(p.locations)]);
    if (p.isDark) facts.push(['Garment', 'Dark (needs underbase)']);
    if (p.isFleece) facts.push(['Fabric', 'Fleece (+surcharge)']);
  }

  if (p.decorationMethod === 'digital') {
    facts.push(['Locations', joinLocations(p.locations)]);
    if (p.isFleece) facts.push(['Fabric', 'Fleece (+surcharge)']);
  }

  if (p.decorationMethod === 'embroidery') {
    facts.push([
      'Stitch count',
      STITCH_LABELS[p.stitchCount ?? ''] ?? p.stitchCount ?? '—',
    ]);
    facts.push(['# Locations', String(p.numLocations ?? '—')]);
  }

  return facts;
}

// -----------------------------------------------------------------------------
// Tiny HTML escaper — inputs are user-controlled so we cannot let raw HTML
// into the templates.
// -----------------------------------------------------------------------------
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =============================================================================
// TEAM NOTIFICATION
// =============================================================================

export interface ProjectQuoteNotificationProps {
  quoteId: string;
  contact: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  projects: SerializedProject[];
  eventDate?: string | null;
  message?: string;
  totalPieces: number;
}

export function generateProjectQuoteNotificationHtml(
  props: ProjectQuoteNotificationProps,
): string {
  const { quoteId, contact, projects, eventDate, message, totalPieces } = props;

  const contactRows = `
    <tr>
      <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; width: 100px; font-family: ${EMAIL_FONTS.stack};">Name:</td>
      <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><strong>${escapeHtml(contact.name)}</strong></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Email:</td>
      <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><a href="mailto:${encodeURIComponent(contact.email)}" style="color: ${EMAIL_COLORS.info};">${escapeHtml(contact.email)}</a></td>
    </tr>
    ${contact.phone ? `
    <tr>
      <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Phone:</td>
      <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><a href="tel:${encodeURIComponent(contact.phone)}" style="color: ${EMAIL_COLORS.info};">${escapeHtml(contact.phone)}</a></td>
    </tr>` : ''}
    ${contact.company ? `
    <tr>
      <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Company:</td>
      <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><strong>${escapeHtml(contact.company)}</strong></td>
    </tr>` : ''}
    ${eventDate ? `
    <tr>
      <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Need-by:</td>
      <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><strong style="color: ${EMAIL_COLORS.warning};">${escapeHtml(eventDate)}</strong></td>
    </tr>` : ''}
  `;

  const projectBlocks = projects
    .map((p, idx) => {
      const factsRows = decorationFacts(p)
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding: 4px 12px 4px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; vertical-align: top; font-family: ${EMAIL_FONTS.stack};">${escapeHtml(label)}</td>
          <td style="padding: 4px 0; color: ${EMAIL_COLORS.textDark}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">${escapeHtml(value)}</td>
        </tr>`,
        )
        .join('');

      return `
        <tr>
          <td style="padding: 0 32px 16px;">
            ${emailCard(`
              <p style="margin: 0 0 12px; color: ${EMAIL_COLORS.primary}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">
                Project ${idx + 1} — ${escapeHtml(p.decorationLabel)}
              </p>
              <p style="margin: 0 0 12px; font-family: ${EMAIL_FONTS.stack};">
                ${blankSummaryHtml(p)}
              </p>
              <table cellpadding="0" cellspacing="0" style="width: 100%;">
                ${factsRows}
              </table>
              ${p.designNotes ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${EMAIL_COLORS.border};">
                  <p style="margin: 0 0 4px; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; font-family: ${EMAIL_FONTS.stack};">Design notes:</p>
                  <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-size: 13px; white-space: pre-wrap; font-family: ${EMAIL_FONTS.stack};">${escapeHtml(p.designNotes)}</p>
                </div>` : ''}
            `)}
          </td>
        </tr>
      `;
    })
    .join('');

  const content = `
    ${emailHeaderInternal('🎉 New Quote Request!', `Quote ID: ${quoteId}`)}

    <!-- Summary strip -->
    <tr>
      <td style="padding: 24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${EMAIL_COLORS.successBg}; border: 1px solid #bbf7d0; border-radius: 8px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <p style="margin: 0; color: ${EMAIL_COLORS.success}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">PROJECTS</p>
              <p style="margin: 4px 0 0; color: ${EMAIL_COLORS.success}; font-size: 28px; font-weight: 700; font-family: ${EMAIL_FONTS.stack};">${projects.length}</p>
              <p style="margin: 4px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">≈ ${totalPieces} pieces total (low estimate)</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Customer -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Customer</h2>
        ${emailCard(`<table width="100%" cellpadding="0" cellspacing="0">${contactRows}</table>`)}
      </td>
    </tr>

    ${message ? `
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Customer note</h2>
        <div style="padding: 16px; background-color: #fafaf9; border-radius: 8px; border: 1px solid ${EMAIL_COLORS.border};">
          <p style="margin: 0; color: ${EMAIL_COLORS.textBody}; line-height: 1.6; white-space: pre-wrap; font-family: ${EMAIL_FONTS.stack};">${escapeHtml(message)}</p>
        </div>
      </td>
    </tr>` : ''}

    <!-- Projects -->
    <tr>
      <td style="padding: 0 32px 8px;">
        <h2 style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Projects</h2>
      </td>
    </tr>
    ${projectBlocks}

    <!-- Reply CTA -->
    <tr>
      <td style="padding: 8px 32px 32px; text-align: center;">
        <a href="mailto:${encodeURIComponent(contact.email)}?subject=Re: Quote ${encodeURIComponent(quoteId)}" style="display: inline-block; padding: 14px 32px; background-color: ${EMAIL_COLORS.primary}; color: white; text-decoration: none; font-weight: 600; border-radius: 8px; margin-right: 12px; font-family: ${EMAIL_FONTS.stack};">Reply to Customer</a>
        ${contact.phone ? `<a href="tel:${encodeURIComponent(contact.phone)}" style="display: inline-block; padding: 14px 32px; background-color: ${EMAIL_COLORS.secondary}; color: white; text-decoration: none; font-weight: 600; border-radius: 8px; font-family: ${EMAIL_FONTS.stack};">Call Customer</a>` : ''}
      </td>
    </tr>

    ${emailFooterInternal()}
  `;

  return emailWrapper(content);
}

export function generateProjectQuoteNotificationText(
  props: ProjectQuoteNotificationProps,
): string {
  const { quoteId, contact, projects, eventDate, message, totalPieces } = props;

  const projectSection = projects
    .map((p, idx) => {
      const facts = decorationFacts(p)
        .map(([label, value]) => `  ${label}: ${value}`)
        .join('\n');
      const notes = p.designNotes
        ? `\n  Design notes:\n    ${p.designNotes.split('\n').join('\n    ')}`
        : '';
      return `PROJECT ${idx + 1} — ${p.decorationLabel}
  Blank: ${blankSummaryText(p)}
${facts}${notes}`;
    })
    .join('\n\n');

  return `
[INTERNAL] NEW QUOTE REQUEST - ${quoteId}
==========================================

PROJECTS: ${projects.length}
ESTIMATED TOTAL: ~${totalPieces} pieces (low estimate)

CUSTOMER
--------
Name: ${contact.name}
Email: ${contact.email}
${contact.phone ? `Phone: ${contact.phone}` : ''}
${contact.company ? `Company: ${contact.company}` : ''}
${eventDate ? `Need-by: ${eventDate}` : ''}

${message ? `CUSTOMER NOTE:\n${message}\n` : ''}
${projectSection}

---
Reply to customer: mailto:${contact.email}?subject=Re: Quote ${quoteId}
${contact.phone ? `Call customer: ${contact.phone}` : ''}
  `.trim();
}

// =============================================================================
// CUSTOMER CONFIRMATION
// =============================================================================

export interface ProjectQuoteConfirmationProps {
  quoteId: string;
  customerName: string;
  projects: SerializedProject[];
  totalPieces: number;
}

export function generateProjectQuoteConfirmationHtml(
  props: ProjectQuoteConfirmationProps,
): string {
  const { quoteId, customerName, projects, totalPieces } = props;
  const firstName = customerName.split(' ')[0] || 'there';

  const projectBlocks = projects
    .map((p, idx) => {
      // Customer-facing: fewer internal-only fields, no `estimatedQuantity`
      // low-bound clutter — we show the tier they picked as-is.
      const rows = [
        [
          'Blank',
          p.blankSource === 'own'
            ? 'Your own blanks'
            : p.catalogProduct
              ? `${p.catalogProduct.brandName} ${p.catalogProduct.styleName}`
              : CATEGORY_LABELS[p.catalogCategory ?? ''] ??
                'Chosen from catalog',
        ],
        ['Method', p.decorationLabel],
      ];

      if (p.decorationMethod === 'finishing') {
        rows.push(['Quantity', `${p.finishingQuantity ?? 0} pieces`]);
        rows.push(['Services', joinFinishing(p.finishingServices)]);
      } else if (p.quantityTier) {
        rows.push(['Quantity', `${p.quantityTier} pieces`]);
      }

      if (
        p.decorationMethod === 'screen-printing' ||
        p.decorationMethod === 'jumbo'
      ) {
        rows.push(['# Colors', String(p.colors ?? '—')]);
        rows.push(['Locations', joinLocations(p.locations)]);
      }
      if (p.decorationMethod === 'digital') {
        rows.push(['Locations', joinLocations(p.locations)]);
      }
      if (p.decorationMethod === 'embroidery') {
        rows.push([
          'Stitch count',
          STITCH_LABELS[p.stitchCount ?? ''] ?? p.stitchCount ?? '—',
        ]);
        rows.push(['# Locations', String(p.numLocations ?? '—')]);
      }

      const rowHtml = rows
        .map(
          ([label, value]) => `
          <tr>
            <td style="padding: 4px 12px 4px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; vertical-align: top; font-family: ${EMAIL_FONTS.stack};">${escapeHtml(label)}</td>
            <td style="padding: 4px 0; color: ${EMAIL_COLORS.textDark}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">${escapeHtml(value)}</td>
          </tr>`,
        )
        .join('');

      return `
        <tr>
          <td style="padding: 0 32px 16px;">
            ${emailCard(`
              <p style="margin: 0 0 12px; color: ${EMAIL_COLORS.primary}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Project ${idx + 1}</p>
              <table cellpadding="0" cellspacing="0" style="width: 100%;">${rowHtml}</table>
            `)}
          </td>
        </tr>`;
    })
    .join('');

  const content = `
    ${emailHeader('Quote Received!', "We'll get back to you within 2 hours", {
      backgroundColor: EMAIL_COLORS.success,
      iconEmoji: '✓',
    })}

    <tr>
      <td style="padding: 32px 32px 16px;">
        <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Hi ${escapeHtml(firstName)},
        </p>
        <p style="margin: 16px 0 0; color: ${EMAIL_COLORS.textBody}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Thanks for the quote request! Our team is reviewing your project${projects.length > 1 ? 's' : ''} and will send you a detailed quote shortly — normally within 2 hours during business hours.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailAccentCard(`
          <p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Your Quote Reference</p>
          <p style="margin: 8px 0 0; color: ${EMAIL_COLORS.info}; font-size: 24px; font-weight: 700; font-family: monospace;">${escapeHtml(quoteId)}</p>
        `, 'info')}
      </td>
    </tr>

    <tr>
      <td style="padding: 0 32px 8px;">
        <h2 style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">What you shared with us</h2>
        <p style="margin: 4px 0 12px; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">${projects.length} project${projects.length !== 1 ? 's' : ''} · ≈ ${totalPieces} pieces total</p>
      </td>
    </tr>
    ${projectBlocks}

    <tr>
      <td style="padding: 8px 32px 32px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">What happens next</h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0 8px 12px;">
              <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">1. Quote review</p>
              <p style="margin: 4px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">Our team reviews your request (avg. 2 hours)</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0 8px 12px;">
              <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">2. Detailed quote</p>
              <p style="margin: 4px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">We'll email pricing and options, and ask for artwork if you have it</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0 8px 12px;">
              <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">3. Approve & produce</p>
              <p style="margin: 4px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">Sample first, then production (typically 5-7 business days)</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 32px 32px;">
        ${emailAccentCard(`
          <p style="margin: 0; color: #92400e; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Need it faster? Have questions?</p>
          <p style="margin: 8px 0 0;"><a href="tel:${COMPANY_INFO.phone.replace(/[^0-9+]/g, '')}" style="color: #92400e; font-size: 20px; font-weight: 700; text-decoration: none; font-family: ${EMAIL_FONTS.stack};">${COMPANY_INFO.phone}</a></p>
          <p style="margin: 8px 0 0; color: #a16207; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">Mon-Fri 8am-5pm PST</p>
        `, 'warning')}
      </td>
    </tr>

    ${emailFooter(true)}
  `;

  return emailWrapper(content, EMAIL_PREHEADERS.quoteConfirmation(projects.length));
}

export function generateProjectQuoteConfirmationText(
  props: ProjectQuoteConfirmationProps,
): string {
  const { quoteId, customerName, projects, totalPieces } = props;
  const firstName = customerName.split(' ')[0] || 'there';

  const projectSection = projects
    .map((p, idx) => {
      const lines: string[] = [`PROJECT ${idx + 1} — ${p.decorationLabel}`];
      lines.push(
        `  Blank: ${
          p.blankSource === 'own'
            ? 'Your own blanks'
            : p.catalogProduct
              ? `${p.catalogProduct.brandName} ${p.catalogProduct.styleName}`
              : CATEGORY_LABELS[p.catalogCategory ?? ''] ??
                'Chosen from catalog'
        }`,
      );
      if (p.decorationMethod === 'finishing') {
        lines.push(`  Quantity: ${p.finishingQuantity ?? 0} pieces`);
        lines.push(`  Services: ${joinFinishing(p.finishingServices)}`);
      } else if (p.quantityTier) {
        lines.push(`  Quantity: ${p.quantityTier} pieces`);
      }
      if (
        p.decorationMethod === 'screen-printing' ||
        p.decorationMethod === 'jumbo'
      ) {
        lines.push(`  # Colors: ${p.colors ?? '—'}`);
        lines.push(`  Locations: ${joinLocations(p.locations)}`);
      }
      if (p.decorationMethod === 'digital') {
        lines.push(`  Locations: ${joinLocations(p.locations)}`);
      }
      if (p.decorationMethod === 'embroidery') {
        lines.push(
          `  Stitch count: ${STITCH_LABELS[p.stitchCount ?? ''] ?? p.stitchCount ?? '—'}`,
        );
        lines.push(`  # Locations: ${p.numLocations ?? '—'}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');

  return `
QUOTE RECEIVED - ${quoteId}
===========================

Hi ${firstName},

Thanks for your quote request! Our team is reviewing your ${projects.length > 1 ? 'projects' : 'project'} and will send a detailed quote — usually within 2 hours during business hours.

YOUR QUOTE REFERENCE: ${quoteId}
Projects: ${projects.length} · ~${totalPieces} pieces total

${projectSection}

WHAT'S NEXT:
1. Quote review — our team reviews your request (~2 hours)
2. Detailed quote — we'll email pricing and ask for artwork if you have it
3. Approve & produce — sample first, then production (5-7 business days)

NEED IT FASTER? HAVE QUESTIONS?
Call us: ${COMPANY_INFO.phone}
Mon-Fri 8am-5pm PST

---
${COMPANY_INFO.name}
${COMPANY_INFO.tagline}
${COMPANY_INFO.address}
${COMPANY_INFO.email}
  `.trim();
}
