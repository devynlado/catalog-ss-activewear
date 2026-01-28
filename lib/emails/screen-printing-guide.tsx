/**
 * Email template for Screen Printing Guide download
 * Uses shared components for consistent branding
 */

import {
  emailWrapper,
  emailHeader,
  emailFooter,
  emailButton,
  emailCard,
  EMAIL_COLORS,
  EMAIL_FONTS,
  EMAIL_SUBJECT_LINES,
  EMAIL_PREHEADERS,
  COMPANY_INFO,
  buildUTMUrl,
} from './components';

/**
 * Get subject line for screen printing guide
 */
export function getScreenPrintingGuideSubject(): string {
  return EMAIL_SUBJECT_LINES.screenPrintingGuide;
}

/**
 * Get preheader for screen printing guide
 */
export function getScreenPrintingGuidePreheader(): string {
  return EMAIL_PREHEADERS.screenPrintingGuide;
}

export function generateScreenPrintingGuideHtml(): string {
  const ctaUrl = buildUTMUrl(`${COMPANY_INFO.website}/pricing`, {
    source: 'email',
    medium: 'guide',
    campaign: 'screen_printing_guide',
    content: 'cta_button',
  });

  const content = `
    ${emailHeader('Your Screen Printing Prep Guide', 'Everything you need for a perfect print', {
      backgroundColor: '#ea580c'
    })}
    
    <!-- Intro -->
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 20px; color: ${EMAIL_COLORS.textBody}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Thanks for downloading our Screen Printing Prep Guide! Here's a quick reference of the key points to ensure your order comes out perfect.
        </p>
      </td>
    </tr>
    
    <!-- Section 1: Artwork -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailCard(`
          <h2 style="margin: 0 0 12px; color: #c2410c; font-size: 18px; font-family: ${EMAIL_FONTS.stack};">1. Prepare Your Artwork</h2>
          <ul style="margin: 0; padding-left: 20px; color: ${EMAIL_COLORS.textBody}; font-size: 14px; line-height: 1.8; font-family: ${EMAIL_FONTS.stack};">
            <li>Vector files (AI, EPS, PDF) are ideal - they scale without losing quality</li>
            <li>Raster images should be 300 DPI minimum at final print size</li>
            <li>Outline all fonts to prevent substitution</li>
            <li>Remove unnecessary elements or hidden layers</li>
          </ul>
        `, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' })}
      </td>
    </tr>
    
    <!-- Section 2: Colors -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailCard(`
          <h2 style="margin: 0 0 12px; color: #15803d; font-size: 18px; font-family: ${EMAIL_FONTS.stack};">2. Optimize Your Colors</h2>
          <ul style="margin: 0; padding-left: 20px; color: ${EMAIL_COLORS.textBody}; font-size: 14px; line-height: 1.8; font-family: ${EMAIL_FONTS.stack};">
            <li>Each color = separate screen = separate setup fee</li>
            <li>1-2 colors: Most economical</li>
            <li>5+ colors: Consider digital screen printing</li>
            <li><strong>Pro tip:</strong> Use the garment color as part of your design!</li>
          </ul>
        `, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' })}
      </td>
    </tr>
    
    <!-- Section 3: Size -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailCard(`
          <h2 style="margin: 0 0 12px; color: #1d4ed8; font-size: 18px; font-family: ${EMAIL_FONTS.stack};">3. Print Sizes & Placement</h2>
          <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
            <tr>
              <td style="border-bottom: 1px solid ${EMAIL_COLORS.border};"><strong>Left Chest</strong></td>
              <td style="border-bottom: 1px solid ${EMAIL_COLORS.border};">3.5" - 4" wide</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid ${EMAIL_COLORS.border};"><strong>Full Front</strong></td>
              <td style="border-bottom: 1px solid ${EMAIL_COLORS.border};">Up to 12" x 14"</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid ${EMAIL_COLORS.border};"><strong>Full Back</strong></td>
              <td style="border-bottom: 1px solid ${EMAIL_COLORS.border};">Up to 14" x 17"</td>
            </tr>
            <tr>
              <td><strong>Jumbo Print</strong></td>
              <td>Up to 17" x 23"</td>
            </tr>
          </table>
        `, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' })}
      </td>
    </tr>
    
    <!-- Section 4: Garments -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailCard(`
          <h2 style="margin: 0 0 12px; color: #a21caf; font-size: 18px; font-family: ${EMAIL_FONTS.stack};">4. Garment Selection</h2>
          <ul style="margin: 0; padding-left: 20px; color: ${EMAIL_COLORS.textBody}; font-size: 14px; line-height: 1.8; font-family: ${EMAIL_FONTS.stack};">
            <li><strong>100% cotton:</strong> Best ink absorption and vibrancy</li>
            <li><strong>50/50 blends:</strong> Good balance of comfort and print quality</li>
            <li><strong>Dark garments:</strong> Require white underbase (+1 color)</li>
            <li><strong>Avoid:</strong> 100% polyester for standard screen printing</li>
          </ul>
        `, { backgroundColor: '#fdf4ff', borderColor: '#f5d0fe' })}
      </td>
    </tr>
    
    <!-- Pricing Example -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <div style="background-color: ${EMAIL_COLORS.secondary}; border-radius: 8px; padding: 20px;">
          <h2 style="margin: 0 0 16px; color: white; font-size: 18px; font-family: ${EMAIL_FONTS.stack};">Example Pricing</h2>
          <p style="margin: 0 0 12px; color: ${EMAIL_COLORS.textLight}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">100 black t-shirts, 2-color front print:</p>
          <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px; color: #e2e8f0; font-family: ${EMAIL_FONTS.stack};">
            <tr>
              <td>Print cost (100 x $2.95)</td>
              <td style="text-align: right;">$295.00</td>
            </tr>
            <tr>
              <td>Setup (3 colors* x $30)</td>
              <td style="text-align: right;">$90.00</td>
            </tr>
            <tr style="border-top: 1px solid #475569;">
              <td style="padding-top: 12px;"><strong>Total decoration</strong></td>
              <td style="text-align: right; padding-top: 12px;"><strong>$385.00</strong></td>
            </tr>
          </table>
          <p style="margin: 16px 0 0; color: ${EMAIL_COLORS.textLight}; font-size: 12px; font-family: ${EMAIL_FONTS.stack};">*Dark shirts = 2 design colors + white underbase</p>
        </div>
      </td>
    </tr>
    
    <!-- CTA -->
    <tr>
      <td style="padding: 0 32px 32px; text-align: center;">
        <p style="margin: 0 0 16px; color: ${EMAIL_COLORS.textBody}; font-size: 16px; font-family: ${EMAIL_FONTS.stack};">Ready to start your order?</p>
        ${emailButton('Get Instant Estimate', ctaUrl, { color: 'primary' })}
      </td>
    </tr>
    
    ${emailFooter(true)}
  `;
  
  return emailWrapper(content, EMAIL_PREHEADERS.screenPrintingGuide);
}

