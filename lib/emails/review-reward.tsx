/**
 * Review Reward Email - "Thanks for your review! Here's 10% off"
 *
 * Sent after a customer submits a product review.
 * Follows docs/EMAIL-SYSTEM-GUIDELINES.md
 */

import {
  emailWrapper,
  emailHeader,
  emailFooter,
  emailButton,
  emailAccentCard,
  buildUTMUrl,
  EMAIL_COLORS,
  EMAIL_FONTS,
  COMPANY_INFO,
} from './components';

export interface ReviewRewardProps {
  customerName: string | null;
  couponCode: string;
  expiresInDays: number;
}

const UTM = {
  source: 'email',
  medium: 'review',
  campaign: 'review_reward',
} as const;

export function getReviewRewardSubject(): string {
  return 'Thanks for your review! Here\u2019s 10% off your next order';
}

export function generateReviewRewardHtml(props: ReviewRewardProps): string {
  const { customerName, couponCode, expiresInDays } = props;

  const greeting = customerName
    ? `Hi ${customerName.split(/\s+/)[0]},`
    : 'Hi there,';

  const shopUrl = buildUTMUrl('https://garmentdecor.com/catalog', UTM);

  const content = `
    ${emailHeader(
      'Thank You for Your Review!',
      'Your feedback helps other customers make better decisions',
      { showLogo: true }
    )}
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
          ${greeting}
        </p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
          We really appreciate you taking the time to share your experience. As a thank-you, here\u2019s <strong>10% off</strong> your next order!
        </p>

        ${emailAccentCard(
          `
          <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">
            Your Reward Code
          </p>
          <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px; color: ${EMAIL_COLORS.primary}; font-family: ${EMAIL_FONTS.stack};">
            ${couponCode}
          </p>
          <p style="margin: 12px 0 0; font-size: 14px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">
            Enter this code at checkout for <strong>10% off</strong>
          </p>
          `,
          'brand'
        )}

        ${emailButton('Shop Now', shopUrl, { color: 'primary', align: 'center' })}

        <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.6; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">
          This code expires in <strong>${expiresInDays} days</strong> and can be used once.
          Questions? Contact us at
          <a href="mailto:${COMPANY_INFO.email}" style="color: ${EMAIL_COLORS.primary}; text-decoration: none;">${COMPANY_INFO.email}</a>.
        </p>
      </td>
    </tr>
    ${emailFooter(true)}
  `;

  return emailWrapper(content, `Use code ${couponCode} for 10% off. Expires in ${expiresInDays} days.`);
}

export function generateReviewRewardText(props: ReviewRewardProps): string {
  const { customerName, couponCode, expiresInDays } = props;

  const greeting = customerName
    ? `Hi ${customerName.split(/\s+/)[0]},`
    : 'Hi there,';

  const shopUrl = buildUTMUrl('https://garmentdecor.com/catalog', UTM);

  return [
    greeting,
    '',
    'Thank you for taking the time to share your review! Your feedback helps other customers make better decisions.',
    '',
    'As a thank-you, here\'s 10% off your next order:',
    '',
    `Your reward code: ${couponCode}`,
    '',
    `Shop now: ${shopUrl}`,
    '',
    `This code expires in ${expiresInDays} days and can be used once.`,
    '',
    `Questions? Contact us at ${COMPANY_INFO.email}.`,
    '',
    COMPANY_INFO.name,
    COMPANY_INFO.address,
  ].join('\n');
}
