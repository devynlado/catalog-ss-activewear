/**
 * Email template for internal team notification when a quote is submitted
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
  formatPrice,
} from './components';

interface QuoteItem {
  styleName: string;
  brandName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteNotificationProps {
  quoteId: string;
  contact: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  items: QuoteItem[];
  decoration?: {
    type: string;
    description?: string;
  };
  finishing?: string[];
  eventDate?: string;
  message?: string;
  subtotal: number;
  totalItems: number;
}

/**
 * Get subject line for internal quote notification
 */
export function getQuoteNotificationSubject(quoteId: string, total: number): string {
  return EMAIL_SUBJECT_LINES.quoteNotification(quoteId, total);
}

export function generateQuoteNotificationHtml(props: QuoteNotificationProps): string {
  const { quoteId, contact, items, decoration, finishing, eventDate, message, subtotal, totalItems } = props;
  
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid ${EMAIL_COLORS.border};">
        <strong style="color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${item.brandName}</strong><br/>
        <span style="color: ${EMAIL_COLORS.textBody}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">${item.styleName}</span><br/>
        <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">${item.colorName} / ${item.sizeName}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: center; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${formatPrice(item.unitPrice * item.quantity)}</td>
    </tr>
  `).join('');

  const decorationInfo = decoration && decoration.type !== 'none' ? `
    <tr>
      <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Decoration:</td>
      <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><strong>${decoration.type}</strong>${decoration.description ? `<br/><span style="color: ${EMAIL_COLORS.textMuted};">${decoration.description}</span>` : ''}</td>
    </tr>
  ` : '';

  const finishingInfo = finishing && finishing.length > 0 ? `
    <tr>
      <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Finishing:</td>
      <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><strong>${finishing.join(', ')}</strong></td>
    </tr>
  ` : '';

  const content = `
    ${emailHeaderInternal('🎉 New Quote Request!', `Quote ID: ${quoteId}`)}
    
    <!-- Quick Summary -->
    <tr>
      <td style="padding: 24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${EMAIL_COLORS.successBg}; border: 1px solid #bbf7d0; border-radius: 8px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <p style="margin: 0; color: ${EMAIL_COLORS.success}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">ESTIMATED VALUE</p>
              <p style="margin: 4px 0 0; color: ${EMAIL_COLORS.success}; font-size: 28px; font-weight: 700; font-family: ${EMAIL_FONTS.stack};">${formatPrice(subtotal)}</p>
              <p style="margin: 4px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">${totalItems} items</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Customer Info -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Customer Information</h2>
        ${emailCard(`
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; width: 100px; font-family: ${EMAIL_FONTS.stack};">Name:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><strong>${contact.name}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Email:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><a href="mailto:${contact.email}" style="color: ${EMAIL_COLORS.info};">${contact.email}</a></td>
            </tr>
            ${contact.phone ? `
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Phone:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><a href="tel:${contact.phone}" style="color: ${EMAIL_COLORS.info};">${contact.phone}</a></td>
            </tr>
            ` : ''}
            ${contact.company ? `
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Company:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><strong>${contact.company}</strong></td>
            </tr>
            ` : ''}
            ${decorationInfo}
            ${finishingInfo}
            ${eventDate ? `
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Event Date:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack};"><strong style="color: ${EMAIL_COLORS.warning};">${eventDate}</strong></td>
            </tr>
            ` : ''}
          </table>
        `)}
      </td>
    </tr>
    
    ${message ? `
    <!-- Message -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Customer Message</h2>
        <div style="padding: 16px; background-color: #fafaf9; border-radius: 8px; border: 1px solid ${EMAIL_COLORS.border};">
          <p style="margin: 0; color: ${EMAIL_COLORS.textBody}; line-height: 1.6; white-space: pre-wrap; font-family: ${EMAIL_FONTS.stack};">${message}</p>
        </div>
      </td>
    </tr>
    ` : ''}
    
    <!-- Items Table -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Quote Items</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
          <tr style="background-color: #fafaf9;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Product</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Qty</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Line Total</th>
          </tr>
          ${itemRows}
          <tr style="background-color: #fafaf9;">
            <td colspan="2" style="padding: 12px; font-weight: 600; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">Subtotal (blanks only)</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; font-size: 18px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${formatPrice(subtotal)}</td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Action Buttons -->
    <tr>
      <td style="padding: 0 32px 32px; text-align: center;">
        <a href="mailto:${contact.email}?subject=Re: Quote ${quoteId}" style="display: inline-block; padding: 14px 32px; background-color: ${EMAIL_COLORS.primary}; color: white; text-decoration: none; font-weight: 600; border-radius: 8px; margin-right: 12px; font-family: ${EMAIL_FONTS.stack};">Reply to Customer</a>
        ${contact.phone ? `<a href="tel:${contact.phone}" style="display: inline-block; padding: 14px 32px; background-color: ${EMAIL_COLORS.secondary}; color: white; text-decoration: none; font-weight: 600; border-radius: 8px; font-family: ${EMAIL_FONTS.stack};">Call Customer</a>` : ''}
      </td>
    </tr>
    
    ${emailFooterInternal()}
  `;
  
  return emailWrapper(content);
}

export function generateQuoteNotificationText(props: QuoteNotificationProps): string {
  const { quoteId, contact, items, decoration, finishing, eventDate, message, subtotal, totalItems } = props;
  
  const itemsList = items.map(item => 
    `- ${item.brandName} ${item.styleName} (${item.colorName}/${item.sizeName}) x${item.quantity} = ${formatPrice(item.unitPrice * item.quantity)}`
  ).join('\n');

  return `
[INTERNAL] NEW QUOTE REQUEST - ${quoteId}
==========================================

ESTIMATED VALUE: ${formatPrice(subtotal)} (${totalItems} items)

CUSTOMER INFORMATION
--------------------
Name: ${contact.name}
Email: ${contact.email}
${contact.phone ? `Phone: ${contact.phone}` : ''}
${contact.company ? `Company: ${contact.company}` : ''}
${decoration && decoration.type !== 'none' ? `Decoration: ${decoration.type}${decoration.description ? ` - ${decoration.description}` : ''}` : ''}
${finishing && finishing.length > 0 ? `Finishing: ${finishing.join(', ')}` : ''}
${eventDate ? `Event Date: ${eventDate}` : ''}

${message ? `CUSTOMER MESSAGE:\n${message}\n` : ''}

QUOTE ITEMS
-----------
${itemsList}

Subtotal (blanks only): ${formatPrice(subtotal)}

---
Reply to customer: mailto:${contact.email}?subject=Re: Quote ${quoteId}
${contact.phone ? `Call customer: ${contact.phone}` : ''}
  `.trim();
}
