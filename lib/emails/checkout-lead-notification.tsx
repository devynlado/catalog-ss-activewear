/**
 * Internal email notification when a checkout lead is captured.
 * Sent to the sales team when someone enters email + phone on checkout
 * but hasn't completed payment yet.
 */

import {
  emailWrapper,
  emailHeaderInternal,
  emailFooterInternal,
  emailAccentCard,
  EMAIL_COLORS,
  EMAIL_FONTS,
  formatPrice,
} from './components';

export interface LeadCartItem {
  sku: string;
  styleName: string;
  brandName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
}

export interface CheckoutLeadNotificationProps {
  email: string;
  phone: string;
  customerName: string;
  company?: string;
  cartItems: LeadCartItem[];
  cartTotal: number;
  itemCount: number;
  createdAt: string;
}

export function getCheckoutLeadSubject(cartTotal: number, itemCount: number): string {
  return `[CHECKOUT LEAD] $${cartTotal.toFixed(2)} – ${itemCount} item${itemCount !== 1 ? 's' : ''} in cart`;
}

function generateCartTableHtml(items: LeadCartItem[]): string {
  const rows = items.map(item => {
    const lineTotal = item.unitPrice * item.quantity;
    return `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid ${EMAIL_COLORS.border}; font-family: ${EMAIL_FONTS.stack};">
          <strong style="color: ${EMAIL_COLORS.textDark};">${item.brandName} ${item.styleName}</strong><br/>
          <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 12px;">${item.colorName} / ${item.sizeName}</span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; font-family: ${EMAIL_FONTS.stack};">${item.sku}</td>
        <td style="padding: 8px; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack}; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack}; text-align: right;">${formatPrice(lineTotal)}</td>
      </tr>
    `;
  }).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background-color: #f8fafc;">
          <th style="padding: 8px 10px; text-align: left; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-transform: uppercase; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Product</th>
          <th style="padding: 8px; text-align: left; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-transform: uppercase; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">SKU</th>
          <th style="padding: 8px; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-transform: uppercase; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Qty</th>
          <th style="padding: 8px 10px; text-align: right; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-transform: uppercase; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

export function generateCheckoutLeadNotificationHtml(props: CheckoutLeadNotificationProps): string {
  const {
    email,
    phone,
    customerName,
    company,
    cartItems,
    cartTotal,
    itemCount,
    createdAt,
  } = props;

  const totalPieces = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const content = `
    ${emailHeaderInternal('NEW CHECKOUT LEAD', "Someone started checkout but hasn't paid yet")}

    <!-- Lead Summary -->
    <tr>
      <td style="padding: 32px 32px 24px;">
        ${emailAccentCard(`
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; font-family: ${EMAIL_FONTS.stack};">Cart Value</td>
              <td style="color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; text-align: center; font-family: ${EMAIL_FONTS.stack};">Items</td>
              <td style="color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; text-align: right; font-family: ${EMAIL_FONTS.stack};">Pieces</td>
            </tr>
            <tr>
              <td style="color: ${EMAIL_COLORS.primary}; font-size: 28px; font-weight: 700; font-family: ${EMAIL_FONTS.stack};">${formatPrice(cartTotal)}</td>
              <td style="color: ${EMAIL_COLORS.textDark}; font-size: 28px; font-weight: 700; text-align: center; font-family: ${EMAIL_FONTS.stack};">${itemCount}</td>
              <td style="color: ${EMAIL_COLORS.textDark}; font-size: 28px; font-weight: 700; text-align: right; font-family: ${EMAIL_FONTS.stack};">${totalPieces}</td>
            </tr>
          </table>
        `, 'brand')}
      </td>
    </tr>

    <!-- Contact Info -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Contact</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
          ${customerName ? `
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; width: 100px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Name</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${customerName}</td>
          </tr>
          ` : ''}
          ${company ? `
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Company</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${company}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Email</td>
            <td style="padding: 12px; font-family: ${EMAIL_FONTS.stack};">
              <a href="mailto:${email}" style="color: ${EMAIL_COLORS.info};">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Phone</td>
            <td style="padding: 12px; font-family: ${EMAIL_FONTS.stack};">
              <a href="tel:${phone}" style="color: ${EMAIL_COLORS.info};">${phone}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Cart Items -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">What's in Their Cart</h2>
        ${generateCartTableHtml(cartItems)}
      </td>
    </tr>

    <!-- Suggested Action -->
    <tr>
      <td style="padding: 0 32px 32px;">
        ${emailAccentCard(`
          <p style="margin: 0 0 8px; color: #1e40af; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Suggested Follow-Up</p>
          <p style="margin: 0; color: #1e40af; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
            This person started checkout at ${createdAt} but hasn't completed payment. 
            A quick call or text can help close the sale — ask if they need help with sizing, decoration, or bulk pricing.
          </p>
        `, 'info')}
      </td>
    </tr>

    ${emailFooterInternal()}
  `;

  return emailWrapper(content);
}

export function generateCheckoutLeadNotificationText(props: CheckoutLeadNotificationProps): string {
  const {
    email,
    phone,
    customerName,
    company,
    cartItems,
    cartTotal,
    itemCount,
    createdAt,
  } = props;

  const totalPieces = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const itemsList = cartItems.map(item =>
    `  - ${item.brandName} ${item.styleName} | SKU: ${item.sku} | ${item.colorName} / ${item.sizeName} | Qty: ${item.quantity} | ${formatPrice(item.unitPrice * item.quantity)}`
  ).join('\n');

  return `
[CHECKOUT LEAD] ${formatPrice(cartTotal)} – ${itemCount} items, ${totalPieces} pieces
===========================

CONTACT:
${customerName ? `Name: ${customerName}` : ''}
${company ? `Company: ${company}` : ''}
Email: ${email}
Phone: ${phone}

CART CONTENTS:
${itemsList}

Cart Total: ${formatPrice(cartTotal)}

CONTEXT:
This person started checkout at ${createdAt} but hasn't completed payment.
A quick call or text can help close the sale.
  `.trim();
}
