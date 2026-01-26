// Email template for Screen Printing Guide download

export function generateScreenPrintingGuideHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Screen Printing Prep Guide - Garment Decor</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Your Screen Printing Prep Guide</h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Everything you need for a perfect print</p>
            </td>
          </tr>
          
          <!-- Intro -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Thanks for downloading our Screen Printing Prep Guide! Here's a quick reference of the key points to ensure your order comes out perfect.
              </p>
            </td>
          </tr>
          
          <!-- Section 1: Artwork -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #fff7ed; border-radius: 8px; padding: 20px;">
                <h2 style="margin: 0 0 12px; color: #c2410c; font-size: 18px;">1. Prepare Your Artwork</h2>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                  <li>Vector files (AI, EPS, PDF) are ideal - they scale without losing quality</li>
                  <li>Raster images should be 300 DPI minimum at final print size</li>
                  <li>Outline all fonts to prevent substitution</li>
                  <li>Remove unnecessary elements or hidden layers</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Section 2: Colors -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px;">
                <h2 style="margin: 0 0 12px; color: #15803d; font-size: 18px;">2. Optimize Your Colors</h2>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                  <li>Each color = separate screen = separate setup fee</li>
                  <li>1-2 colors: Most economical</li>
                  <li>5+ colors: Consider digital screen printing</li>
                  <li><strong>Pro tip:</strong> Use the garment color as part of your design!</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Section 3: Size -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px;">
                <h2 style="margin: 0 0 12px; color: #1d4ed8; font-size: 18px;">3. Print Sizes & Placement</h2>
                <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px; color: #374151;">
                  <tr>
                    <td style="border-bottom: 1px solid #e2e8f0;"><strong>Left Chest</strong></td>
                    <td style="border-bottom: 1px solid #e2e8f0;">3.5" - 4" wide</td>
                  </tr>
                  <tr>
                    <td style="border-bottom: 1px solid #e2e8f0;"><strong>Full Front</strong></td>
                    <td style="border-bottom: 1px solid #e2e8f0;">Up to 12" x 14"</td>
                  </tr>
                  <tr>
                    <td style="border-bottom: 1px solid #e2e8f0;"><strong>Full Back</strong></td>
                    <td style="border-bottom: 1px solid #e2e8f0;">Up to 14" x 17"</td>
                  </tr>
                  <tr>
                    <td><strong>Jumbo Print</strong></td>
                    <td>Up to 17" x 23"</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Section 4: Garments -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #fdf4ff; border-radius: 8px; padding: 20px;">
                <h2 style="margin: 0 0 12px; color: #a21caf; font-size: 18px;">4. Garment Selection</h2>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                  <li><strong>100% cotton:</strong> Best ink absorption and vibrancy</li>
                  <li><strong>50/50 blends:</strong> Good balance of comfort and print quality</li>
                  <li><strong>Dark garments:</strong> Require white underbase (+1 color)</li>
                  <li><strong>Avoid:</strong> 100% polyester for standard screen printing</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Pricing Example -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background-color: #1e293b; border-radius: 8px; padding: 20px;">
                <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 18px;">Example Pricing</h2>
                <p style="margin: 0 0 12px; color: #94a3b8; font-size: 14px;">100 black t-shirts, 2-color front print:</p>
                <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px; color: #e2e8f0;">
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
                <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">*Dark shirts = 2 design colors + white underbase</p>
              </div>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">Ready to start your order?</p>
              <a href="https://garmentdecor.com/pricing?service=screen-printing" style="display: inline-block; padding: 14px 32px; background-color: #ea580c; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px;">Get Instant Estimate</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; color: #374151; font-size: 14px; font-weight: 600;">Garment Decor</p>
              <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">4778 W Mission Blvd, Montclair, CA 91762</p>
              <p style="margin: 0; color: #64748b; font-size: 12px;">(855) 942-7636 | sales@garmentdecor.com</p>
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

export function generateScreenPrintingGuideText(): string {
  return `
YOUR SCREEN PRINTING PREP GUIDE
================================
From Garment Decor

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
https://garmentdecor.com/pricing?service=screen-printing

Garment Decor
4778 W Mission Blvd, Montclair, CA 91762
(855) 942-7636 | sales@garmentdecor.com
  `.trim();
}
