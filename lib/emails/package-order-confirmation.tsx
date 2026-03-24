/**
 * Email template for customer confirmation when they purchase a package deal
 * Supports all package types: embroidered caps, printed tees, embroidered polos, etc.
 */

import {
  emailWrapper,
  emailHeader,
  emailFooter,
  emailAccentCard,
  EMAIL_COLORS,
  EMAIL_FONTS,
  COMPANY_INFO,
  formatPrice,
  PackageOrderEmailProps,
  getDecorationDescription,
  getProcessSteps,
  getTotalQuantity,
  hasAnySizeBreakdown,
} from './components';

/**
 * Get subject line for package order confirmation
 */
export function getPackageOrderConfirmationSubject(
  orderNumber: string, 
  packageDisplayName: string
): string {
  return `Order ${orderNumber} Confirmed – ${packageDisplayName}`;
}

/**
 * Get preheader for package order confirmation
 */
export function getPackageOrderConfirmationPreheader(
  quantity: number, 
  productUnit: string
): string {
  return `Your ${quantity} custom ${productUnit} are headed to production!`;
}

/**
 * Generate size breakdown table HTML
 */
function generateSizeBreakdownHtml(
  items: PackageOrderEmailProps['items']
): string {
  // Check if we have any size breakdowns
  if (!hasAnySizeBreakdown(items)) return '';
  
  // Collect all unique sizes
  const allSizes = new Set<string>();
  items.forEach(item => {
    if (item.sizeBreakdown) {
      Object.keys(item.sizeBreakdown).forEach(size => allSizes.add(size));
    }
  });
  
  // Sort sizes in logical order
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  const sortedSizes = Array.from(allSizes).sort((a, b) => {
    const aIndex = sizeOrder.indexOf(a);
    const bIndex = sizeOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  
  let html = `
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Size Breakdown</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
          <tr style="background-color: #fafaf9;">
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Color</th>
            ${sortedSizes.map(size => `
              <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">${size}</th>
            `).join('')}
            <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Total</th>
          </tr>
  `;
  
  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const borderStyle = isLast ? '' : `border-bottom: 1px solid ${EMAIL_COLORS.border};`;
    
    html += `
      <tr>
        <td style="padding: 10px 12px; ${borderStyle} color: ${EMAIL_COLORS.textDark}; font-weight: 500; font-family: ${EMAIL_FONTS.stack};">${item.colorName}</td>
        ${sortedSizes.map(size => `
          <td style="padding: 10px 8px; ${borderStyle} text-align: center; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">${item.sizeBreakdown?.[size] || '-'}</td>
        `).join('')}
        <td style="padding: 10px 12px; ${borderStyle} text-align: right; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${item.quantity}</td>
      </tr>
    `;
  });
  
  html += `
        </table>
      </td>
    </tr>
  `;
  
  return html;
}

