/**
 * Refund confirmation email – customer notification after admin issues a refund.
 * Follows docs/EMAIL-SYSTEM-GUIDELINES.md (color palette, structure, footer).
 */

import {
  emailWrapper,
  emailHeader,
  emailFooter,
  emailCard,
  emailAccentCard,
  EMAIL_COLORS,
  EMAIL_FONTS,
  COMPANY_INFO,
} from './components';

export interface RefundConfirmationProps {
  orderNumber: string;
  customerName: string | null;
  customerEmail: string;
  refundAmount: number;
  isFullRefund: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getRefundConfirmationSubject(orderNumber: string, refundAmount: number): string {
  return `Order ${orderNumber} refunded – ${formatCurrency(refundAmount)}`;
}

export function getRefundConfirmationPreheader(orderNumber: string, refundAmount: number): string {
  return `Your refund of ${formatCurrency(refundAmount)} for order ${orderNumber} has been processed. It will appear in 5–10 business days.`;
}

export function generateRefundConfirmationHtml(props: RefundConfirmationProps): string {
  const { orderNumber, customerName, customerEmail, refundAmount, isFullRefund } = props;
  const greeting = customerName ? `Hi ${customerName.split(/\s+/)[0]},` : 'Hi there,';

  const content = `
    ${emailHeader(
      'Refund Processed',
      `Order ${orderNumber}`,
      { iconEmoji: '✓', showLogo: true }
    )}
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
          ${greeting}
        </p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
          We've processed ${isFullRefund ? 'a full refund' : 'a partial refund'} for your order.
        </p>

        ${emailAccentCard(
          `
          <p style="margin: 0 0 8px; font-size: 14px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Order</p>
          <p style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${orderNumber}</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Refund amount</p>
          <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.primary}; font-family: ${EMAIL_FONTS.stack};">${formatCurrency(refundAmount)}</p>
          `,
          'success'
        )}

        ${emailCard(
          `
          <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">What happens next?</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
            The refund has been sent to your original payment method. It typically appears within <strong>5–10 business days</strong>, depending on your bank or card issuer.
          </p>
          `,
          { backgroundColor: EMAIL_COLORS.borderLight }
        )}

        <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">
          Questions? Contact us at <a href="mailto:${COMPANY_INFO.email}" style="color: ${EMAIL_COLORS.primary}; text-decoration: none;">${COMPANY_INFO.email}</a> or call <a href="tel:${COMPANY_INFO.phone.replace(/[^0-9+]/g, '')}" style="color: ${EMAIL_COLORS.primary}; text-decoration: none;">${COMPANY_INFO.phone}</a>.
        </p>
      </td>
    </tr>
    ${emailFooter(true)}
  `;

  const preheader = getRefundConfirmationPreheader(orderNumber, refundAmount);
  return emailWrapper(content, preheader);
}

export function generateRefundConfirmationText(props: RefundConfirmationProps): string {
  const { orderNumber, customerName, refundAmount, isFullRefund } = props;
  const greeting = customerName ? `Hi ${customerName.split(/\s+/)[0]},` : 'Hi there,';

  return [
    greeting,
    '',
    `We've processed ${isFullRefund ? 'a full refund' : 'a partial refund'} for your order ${orderNumber}.`,
    '',
    `Refund amount: ${formatCurrency(refundAmount)}`,
    '',
    'The refund has been sent to your original payment method. It typically appears within 5–10 business days, depending on your bank or card issuer.',
    '',
    `Questions? Contact us at ${COMPANY_INFO.email} or ${COMPANY_INFO.phone}.`,
    '',
    COMPANY_INFO.name,
    COMPANY_INFO.address,
  ].join('\n');
}
