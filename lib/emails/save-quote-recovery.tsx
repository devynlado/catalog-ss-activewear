/**
 * Email template for quote recovery (exit intent save)
 * Sent when a user saves their quote via the exit intent popup
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

interface CartItem {
  sku?: string;
  styleName: string;
  brandName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
}

interface SaveQuoteRecoveryProps {
  email: string;
  recoveryToken: string;
  cartItems: CartItem[];
  expiresAt: Date;
}

/**
 * Get subject line for recovery email
 */
export function getRecoverySubject(itemCount: number): string {
  return EMAIL_SUBJECT_LINES.quoteRecovery(itemCount);
}

/**
 * Get preheader text for recovery email
 */
export function getRecoveryPreheader(): string {
  return EMAIL_PREHEADERS.quoteRecovery;
}

/**
 * Generate HTML version of recovery email
 */
export function generateSaveQuoteRecoveryHtml(props: SaveQuoteRecoveryProps): string {
  const { recoveryToken, cartItems, expiresAt } = props;
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';
  const recoveryUrl = buildUTMUrl(`${baseUrl}/resume-quote/${recoveryToken}`, {
    source: 'email',
    medium: 'recovery',
    campaign: 'exit_intent',
    content: 'cta_button',
  });
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  // Generate cart items HTML
  const cartItemsHtml = cartItems.slice(0, 5).map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid ${EMAIL_COLORS.border};">
        <strong style="color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${item.brandName}</strong><br/>
        <span style="color: ${EMAIL_COLORS.textBody}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">${item.styleName}</span><br/>
        <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">${item.colorName} / ${item.sizeName}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: center; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">
        ${formatPrice(item.unitPrice * item.quantity)}
      </td>
    </tr>
  `).join('');
  
  const moreItemsNote = cartItems.length > 5 
    ? `<p style="margin: 12px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-style: italic; font-family: ${EMAIL_FONTS.stack};">+ ${cartItems.length - 5} more item${cartItems.length - 5 !== 1 ? 's' : ''} in your quote</p>`
    : '';

  const content = `
    ${emailHeader('Your Quote is Saved!', `${totalItems} item${totalItems !== 1 ? 's' : ''} waiting for you`)}
    
    <!-- Greeting -->
    <tr>
      <td style="padding: 32px 32px 24px;">
        <p style="margin: 0; color: ${EMAIL_COLORS.textBody}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Good news! We've saved your quote so you can pick up right where you left off. Your items are reserved for ${daysUntilExpiry} days.
        </p>
      </td>
    </tr>
    
    <!-- CTA Button -->
    <tr>
      <td style="padding: 0 32px 24px; text-align: center;">
        ${emailButton('Resume Your Quote', recoveryUrl, { color: 'primary' })}
      </td>
    </tr>
    
    <!-- Cart Summary -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">
          Your Saved Items
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
          <tr style="background-color: #fafaf9;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Product</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Qty</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Est. Total</th>
          </tr>
          ${cartItemsHtml}
        </table>
        ${moreItemsNote}
        
        <!-- Subtotal -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
          <tr>
            <td style="padding: 12px 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-size: 16px; font-family: ${EMAIL_FONTS.stack};">
              Estimated Subtotal:
            </td>
            <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 20px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">
              ${formatPrice(subtotal)}
            </td>
          </tr>
        </table>
        <p style="margin: 8px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; font-family: ${EMAIL_FONTS.stack};">
          *Blank pricing only. Final quote will include decoration costs.
        </p>
      </td>
    </tr>
    
    <!-- Expiration Notice -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailAccentCard(`
          <p style="margin: 0; color: #92400e; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
            <strong>⏰ This link expires in ${daysUntilExpiry} days</strong><br/>
            After that, you'll need to rebuild your quote from scratch.
          </p>
        `, 'warning')}
      </td>
    </tr>
    
    <!-- What's Next -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">
          Ready to Complete Your Order?
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 32px;">
              <div style="width: 24px; height: 24px; background-color: #fed7aa; border-radius: 50%; text-align: center; line-height: 24px; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-size: 12px;">1</div>
            </td>
            <td style="padding: 8px 0 8px 12px;">
              <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">Click the button above</p>
              <p style="margin: 2px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">Your cart will be restored automatically</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top;">
              <div style="width: 24px; height: 24px; background-color: #fed7aa; border-radius: 50%; text-align: center; line-height: 24px; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-size: 12px;">2</div>
            </td>
            <td style="padding: 8px 0 8px 12px;">
              <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">Choose your decoration</p>
              <p style="margin: 2px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">Screen printing, embroidery, or digital print</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top;">
              <div style="width: 24px; height: 24px; background-color: #fed7aa; border-radius: 50%; text-align: center; line-height: 24px; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-size: 12px;">3</div>
            </td>
            <td style="padding: 8px 0 8px 12px;">
              <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">Submit for a free quote</p>
              <p style="margin: 2px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">We respond within 2 hours on business days</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Help Section -->
    <tr>
      <td style="padding: 0 32px 32px;">
        ${emailCard(`
          <p style="margin: 0 0 8px; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
            Have questions? We're here to help!
          </p>
          <p style="margin: 0;">
            <a href="tel:${COMPANY_INFO.phone.replace(/[^0-9+]/g, '')}" style="color: ${EMAIL_COLORS.primary}; font-size: 18px; font-weight: 700; text-decoration: none; font-family: ${EMAIL_FONTS.stack};">
              ${COMPANY_INFO.phone}
            </a>
          </p>
          <p style="margin: 4px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">
            Mon-Fri 8am-5pm PST
          </p>
        `)}
      </td>
    </tr>
    
    ${emailFooter(true)}
  `;
  
  return emailWrapper(content, EMAIL_PREHEADERS.quoteRecovery);
}

/**
 * Generate plain text version of recovery email
 */
export function generateSaveQuoteRecoveryText(props: SaveQuoteRecoveryProps): string {
  const { recoveryToken, cartItems, expiresAt } = props;
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';
  const recoveryUrl = `${baseUrl}/resume-quote/${recoveryToken}`;
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  const itemsList = cartItems.slice(0, 5).map(item => 
    `- ${item.brandName} ${item.styleName} (${item.colorName}/${item.sizeName}) x${item.quantity} - ${formatPrice(item.unitPrice * item.quantity)}`
  ).join('\n');
  
  const moreItemsNote = cartItems.length > 5 
    ? `\n+ ${cartItems.length - 5} more item(s) in your quote`
    : '';

  return `
YOUR QUOTE IS SAVED!
====================

Good news! We've saved your quote so you can pick up right where you left off.

RESUME YOUR QUOTE:
${recoveryUrl}

---

YOUR SAVED ITEMS (${totalItems} items)
${itemsList}${moreItemsNote}

Estimated Subtotal: ${formatPrice(subtotal)}
*Blank pricing only. Final quote will include decoration costs.

---

⏰ This link expires in ${daysUntilExpiry} days.
After that, you'll need to rebuild your quote from scratch.

---

READY TO COMPLETE YOUR ORDER?

1. Click the link above - your cart will be restored automatically
2. Choose your decoration - screen printing, embroidery, or digital print
3. Submit for a free quote - we respond within 2 hours on business days

---

Have questions? We're here to help!
Call: ${COMPANY_INFO.phone}
Mon-Fri 8am-5pm PST

---

${COMPANY_INFO.name}
${COMPANY_INFO.tagline}
${COMPANY_INFO.address}
${COMPANY_INFO.email}

To unsubscribe: ${baseUrl}/unsubscribe
  `.trim();
}
