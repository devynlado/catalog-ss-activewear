/**
 * Email template for notifying customers their order has shipped.
 * Subject: "Your Garment Decor order is on its way"
 * Triggered when admin marks order as shipped with tracking info.
 */

import {
  emailWrapper,
  emailHeader,
  emailFooter,
  emailButton,
  emailAccentCard,
  EMAIL_COLORS,
  EMAIL_FONTS,
  COMPANY_INFO,
} from './components';

export interface OrderShippedEmailProps {
  orderNumber: string;
  customerName: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  items: Array<{
    name: string;
    color: string;
    quantity: number;
  }>;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    zip?: string;
  } | null;
  shipmentIndex?: number;
  totalShipments?: number;
}

const CARRIER_LABELS: Record<string, string> = {
  ups: 'UPS',
  fedex: 'FedEx',
  usps: 'USPS',
  dhl: 'DHL',
  other: 'Carrier',
};

export function getOrderShippedSubject(orderNumber: string, shipmentIndex?: number, totalShipments?: number): string {
  if (totalShipments && totalShipments > 1 && shipmentIndex !== undefined) {
    return `Shipment ${shipmentIndex + 1} of ${totalShipments} is on its way — ${orderNumber}`;
  }
  return `Your Garment Decor order is on its way — ${orderNumber}`;
}

export function generateOrderShippedHtml(props: OrderShippedEmailProps): string {
  const {
    orderNumber,
    customerName,
    carrier,
    trackingNumber,
    trackingUrl,
    items,
    shippingAddress,
    shipmentIndex,
    totalShipments,
  } = props;

  const firstName = customerName.split(' ')[0];
  const carrierLabel = CARRIER_LABELS[carrier.toLowerCase()] || carrier;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const isPartialShipment = totalShipments && totalShipments > 1;
  const shipmentLabel = isPartialShipment
    ? `Shipment ${(shipmentIndex ?? 0) + 1} of ${totalShipments}`
    : null;

  const addressLine = shippingAddress
    ? [
        shippingAddress.address1 || shippingAddress.address || shippingAddress.street || '',
        [
          shippingAddress.city || '',
          shippingAddress.state || '',
          shippingAddress.zipCode || shippingAddress.zip || '',
        ].filter(Boolean).join(', '),
      ].filter(Boolean).join('<br/>')
    : '';

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid ${EMAIL_COLORS.border};">
        <span style="color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack}; font-weight: 500;">${item.name}</span>
        ${item.color ? `<br/><span style="color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">${item.color}</span>` : ''}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: center; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
        ${item.quantity}
      </td>
    </tr>
  `).join('');

  const content = `
    ${emailHeader(
      isPartialShipment ? `${shipmentLabel} is on its way!` : 'Your order is on its way!',
      `Order #${orderNumber}`,
      { backgroundColor: EMAIL_COLORS.success, iconEmoji: '📦' }
    )}

    <!-- Greeting -->
    <tr>
      <td style="padding: 32px 32px 24px;">
        <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Hi ${firstName},
        </p>
        <p style="margin: 16px 0 0; color: ${EMAIL_COLORS.textBody}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          ${isPartialShipment
            ? `Part of your order (${orderNumber}) has shipped. The remaining items will ship separately and you'll receive another tracking email.`
            : `Order ${orderNumber} has shipped and is headed to you. Here's everything you need to track your delivery.`
          }
        </p>
      </td>
    </tr>

    <!-- Tracking Info -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailAccentCard(`
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 4px 0;">
                <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Carrier</span><br/>
                <span style="color: ${EMAIL_COLORS.textDark}; font-size: 16px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${carrierLabel}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0 4px;">
                <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Tracking Number</span><br/>
                <span style="color: ${EMAIL_COLORS.textDark}; font-size: 16px; font-weight: 600; font-family: ${EMAIL_FONTS.stack}; word-break: break-all;">${trackingNumber}</span>
              </td>
            </tr>
          </table>
        `, 'info')}
      </td>
    </tr>

    <!-- Track Button -->
    ${trackingUrl ? `
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailButton('Track Your Order', trackingUrl, { color: 'primary' })}
      </td>
    </tr>
    ` : ''}

    <!-- Items Summary -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">What's in your shipment</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
          <tr style="background-color: #fafaf9;">
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Item</th>
            <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Qty</th>
          </tr>
          ${itemsHtml}
        </table>
        <p style="margin: 12px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
          ${totalItems} item${totalItems !== 1 ? 's' : ''} total
        </p>
      </td>
    </tr>

    ${addressLine ? `
    <!-- Shipping To -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Shipping to</h2>
        <div style="background-color: #fafaf9; border-radius: 8px; padding: 16px;">
          <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">
            ${customerName}<br/>
            ${addressLine}
          </p>
        </div>
      </td>
    </tr>
    ` : ''}

    <!-- Contact -->
    <tr>
      <td style="padding: 0 32px 32px;">
        ${emailAccentCard(`
          <p style="margin: 0; color: #1e40af; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Questions about your shipment?</p>
          <p style="margin: 8px 0 0;">
            <a href="tel:+18559427636" style="color: #1e40af; font-size: 18px; font-weight: 700; text-decoration: none; font-family: ${EMAIL_FONTS.stack};">${COMPANY_INFO.phone}</a>
          </p>
          <p style="margin: 8px 0 0; color: #3b82f6; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">Mon-Fri 8am-5pm PST</p>
        `, 'info')}
      </td>
    </tr>

    ${emailFooter(true)}
  `;

  return emailWrapper(content, `Order ${orderNumber} has shipped — track your delivery`);
}

export function generateOrderShippedText(props: OrderShippedEmailProps): string {
  const {
    orderNumber,
    customerName,
    carrier,
    trackingNumber,
    trackingUrl,
    items,
    shippingAddress,
    shipmentIndex,
    totalShipments,
  } = props;

  const firstName = customerName.split(' ')[0];
  const carrierLabel = CARRIER_LABELS[carrier.toLowerCase()] || carrier;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const isPartialShipment = totalShipments && totalShipments > 1;

  const itemsList = items.map(item =>
    `  - ${item.name}${item.color ? ` (${item.color})` : ''} x${item.quantity}`
  ).join('\n');

  const addressText = shippingAddress
    ? [
        customerName,
        shippingAddress.address1 || shippingAddress.address || shippingAddress.street || '',
        [shippingAddress.city, shippingAddress.state, shippingAddress.zipCode || shippingAddress.zip].filter(Boolean).join(', '),
      ].filter(Boolean).join('\n')
    : '';

  return `
${isPartialShipment ? `SHIPMENT ${(shipmentIndex ?? 0) + 1} OF ${totalShipments} IS ON ITS WAY!` : 'YOUR ORDER IS ON ITS WAY!'}
===========================

Hi ${firstName},

${isPartialShipment
    ? `Part of your order (${orderNumber}) has shipped. The remaining items will ship separately.`
    : `Order ${orderNumber} has shipped and is headed to you.`
  }

TRACKING DETAILS:
Carrier: ${carrierLabel}
Tracking Number: ${trackingNumber}
${trackingUrl ? `Track your order: ${trackingUrl}` : ''}

WHAT'S IN YOUR SHIPMENT (${totalItems} item${totalItems !== 1 ? 's' : ''}):
${itemsList}

${addressText ? `SHIPPING TO:\n${addressText}` : ''}

QUESTIONS?
Call us: ${COMPANY_INFO.phone}
Mon-Fri 8am-5pm PST

---
${COMPANY_INFO.name}
${COMPANY_INFO.tagline}
${COMPANY_INFO.address}
${COMPANY_INFO.email}
  `.trim();
}