export function generatePackageOrderConfirmationHtml(props: PackageOrderEmailProps): string {
  const {
    orderNumber,
    customerName,
    packageDisplayName,
    productName,
    productUnit,
    decorationMethod,
    items,
    decorationDetails,
    subtotal,
    tax,
    shipping,
    total,
    pricePerUnit,
    shippingAddress,
    logoUploaded,
    notes,
    trackingUrl,
  } = props;
  
  const siteUrl = 'https://www.garmentdecor.com';
  const firstName = customerName.split(' ')[0];
  const totalQuantity = getTotalQuantity(items);
  const decorationDescription = getDecorationDescription(decorationMethod, decorationDetails);
  const processSteps = getProcessSteps(decorationMethod);
  const hasSizes = hasAnySizeBreakdown(items);
  
  // Build items display
  const itemsHtml = items.length > 1
    ? items.map(item => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid ${EMAIL_COLORS.border};">
            <span style="color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${item.colorName}</span>
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: center; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">${item.quantity}</td>
        </tr>
      `).join('')
    : '';
  
  const content = `
    ${emailHeader('Order Confirmed!', `Order #${orderNumber}`, { 
      backgroundColor: EMAIL_COLORS.success,
      iconEmoji: '✓'
    })}
    
    <!-- Greeting -->
    <tr>
      <td style="padding: 32px 32px 24px;">
        <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Hi ${firstName},
        </p>
        <p style="margin: 16px 0 0; color: ${EMAIL_COLORS.textBody}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Thank you for your order! We've received your payment and your custom ${productUnit} are headed to production.
        </p>
      </td>
    </tr>
    
    <!-- Order Details -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Order Details</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
          <tr style="background-color: #fafaf9;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Item</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Qty</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Price</th>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid ${EMAIL_COLORS.border};">
              <strong style="color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${packageDisplayName}</strong><br/>
              <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">${productName}</span><br/>
              <span style="color: ${EMAIL_COLORS.primary}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">${decorationDescription}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: center; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">${totalQuantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${formatPrice(subtotal)}</td>
          </tr>
          ${items.length > 1 ? `
          <tr>
            <td colspan="3" style="padding: 12px; background-color: #fafaf9;">
              <p style="margin: 0 0 8px; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${EMAIL_FONTS.stack};">Color Breakdown</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>
          ` : items.length === 1 ? `
          <tr>
            <td colspan="3" style="padding: 8px 12px; background-color: #fafaf9;">
              <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">Color: ${items[0].colorName}</span>
            </td>
          </tr>
          ` : ''}
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
          <tr>
            <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Subtotal (${formatPrice(pricePerUnit)}/${productUnit.slice(0, -1)}):</td>
            <td style="padding: 8px 0; text-align: right; font-family: ${EMAIL_FONTS.stack};">${formatPrice(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Tax:</td>
            <td style="padding: 8px 0; text-align: right; font-family: ${EMAIL_FONTS.stack};">${formatPrice(tax)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Shipping:</td>
            <td style="padding: 8px 0; text-align: right; font-family: ${EMAIL_FONTS.stack};">${shipping === 0 ? 'FREE' : formatPrice(shipping)}</td>
          </tr>
          <tr style="border-top: 2px solid ${EMAIL_COLORS.border};">
            <td style="padding: 12px 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-size: 16px; font-family: ${EMAIL_FONTS.stack};">Total:</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 20px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${formatPrice(total)}</td>
          </tr>
        </table>
      </td>
    </tr>
    
    ${hasSizes ? generateSizeBreakdownHtml(items) : ''}
    
    <!-- Shipping Address -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Shipping Address</h2>
        <div style="background-color: #fafaf9; border-radius: 8px; padding: 16px;">
          <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">
            ${customerName}<br/>
            ${shippingAddress.street}<br/>
            ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}
          </p>
        </div>
      </td>
    </tr>
    
    ${!logoUploaded ? `
    <!-- Logo Upload Reminder -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailAccentCard(`
          <p style="margin: 0; color: #92400e; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">📁 Artwork Needed</p>
          <p style="margin: 8px 0 0; color: #a16207; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
            Please reply to this email with your logo/artwork attached (PNG, SVG, AI, or EPS format preferred). Our art team will create a proof for your approval.
          </p>
        `, 'warning')}
      </td>
    </tr>
    ` : ''}
    
    ${notes ? `
    <!-- Order Notes -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Your Notes</h2>
        <div style="background-color: #fafaf9; border-radius: 8px; padding: 16px;">
          <p style="margin: 0; color: ${EMAIL_COLORS.textBody}; font-style: italic; font-family: ${EMAIL_FONTS.stack};">"${notes}"</p>
        </div>
      </td>
    </tr>
    ` : ''}
    
    <!-- Track Your Order -->
    <tr>
      <td style="padding: 0 32px 24px; text-align: center;">
        <a href="${trackingUrl || `${siteUrl}/orders`}" style="display: inline-block; background-color: ${EMAIL_COLORS.primary}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; font-family: ${EMAIL_FONTS.stack};">
          Track Your Order
        </a>
        <p style="margin: 12px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_FONTS.stack};">
          You can also track your order anytime at
          <a href="${siteUrl}/orders" style="color: ${EMAIL_COLORS.primary}; text-decoration: none; font-weight: 500;">${siteUrl.replace('https://www.', '')}/orders</a>
        </p>
      </td>
    </tr>
    
    <!-- What's Next -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">What Happens Next?</h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${processSteps.map((step, index) => `
          <tr>
            <td style="padding: 12px 0; vertical-align: top; width: 40px;">
              <div style="width: 28px; height: 28px; background-color: #dbeafe; border-radius: 50%; text-align: center; line-height: 28px; color: ${EMAIL_COLORS.info}; font-weight: 600;">${index + 1}</div>
            </td>
            <td style="padding: 12px 0 12px 12px;">
              <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${step.title}</p>
              <p style="margin: 4px 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">${step.description}</p>
            </td>
          </tr>
          `).join('')}
        </table>
      </td>
    </tr>
    
    <!-- Contact -->
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
    
    ${emailFooter(true)}
  `;
  
  return emailWrapper(content, getPackageOrderConfirmationPreheader(totalQuantity, productUnit));
}

export function generatePackageOrderConfirmationText(props: PackageOrderEmailProps): string {
  const {
    orderNumber,
    customerName,
    packageDisplayName,
    productName,
    productUnit,
    decorationMethod,
    items,
    decorationDetails,
    subtotal,
    tax,
    shipping,
    total,
    pricePerUnit,
    shippingAddress,
    logoUploaded,
    notes,
    trackingUrl,
  } = props;
  
  const totalQuantity = getTotalQuantity(items);
  const decorationDescription = getDecorationDescription(decorationMethod, decorationDetails);
  const processSteps = getProcessSteps(decorationMethod);
  const hasSizes = hasAnySizeBreakdown(items);
  
  let sizeBreakdownText = '';
  if (hasSizes) {
    sizeBreakdownText = '\nSIZE BREAKDOWN:\n';
    items.forEach(item => {
      if (item.sizeBreakdown) {
        sizeBreakdownText += `${item.colorName}: `;
        sizeBreakdownText += Object.entries(item.sizeBreakdown)
          .filter(([, qty]) => qty > 0)
          .map(([size, qty]) => `${size}:${qty}`)
          .join(', ');
        sizeBreakdownText += '\n';
      }
    });
  }
  
  const colorBreakdown = items.length > 1
    ? items.map(item => `  - ${item.colorName}: ${item.quantity}`).join('\n')
    : `Color: ${items[0]?.colorName || 'N/A'}`;

  return `
ORDER CONFIRMED - ${orderNumber}
===========================

Hi ${customerName.split(' ')[0]},

Thank you for your order! We've received your payment and your custom ${productUnit} are headed to production.

ORDER DETAILS:
${packageDisplayName}
Product: ${productName}
Decoration: ${decorationDescription}
Quantity: ${totalQuantity}

${items.length > 1 ? `Colors:\n${colorBreakdown}` : colorBreakdown}
${sizeBreakdownText}
Subtotal (${formatPrice(pricePerUnit)}/${productUnit.slice(0, -1)}): ${formatPrice(subtotal)}
Tax: ${formatPrice(tax)}
Shipping: ${shipping === 0 ? 'FREE' : formatPrice(shipping)}
Total: ${formatPrice(total)}

SHIPPING ADDRESS:
${customerName}
${shippingAddress.street}
${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}

${!logoUploaded ? `
ARTWORK NEEDED:
Please reply to this email with your logo/artwork attached (PNG, SVG, AI, or EPS format preferred). Our art team will create a proof for your approval.
` : ''}

${notes ? `YOUR NOTES: "${notes}"` : ''}

TRACK YOUR ORDER:
${trackingUrl || 'https://www.garmentdecor.com/orders'}
You can track your order anytime at https://www.garmentdecor.com/orders

WHAT'S NEXT:
${processSteps.map((step, index) => `${index + 1}. ${step.title} - ${step.description}`).join('\n')}

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
