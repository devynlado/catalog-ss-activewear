/**
 * Email template for Embroidery Guide download
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
 * Get subject line for embroidery guide
 */
export function getEmbroideryGuideSubject(): string {
  return EMAIL_SUBJECT_LINES.embroideryGuide;
}

/**
 * Get preheader for embroidery guide
 */
export function getEmbroideryGuidePreheader(): string {
  return EMAIL_PREHEADERS.embroideryGuide;
}

export function generateEmbroideryGuideHtml(): string {
  const ctaUrl = buildUTMUrl(`${COMPANY_INFO.website}/pricing`, {
    source: 'email',
    medium: 'guide',
    campaign: 'embroidery_guide',
    content: 'cta_button',
  });

  const content = `
    ${emailHeader('Your Embroidery Prep Guide', 'Professional results, every stitch', {
      backgroundColor: '#7c3aed'
    })}
    
    <!-- Intro -->
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 20px; color: ${EMAIL_COLORS.textBody}; font-size: 16px; line-height: 1.6; font-family: ${EMAIL_FONTS.stack};">
          Thanks for downloading our Embroidery Prep Guide! Here's everything you need to know for a flawless embroidery order.
        </p>
      </td>
    </tr>
    
    <!-- Section 1: Artwork -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailCard(`
          <h2 style="margin: 0 0 12px; color: #4338ca; font-size: 18px; font-family: ${EMAIL_FONTS.stack};">1. Prepare Your Artwork</h2>
          <ul style="margin: 0; padding-left: 20px; color: ${EMAIL_COLORS.textBody}; font-size: 14px; line-height: 1.8; font-family: ${EMAIL_FONTS.stack};">
            <li>Vector files (AI, EPS, PDF) are best</li>
            <li>High-res raster images (300+ DPI) also work</li>
            <li>Simplify small details - thread can't reproduce tiny elements</li>
            <li>Provide Pantone (PMS) colors for accurate thread matching</li>
            <li><strong>Avoid:</strong> Gradients, shadows, and photorealistic images</li>
          </ul>
        `, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' })}
      </td>
    </tr>
    
    <!-- Section 2: Size -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailCard(`
          <h2 style="margin: 0 0 12px; color: #a21caf; font-size: 18px; font-family: ${EMAIL_FONTS.stack};">2. Size Your Design</h2>
          <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px; color: ${EMAIL_COLORS.textBody}; font-family: ${EMAIL_FONTS.stack};">
            <tr>
              <td style="border-bottom: 1px solid ${EMAIL_COLORS.border};"><strong>Left Chest</strong></td>
              <td style="border-bottom: 1px solid ${EMAIL_COLORS.border};">3.5" - 4" wide (standard)</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid ${EMAIL_COLORS.border};"><strong>Cap Front</strong></td>
              <td style="border-bottom: 1px solid ${EMAIL_COLORS.border};">2.5" tall max</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid ${EMAIL_COLORS.border};"><strong>Full Back</strong></td>
              <td style="border-bottom: 1px solid ${EMAIL_COLORS.border};">Up to 12" x 12"</td>
            </tr>
            <tr>
              <td><strong>Sleeve</strong></td>
              <td>3" - 4" wide</td>
            </tr>
          </table>
          <p style="margin: 16px 0 0; color: #7c3aed; font-size: 12px; font-style: italic; font-family: ${EMAIL_FONTS.stack};">⚠️ Text smaller than 1/4" tall may not be legible</p>
        `, { backgroundColor: '#fdf4ff', borderColor: '#f5d0fe' })}
      </td>
    </tr>
    
    <!-- Section 3: Thread Colors -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailCard(`
          <h2 style="margin: 0 0 12px; color: #15803d; font-size: 18px; font-family: ${EMAIL_FONTS.stack};">3. Thread Colors</h2>
          <ul style="margin: 0; padding-left: 20px; color: ${EMAIL_COLORS.textBody}; font-size: 14px; line-height: 1.8; font-family: ${EMAIL_FONTS.stack};">
            <li>We use Madeira Polyneon thread (400+ colors)</li>
            <li>Provide PMS codes for exact matching</li>
            <li>Fewer colors = faster production = lower cost</li>
            <li>Metallic threads available for premium look</li>
          </ul>
        `, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' })}
      </td>
    </tr>
    
    <!-- Section 4: Garments -->
    <tr>
      <td style="padding: 0 32px 24px;">
        ${emailCard(`
          <h2 style="margin: 0 0 12px; color: #c2410c; font-size: 18px; font-family: ${EMAIL_FONTS.stack};">4. Best Garments for Embroidery</h2>
          <p style="margin: 0 0 12px; color: ${EMAIL_COLORS.textBody}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
            <span style="display: inline-block; background: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #fed7aa; margin: 4px 4px 4px 0;">Polos</span>
            <span style="display: inline-block; background: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #fed7aa; margin: 4px 4px 4px 0;">Caps</span>
            <span style="display: inline-block; background: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #fed7aa; margin: 4px 4px 4px 0;">Jackets</span>
            <span style="display: inline-block; background: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #fed7aa; margin: 4px 4px 4px 0;">Quarter-zips</span>
            <span style="display: inline-block; background: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #fed7aa; margin: 4px 4px 4px 0;">Fleece</span>
          </p>
          <p style="margin: 0; color: ${EMAIL_COLORS.textBody}; font-size: 14px; font-family: ${EMAIL_FONTS.stack};">
            <strong>Avoid:</strong> Ultra-lightweight or very stretchy materials
          </p>
        `, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' })}
      </td>
    </tr>
    
    <!-- Stitch Count Pricing -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <div style="background-color: ${EMAIL_COLORS.secondary}; border-radius: 8px; padding: 20px;">
          <h2 style="margin: 0 0 16px; color: white; font-size: 18px; font-family: ${EMAIL_FONTS.stack};">Stitch Count = Pricing</h2>
          <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px; color: #e2e8f0; font-family: ${EMAIL_FONTS.stack};">
            <tr>
              <td style="border-bottom: 1px solid #475569;">Simple logo (2,500 stitches)</td>
              <td style="text-align: right; border-bottom: 1px solid #475569;">~$4-5/piece</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #475569;">Medium logo (5,000 stitches)</td>
              <td style="text-align: right; border-bottom: 1px solid #475569;">~$4.50-5.50/piece</td>
            </tr>
            <tr>
              <td>Large/detailed (10,000+ stitches)</td>
              <td style="text-align: right;">~$5.50-7/piece</td>
            </tr>
          </table>
          <p style="margin: 16px 0 0; color: ${EMAIL_COLORS.textLight}; font-size: 12px; font-family: ${EMAIL_FONTS.stack};">One-time digitization fee: $40-60 (you keep the file forever!)</p>
        </div>
      </td>
    </tr>
    
    <!-- Pro Tips -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <h2 style="margin: 0 0 16px; color: ${EMAIL_COLORS.textBody}; font-size: 18px; font-family: ${EMAIL_FONTS.stack};">💡 Pro Tips for Savings</h2>
        <ul style="margin: 0; padding-left: 20px; color: ${EMAIL_COLORS.textBody}; font-size: 14px; line-height: 1.8; font-family: ${EMAIL_FONTS.stack};">
          <li>Order in bulk - prices drop at 100, 250, 500+ pieces</li>
          <li>Stick to one placement - each location = separate setup</li>
          <li>Simplify design - fewer colors & smaller size = lower stitch count</li>
          <li>Reuse digitization - once created, it's yours forever</li>
        </ul>
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
  
  return emailWrapper(content, EMAIL_PREHEADERS.embroideryGuide);
}

export function generateEmbroideryGuideText(): string {
  return `
YOUR EMBROIDERY PREP GUIDE
===========================
From ${COMPANY_INFO.name}

Thanks for downloading our Embroidery Prep Guide! Here's everything you need for a flawless order.

1. PREPARE YOUR ARTWORK
-----------------------
- Vector files (AI, EPS, PDF) are best
- High-res raster images (300+ DPI) also work
- Simplify small details - thread can't reproduce tiny elements
- Provide Pantone (PMS) colors for accurate matching
- Avoid: Gradients, shadows, photorealistic images

2. SIZE YOUR DESIGN
-------------------
- Left Chest: 3.5" - 4" wide (standard)
- Cap Front: 2.5" tall max
- Full Back: Up to 12" x 12"
- Sleeve: 3" - 4" wide
⚠️ Text smaller than 1/4" tall may not be legible

3. THREAD COLORS
----------------
- We use Madeira Polyneon thread (400+ colors)
- Provide PMS codes for exact matching
- Fewer colors = faster production = lower cost
- Metallic threads available for premium look

4. BEST GARMENTS FOR EMBROIDERY
-------------------------------
✓ Polos, Caps, Jackets, Quarter-zips, Fleece
✗ Avoid: Ultra-lightweight or very stretchy materials

STITCH COUNT = PRICING
----------------------
- Simple logo (2,500 stitches): ~$4-5/piece
- Medium logo (5,000 stitches): ~$4.50-5.50/piece
- Large/detailed (10,000+ stitches): ~$5.50-7/piece

One-time digitization fee: $40-60 (you keep the file forever!)

PRO TIPS FOR SAVINGS
--------------------
- Order in bulk - prices drop at 100, 250, 500+ pieces
- Stick to one placement - each location = separate setup
- Simplify design - fewer colors & smaller size = lower stitch count
- Reuse digitization - once created, it's yours forever

---
Ready to start? Get an instant estimate:
${COMPANY_INFO.website}/pricing?service=embroidery

${COMPANY_INFO.name}
${COMPANY_INFO.address}
${COMPANY_INFO.phone} | ${COMPANY_INFO.email}
  `.trim();
}
