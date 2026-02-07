/**
 * Internal email notification when a package order is placed
 * Sent to the sales team for order processing
 * Supports all package types: embroidered caps, printed tees, embroidered polos, etc.
 */

import {
  emailWrapper,
  emailHeaderInternal,
  emailFooterInternal,
  emailAccentCard,
  EMAIL_COLORS,
  EMAIL_FONTS,
  formatPrice,
  PackageOrderEmailProps,
  getDecorationDescription,
  getActionItems,
  getTotalQuantity,
  hasAnySizeBreakdown,
  getAggregatedSizeBreakdown,
} from './components';

/**
 * Get subject line for internal package order notification
 */
export function getPackageOrderNotificationSubject(
  orderNumber: string, 
  total: number,
  packageDisplayName: string
): string {
  return `[PACKAGE ORDER] ${orderNumber} – $${total.toFixed(2)} – ${packageDisplayName}`;
}

/**
 * Generate size breakdown summary for internal team
 */
function generateSizeBreakdownSummaryHtml(
  items: PackageOrderEmailProps['items']
): string {
  if (!hasAnySizeBreakdown(items)) return '';
  
  const aggregated = getAggregatedSizeBreakdown(items);
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  const sortedSizes = Object.keys(aggregated).sort((a, b) => {
    const aIndex = sizeOrder.indexOf(a);
    const bIndex = sizeOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  
  return `
    <tr>
      <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Size Breakdown</td>
      <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">
        ${sortedSizes.map(size => `<span style="display: inline-block; margin-right: 12px;"><strong>${size}:</strong> ${aggregated[size]}</span>`).join('')}
      </td>
    </tr>
  `;
}

/**
 * Generate per-color breakdown for internal team
 */
function generateColorBreakdownHtml(
  items: PackageOrderEmailProps['items']
): string {
  if (items.length <= 1) return '';
  
  const hasSizes = hasAnySizeBreakdown(items);
  
  return `
    <tr>
      <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Colors</td>
      <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">
        ${items.map(item => {
          let sizeDetail = '';
          if (hasSizes && item.sizeBreakdown) {
            const sizeStr = Object.entries(item.sizeBreakdown)
              .filter(([, qty]) => qty > 0)
              .map(([size, qty]) => `${size}:${qty}`)
              .join(', ');
            sizeDetail = ` (${sizeStr})`;
          }
          return `<div style="margin-bottom: 4px;"><strong>${item.colorName}:</strong> ${item.quantity}${sizeDetail}</div>`;
        }).join('')}
      </td>
    </tr>
  `;
}

export function generatePackageOrderNotificationHtml(props: PackageOrderEmailProps): string {
  const {
    orderNumber,
    customerName,
    email,
    phone,
    company,
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
    logoUrl,
    notes,
    paymentIntentId,
    createdAt,
  } = props;
  
  const totalQuantity = getTotalQuantity(items);
  const decorationDescription = getDecorationDescription(decorationMethod, decorationDetails);
  const actionItems = getActionItems(decorationMethod, !!logoUrl);
  const hasSizes = hasAnySizeBreakdown(items);
  
  const content = `
    ${emailHeaderInternal('New Package Order', `Order #${orderNumber}`)}
    
    <!-- Order Summary -->
    <tr>
      <td style="padding: 32px 32px 24px;">
        ${emailAccentCard(`
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; font-family: ${EMAIL_FONTS.stack};">Order Total</td>
              <td style="color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; text-align: right; font-family: ${EMAIL_FONTS.stack};">Quantity</td>
            </tr>
            <tr>
              <td style="color: ${EMAIL_COLORS.success}; font-size: 28px; font-weight: 700; font-family: ${EMAIL_FONTS.stack};">${formatPrice(total)}</td>
              <td style="color: ${EMAIL_COLORS.textDark}; font-size: 28px; font-weight: 700; text-align: right; font-family: ${EMAIL_FONTS.stack};">${totalQuantity} ${productUnit}</td>
            </tr>
          </table>
        `, 'success')}
      </td>
    </tr>
    
    <!-- Customer Info -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Customer Information</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; width: 140px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Name</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Email</td>
            <td style="padding: 12px; font-family: ${EMAIL_FONTS.stack};"><a href="mailto:${email}" style="color: ${EMAIL_COLORS.info};">${email}</a></td>
          </tr>
          ${phone ? `
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Phone</td>
            <td style="padding: 12px; font-family: ${EMAIL_FONTS.stack};"><a href="tel:${phone}" style="color: ${EMAIL_COLORS.info};">${phone}</a></td>
          </tr>
          ` : ''}
          ${company ? `
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Company</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${company}</td>
          </tr>
          ` : ''}
        </table>
      </td>
    </tr>
    
    <!-- Order Details -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Order Details</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; width: 140px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Package</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${packageDisplayName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Product</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Quantity</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${totalQuantity} ${productUnit}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Decoration</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">${decorationDescription}</td>
          </tr>
          ${items.length === 1 ? `
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Color</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${items[0].colorName}</td>
          </tr>
          ` : ''}
          ${generateColorBreakdownHtml(items)}
          ${hasSizes ? generateSizeBreakdownSummaryHtml(items) : ''}
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
            <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 20px; color: ${EMAIL_COLORS.success}; font-family: ${EMAIL_FONTS.stack};">${formatPrice(total)}</td>
          </tr>
        </table>
      </td>
    </tr>
    
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
    
    <!-- Logo Status -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${logoUrl ? `
          ${emailAccentCard(`
            <p style="margin: 0; color: #166534; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">✓ Artwork Uploaded</p>
            <p style="margin: 8px 0 0; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
              <a href="${logoUrl}" style="color: ${EMAIL_COLORS.info}; text-decoration: underline;">View Artwork File</a>
            </p>
          `, 'success')}
        ` : `
          ${emailAccentCard(`
            <p style="margin: 0; color: #92400e; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">⚠ Artwork Not Uploaded</p>
            <p style="margin: 8px 0 0; color: #a16207; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
              Customer needs to send their artwork. Follow up to request the file.
            </p>
          `, 'warning')}
        `}
      </td>
    </tr>
    
    ${notes ? `
    <!-- Customer Notes -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Customer Notes</h2>
        <div style="background-color: #fffbeb; border: 1px solid #fef08a; border-radius: 8px; padding: 16px;">
          <p style="margin: 0; color: ${EMAIL_COLORS.textBody}; font-style: italic; font-family: ${EMAIL_FONTS.stack};">"${notes}"</p>
        </div>
      </td>
    </tr>
    ` : ''}
    
    <!-- Technical Details -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textDark}; font-size: 18px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">Technical Details</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; width: 140px; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Order Number</td>
            <td style="padding: 12px; font-family: monospace; color: ${EMAIL_COLORS.textDark};">${orderNumber}</td>
          </tr>
          ${paymentIntentId ? `
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Stripe Payment</td>
            <td style="padding: 12px; font-family: monospace; font-size: 12px;">
              <a href="https://dashboard.stripe.com/payments/${paymentIntentId}" style="color: ${EMAIL_COLORS.info};">${paymentIntentId}</a>
            </td>
          </tr>
          ` : ''}
          ${createdAt ? `
          <tr>
            <td style="padding: 12px; background-color: #fafaf9; color: ${EMAIL_COLORS.textMuted}; font-family: ${EMAIL_FONTS.stack};">Order Time</td>
            <td style="padding: 12px; color: ${EMAIL_COLORS.textDark}; font-family: ${EMAIL_FONTS.stack};">${createdAt}</td>
          </tr>
          ` : ''}
        </table>
      </td>
    </tr>
    
    <!-- Action Items -->
    <tr>
      <td style="padding: 0 32px 32px;">
        ${emailAccentCard(`
          <p style="margin: 0; color: #1e40af; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">📋 Action Items</p>
          <ol style="margin: 12px 0 0; padding-left: 20px; color: #1e40af; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
            ${actionItems.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
          </ol>
        `, 'info')}
      </td>
    </tr>
    
    ${emailFooterInternal()}
  `;
  
  return emailWrapper(content);
}

export function generatePackageOrderNotificationText(props: PackageOrderEmailProps): string {
  const {
    orderNumber,
    customerName,
    email,
    phone,
    company,
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
    logoUrl,
    notes,
    paymentIntentId,
    createdAt,
  } = props;
  
  const totalQuantity = getTotalQuantity(items);
  const decorationDescription = getDecorationDescription(decorationMethod, decorationDetails);
  const actionItems = getActionItems(decorationMethod, !!logoUrl);
  const hasSizes = hasAnySizeBreakdown(items);
  
  let colorBreakdown = '';
  if (items.length > 1) {
    colorBreakdown = items.map(item => {
      let sizeDetail = '';
      if (hasSizes && item.sizeBreakdown) {
        const sizeStr = Object.entries(item.sizeBreakdown)
          .filter(([, qty]) => qty > 0)
          .map(([size, qty]) => `${size}:${qty}`)
          .join(', ');
        sizeDetail = ` (${sizeStr})`;
      }
      return `  - ${item.colorName}: ${item.quantity}${sizeDetail}`;
    }).join('\n');
  }
  
  let sizeBreakdownText = '';
  if (hasSizes) {
    const aggregated = getAggregatedSizeBreakdown(items);
    sizeBreakdownText = '\nSize Breakdown (Total): ' + 
      Object.entries(aggregated)
        .filter(([, qty]) => qty > 0)
        .map(([size, qty]) => `${size}:${qty}`)
        .join(', ');
  }

  return `
[PACKAGE ORDER] ${orderNumber} – ${formatPrice(total)}
===========================

CUSTOMER INFORMATION:
Name: ${customerName}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${company ? `Company: ${company}` : ''}

ORDER DETAILS:
Package: ${packageDisplayName}
Product: ${productName}
Decoration: ${decorationDescription}
Quantity: ${totalQuantity} ${productUnit}
${items.length === 1 ? `Color: ${items[0].colorName}` : `Colors:\n${colorBreakdown}`}
${sizeBreakdownText}

Subtotal (${formatPrice(pricePerUnit)}/${productUnit.slice(0, -1)}): ${formatPrice(subtotal)}
Tax: ${formatPrice(tax)}
Shipping: ${shipping === 0 ? 'FREE' : formatPrice(shipping)}
Total: ${formatPrice(total)}

SHIPPING ADDRESS:
${customerName}
${shippingAddress.street}
${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}

ARTWORK STATUS: ${logoUrl ? `Uploaded - ${logoUrl}` : 'NOT UPLOADED - Follow up required'}

${notes ? `CUSTOMER NOTES: "${notes}"` : ''}

TECHNICAL DETAILS:
Order Number: ${orderNumber}
${paymentIntentId ? `Stripe Payment: https://dashboard.stripe.com/payments/${paymentIntentId}` : ''}
${createdAt ? `Order Time: ${createdAt}` : ''}

ACTION ITEMS:
${actionItems.map((item, index) => `${index + 1}. ${item}`).join('\n')}
  `.trim();
}
