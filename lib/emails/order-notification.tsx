/**
 * Internal email notification when a standard (cart) order is placed
 * Designed to be forwarded to the purchasing team with all details needed to fulfill the order.
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

export interface OrderItem {
  sku: string;
  styleId?: number;
  styleName: string;
  brandName: string;
  colorName: string;
  colorCode?: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  discountedPrice?: number;
}

export interface OrderNotificationProps {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  company?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  shippingMethod: string;
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address?: string;
    apartment?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  poNumber?: string;
  notes?: string;
  paymentIntentId?: string;
  createdAt: string;
}

export function getOrderNotificationSubject(orderNumber: string, total: number): string {
  return `[NEW ORDER] ${orderNumber} – $${total.toFixed(2)} – Action Required`;
}

function generateItemsTableHtml(items: OrderItem[]): string {
  const rows = items.map(item => {
    const price = item.discountedPrice ?? item.unitPrice;
    const lineTotal = price * item.quantity;
    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid ${EMAIL_COLORS.border}; font-family: ${EMAIL_FONTS.stack};">
          <strong style="color: ${EMAIL_COLORS.textDark};">${item.brandName} ${item.styleName}</strong><br/>
          <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 12px;">SKU: ${item.sku}</span>
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack}; text-align: center;">${item.colorName}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack}; text-align: center;">${item.sizeName}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack}; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack}; text-align: right;">${formatPrice(price)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack}; text-align: right;">${formatPrice(lineTotal)}</td>
      </tr>
    `;
  }).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background-color: #f8fafc;">
          <th style="padding: 10px 12px; text-align: left; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-transform: uppercase; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Product</th>
          <th style="padding: 10px 8px; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-transform: uppercase; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Color</th>
          <th style="padding: 10px 8px; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-transform: uppercase; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Size</th>
          <th style="padding: 10px 8px; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-transform: uppercase; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Qty</th>
          <th style="padding: 10px 8px; text-align: right; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-transform: uppercase; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Price</th>
          <th style="padding: 10px 12px; text-align: right; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-transform: uppercase; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

export function generateOrderNotificationHtml(props: OrderNotificationProps): string {
  const {
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    company,
    items,
    subtotal,
    shippingCost,
    taxAmount,
    total,
    shippingMethod,
    shippingAddress,
    poNumber,
    notes,
    paymentIntentId,
    createdAt,
  } = props;

  const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingLabel = shippingMethod === 'same_day' ? 'Express' : 'Economy';

  const content = `
    ${emailHeaderInternal('ACTION REQUIRED: New Order', `Order #${orderNumber}`)}
    
    <!-- Order Summary Card -->
    <tr>
      <td style="padding: 32px 32px 24px;">
        ${emailAccentCard(`
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; font-family: ${EMAIL_FONTS.stack};">Order Total</td>
              <td style="color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; text-align: center; font-family: ${EMAIL_FONTS.stack};">Items</td>
              <td style="color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; text-align: right; font-family: ${EMAIL_FONTS.stack};">Shipping</td>
            </tr>
            <tr>
              <td style="color: ${EMAIL_COLORS.success}; font-size: 28px; font-weight: 700; font-family: ${EMAIL_FONTS.stack};">${formatPrice(total)}</td>
              <td style="color: ${EMAIL_COLORS.textDark}; font-size: 28px; font-weight: 700; text-align: center; font-family: ${EMAIL_FONTS.stack};">${totalPieces} pcs</td>
              <td style="color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; text-align: right; font-family: ${EMAIL_FONTS.stack};">${shippingLabel}</td>
            </tr>
          </table>
        `, 'success')}
      </td>
    </tr>

    <!-- Items to Purchase -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Items to Purchase</h2>
        ${generateItemsTableHtml(items)}
      </td>
    </tr>

    <!-- Pricing Breakdown -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 6px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Subtotal</td>
            <td style="padding: 6px 0; text-align: right; font-family: ${EMAIL_FONTS.stack};">${formatPrice(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Shipping (${shippingLabel})</td>
            <td style="padding: 6px 0; text-align: right; font-family: ${EMAIL_FONTS.stack};">${shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Tax</td>
            <td style="padding: 6px 0; text-align: right; font-family: ${EMAIL_FONTS.stack};">${formatPrice(taxAmount)}</td>
          </tr>
          <tr style="border-top: 2px solid ${EMAIL_COLORS.border};">
            <td style="padding: 12px 0; color: ${EMAIL_COLORS.textDark}; font-weight: 700; font-size: 16px; font-family: ${EMAIL_FONTS.stack};">Total</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 20px; color: ${EMAIL_COLORS.success}; font-family: ${EMAIL_FONTS.stack};">${formatPrice(total)}</td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Shipping Address -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Ship To</h2>
        <div style="background-color: #fafaf9; border-radius: 8px; padding: 16px;">
          <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">
            ${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}<br/>
            ${shippingAddress.company ? `${shippingAddress.company}<br/>` : ''}
            ${shippingAddress.address || ''}${shippingAddress.apartment ? `, ${shippingAddress.apartment}` : ''}<br/>
            ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}
          </p>
        </div>
      </td>
    </tr>

    <!-- Customer Information -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Customer Information</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; width: 140px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Name</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${customerName}</td>
          </tr>
          ${company ? `
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Company</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${company}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Email</td>
            <td style="padding: 12px; font-family: ${EMAIL_FONTS.stack};"><a href="mailto:${customerEmail}" style="color: ${EMAIL_COLORS.info};">${customerEmail}</a></td>
          </tr>
          ${customerPhone ? `
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Phone</td>
            <td style="padding: 12px; font-family: ${EMAIL_FONTS.stack};"><a href="tel:${customerPhone}" style="color: ${EMAIL_COLORS.info};">${customerPhone}</a></td>
          </tr>
          ` : ''}
          ${poNumber ? `
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">PO Number</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${poNumber}</td>
          </tr>
          ` : ''}
        </table>
      </td>
    </tr>

    ${notes ? `
    <!-- Order Notes -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Order Notes</h2>
        <div style="background-color: #fffbeb; border: 1px solid #fef08a; border-radius: 8px; padding: 16px;">
          <p style="margin: 0; color: ${EMAIL_COLORS.textBody}; font-style: italic; font-family: ${EMAIL_FONTS.stack};">"${notes}"</p>
        </div>
      </td>
    </tr>
    ` : ''}

    <!-- Technical Details -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Technical Details</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; width: 140px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Order Number</td>
            <td style="padding: 12px; font-family: monospace; color: ${EMAIL_COLORS.textDark};">${orderNumber}</td>
          </tr>
          ${paymentIntentId ? `
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Stripe Payment</td>
            <td style="padding: 12px; font-family: monospace; font-size: 12px;">
              <a href="https://dashboard.stripe.com/payments/${paymentIntentId}" style="color: ${EMAIL_COLORS.info};">View in Stripe Dashboard</a>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Order Time</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${createdAt}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Action Items -->
    <tr>
      <td style="padding: 0 32px 32px;">
        ${emailAccentCard(`
          <p style="margin: 0; color: #1e40af; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Next Steps</p>
          <ol style="margin: 12px 0 0; padding-left: 20px; color: #1e40af; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
            <li style="margin-bottom: 8px;">Purchase items from SS Activewear (or supplier)</li>
            <li style="margin-bottom: 8px;">Ship to customer address above</li>
            <li style="margin-bottom: 8px;">Update order status + send tracking info</li>
          </ol>
        `, 'info')}
      </td>
    </tr>
    
    ${emailFooterInternal()}
  `;

  return emailWrapper(content);
}

export function generateOrderNotificationText(props: OrderNotificationProps): string {
  const {
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    company,
    items,
    subtotal,
    shippingCost,
    taxAmount,
    total,
    shippingMethod,
    shippingAddress,
    poNumber,
    notes,
    paymentIntentId,
    createdAt,
  } = props;

  const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingLabel = shippingMethod === 'same_day' ? 'Express' : 'Economy';

  const itemsList = items.map(item => {
    const price = item.discountedPrice ?? item.unitPrice;
    return `  - ${item.brandName} ${item.styleName} | SKU: ${item.sku} | ${item.colorName} / ${item.sizeName} | Qty: ${item.quantity} | ${formatPrice(price)} ea | ${formatPrice(price * item.quantity)}`;
  }).join('\n');

  return `
[NEW ORDER] ${orderNumber} – ${formatPrice(total)}
===========================

SUMMARY: ${totalPieces} pieces | ${shippingLabel} shipping | ${formatPrice(total)}

ITEMS TO PURCHASE:
${itemsList}

Subtotal: ${formatPrice(subtotal)}
Shipping (${shippingLabel}): ${shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
Tax: ${formatPrice(taxAmount)}
Total: ${formatPrice(total)}

SHIP TO:
${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}
${shippingAddress.company ? shippingAddress.company + '\n' : ''}${shippingAddress.address || ''}${shippingAddress.apartment ? ', ' + shippingAddress.apartment : ''}
${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}

CUSTOMER INFORMATION:
Name: ${customerName}
${company ? `Company: ${company}` : ''}
Email: ${customerEmail}
${customerPhone ? `Phone: ${customerPhone}` : ''}
${poNumber ? `PO Number: ${poNumber}` : ''}

${notes ? `ORDER NOTES: "${notes}"` : ''}

TECHNICAL DETAILS:
Order Number: ${orderNumber}
${paymentIntentId ? `Stripe: https://dashboard.stripe.com/payments/${paymentIntentId}` : ''}
Order Time: ${createdAt}

NEXT STEPS:
1. Purchase items from SS Activewear (or supplier)
2. Ship to customer address above
3. Update order status + send tracking info
  `.trim();
}
