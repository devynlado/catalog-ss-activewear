/**
 * Email template for customer confirmation when they submit a quote
 * Uses shared components for consistent branding
 */

import {
  emailWrapper,
  emailHeader,
  emailFooter,
  emailButton,
  emailCard,
  emailAccentCard,
  EMAIL_COLORS,
  EMAIL_FONTS,
  EMAIL_SUBJECT_LINES,
  EMAIL_PREHEADERS,
  COMPANY_INFO,
  formatPrice,
  buildUTMUrl,
} from './components';

interface QuoteItem {
  styleName: string;
  brandName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteConfirmationProps {
  quoteId: string;
  customerName: string;
  items: QuoteItem[];
  decoration?: {
    type: string;
    description?: string;
  };
  finishing?: string[];
  subtotal: number;
  totalItems: number;
}

/**
 * Get subject line for quote confirmation
 */
export function getQuoteConfirmationSubject(quoteId: string): string {
  return EMAIL_SUBJECT_LINES.quoteConfirmation(quoteId);
}

/**
 * Get preheader for quote confirmation
 */
export function getQuoteConfirmationPreheader(itemCount: number): string {
  return EMAIL_PREHEADERS.quoteConfirmation(itemCount);
}

export function generateQuoteConfirmationHtml(props: QuoteConfirmationProps): string {
  const { quoteId, customerName, items, decoration, finishing, subtotal, totalItems } = props;
  
  const firstName = customerName.split(' ')[0];
  
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

  const decorationName: Record<string, string> = {
    'screen': 'Screen Printing',
    'embroidery': 'Embroidery',
    'digital': 'Digital Printing',
    'puff': 'Puff Printing',
    'none': 'No Decoration'
  };

  const finishingNames: Record<string, string> = {
    'fold-bag': 'Fold & Bag',
    'printed-tags': 'Printed Tags',
    'hang-tags': 'Hang Tags',
    'sewn-tags': 'Sewn Tags'
  };

  const content = `
    ${emailHeader('Quote Received!', "We'll get back to you within 2 hours", { 
      backgroundColor: EMAIL_COLORS.success,
      iconEmoji: '✓'
    })}
    
    <!-- Greeting -->
    <tr>
      <td style="padding: 32px 32px 24px;">
        <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Hi ${firstName},
        </p>
        <p style="margin: 16px 0 0; color: ${EMAIL_COLORS.textBody}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Thank you for your quote request! Our team is reviewing your order and will send you a detailed quote shortly.
        </p>
      </td>
    </tr>
    
    <!-- Quote Reference -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailAccentCard(`
          <p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Your Quote Reference</p>
          <p style="margin: 8px 0 0; color: ${EMAIL_COLORS.info}; font-size: 24px; font-weight: 700; font-family: monospace;">${quoteId}</p>
        `, 'info')}
      </td>
    </tr>
    
    <!-- Items Summary -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Your Quote Summary</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
          <tr style="background-color: #fafaf9;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Product</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Qty</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Est. Total</th>
          </tr>
          ${itemRows}
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
          <tr>
            <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Total Items:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${totalItems}</td>
          </tr>
          ${decoration && decoration.type !== 'none' ? `
          <tr>
            <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Decoration:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${decorationName[decoration.type] || decoration.type}</td>
          </tr>
          ` : ''}
          ${finishing && finishing.length > 0 ? `
          <tr>
            <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Finishing:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${finishing.map(f => finishingNames[f] || f).join(', ')}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid ${EMAIL_COLORS.border};">
            <td style="padding: 12px 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-size: 16px; font-family: ${EMAIL_FONTS.stack};">Estimated Subtotal:</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 20px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${formatPrice(subtotal)}</td>
          </tr>
        </table>
        <p style="margin: 12px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; font-family: ${EMAIL_FONTS.stack};">*Final pricing will be confirmed in your quote response and may vary based on decoration complexity.</p>
      </td>
    </tr>
    
    <!-- What's Next -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">What Happens Next?</h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 12px 0; vertical-align: top; width: 40px;">
              <div style="width: 28px; height: 28px; background-color: #dbeafe; border-radius: 50%; text-align: center; line-height: 28px; color: ${EMAIL_COLORS.info}; font-weight: 600;">1</div>
            </td>
            <td style="padding: 12px 0 12px 12px;">
              <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Quote Review</p>
              <p style="margin: 4px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">Our team reviews your request (avg. 2 hours)</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; vertical-align: top;">
              <div style="width: 28px; height: 28px; background-color: #dbeafe; border-radius: 50%; text-align: center; line-height: 28px; color: ${EMAIL_COLORS.info}; font-weight: 600;">2</div>
            </td>
            <td style="padding: 12px 0 12px 12px;">
              <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Detailed Quote</p>
              <p style="margin: 4px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">We'll email you pricing with decoration options</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; vertical-align: top;">
              <div style="width: 28px; height: 28px; background-color: #dbeafe; border-radius: 50%; text-align: center; line-height: 28px; color: ${EMAIL_COLORS.info}; font-weight: 600;">3</div>
            </td>
            <td style="padding: 12px 0 12px 12px;">
              <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Approve & Produce</p>
              <p style="margin: 4px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">Review sample, then we start production (5-7 days)</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Need Help -->
    <tr>
      <td style="padding: 0 32px 32px;">
        ${emailAccentCard(`
          <p style="margin: 0; color: #92400e; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Need it faster? Have questions?</p>
          <p style="margin: 8px 0 0;">
            <a href="tel:+18559427636" style="color: #92400e; font-size: 20px; font-weight: 700; text-decoration: none; font-family: ${EMAIL_FONTS.stack};">${COMPANY_INFO.phone}</a>
          </p>
          <p style="margin: 8px 0 0; color: #a16207; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">Mon-Fri 8am-5pm PST</p>
        `, 'warning')}
      </td>
    </tr>
    
    ${emailFooter(true)}
  `;
  
  return emailWrapper(content, EMAIL_PREHEADERS.quoteConfirmation(totalItems));
}

export function generateQuoteConfirmationText(props: QuoteConfirmationProps): string {
  const { quoteId, customerName, items, subtotal, totalItems } = props;
  
  const itemsList = items.map(item => 
    `- ${item.brandName} ${item.styleName} (${item.colorName}/${item.sizeName}) x${item.quantity}`
  ).join('\n');

  return `
QUOTE RECEIVED - ${quoteId}
===========================

Hi ${customerName.split(' ')[0]},

Thank you for your quote request! Our team is reviewing your order and will send you a detailed quote within 2 hours.

YOUR QUOTE REFERENCE: ${quoteId}

ITEMS (${totalItems} total):
${itemsList}

Estimated Subtotal: ${formatPrice(subtotal)}
*Final pricing will be confirmed in your quote response.

WHAT'S NEXT:
1. Quote Review - Our team reviews your request (avg. 2 hours)
2. Detailed Quote - We'll email you pricing with decoration options
3. Approve & Produce - Review sample, then we start production

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
