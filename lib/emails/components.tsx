/**
 * Shared Email Components
 * 
 * Reusable HTML generators for consistent email styling across all templates.
 * Based on the Soft Craft design system adapted for email constraints.
 * 
 * @see docs/EMAIL-SYSTEM-GUIDELINES.md for full documentation
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export const EMAIL_COLORS = {
  // Backgrounds
  backgroundOuter: '#FAF6F3',  // Warm cream - Soft Craft signature
  backgroundAlt: '#f8fafc',    // Slate-50 fallback
  backgroundCard: '#FFFFFF',
  
  // Brand colors
  primary: '#f97316',          // brand-500 orange
  primaryHover: '#ea580c',     // brand-600
  secondary: '#0f172a',        // navy-800
  
  // Text colors
  textDark: '#0f172a',         // navy-800
  textBody: '#475569',         // slate-600
  textMuted: '#64748b',        // slate-500
  textLight: '#94a3b8',        // slate-400
  textWhite: '#ffffff',
  
  // Utility colors
  border: '#e7e5e4',           // stone-200
  borderLight: '#f5f5f4',      // stone-100
  success: '#16a34a',          // green-600
  successBg: '#f0fdf4',        // green-50
  warning: '#d97706',          // amber-600
  warningBg: '#fffbeb',        // amber-50
  error: '#dc2626',            // red-600
  info: '#2563eb',             // blue-600
  infoBg: '#eff6ff',           // blue-50
} as const;

export const EMAIL_FONTS = {
  stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

export const LOGO_URLS = {
  // Using PNG for email compatibility (most email clients block SVG)
  wordmarkWhite: 'https://www.garmentdecor.com/images/brand/logo-wordmark-white.png',
  wordmarkDark: 'https://www.garmentdecor.com/images/brand/logo-wordmark-dark.png',
  iconDark: 'https://www.garmentdecor.com/images/brand/logo-circle-dark.png',
} as const;

export const COMPANY_INFO = {
  name: 'Garment Decor',
  tagline: "Southern California's #1 Custom Apparel Decorator",
  address: '4778 W. Mission Blvd, Montclair CA 91762',
  phone: '(855) 942-7636',
  email: 'info@garmentdecor.com',
  website: 'https://garmentdecor.com',
} as const;

export const EMAIL_SUBJECT_LINES = {
  quoteConfirmation: (quoteId: string) => 
    `Quote ${quoteId} received – we'll respond in 2 hours`,
  quoteRecovery: (itemCount: number) => 
    `Your quote is waiting – ${itemCount} item${itemCount !== 1 ? 's' : ''} saved`,
  recoveryReminder: (itemCount: number) => 
    `Still thinking it over? Your ${itemCount} item${itemCount !== 1 ? 's' : ''} ${itemCount !== 1 ? 'are' : 'is'} waiting`,
  screenPrintingGuide: 'Your Screen Printing Prep Guide',
  embroideryGuide: 'Your Embroidery Prep Guide',
  // Internal emails
  quoteNotification: (quoteId: string, total: number) => 
    `[INTERNAL] New quote ${quoteId} – $${total.toFixed(2)}`,
  contactNotification: (name: string) => 
    `[INTERNAL] New contact: ${name}`,
} as const;

export const EMAIL_PREHEADERS = {
  quoteConfirmation: (itemCount: number) => 
    `Your ${itemCount} item${itemCount !== 1 ? 's are' : ' is'} being reviewed by our team...`,
  quoteRecovery: 'Click to resume where you left off. Your items are saved for 30 days.',
  recoveryReminder: "Don't lose your quote – complete it before items go out of stock.",
  screenPrintingGuide: 'Everything you need for a perfect print – artwork, colors, sizing tips.',
  embroideryGuide: 'Professional results, every stitch – prep guide inside.',
} as const;

// =============================================================================
// UTM HELPERS
// =============================================================================

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
}

export function buildUTMUrl(baseUrl: string, params: UTMParams = {}): string {
  const url = new URL(baseUrl);
  
  if (params.source) url.searchParams.set('utm_source', params.source);
  if (params.medium) url.searchParams.set('utm_medium', params.medium);
  if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
  if (params.content) url.searchParams.set('utm_content', params.content);
  
  return url.toString();
}

// =============================================================================
// COMPONENT GENERATORS
// =============================================================================

/**
 * Hidden preheader text that appears in email inbox preview
 * @param text - Preview text (50-100 characters recommended)
 */
