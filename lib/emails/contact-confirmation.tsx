/**
 * Email template for customer confirmation when a contact/quote form is submitted
 * Confirms receipt and sets expectations for follow-up
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
  COMPANY_INFO,
  getGreeting,
} from './components';

interface ContactConfirmationProps {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  quantity?: string;
  message?: string;
}

/**
 * Get subject line for customer confirmation
 */
export function getContactConfirmationSubject(): string {
  return "We received your request – expect a call within 2 hours";
}

/**
 * Get preheader text for email preview
 */
export function getContactConfirmationPreheader(name: string): string {
  return `Thanks ${name.split(' ')[0]}! Your quote request is being reviewed by our team...`;
}

export function generateContactConfirmationHtml(props: ContactConfirmationProps): string {
  const { name, email, phone, service, quantity, message } = props;
  const firstName = name.split(' ')[0];
  
  const serviceDisplay = service === 'screen-printing' 
    ? 'Screen Printing' 
    : service === 'embroidery' 
      ? 'Embroidery' 
      : service || 'Custom Apparel';

  const content = `
    ${emailHeader("We Got Your Request!", `We'll be in touch within 2 hours`)}
    
    <!-- Greeting -->
    <tr>
      <td style="padding: 32px 32px 16px;">
        <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">
          ${getGreeting(name)}! 👋
        </p>
        <p style="margin: 16px 0 0; color: ${EMAIL_COLORS.textBody}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Thank you for reaching out about ${serviceDisplay.toLowerCase()}. Your request has been received and one of our specialists is reviewing it now.
        </p>
      </td>
    </tr>
    
    <!-- What happens next -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailAccentCard(`
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 0 0 12px;">
                <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-size: 16px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">
                  ⏱️ What happens next?
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack}; font-size: 14px;">
                      <strong style="color: ${EMAIL_COLORS.primary};">1.</strong> We review your request (usually within 30 min)
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack}; font-size: 14px;">
                      <strong style="color: ${EMAIL_COLORS.primary};">2.</strong> A specialist will ${phone ? 'call you' : 'email you'} to discuss details
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack}; font-size: 14px;">
                      <strong style="color: ${EMAIL_COLORS.primary};">3.</strong> You'll receive a detailed quote within 2 hours
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `, 'brand')}
      </td>
    </tr>
    
    <!-- Your request summary -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <p style="margin: 0 0 12px; color: ${EMAIL_COLORS.textDark}; font-size: 16px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">
          📋 Your Request Summary
        </p>
        ${emailCard(`
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; width: 120px; font-family: ${EMAIL_FONTS.stack}; font-size: 14px;">Service:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack}; font-size: 14px;"><strong>${serviceDisplay}</strong></td>
            </tr>
            ${quantity ? `
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack}; font-size: 14px;">Est. Quantity:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack}; font-size: 14px;"><strong>${quantity} pieces</strong></td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack}; font-size: 14px;">Contact:</td>
              <td style="padding: 8px 0; font-family: ${EMAIL_FONTS.stack}; font-size: 14px;">${email}${phone ? ` · ${phone}` : ''}</td>
            </tr>
            ${message ? `
            <tr>
              <td colspan="2" style="padding: 12px 0 0;">
                <p style="margin: 0 0 4px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack}; font-size: 14px;">Project Details:</p>
                <p style="margin: 0; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack}; font-size: 14px; background: #f8fafc; padding: 12px; border-radius: 6px;">${message}</p>
              </td>
            </tr>
            ` : ''}
          </table>
        `)}
      </td>
    </tr>
    
    <!-- Need it faster? -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: ${EMAIL_COLORS.textDark}; font-size: 16px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">
                📞 Need it faster? Call us now!
              </p>
              <p style="margin: 0 0 16px; color: ${EMAIL_COLORS.textBody}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
                We're available Mon-Fri, 8am-5pm PST
              </p>
              <a href="tel:+18559427636" style="display: inline-block; padding: 14px 32px; background-color: ${EMAIL_COLORS.success}; color: white; text-decoration: none; font-weight: 600; font-size: 18px; border-radius: 8px; font-family: ${EMAIL_FONTS.stack};">
                (855) 942-7636
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Closing -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <p style="margin: 0; color: ${EMAIL_COLORS.textBody}; font-size: 14px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          We look forward to working with you, ${firstName}!
        </p>
        <p style="margin: 16px 0 0; color: ${EMAIL_COLORS.textBody}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
          – The Garment Decor Team
        </p>
      </td>
    </tr>
    
    ${emailFooter(false)}
  `;
  
  return emailWrapper(content, getContactConfirmationPreheader(name));
}

export function generateContactConfirmationText(props: ContactConfirmationProps): string {
  const { name, email, phone, service, quantity, message } = props;
  const firstName = name.split(' ')[0];
  
  const serviceDisplay = service === 'screen-printing' 
    ? 'Screen Printing' 
    : service === 'embroidery' 
      ? 'Embroidery' 
      : service || 'Custom Apparel';

  return `
WE GOT YOUR REQUEST!
====================

Hi ${firstName}! 👋

Thank you for reaching out about ${serviceDisplay.toLowerCase()}. Your request has been received and one of our specialists is reviewing it now.

WHAT HAPPENS NEXT?
------------------
1. We review your request (usually within 30 min)
2. A specialist will ${phone ? 'call you' : 'email you'} to discuss details
3. You'll receive a detailed quote within 2 hours

YOUR REQUEST SUMMARY
--------------------
Service: ${serviceDisplay}
${quantity ? `Estimated Quantity: ${quantity} pieces` : ''}
Contact: ${email}${phone ? ` · ${phone}` : ''}
${message ? `\nProject Details:\n${message}` : ''}

NEED IT FASTER?
---------------
Call us now: (855) 942-7636
We're available Mon-Fri, 8am-5pm PST

We look forward to working with you, ${firstName}!

– The Garment Decor Team

---
${COMPANY_INFO.name}
${COMPANY_INFO.address}
${COMPANY_INFO.phone} | ${COMPANY_INFO.email}
  `.trim();
}
