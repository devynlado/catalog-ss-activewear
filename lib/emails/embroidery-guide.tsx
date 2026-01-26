// Email template for Embroidery Guide download

export function generateEmbroideryGuideHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Embroidery Prep Guide - Garment Decor</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #9333ea 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Your Embroidery Prep Guide</h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Professional results, every stitch</p>
            </td>
          </tr>
          
          <!-- Intro -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Thanks for downloading our Embroidery Prep Guide! Here's everything you need to know for a flawless embroidery order.
              </p>
            </td>
          </tr>
          
          <!-- Section 1: Artwork -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #eef2ff; border-radius: 8px; padding: 20px;">
                <h2 style="margin: 0 0 12px; color: #4338ca; font-size: 18px;">1. Prepare Your Artwork</h2>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                  <li>Vector files (AI, EPS, PDF) are best</li>
                  <li>High-res raster images (300+ DPI) also work</li>
                  <li>Simplify small details - thread can't reproduce tiny elements</li>
                  <li>Provide Pantone (PMS) colors for accurate thread matching</li>
                  <li><strong>Avoid:</strong> Gradients, shadows, and photorealistic images</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Section 2: Size -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #fdf4ff; border-radius: 8px; padding: 20px;">
                <h2 style="margin: 0 0 12px; color: #a21caf; font-size: 18px;">2. Size Your Design</h2>
                <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px; color: #374151;">
                  <tr>
                    <td style="border-bottom: 1px solid #e2e8f0;"><strong>Left Chest</strong></td>
                    <td style="border-bottom: 1px solid #e2e8f0;">3.5" - 4" wide (standard)</td>
                  </tr>
                  <tr>
                    <td style="border-bottom: 1px solid #e2e8f0;"><strong>Cap Front</strong></td>
                    <td style="border-bottom: 1px solid #e2e8f0;">2.5" tall max</td>
                  </tr>
                  <tr>
                    <td style="border-bottom: 1px solid #e2e8f0;"><strong>Full Back</strong></td>
                    <td style="border-bottom: 1px solid #e2e8f0;">Up to 12" x 12"</td>
                  </tr>
                  <tr>
                    <td><strong>Sleeve</strong></td>
                    <td>3" - 4" wide</td>
                  </tr>
                </table>
                <p style="margin: 16px 0 0; color: #7c3aed; font-size: 12px; font-style: italic;">⚠️ Text smaller than 1/4" tall may not be legible</p>
              </div>
            </td>
          </tr>
          
          <!-- Section 3: Thread Colors -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px;">
                <h2 style="margin: 0 0 12px; color: #15803d; font-size: 18px;">3. Thread Colors</h2>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                  <li>We use Madeira Polyneon thread (400+ colors)</li>
                  <li>Provide PMS codes for exact matching</li>
                  <li>Fewer colors = faster production = lower cost</li>
                  <li>Metallic threads available for premium look</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Section 4: Garments -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #fff7ed; border-radius: 8px; padding: 20px;">
                <h2 style="margin: 0 0 12px; color: #c2410c; font-size: 18px;">4. Best Garments for Embroidery</h2>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
                  <span style="background: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #fed7aa;">Polos</span>
                  <span style="background: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #fed7aa;">Caps</span>
                  <span style="background: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #fed7aa;">Jackets</span>
                  <span style="background: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #fed7aa;">Quarter-zips</span>
                  <span style="background: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #fed7aa;">Fleece</span>
                </div>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong>Avoid:</strong> Ultra-lightweight or very stretchy materials
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Stitch Count Pricing -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background-color: #1e293b; border-radius: 8px; padding: 20px;">
                <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 18px;">Stitch Count = Pricing</h2>
                <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px; color: #e2e8f0;">
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
                <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">One-time digitization fee: $40-60 (you keep the file forever!)</p>
              </div>
            </td>
          </tr>
          
          <!-- Pro Tips -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <h2 style="margin: 0 0 16px; color: #374151; font-size: 18px;">💡 Pro Tips for Savings</h2>
              <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
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
              <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">Ready to start your order?</p>
              <a href="https://garmentdecor.com/pricing?service=embroidery" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px;">Get Instant Estimate</a>
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

export function generateEmbroideryGuideText(): string {
  return `
YOUR EMBROIDERY PREP GUIDE
===========================
From Garment Decor

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
https://garmentdecor.com/pricing?service=embroidery

Garment Decor
4778 W Mission Blvd, Montclair, CA 91762
(855) 942-7636 | sales@garmentdecor.com
  `.trim();
}
