// Email template for internal team notification when a quote is submitted

interface QuoteItem {
  styleName: string;
  brandName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteNotificationProps {
  quoteId: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  items: QuoteItem[];
  decoration?: {
    type: string;
    description?: string;
  };
  finishing?: string[];
  eventDate?: string;
  message?: string;
  subtotal: number;
  totalItems: number;
}

export function generateQuoteNotificationHtml(props: QuoteNotificationProps): string {
  const { quoteId, contact, items, decoration, finishing, eventDate, message, subtotal, totalItems } = props;
  
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
        <strong>${item.brandName}</strong><br/>
        ${item.styleName}<br/>
        <span style="color: #64748b;">${item.colorName} / ${item.sizeName}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${(item.unitPrice * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const decorationInfo = decoration && decoration.type !== 'none' ? `
    <tr>
      <td style="padding: 8px 0; color: #64748b;">Decoration:</td>
      <td style="padding: 8px 0;"><strong>${decoration.type}</strong>${decoration.description ? `<br/><span style="color: #64748b;">${decoration.description}</span>` : ''}</td>
    </tr>
  ` : '';

  const finishingInfo = finishing && finishing.length > 0 ? `
    <tr>
      <td style="padding: 8px 0; color: #64748b;">Finishing:</td>
      <td style="padding: 8px 0;"><strong>${finishing.join(', ')}</strong></td>
    </tr>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Quote Request - ${quoteId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">🎉 New Quote Request!</h1>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Quote ID: ${quoteId}</p>
            </td>
          </tr>
          
          <!-- Contact Info -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; font-weight: 600;">Contact Information</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; width: 100px;">Name:</td>
                  <td style="padding: 8px 0;"><strong>${contact.name}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${contact.email}" style="color: #2563eb;">${contact.email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Phone:</td>
                  <td style="padding: 8px 0;"><a href="tel:${contact.phone}" style="color: #2563eb;">${contact.phone}</a></td>
                </tr>
                ${contact.company ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Company:</td>
                  <td style="padding: 8px 0;"><strong>${contact.company}</strong></td>
                </tr>
                ` : ''}
                ${eventDate ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Need By:</td>
                  <td style="padding: 8px 0;"><strong style="color: #dc2626;">${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
          
          <!-- Items -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; font-weight: 600;">Quote Items (${totalItems} total)</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #f8fafc;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569;">Product</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #475569;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #475569;">Line Total</th>
                </tr>
                ${itemRows}
                <tr style="background-color: #f8fafc;">
                  <td colspan="2" style="padding: 12px; font-weight: 600;">Estimated Subtotal</td>
                  <td style="padding: 12px; text-align: right; font-weight: 700; font-size: 18px; color: #0f172a;">$${subtotal.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Services -->
          ${(decorationInfo || finishingInfo) ? `
          <tr>
            <td style="padding: 0 32px 32px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; font-weight: 600;">Services Requested</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${decorationInfo}
                ${finishingInfo}
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Message -->
          ${message ? `
          <tr>
            <td style="padding: 0 32px 32px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; font-weight: 600;">Additional Notes</h2>
              <p style="margin: 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; color: #475569; line-height: 1.6;">${message}</p>
            </td>
          </tr>
          ` : ''}
          
          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="mailto:${contact.email}?subject=Re: Quote ${quoteId}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px;">Reply to Customer</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">This quote was submitted via garmentdecor.com</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function generateQuoteNotificationText(props: QuoteNotificationProps): string {
  const { quoteId, contact, items, decoration, finishing, eventDate, message, subtotal, totalItems } = props;
  
  const itemsList = items.map(item => 
    `- ${item.brandName} ${item.styleName} (${item.colorName}/${item.sizeName}) x${item.quantity} = $${(item.unitPrice * item.quantity).toFixed(2)}`
  ).join('\n');

  return `
NEW QUOTE REQUEST - ${quoteId}
================================

CONTACT INFORMATION
-------------------
Name: ${contact.name}
Email: ${contact.email}
Phone: ${contact.phone}
${contact.company ? `Company: ${contact.company}` : ''}
${eventDate ? `Need By: ${new Date(eventDate).toLocaleDateString()}` : ''}

QUOTE ITEMS (${totalItems} total)
---------------------------------
${itemsList}

Estimated Subtotal: $${subtotal.toFixed(2)}

${decoration && decoration.type !== 'none' ? `
DECORATION
----------
Type: ${decoration.type}
${decoration.description ? `Description: ${decoration.description}` : ''}
` : ''}

${finishing && finishing.length > 0 ? `
FINISHING SERVICES
------------------
${finishing.join(', ')}
` : ''}

${message ? `
ADDITIONAL NOTES
----------------
${message}
` : ''}

---
Reply to: ${contact.email}
  `.trim();
}
