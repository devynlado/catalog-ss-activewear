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

interface ContactNotificationProps {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  service?: string;
}

/**
 * Get subject line for internal contact notification
 */
export function getContactNotificationSubject(name: string): string {
  return EMAIL_SUBJECT_LINES.contactNotification(name);
}

export function generateContactNotificationHtml(props: ContactNotificationProps): string {
  const { name, email, phone, company, message, service } = props;

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
  const { name, email, phone, company, message, service } = props;

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

---
Reply via email: mailto:${email}
${phone ? `Call: ${phone}` : ''}
  `.trim();
}