export function emailPreheader(text: string): string {
  return `
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
      ${text}
    </div>
    <!-- Preheader spacer to prevent content from showing -->
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
      &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>
  `;
}

/**
 * Branded email header with logo
 * @param title - Main heading
 * @param subtitle - Optional subheading
 * @param options - Header customization options
 */
export function emailHeader(
  title: string, 
  subtitle?: string,
  options?: {
    backgroundColor?: string;
    showLogo?: boolean;
    iconEmoji?: string;
  }
): string {
  const {
    backgroundColor = EMAIL_COLORS.primary,
    showLogo = true,
    iconEmoji,
  } = options || {};

  return `
    <tr>
      <td style="background-color: ${backgroundColor}; padding: 32px; text-align: center;">
        ${showLogo ? `
          <img 
            src="${LOGO_URLS.wordmarkWhite}" 
            alt="${COMPANY_INFO.name}" 
            width="180" 
            height="40"
            style="display: block; margin: 0 auto 16px; max-width: 180px; height: auto;"
          />
        ` : ''}
        ${iconEmoji ? `
          <div style="font-size: 48px; margin-bottom: 12px;">${iconEmoji}</div>
        ` : ''}
        <h1 style="margin: 0; color: ${EMAIL_COLORS.textWhite}; font-size: 24px; font-weight: 700; font-family: ${EMAIL_FONTS.stack};">
          ${title}
        </h1>
        ${subtitle ? `
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
            ${subtitle}
          </p>
        ` : ''}
      </td>
    </tr>
  `;
}

/**
 * Internal email header (simpler styling)
 */
export function emailHeaderInternal(title: string, subtitle?: string): string {
  return `
    <tr>
      <td style="background: linear-gradient(135deg, ${EMAIL_COLORS.secondary} 0%, #1e293b 100%); padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: ${EMAIL_COLORS.textWhite}; font-size: 24px; font-weight: 700; font-family: ${EMAIL_FONTS.stack};">
          ${title}
        </h1>
        ${subtitle ? `
          <p style="margin: 8px 0 0; color: ${EMAIL_COLORS.textLight}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
            ${subtitle}
          </p>
        ` : ''}
      </td>
    </tr>
  `;
}

/**
 * Email footer with company info and optional unsubscribe
 * @param includeUnsubscribe - Whether to show unsubscribe link (default: true)
 */
export function emailFooter(includeUnsubscribe = true): string {
  return `
    <tr>
      <td style="padding: 32px; background-color: ${EMAIL_COLORS.secondary}; text-align: center;">
        <img 
          src="${LOGO_URLS.wordmarkWhite}" 
          alt="${COMPANY_INFO.name}" 
          width="140" 
          height="32"
          style="display: block; margin: 0 auto 12px; max-width: 140px; height: auto;"
        />
        <p style="margin: 0 0 4px; color: ${EMAIL_COLORS.textWhite}; font-size: 14px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">
          ${COMPANY_INFO.name}
        </p>
        <p style="margin: 0 0 12px; color: ${EMAIL_COLORS.textLight}; font-size: 12px; font-family: ${EMAIL_FONTS.stack};">
          ${COMPANY_INFO.tagline}
        </p>
        <p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; font-family: ${EMAIL_FONTS.stack};">
          ${COMPANY_INFO.address}<br/>
          <a href="tel:${COMPANY_INFO.phone.replace(/[^0-9+]/g, '')}" style="color: ${EMAIL_COLORS.textMuted}; text-decoration: none;">
            ${COMPANY_INFO.phone}
          </a>
          &nbsp;|&nbsp;
          <a href="mailto:${COMPANY_INFO.email}" style="color: ${EMAIL_COLORS.textMuted}; text-decoration: none;">
            ${COMPANY_INFO.email}
          </a>
        </p>
        ${includeUnsubscribe ? `
          <p style="margin: 16px 0 0; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
            <a href="${COMPANY_INFO.website}/unsubscribe" style="color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-decoration: underline; font-family: ${EMAIL_FONTS.stack};">
              Unsubscribe from these emails
            </a>
          </p>
        ` : ''}
      </td>
    </tr>
  `;
}

