/**
 * Email template for internal team notification when a contact form is submitted
 * Uses shared components for consistent styling
 */

import {
  emailWrapper,
  emailHeaderInternal,
  emailFooterInternal,
  emailCard,
  EMAIL_COLORS,
  EMAIL_FONTS,
  EMAIL_SUBJECT_LINES,
} from './components';

interface ArtworkLinkProp {
  url: string | null;
  name: string;
  isImage: boolean;
}

interface ContactNotificationProps {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  service?: string;
  artwork?: ArtworkLinkProp[];
  artworkFailed?: boolean;
}

/**
 * Renders the "Customer Artwork" block (link + inline thumbnail) for the team
 * notification email. Returns '' when there's nothing to show.
 */
function artworkSectionHtml(
  artwork?: ArtworkLinkProp[],
  artworkFailed?: boolean,
): string {
  if (artworkFailed && (!artwork || artwork.length === 0)) {
    return `
    <tr>
      <td style="padding: 0 32px 32px;">
        <div style="padding: 12px 16px; background-color: ${EMAIL_COLORS.warningBg}; border: 1px solid #fef08a; border-radius: 8px;">
          <p style="margin: 0; color: ${EMAIL_COLORS.warning}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">
            ⚠ The customer attached a file but the upload did not complete. Please ask them to resend the artwork by replying to this email.
          </p>
        </div>
      </td>
    </tr>`;
  }

  if (!artwork || artwork.length === 0) return '';

  const cards = artwork
    .map((a) => {
      const thumb =
        a.isImage && a.url
          ? `<a href="${a.url}"><img src="${a.url}" alt="${a.name}" width="96" height="96" style="display:block; width:96px; height:96px; object-fit:cover; border-radius:8px; border:1px solid ${EMAIL_COLORS.border};" /></a>`
          : `<div style="width:96px; height:96px; border-radius:8px; border:1px solid ${EMAIL_COLORS.border}; background-color:#f8fafc; text-align:center; line-height:96px; font-size:12px; color:${EMAIL_COLORS.textMuted}; font-family:${EMAIL_FONTS.stack};">FILE</div>`;
      const link = a.url
        ? `<a href="${a.url}" style="color:${EMAIL_COLORS.info}; font-size:13px; font-weight:600; text-decoration:none; font-family:${EMAIL_FONTS.stack};">Download ${a.name} →</a>`
        : `<span style="color:${EMAIL_COLORS.textMuted}; font-size:13px; font-family:${EMAIL_FONTS.stack};">${a.name}</span>`;
      return `
        <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;"><tr>
          <td style="vertical-align:top; padding-right:12px;">${thumb}</td>
          <td style="vertical-align:middle;">${link}<br/><span style="color:${EMAIL_COLORS.textMuted}; font-size:11px; font-family:${EMAIL_FONTS.stack};">Link valid for 7 days — the admin dashboard always has it.</span></td>
        </tr></table>`;
    })
    .join('');

  return `
    <tr>
      <td style="padding: 0 32px 32px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Customer Artwork</h2>
        ${cards}
      </td>
    </tr>`;
}

/**
 * Get subject line for internal contact notification
 */
export function getContactNotificationSubject(name: string): string {
  return EMAIL_SUBJECT_LINES.contactNotification(name);
}

export function generateContactNotificationHtml(props: ContactNotificationProps): string {
  const { name, email, phone, company, message, service, artwork, artworkFailed } = props;

  const content = `
    ${emailHeaderInternal('💬 New Contact Form Submission')}
    
    <!-- Contact Info -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Contact Information</h2>
        ${emailCard(`
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; width: 100px; font-family: ${EMAIL_FONTS.stack};">Name:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><strong>${name}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Email:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><a href="mailto:${email}" style="color: ${EMAIL_COLORS.info};">${email}</a></td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Phone:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><a href="tel:${phone}" style="color: ${EMAIL_COLORS.info};">${phone}</a></td>
            </tr>
            ` : ''}
            ${company ? `
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Company:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><strong>${company}</strong></td>
            </tr>
            ` : ''}
            ${service ? `
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Interested In:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><strong style="color: ${EMAIL_COLORS.info};">${service}</strong></td>
            </tr>
            ` : ''}
          </table>
        `)}
      </td>
    </tr>
    
    <!-- Message -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Message</h2>
        <div style="padding: 16px; background-color: #fafaf9; border-radius: 8px; border: 1px solid ${EMAIL_COLORS.border};">
          <p style="margin: 0; color: ${EMAIL_COLORS.textBody}; line-height: 1.6; white-space: pre-wrap; font-family: ${EMAIL_FONTS.stack};">${message}</p>
        </div>
      </td>
    </tr>

    ${artworkSectionHtml(artwork, artworkFailed)}

    <!-- Action Buttons -->
    <tr>
      <td style="padding: 0 32px 32px; text-align: center;">
        <a href="mailto:${email}?subject=Re: Your inquiry to Garment Decor" style="display: inline-block; padding: 14px 32px; background-color: ${EMAIL_COLORS.primary}; color: white; text-decoration: none; font-weight: 600; border-radius: 8px; margin-right: 12px; font-family: ${EMAIL_FONTS.stack};">Reply via Email</a>
        ${phone ? `<a href="tel:${phone}" style="display: inline-block; padding: 14px 32px; background-color: ${EMAIL_COLORS.secondary}; color: white; text-decoration: none; font-weight: 600; border-radius: 8px; font-family: ${EMAIL_FONTS.stack};">Call ${name.split(' ')[0]}</a>` : ''}
      </td>
    </tr>
    
    ${emailFooterInternal()}
  `;
  
  return emailWrapper(content);
}

export function generateContactNotificationText(props: ContactNotificationProps): string {
  const { name, email, phone, company, message, service, artwork, artworkFailed } = props;

  let artworkText = '';
  if (artwork && artwork.length > 0) {
    const lines = artwork
      .map((a) => `- ${a.name}: ${a.url || '(link unavailable — see admin dashboard)'}`)
      .join('\n');
    artworkText = `\nCUSTOMER ARTWORK (links valid 7 days; admin dashboard always has it)\n-------------------\n${lines}\n`;
  } else if (artworkFailed) {
    artworkText = `\nCUSTOMER ARTWORK\n-------------------\n⚠ Customer attached a file but the upload failed. Ask them to resend.\n`;
  }

  return `
[INTERNAL] NEW CONTACT FORM SUBMISSION
======================================

CONTACT INFORMATION
-------------------
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${company ? `Company: ${company}` : ''}
${service ? `Interested In: ${service}` : ''}

MESSAGE
-------
${message}
${artworkText}
---
Reply via email: mailto:${email}
${phone ? `Call: ${phone}` : ''}
  `.trim();
}
