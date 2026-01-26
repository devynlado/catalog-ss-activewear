// Email template for customer confirmation when they submit a quote

interface QuoteItem {
  styleName: string;
  brandName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteConfirmationProps {
  quoteId: string;
  customerName: string;
  items: QuoteItem[];
  decoration?: {
    type: string;
    description?: string;
  };
  finishing?: string[];
  subtotal: number;
  totalItems: number;
}

export function generateQuoteConfirmationHtml(props: QuoteConfirmationProps): string {
  const { quoteId, customerName, items, decoration, finishing, subtotal, totalItems } = props;
  
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

  const decorationName: Record<string, string> = {
    'screen': 'Screen Printing',
    'embroidery': 'Embroidery',
    'digital': 'Digital Printing',
    'puff': 'Puff Printing',
    'none': 'No Decoration'
  };

  const finishingNames: Record<string, string> = {
    'fold-bag': 'Fold & Bag',
    'printed-tags': 'Printed Tags',
    'hang-tags': 'Hang Tags',
    'sewn-tags': 'Sewn Tags'
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Received - ${quoteId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 32px; text-align: center;">
              <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Quote Received!</h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">We'll get back to you within 2 hours</p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0; color: #0f172a; font-size: 16px; line-height: 1.6;">
                Hi ${customerName.split(' ')[0]},
              </p>
              <p style="margin: 16px 0 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Thank you for your quote request! Our team is reviewing your order and will send you a detailed quote shortly.
              </p>
            </td>
          </tr>
          
          <!-- Quote Reference -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your Quote Reference</p>
                <p style="margin: 8px 0 0; color: #0369a1; font-size: 24px; font-weight: 700; font-family: monospace;">${quoteId}</p>
              </div>
            </td>
          </tr>
          
          <!-- Items Summary -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; font-weight: 600;">Your Quote Summary</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #f8fafc;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; font-size: 14px;">Product</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #475569; font-size: 14px;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #475569; font-size: 14px;">Est. Total</th>
                </tr>
                ${itemRows}
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Total Items:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600;">${totalItems}</td>
                </tr>
                ${decoration && decoration.type !== 'none' ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Decoration:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600;">${decorationName[decoration.type] || decoration.type}</td>
                </tr>
                ` : ''}
                ${finishing && finishing.length > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Finishing:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600;">${finishing.map(f => finishingNames[f] || f).join(', ')}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e2e8f0;">
                  <td style="padding: 12px 0; color: #0f172a; font-weight: 600; font-size: 16px;">Estimated Subtotal:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 20px; color: #0f172a;">$${subtotal.toFixed(2)}</td>
                </tr>
              </table>
              <p style="margin: 12px 0 0; color: #64748b; font-size: 12px;">*Final pricing will be confirmed in your quote response and may vary based on decoration complexity.</p>
            </td>
          </tr>
          
          <!-- What's Next -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; font-weight: 600;">What Happens Next?</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; vertical-align: top; width: 40px;">
                    <div style="width: 28px; height: 28px; background-color: #dbeafe; border-radius: 50%; text-align: center; line-height: 28px; color: #2563eb; font-weight: 600;">1</div>
                  </td>
                  <td style="padding: 12px 0 12px 12px;">
                    <p style="margin: 0; color: #0f172a; font-weight: 600;">Quote Review</p>
                    <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Our team reviews your request (avg. 2 hours)</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background-color: #dbeafe; border-radius: 50%; text-align: center; line-height: 28px; color: #2563eb; font-weight: 600;">2</div>
                  </td>
                  <td style="padding: 12px 0 12px 12px;">
                    <p style="margin: 0; color: #0f172a; font-weight: 600;">Detailed Quote</p>
                    <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">We'll email you pricing with decoration options</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background-color: #dbeafe; border-radius: 50%; text-align: center; line-height: 28px; color: #2563eb; font-weight: 600;">3</div>
                  </td>
                  <td style="padding: 12px 0 12px 12px;">
                    <p style="margin: 0; color: #0f172a; font-weight: 600;">Approve & Produce</p>
                    <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Review sample, then we start production (5-7 days)</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Need Help -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 20px; text-align: center;">
                <p style="margin: 0; color: #854d0e; font-weight: 600;">Need it faster? Have questions?</p>
                <p style="margin: 8px 0 0;">
                  <a href="tel:+18559427636" style="color: #854d0e; font-size: 20px; font-weight: 700; text-decoration: none;">(855) 942-7636</a>
                </p>
                <p style="margin: 8px 0 0; color: #a16207; font-size: 14px;">Mon-Fri 8am-5pm PST</p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f172a; text-align: center;">
              <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700;">Garment Decor</p>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Southern California's #1 Custom Apparel Decorator</p>
              <p style="margin: 16px 0 0; color: #64748b; font-size: 12px;">
                4778 W. Mission Blvd, Montclair CA 91762<br/>
                <a href="mailto:info@garmentdecor.com" style="color: #64748b;">info@garmentdecor.com</a>
              </p>
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

export function generateQuoteConfirmationText(props: QuoteConfirmationProps): string {
  const { quoteId, customerName, items, subtotal, totalItems } = props;
  
  const itemsList = items.map(item => 
    `- ${item.brandName} ${item.styleName} (${item.colorName}/${item.sizeName}) x${item.quantity}`
  ).join('\n');

  return `
QUOTE RECEIVED - ${quoteId}
===========================

Hi ${customerName.split(' ')[0]},

Thank you for your quote request! Our team is reviewing your order and will send you a detailed quote within 2 hours.

YOUR QUOTE REFERENCE: ${quoteId}

ITEMS (${totalItems} total):
${itemsList}

Estimated Subtotal: $${subtotal.toFixed(2)}
*Final pricing will be confirmed in your quote response.

WHAT'S NEXT:
1. Quote Review - Our team reviews your request (avg. 2 hours)
2. Detailed Quote - We'll email you pricing with decoration options
3. Approve & Produce - Review sample, then we start production

NEED IT FASTER? HAVE QUESTIONS?
Call us: (855) 942-7636
Mon-Fri 8am-5pm PST

---
Garment Decor
Southern California's #1 Custom Apparel Decorator
4778 W. Mission Blvd, Montclair CA 91762
info@garmentdecor.com
  `.trim();
}