/**
 * Simpler footer for internal emails
 */
export function emailFooterInternal(): string {
  return `
    <tr>
      <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center; border-top: 1px solid ${EMAIL_COLORS.border};">
        <p style="margin: 0 0 4px; color: ${EMAIL_COLORS.textBody}; font-size: 14px; font-weight: 600; font-family: ${EMAIL_FONTS.stack};">
          ${COMPANY_INFO.name}
        </p>
        <p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; font-family: ${EMAIL_FONTS.stack};">
          ${COMPANY_INFO.address} | ${COMPANY_INFO.phone}
        </p>
      </td>
    </tr>
  `;
}

/**
 * Styled CTA button
 * @param text - Button label
 * @param href - Link URL
 * @param options - Button customization
 */
export function emailButton(
  text: string, 
  href: string, 
  options?: {
    color?: 'primary' | 'secondary' | 'success';
    utm?: UTMParams;
    align?: 'left' | 'center' | 'right';
  }
): string {
  const { color = 'primary', utm, align = 'center' } = options || {};
  
  const colors = {
    primary: { bg: EMAIL_COLORS.primary, text: EMAIL_COLORS.textWhite },
    secondary: { bg: EMAIL_COLORS.secondary, text: EMAIL_COLORS.textWhite },
    success: { bg: EMAIL_COLORS.success, text: EMAIL_COLORS.textWhite },
  };
  
  const { bg, text: textColor } = colors[color];
  const finalHref = utm ? buildUTMUrl(href, utm) : href;
  
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td align="${align}">
          <a 
            href="${finalHref}" 
            style="display: inline-block; padding: 14px 32px; background-color: ${bg}; color: ${textColor}; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; font-family: ${EMAIL_FONTS.stack};"
          >
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Secondary/outline button
 */
export function emailButtonOutline(
  text: string, 
  href: string,
  options?: { utm?: UTMParams; align?: 'left' | 'center' | 'right' }
): string {
  const { utm, align = 'center' } = options || {};
  const finalHref = utm ? buildUTMUrl(href, utm) : href;
  
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
      <tr>
        <td align="${align}">
          <a 
            href="${finalHref}" 
            style="display: inline-block; padding: 12px 24px; background-color: transparent; color: ${EMAIL_COLORS.secondary}; text-decoration: none; font-weight: 600; font-size: 14px; border: 2px solid ${EMAIL_COLORS.border}; border-radius: 8px; font-family: ${EMAIL_FONTS.stack};"
          >
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Info card with colored background
 * @param content - HTML content inside the card
 * @param options - Card customization
 */
export function emailCard(
  content: string,
  options?: {
    backgroundColor?: string;
    borderColor?: string;
    padding?: string;
  }
): string {
  const {
    backgroundColor = '#fafaf9',  // stone-50
    borderColor = EMAIL_COLORS.border,
    padding = '20px',
  } = options || {};
  
  return `
    <div style="background-color: ${backgroundColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: ${padding}; margin: 16px 0;">
      ${content}
    </div>
  `;
}

/**
 * Colored accent card (for callouts, alerts)
 */
export function emailAccentCard(
  content: string,
  type: 'info' | 'success' | 'warning' | 'brand' = 'info'
): string {
  const styles = {
    info: { bg: EMAIL_COLORS.infoBg, border: '#bfdbfe', accent: EMAIL_COLORS.info },
    success: { bg: EMAIL_COLORS.successBg, border: '#bbf7d0', accent: EMAIL_COLORS.success },
    warning: { bg: EMAIL_COLORS.warningBg, border: '#fef08a', accent: EMAIL_COLORS.warning },
    brand: { bg: '#fff7ed', border: '#fed7aa', accent: EMAIL_COLORS.primary },
  };
  
  const { bg, border } = styles[type];
  
  return `
    <div style="background-color: ${bg}; border: 1px solid ${border}; border-radius: 8px; padding: 16px; margin: 16px 0;">
      ${content}
    </div>
  `;
}

/**
 * Section divider
 */
export function emailDivider(): string {
  return `
    <tr>
      <td style="padding: 0 32px;">
        <hr style="border: none; border-top: 1px solid ${EMAIL_COLORS.border}; margin: 24px 0;" />
      </td>
    </tr>
  `;
}

/**
 * Complete email wrapper
 * @param content - Main email content (table rows)
 * @param preheaderText - Optional preheader text
 */
export function emailWrapper(content: string, preheaderText?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Garment Decor</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.backgroundOuter}; font-family: ${EMAIL_FONTS.stack};">
  ${preheaderText ? emailPreheader(preheaderText) : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${EMAIL_COLORS.backgroundOuter}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${EMAIL_COLORS.backgroundCard}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// =============================================================================
// PACKAGE ORDER TYPES & HELPERS
// =============================================================================

/**
 * Decoration methods supported by the system
 */
export type DecorationMethod = 'embroidery' | 'screen-print' | 'heat-transfer' | 'dtg';

/**
 * Decoration details vary by method
 */
export interface DecorationDetails {
  locations: string[];              // ['front', 'back'] or ['left-chest']
  colors?: number;                  // For screen printing
  stitchCount?: number;             // For embroidery
}

/**
 * Individual item in a package order (supports multiple colors with optional sizes)
 */
export interface PackageOrderItem {
  colorName: string;
  quantity: number;
  sizeBreakdown?: Record<string, number>;  // Optional for products with sizes
}

/**
 * Unified interface for package order emails
 * Supports any package type (embroidered caps, printed tees, etc.)
 */
export interface PackageOrderEmailProps {
  // Order basics
  orderNumber: string;
  customerName: string;
  email: string;
  
  // Package details (dynamic)
  packageType: string;               // 'embroidered-caps', 'printed-tees-gildan', etc.
  packageDisplayName: string;        // "Custom Embroidered Caps"
  productName: string;               // "Richardson 112 Trucker Cap"
  productUnit: string;               // "caps", "shirts", "polos"
  decorationMethod: DecorationMethod;
  
  // Items (support single or multiple colors)
  items: PackageOrderItem[];
  
  // Decoration details
  decorationDetails: DecorationDetails;
  
  // Pricing
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  pricePerUnit: number;
  
  // Shipping
  shippingAddress: { 
    street: string; 
    city: string; 
    state: string; 
    zip: string; 
  };
  
  // Artwork
  logoUploaded: boolean;
  logoUrl?: string;
  
  // Optional fields
  notes?: string;
  phone?: string;
  company?: string;
  paymentIntentId?: string;
  createdAt?: string;
  trackingUrl?: string;
}

/**
 * Get human-readable decoration description
 * Examples:
 * - "2-color screen print on front & back"
 * - "Embroidery up to 10,000 stitches on left chest"
 */
export function getDecorationDescription(
  method: DecorationMethod, 
  details: DecorationDetails
): string {
  const locationText = details.locations.length > 1 
    ? details.locations.map(l => l.replace('-', ' ')).join(' & ')
    : details.locations[0]?.replace('-', ' ') || 'front';
  
  switch (method) {
    case 'screen-print':
      const colorCount = details.colors || 1;
      return `${colorCount}-color screen print on ${locationText}`;
    
    case 'embroidery':
      const stitches = details.stitchCount 
        ? `up to ${details.stitchCount.toLocaleString()} stitches` 
        : 'custom embroidery';
      return `${stitches} on ${locationText}`;
    
    case 'heat-transfer':
      return `Heat transfer on ${locationText}`;
    
    case 'dtg':
      return `Direct-to-garment print on ${locationText}`;
    
    default:
      return `Custom decoration on ${locationText}`;
  }
}

/**
 * Get process steps based on decoration method
 * Returns an array of steps for the "What's Next" section
 */
export function getProcessSteps(method: DecorationMethod): Array<{ 
  title: string; 
  description: string; 
}> {
  switch (method) {
    case 'embroidery':
      return [
        { 
          title: 'Art Digitization', 
          description: 'Our team converts your logo to embroidery format (1-2 business days)' 
        },
        { 
          title: 'Your Approval', 
          description: "We'll email you a digital mockup to approve before production" 
        },
        { 
          title: 'Production & Shipping', 
          description: 'Ships within 10 business days of approval – tracking included!' 
        },
      ];
    
    case 'screen-print':
      return [
        { 
          title: 'Art Setup', 
          description: 'Our team prepares your artwork for screen printing (1-2 business days)' 
        },
        { 
          title: 'Proof Approval', 
          description: "We'll email you a digital proof to approve before production" 
        },
        { 
          title: 'Production & Shipping', 
          description: 'Ships within 7-10 business days of approval – tracking included!' 
        },
      ];
    
    case 'heat-transfer':
      return [
        { 
          title: 'Art Preparation', 
          description: 'Your design is prepared for heat transfer (1 business day)' 
        },
        { 
          title: 'Proof Approval', 
          description: "We'll send a digital proof for your approval" 
        },
        { 
          title: 'Production & Shipping', 
          description: 'Ships within 5-7 business days of approval – tracking included!' 
        },
      ];
    
    case 'dtg':
      return [
        { 
          title: 'Color Matching', 
          description: 'We optimize your artwork colors for DTG printing (1 business day)' 
        },
        { 
          title: 'Proof Approval', 
          description: "We'll email a digital proof for your review" 
        },
        { 
          title: 'Production & Shipping', 
          description: 'Ships within 5-7 business days of approval – tracking included!' 
        },
      ];
    
    default:
      return [
        { 
          title: 'Art Review', 
          description: 'Our team reviews your artwork (1-2 business days)' 
        },
        { 
          title: 'Your Approval', 
          description: "We'll email you a mockup to approve" 
        },
        { 
          title: 'Production & Shipping', 
          description: 'Ships after approval – tracking included!' 
        },
      ];
  }
}

/**
 * Get action items for internal team based on decoration method
 */
export function getActionItems(
  method: DecorationMethod, 
  hasLogo: boolean
): string[] {
  const items: string[] = [];
  
  if (!hasLogo) {
    items.push('Request logo/artwork from customer');
  }
  
  switch (method) {
    case 'embroidery':
      items.push('Digitize logo for embroidery');
      items.push('Create embroidery mockup');
      break;
    
    case 'screen-print':
      items.push('Prepare artwork for screen printing');
      items.push('Create screen print proof');
      break;
    
    case 'heat-transfer':
      items.push('Prepare heat transfer artwork');
      items.push('Create mockup proof');
      break;
    
    case 'dtg':
      items.push('Optimize artwork for DTG');
      items.push('Create digital proof');
      break;
    
    default:
      items.push('Review artwork');
      items.push('Create mockup');
  }
  
  items.push('Send proof for customer approval');
  items.push('Begin production after approval');
  
  return items;
}

/**
 * Calculate total quantity from items
 */
export function getTotalQuantity(items: PackageOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Check if any items have size breakdowns
 */
export function hasAnySizeBreakdown(items: PackageOrderItem[]): boolean {
  return items.some(item => item.sizeBreakdown && Object.keys(item.sizeBreakdown).length > 0);
}

/**
 * Get aggregated size breakdown across all items
 */
export function getAggregatedSizeBreakdown(items: PackageOrderItem[]): Record<string, number> {
  const aggregated: Record<string, number> = {};
  
  for (const item of items) {
    if (item.sizeBreakdown) {
      for (const [size, qty] of Object.entries(item.sizeBreakdown)) {
        aggregated[size] = (aggregated[size] || 0) + qty;
      }
    }
  }
  
  return aggregated;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Mask email for display (privacy)
 * example@domain.com → e****e@d***n.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  const maskPart = (str: string) => {
    if (str.length <= 2) return str;
    return str[0] + '*'.repeat(Math.min(4, str.length - 2)) + str[str.length - 1];
  };
  
  const [domainName, tld] = domain.split('.');
  return `${maskPart(local)}@${maskPart(domainName)}.${tld}`;
}

/**
 * Generate a greeting based on time of day
 */
export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let timeGreeting = 'Hello';
  
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';
  
  return name ? `${timeGreeting}, ${name.split(' ')[0]}` : timeGreeting;
}
