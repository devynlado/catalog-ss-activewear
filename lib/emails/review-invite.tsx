/**
 * Review Invite Email - "How was your order? Share your experience and get 10% off"
 *
 * Sent 7 days after order is delivered via cron job.
 * Follows docs/EMAIL-SYSTEM-GUIDELINES.md
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

export interface ReviewInviteProps {
  customerName: string | null;
  orderNumber: string;
  token: string;
  products: Array<{
    name: string;
    imageUrl?: string;
  }>;
}

const UTM = {
  source: 'email',
  medium: 'review_invite',
  campaign: 'post_delivery_review',
} as const;

export function getReviewInviteSubject(customerName?: string | null): string {
  const name = customerName?.split(/\s+/)[0];
  return name
    ? `Did You Like Your Order, ${name}? - Garment Decor`
    : 'Did You Like Your Order? - Garment Decor';
}

export function getReviewInvitePreheader(): string {
  return 'Leave a review and receive a 10% discount on your next order.';
}

export function generateReviewInviteHtml(props: ReviewInviteProps): string {
  const { customerName, orderNumber, token, products } = props;

  const greeting = customerName
    ? `Hi ${customerName.split(/\s+/)[0]},`
    : 'Hi there,';

  const reviewUrl = buildUTMUrl(
    `https://garmentdecor.com/reviews/write?token=${token}`,
    UTM
  );

  const productList = products.slice(0, 3).map(p => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid ${EMAIL_COLORS.borderLight};">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">
          ${p.name}
        </p>
      </td>
    </tr>
  `).join('');

  const content = `
    ${emailHeader(
      'We\u2019d Love to Hear Your Feedback',
      '',
      { showLogo: true }
    )}
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
          ${greeting}
        </p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
          We hope you\u2019re enjoying your order <strong>${orderNumber}</strong>! Your review helps us improve and others choose wisely.
        </p>

        ${emailAccentCard(
          `
          <p style="margin: 0 0 4px; font-size: 18px; font-weight: 700; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">
            Leave a Review, Get <span style="color: ${EMAIL_COLORS.primary};">10% OFF</span>
          </p>
          <p style="margin: 0; font-size: 13px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">
            Your unique discount code will be sent instantly after you submit your review.
          </p>
          `,
          'brand'
        )}

        ${products.length > 0 ? emailCard(`
          <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">
            Products to Review
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${productList}
          </table>
        `) : ''}

        ${emailButton('Write a Review', reviewUrl, { color: 'primary', align: 'center' })}

        <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.6; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">
          It only takes a minute! Questions? Contact us at
          <a href="mailto:${COMPANY_INFO.email}" style="color: ${EMAIL_COLORS.primary}; text-decoration: none;">${COMPANY_INFO.email}</a>.
        </p>
      </td>
    </tr>
    ${emailFooter(true)}
  `;

  const preheader = getReviewInvitePreheader();
  return emailWrapper(content, preheader);
}

export function generateReviewInviteText(props: ReviewInviteProps): string {
  const { customerName, orderNumber, token, products } = props;

  const greeting = customerName
    ? `Hi ${customerName.split(/\s+/)[0]},`
    : 'Hi there,';

  const reviewUrl = buildUTMUrl(
    `https://garmentdecor.com/reviews/write?token=${token}`,
    UTM
  );

  const productNames = products.slice(0, 3).map(p => `  - ${p.name}`).join('\n');

  return [
    greeting,
    '',
    `We hope you're enjoying your order ${orderNumber}! Your review helps us improve and others choose wisely.`,
    '',
    'Leave a Review, Get 10% OFF your next order!',
    '',
    products.length > 0 ? `Products to review:\n${productNames}` : '',
    '',
    `Write a review: ${reviewUrl}`,
    '',
    `Questions? Contact us at ${COMPANY_INFO.email}.`,
    '',
    COMPANY_INFO.name,
    COMPANY_INFO.address,
  ].filter(Boolean).join('\n');
}
