/**
 * Refund confirmation email to customer.
 * Follows EMAIL-SYSTEM-GUIDELINES and uses shared components.
 */

import { Resend } from 'resend';
import {
  emailWrapper,
  emailHeader,
  emailFooter,
  emailAccentCard,
  formatPrice,
  EMAIL_COLORS,
  EMAIL_FONTS,
  COMPANY_INFO,
} from './components';

export interface RefundConfirmationProps {
  to: string;
  customerName: string;
  orderNumber: string;
  refundAmount: number;
  isFullRefund: boolean;
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export function getRefundConfirmationSubject(orderNumber: string): string {
  return `Refund processed for order ${orderNumber}`;
}

export function generateRefundConfirmationHtml(props: RefundConfirmationProps): string {
  const { customerName, orderNumber, refundAmount, isFullRefund } = props;
  const content = `
    ${emailHeader(
      'Refund Processed',
      `Order ${orderNumber}`,
      { iconEmoji: '✓', backgroundColor: EMAIL_COLORS.success }
    )}
    <tr>
      <td style="padding: 24px 32px;">
        <p style="margin: 0 0 16px; color: ${EMAIL_COLORS.textBody}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Hi ${customerName},
        </p>
        <p style="margin: 0 0 20px; color: ${EMAIL_COLORS.textBody}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          We've processed your refund for order <strong>${orderNumber}</strong>.
        </p>
        ${emailAccentCard(
          `
          <p style="margin: 0 0 8px; color: ${EMAIL_COLORS.textDark}; font-size: 14px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Refund amount</p>
          <p style="margin: 0; color: ${EMAIL_COLORS.textBody}; font-size: 24px; font-weight: 700; font-family: ${EMAIL_FONTS.stack};">${formatPrice(refundAmount)}</p>
          <p style="margin: 8px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; font-family: ${EMAIL_FONTS.stack};">
            ${isFullRefund ? 'Full order refund.' : 'Partial refund. The amount will appear on your original payment method within 5–10 business days.'}
          </p>
          `,
          'success'
        )}
        <p style="margin: 20px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          If you have any questions, reply to this email or call us at ${COMPANY_INFO.phone}.
        </p>
      </td>
    </tr>
    ${emailFooter(false)}
  `;
  return emailWrapper(content);
}

export function generateRefundConfirmationText(props: RefundConfirmationProps): string {
  const { customerName, orderNumber, refundAmount, isFullRefund } = props;
  return [
    `Hi ${customerName},`,
    '',
    `We've processed your refund for order ${orderNumber}.`,
    '',
    `Refund amount: ${formatPrice(refundAmount)}`,
    isFullRefund ? 'Full order refund.' : 'Partial refund. The amount will appear on your original payment method within 5–10 business days.',
    '',
    `Questions? Reply to this email or call ${COMPANY_INFO.phone}.`,
    '',
    `— ${COMPANY_INFO.name}`,
  ].join('\n');
}

export async function sendRefundConfirmationEmail(props: RefundConfirmationProps): Promise<void> {
  const resend = getResend();
  const html = generateRefundConfirmationHtml(props);
  const text = generateRefundConfirmationText(props);
  const subject = getRefundConfirmationSubject(props.orderNumber);
  await resend.emails.send({
    from: 'Garment Decor <noreply@garmentdecor.com>',
    to: props.to,
    subject,
    html,
    text,
  });
}
