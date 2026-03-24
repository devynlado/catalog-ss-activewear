/**
 * One-time email template to notify existing customers about the order tracking portal.
 * Sent to customers with orders in active stages (awaiting_purchasing, ordered, in_production).
 */

import {
  emailWrapper,
  emailHeader,
  emailFooter,
  emailAccentCard,
  EMAIL_COLORS,
  EMAIL_FONTS,
  COMPANY_INFO,
} from './components';

export interface OrderTrackingNotificationProps {
  customerName: string;
  orderNumber: string;
  trackingUrl: string;
}

export function getOrderTrackingNotificationSubject(): string {
  return 'Track Your Order Online – New Feature from Garment Decor';
}

export function generateOrderTrackingNotificationHtml(
  props: OrderTrackingNotificationProps
): string {
  const { customerName, orderNumber, trackingUrl } = props;
  const firstName = customerName.split(' ')[0];
  const siteUrl = 'https://www.garmentdecor.com';

  const content = `
    ${emailHeader('Track Your Order Online', `Order #${orderNumber}`, {
      backgroundColor: EMAIL_COLORS.info,
      iconEmoji: '📦',
    })}
    
    <tr>
      <td style="padding: 32px 32px 24px;">
        <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Hi ${firstName},
        </p>
        <p style="margin: 16px 0 0; color: ${EMAIL_COLORS.textBody}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Great news! We've launched a new <strong>Order Tracking Portal</strong> where you can check the status of your order, review order details, and stay updated — all in one place.
        </p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailAccentCard(`
          <p style="margin: 0; color: #1e40af; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Your Order</p>
          <p style="margin: 8px 0 0; color: #1e3a5f; font-size: 20px; font-weight: 700; font-family: ${EMAIL_FONTS.stack};">${orderNumber}</p>
        `, 'info')}
      </td>
    </tr>

    <tr>
      <td style="padding: 0 32px 16px; text-align: center;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: ${EMAIL_COLORS.primary}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; font-family: ${EMAIL_FONTS.stack};">
          Track Your Order
        </a>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 32px 32px; text-align: center;">
        <p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">
          You can also track your order anytime at
          <a href="${siteUrl}/orders" style="color: ${EMAIL_COLORS.primary}; text-decoration: none; font-weight: 500;">${siteUrl.replace('https://www.', '')}/orders</a>
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">What You Can Do</h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 30px;">
              <span style="font-size: 18px;">✓</span>
            </td>
            <td style="padding: 8px 0 8px 8px; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
              Check your order status in real time
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 30px;">
              <span style="font-size: 18px;">✓</span>
            </td>
            <td style="padding: 8px 0 8px 8px; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
              View order details, items, and pricing
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 30px;">
              <span style="font-size: 18px;">✓</span>
            </td>
            <td style="padding: 8px 0 8px 8px; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
              No password needed — just verify with your email
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 0 32px 32px;">
        ${emailAccentCard(`
          <p style="margin: 0; color: #1e40af; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Questions about your order?</p>
          <p style="margin: 8px 0 0;">
            <a href="tel:+18559427636" style="color: #1e40af; font-size: 18px; font-weight: 700; text-decoration: none; font-family: ${EMAIL_FONTS.stack};">${COMPANY_INFO.phone}</a>
          </p>
          <p style="margin: 8px 0 0; color: #3b82f6; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">Mon-Fri 8am-5pm PST</p>
        `, 'info')}
      </td>
    </tr>
    
    ${emailFooter(false)}
  `;

  return emailWrapper(content, 'Track your order online — new feature from Garment Decor');
}

export function generateOrderTrackingNotificationText(
  props: OrderTrackingNotificationProps
): string {
  const { customerName, orderNumber, trackingUrl } = props;
  const firstName = customerName.split(' ')[0];

  return `
TRACK YOUR ORDER ONLINE
===========================

Hi ${firstName},

Great news! We've launched a new Order Tracking Portal where you can check the status of your order, review order details, and stay updated — all in one place.

Your Order: ${orderNumber}

Track your order: ${trackingUrl}

You can also visit https://www.garmentdecor.com/orders anytime.

WHAT YOU CAN DO:
- Check your order status in real time
- View order details, items, and pricing
- No password needed — just verify with your email

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