export function generateScreenPrintingGuideText(): string {
  return `
YOUR SCREEN PRINTING PREP GUIDE
================================
From ${COMPANY_INFO.name}

Thanks for downloading our Screen Printing Prep Guide! Here's a quick reference of the key points.

1. PREPARE YOUR ARTWORK
-----------------------
- Vector files (AI, EPS, PDF) are ideal
- Raster images: 300 DPI minimum at final size
- Outline all fonts
- Remove unnecessary elements

2. OPTIMIZE YOUR COLORS
-----------------------
- Each color = separate screen = separate setup fee
- 1-2 colors: Most economical
- 5+ colors: Consider digital screen printing
- Pro tip: Use garment color as part of your design!

3. PRINT SIZES & PLACEMENT
--------------------------
- Left Chest: 3.5" - 4" wide
- Full Front: Up to 12" x 14"
- Full Back: Up to 14" x 17"
- Jumbo Print: Up to 17" x 23"

4. GARMENT SELECTION
--------------------
- 100% cotton: Best ink absorption
- 50/50 blends: Good balance
- Dark garments: Need white underbase (+1 color)
- Avoid: 100% polyester for standard screen printing

EXAMPLE PRICING
---------------
100 black t-shirts, 2-color front print:
- Print cost (100 x $2.95): $295.00
- Setup (3 colors x $30): $90.00
- Total: $385.00 ($3.85/piece)

---
Ready to start? Get an instant estimate:
${COMPANY_INFO.website}/pricing?service=screen-printing

${COMPANY_INFO.name}
${COMPANY_INFO.address}
${COMPANY_INFO.phone} | ${COMPANY_INFO.email}
  `.trim();
}
