/**
 * 30-Day Retention Coupon Campaign Email
 *
 * Sent automatically ~30 days after a customer's first paid order to
 * encourage a repeat purchase with a shared coupon code.
 *
 * Follows docs/EMAIL-SYSTEM-GUIDELINES.md (color palette, structure, footer).
 */

import {
  emailWrapper,
  emailHeader,
  emailFooter,
  emailButton,
  emailCard,
  emailAccentCard,
  buildUTMUrl,
  EMAIL_COLORS,
  EMAIL_FONTS,
  COMPANY_INFO,
} from './components';

export interface CouponCampaignProps {
  customerName: string | null;
  customerEmail: string;
  orderNumber: string;
  couponCode: string;
  discountLabel: string; // e.g. "10% off" or "$15 off"
  expiresInDays: number; // urgency text, e.g. 14
  catalogUrl?: string;
}

const UTM = {
  source: 'email',
  medium: 'retention',
  campaign: '30day_coupon',
} as const;

export function getCouponCampaignSubject(discountLabel: string): string {
  return `A thank-you from Garment Decor \u2014 here\u2019s ${discountLabel} your next order`;
}

export function getCouponCampaignPreheader(couponCode: string, expiresInDays: number): string {
  return `Use code ${couponCode} at checkout. Expires in ${expiresInDays} days.`;
}

export function generateCouponCampaignHtml(props: CouponCampaignProps): string {
  const {
    customerName,
    orderNumber,
    couponCode,
    discountLabel,
    expiresInDays,
    catalogUrl = 'https://garmentdecor.com/catalog',
  } = props;

  const greeting = customerName
    ? `Hi ${customerName.split(/\s+/)[0]},`
    : 'Hi there,';

  const shopUrl = buildUTMUrl(catalogUrl, UTM);

  const content = `
    ${emailHeader(
      'Thank You for Your Order!',
      'Here\u2019s a little something for next time',
      { showLogo: true }
    )}
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
          ${greeting}
        </p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
          We really appreciate your order <strong>${orderNumber}</strong>.
          As a thank-you, we\u2019d love to offer you <strong>${discountLabel}</strong> your next order with us.
        </p>

        ${emailAccentCard(
          `
          <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">
            Your Coupon Code
          </p>
          <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px; color: ${EMAIL_COLORS.primary}; font-family: ${EMAIL_FONTS.stack};">
            ${couponCode}
          </p>
          <p style="margin: 12px 0 0; font-size: 14px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">
            Enter this code at checkout for <strong>${discountLabel}</strong>
          </p>
          `,
          'brand'
        )}

        ${emailButton('Shop Now', shopUrl, { color: 'primary', align: 'center' })}

        ${emailCard(
          `
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 4px 0;">
                <p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
                  <strong style="color: ${EMAIL_COLORS.textDark};">Browse 5,000+ blank products</strong> \u2014 tees, hoodies, caps, polos, and more from brands like Bella+Canvas, Gildan, and Next Level.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0 0;">
                <p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
                  <strong style="color: ${EMAIL_COLORS.textDark};">Need custom decoration?</strong> Add screen printing, embroidery, or retail finishing to any order.
                </p>
              </td>
            </tr>
          </table>
          `,
          { backgroundColor: EMAIL_COLORS.borderLight }
        )}

        <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.6; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">
          This offer expires in <strong>${expiresInDays} days</strong>.
          Questions? Contact us at
          <a href="mailto:${COMPANY_INFO.email}" style="color: ${EMAIL_COLORS.primary}; text-decoration: none;">${COMPANY_INFO.email}</a>
          or call
          <a href="tel:${COMPANY_INFO.phone.replace(/[^0-9+]/g, '')}" style="color: ${EMAIL_COLORS.primary}; text-decoration: none;">${COMPANY_INFO.phone}</a>.
        </p>
      </td>
    </tr>
    ${emailFooter(true)}
  `;

  const preheader = getCouponCampaignPreheader(couponCode, expiresInDays);
  return emailWrapper(content, preheader);
}

export function generateCouponCampaignText(props: CouponCampaignProps): string {
  const {
    customerName,
    orderNumber,
    couponCode,
    discountLabel,
    expiresInDays,
    catalogUrl = 'https://garmentdecor.com/catalog',
  } = props;

  const greeting = customerName
    ? `Hi ${customerName.split(/\s+/)[0]},`
    : 'Hi there,';

  const shopUrl = buildUTMUrl(catalogUrl, UTM);

  return [
    greeting,
    '',
    `We really appreciate your order ${orderNumber}. As a thank-you, we'd love to offer you ${discountLabel} your next order with us.`,
    '',
    `Your coupon code: ${couponCode}`,
    `Enter this code at checkout for ${discountLabel}.`,
    '',
    `Shop now: ${shopUrl}`,
    '',
    `This offer expires in ${expiresInDays} days.`,
    '',
    `Questions? Contact us at ${COMPANY_INFO.email} or ${COMPANY_INFO.phone}.`,
    '',
    COMPANY_INFO.name,
    COMPANY_INFO.address,
  ].join('\n');
}
