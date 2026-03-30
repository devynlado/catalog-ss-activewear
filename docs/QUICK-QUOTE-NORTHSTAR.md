# Quick Quote — North Star Document

> **Purpose**: This is the single source of truth for the Quick Quote tool. Every design decision, UX choice, and implementation detail lives here. When in doubt, refer back to this document.

---

## 1. The Problem

Sales reps receive ~50 "What is pricing?" inquiries per day from Google Ads leads. These customers rarely have full project details — they might have a style number but no logo, or a logo but no garment picked, or just a vague "how much for custom shirts?" The current quoting workflow requires reps to manually piece together garment costs, decoration pricing, and add-ons — a process that takes 10-15 minutes per inquiry. At 50 inquiries/day, that's **8+ hours of sales rep time** spent on rough estimates, most of which never convert.

## 2. The Solution

A lightweight internal tool on the admin dashboard where a sales rep types a garment style number (e.g., `1801GD`) and instantly gets a **beautiful, branded pricing presentation** covering garment cost + screen printing + embroidery across quantity tiers, with add-on pricing shown as a visual menu. The rep screenshots or PDFs the presentation and texts/emails it to the customer in under 60 seconds.

## 3. What This Tool Is NOT

- **Not a formal quote system.** Formal quotes are built in DecoNetwork after the customer confirms. This tool is the fast first-touch response.
- **Not a database.** Nothing is saved. No quote numbers, no history, no status tracking. It's a calculator with a pretty face.
- **Not customer-facing** (yet). V1 is an internal sales rep tool. If it proves valuable, V2 could be a public-facing version.

---

## 4. User Persona

**Primary user**: Sales rep (role: `admin` or `sales_rep`)

**Context**: Rep is on the phone, responding to a text, or replying to a Google Ads lead form. They need to respond in under 2 minutes before the lead goes cold.

**Workflow**:
1. Customer asks "What would it cost for 100 custom tees?"
2. Rep opens Quick Quote, types `5000` (Gildan 5000 style number)
3. Presentation generates instantly
4. Rep screenshots the presentation and texts it back
5. Customer sees pricing, picks a tier, asks about puff embroidery
6. Rep adjusts the quote (toggles puff on) and sends an updated screenshot
7. Customer says "let's do it" → rep builds the real quote in DecoNetwork

**Key insight**: Speed matters more than precision. A fast ballpark that lands in 30 seconds beats a perfect quote that takes 15 minutes.

---

## 5. Page Structure

**Route**: `/admin/quick-quote`

The page has two distinct zones:

### Zone 1 — The Control Panel (top of page)

This is the rep's workspace. It is NOT part of the screenshot. It contains:

#### Product Search Bar
- Large, prominent input field with placeholder: *"Enter style # (e.g., 5000, 1801GD, PC54)"*
- Type-ahead search hitting the existing `/api/products?search=` endpoint
- Search matches against `style_name` (highest priority), `brand_name`, and `title`
- Results appear in a dropdown showing: product image thumbnail, brand, style number, product name, base price
- Clicking a result adds the product as a **garment card** in the presentation below
- Support adding up to 4 products (separate cards per garment)

#### Global Controls (row of toggles/buttons next to search)
- **"Customer supplies blanks"** toggle — OFF by default (65% of the time we supply garments). When ON, garment cost shows as a reference line ("Retail: $X.XX — not included") instead of being added to the all-in price
- **"Download PDF"** button
- **"Reset"** button to clear all products and start fresh

#### Per-Product Controls (shown on each garment card header, in the control panel zone)
- **Quantity input** — defaults to showing the standard tier table; optionally accepts a specific number (e.g., `72`) which highlights that row in the tier table
- **Remove** button (X) to remove a product from the presentation

#### Decoration Overrides (collapsible panel, labeled "Customize Defaults")
Collapsed by default. Only expanded when the customer has provided specific details. Contains:
- **Screen print colors**: 1-8 selector (default: 2)
- **Screen print locations**: multi-select for Front, Back, Left Sleeve, Right Sleeve (default: Front)
- **Embroidery stitch count**: Under 5K / 5K-7.5K / 7.5K-10K / Over 10K (default: Under 5K / 5,000 stitches)
- **Embroidery locations**: 1-4 (default: 1)
- **Garment type**: Standard / Fleece toggle (affects surcharges)
- **Dark garment**: toggle (adds +1 color to screen print for underbase)

When overrides are changed, a small label appears on the collapsed header: *"Custom: 3-color, front + back, fleece"* so the rep remembers at a glance.

---

### Zone 2 — The Presentation (below, the screenshot/PDF target)

This is the part customers see. It should be **visually self-contained, branded, and beautiful**. It renders with a subtle border/shadow so it looks polished when cropped in a screenshot.

#### Presentation Header
- Garment Decor logo (small, top-left)
- Title: **"Pricing Estimate"** (top-center, navy-800)
- Subtitle: *"Prepared for you by Garment Decor • (855) 942-7636"*
- Date generated (right-aligned, subtle)

#### Per-Product Card (one per garment added)

Each product gets its own card. Cards stack vertically.

**Card Header**:
- Product image (front image of first available color, ~120px)
- Brand name (small, muted text above product name)
- Product name + style number (e.g., **"Gildan Heavy Cotton Tee"** `5000`)
- Color count badge: *"48 colors available"*
- Base garment price: *"Starting at $X.XX/pc"* (or *"Customer supplied"* if toggled)

**Assumptions Banner** (subtle, informative — not a warning):
- Appears directly below the card header
- Light stone-50 background, small text
- Shows the current defaults: *"Showing: 2-color screen print (front) • 5,000 stitch embroidery (left chest)"*
- This turns a limitation into a conversation tool — the customer reads it and says "actually, we need front and back" and the rep adjusts

**Pricing Tier Table** (the hero element):

A clean, well-designed table with the following structure:

| Quantity | Garment | Screen Print | Embroidery | All-In (Screen) | All-In (Embroidery) | You Save |
|----------|---------|-------------|------------|-----------------|--------------------|---------:|
| 50       | $4.80   | $8.90       | $4.95      | $13.70/pc       | $9.75/pc           | —        |
| 100      | $4.80   | $5.90       | $4.25      | $10.70/pc       | $9.05/pc           | $3.00/pc |
| 250      | $4.80   | $3.90       | $3.75      | $8.70/pc        | $8.55/pc           | $5.00/pc |
| 500      | $4.80   | $2.90       | $3.25      | $7.70/pc        | $8.05/pc           | $6.00/pc |
| 1,000    | $4.80   | $2.20       | $3.00      | $7.00/pc        | $7.80/pc           | $6.70/pc |

Design details for the table:
- **Row highlighting**: If the rep entered a specific quantity (e.g., 72), that row or the nearest tier is highlighted with a brand-50 background and a left border in brand-500
- **"You Save" column**: Shows per-piece savings compared to the 50-piece tier. Use green text for positive savings. This creates urgency to order more.
- **"Best Value" badge**: The tier with the best per-piece savings gets a small green badge
- **Setup fees row**: Below the table, a single line: *"Screen print setup: $30/color × 2 colors × 1 location = $60 one-time"* and *"Embroidery setup: Included"*
- When "Customer supplies blanks" is ON: The Garment column shows the price crossed out with *"Supplied by customer"* text, and the All-In columns exclude it

**Total Estimate Row** (below table, per highlighted/selected quantity):
If a specific quantity was entered (e.g., 150), show:
- *"Estimated total for 150 pieces: **$1,605** (screen print) or **$1,358** (embroidery)"*

**The Add-Ons Menu**:

This section is always visible. It's designed to educate and upsell. Think restaurant menu — everything is listed with prices, descriptions, and a subtle "most popular" tag where applicable.

Layout: two-column grid of add-on cards, each with:

```
┌──────────────────────────────────────────┐
│  3D Puff Embroidery              +$3.00  │
│  Raised, textured letters with a         │
│  premium look. Most popular on caps.     │
│                                          │
│  ★ Most Popular                          │
└──────────────────────────────────────────┘
```

Add-ons to display:

| Add-On | Price | Description |
|--------|-------|-------------|
| 3D Puff Embroidery | +$3.00/pc | Raised, textured letters for a premium look. Popular on caps and beanies. |
| Side Embroidery | +$5.00/pc | Additional logo on left or right side of caps. |
| Back Embroidery | +$5.00/pc | Logo placement on the back panel. Great for website URLs. |
| Fold & Bag (Shirts) | +$0.85–1.00/pc | Individual poly-bagged for retail-ready presentation. |
| Fold & Bag (Fleece) | +$1.35–1.50/pc | Individual poly-bagged for heavier garments. |
| Woven Neck Labels | +$1.80–3.00/pc | Replace manufacturer tags with your own brand. |
| Hang Tags | +$0.35–0.50/pc | Custom branded hang tags for retail display. |
| Barcode/UPC Labels | +$0.19–0.25/pc | Retail-ready with scannable product codes. |
| Fleece Surcharge | +$1.00/pc | Additional cost for printing on fleece garments. |
| Metallic Ink | +$0.50/pc | Eye-catching metallic finish for screen prints. |
| PMS Color Match | +$30 one-time | Exact Pantone color matching for brand consistency. |

**"Most Popular" badges** should appear on: 3D Puff, Fold & Bag (Shirts), and Woven Neck Labels — these are the ones customers don't know they want but always end up adding.

**Presentation Footer**:
- *"This is a general estimate. Final pricing may vary based on artwork complexity, garment selection, and project specifications."*
- *"Ready to move forward? Reply to this message or call us at (855) 942-7636"*
- Garment Decor website: garmentdecor.com

---

## 6. Pricing Logic

### Garment Cost
- Fetched from the product API via `product.price` (retail price from Supabase cache or SS Activewear API)
- Uses the base/minimum price across all sizes for display
- When "Customer supplies blanks" is ON, garment cost is shown but excluded from all-in calculation

### Screen Print Pricing
- Source: `SCREEN_PRINT_PRICING` from `lib/decoration-pricing.ts`
- Calculation: `pricePerLocation × numberOfLocations` per piece
- Setup fee: `$30 × numberOfColors × numberOfLocations`
- Default: 2 colors, 1 location (front)
- Dark garment: adds +1 to color count (underbase white)
- Fleece: adds +$1.00/pc surcharge

### Embroidery Pricing
- Source: `EMBROIDERY_PRICING` from `lib/decoration-pricing.ts`
- Calculation: `pricePerLocation × numberOfLocations` per piece
- Setup fee: $0 (included)
- Default: Under 5K stitches (index 0), 1 location
- Stitch count bands: Under 5K, 5K-7.5K, 7.5K-10K, Over 10K

### Quantity Tiers Displayed
Standard tiers shown in the table: **50, 100, 250, 500, 1,000**

If the rep enters a custom quantity:
- The custom quantity row appears in the table, highlighted
- It uses the appropriate tier pricing (e.g., 72 pieces uses the 50-74 tier for screen print, 50-99 tier for embroidery)
- Other standard tiers still show for comparison

### "You Save" Calculation
- Savings = (price at 50-piece tier) - (price at current tier), per piece
- Displayed in green when positive
- Shows `—` for the 50-piece baseline row

### All-In Price
- When supplying blanks: `garmentCost + decorationCost` per piece
- When customer supplies: `decorationCost` per piece only
- Setup fees are shown separately (not baked into per-piece for transparency)

---

## 7. Screen Print Default Strategy

The default configuration shows **2 colors, Front only**. This is the most common simple job.

However, screen printing's price is highly variable by color count. To help the customer understand range without overwhelming them, the presentation should include a **collapsed "What if I need more colors?" micro-table** below the screen print column header:

| Colors | +Cost/pc (at 100 pcs) |
|--------|-----------------------|
| 1 color | $2.45 |
| 2 colors | $2.95 |
| 3 colors | $3.35 |
| 4 colors | $3.75 |
| 5+ colors | $4.25+ |

This micro-table is small, subtle, and collapsed by default on the presentation (but visible on PDF). It answers the customer's natural follow-up question before they ask it.

---

## 8. Technical Architecture

### Route & Components

```
app/admin/quick-quote/
├── page.tsx              → Server component (auth guard, page shell)
└── QuickQuoteClient.tsx  → Client component (all interactive logic)

lib/
├── decoration-pricing.ts → Existing (screen print + embroidery tiers, setup fees)
├── pricing-utils.ts      → Existing (estimate functions, finishing pricing)
└── quick-quote.ts        → New (presentation-specific calculation helpers)
```

### Data Flow

1. Rep types style number → client calls `GET /api/products?search={term}`
2. Rep selects product → client calls `GET /api/products/{styleId}` for full product data (image, price, colors)
3. All pricing calculations happen **client-side** using imported pricing constants from `lib/decoration-pricing.ts` and `lib/pricing-utils.ts`
4. No server round-trips for pricing — instant reactivity
5. PDF generation via `html2canvas` + `jsPDF` (already have `jspdf` in dependencies) or a dedicated print stylesheet with `window.print()`

### State Management

Client-side only. React `useState` or a lightweight Zustand store if state gets complex. Shape:

```typescript
interface QuickQuoteState {
  products: QuickQuoteProduct[];        // 1-4 products added
  customerSuppliesBlanks: boolean;      // Global toggle
  customizations: {
    screenPrintColors: number;          // 1-8, default 2
    screenPrintLocations: string[];     // default ['front']
    embroideryStitchIndex: number;      // 0-3, default 0
    embroideryLocations: number;        // 1-4, default 1
    isFleece: boolean;                  // default false
    isDarkGarment: boolean;             // default false
  };
}

interface QuickQuoteProduct {
  styleId: number;
  styleName: string;
  brandName: string;
  title: string;
  imageUrl: string;
  basePrice: number;
  colorCount: number;
  customQuantity?: number;              // Optional specific quantity
}
```

### Auth
- Page is under `/admin/` which already has the layout guard requiring `admin` or `sales_rep` role
- No additional auth needed

### New Dependencies
- None. Everything needed is already in the project (`jspdf`, Tailwind, Lucide icons, existing pricing libs)

---

## 9. Design System Alignment

Follow the existing admin dashboard patterns:

- **Background**: `bg-stone-50` (page), `bg-white` (cards)
- **Borders**: `border-stone-200`, `rounded-xl`
- **Headings**: `text-navy-800`, font-bold
- **Accent/CTA**: `brand-500` (#EE8935, orange)
- **Muted text**: `text-slate-600`, `text-slate-500`
- **Icons**: Lucide (already used everywhere)
- **Font**: DM Sans (already configured as `font-sans`)
- **Shadows**: `shadow-card` for cards, `shadow-card-hover` for interactive elements
- **Spacing**: `p-6` card padding, `gap-4` between grid items

### Presentation Zone Specific Styles
The presentation zone gets special treatment since it's the screenshot target:
- White background with a 1px `border-stone-200` and `shadow-lg`
- Internal padding of `p-8` for breathing room
- Max width of `max-w-4xl` centered for clean proportions
- The Garment Decor branded header uses `navy-800` text with `brand-500` accent line

---

## 10. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Style number not found | Show "Product not found" with a suggestion to try a different search term |
| Product has no retail price | Fall back to `basePrice`; if also missing, show "Price TBD" and omit from all-in calc |
| Quantity below 50 | Table starts at 50. Show a note: *"Minimum order: 50 pieces"* |
| Custom quantity of exactly 50, 100, etc. | Highlight that standard tier row instead of adding a duplicate |
| Customer supplies blanks + no garment price available | Show "Customer supplied" with no reference price |
| Fleece surcharge + dark garment | Both stack: +$1.00/pc surcharge + 1 extra color in setup fee |
| 4 products added, rep tries to add 5th | Disable search input, show: *"Maximum 4 products per quote"* |
| API timeout on product search | Show error toast: *"Couldn't load product. Try again."* |

---

## 11. PDF Output

The PDF should mirror the presentation zone exactly. Implementation approach:

1. **Primary**: Use `html2canvas` to capture the presentation `div` as an image, then place it in a `jsPDF` document
2. **Fallback**: CSS `@media print` stylesheet that hides the control panel and styles the presentation zone for A4/Letter paper

PDF specifics:
- Page size: Letter (8.5" × 11")
- Orientation: Portrait
- Header with Garment Decor branding
- Each product card may span multiple pages if the content is tall
- Footer on every page: *"Estimate only • garmentdecor.com • (855) 942-7636"*
- Filename format: `QuickQuote-{StyleNumber}-{Date}.pdf` (e.g., `QuickQuote-5000-2026-03-29.pdf`)

---

## 12. UX Principles for This Tool

### Speed Over Precision
The entire point is fast first-touch response. Every design choice should optimize for "type → screenshot → send" in under 60 seconds. If a feature slows down that loop, cut it.

### Show, Don't Ask
Instead of asking the customer what they want (colors? locations? stitch count?), show them the defaults and let them react. The assumptions banner + add-ons menu turns "I need you to tell me what you want" into "here's what it looks like — what would you change?" This is a consultative sales approach.

### Passive Upselling Through Visibility
Add-ons are always visible because customers don't know what they don't know. When a customer sees "Woven Neck Labels: +$1.80/pc" they start thinking about their brand experience. The add-on menu isn't a configuration step — it's a sales pitch disguised as a menu.

### Quantity Tiers Create Urgency
Showing all tiers with savings makes the customer think "well, if I'm already doing 100, might as well do 250 and save $2/pc." The "You Save" column does the selling for you.

### The Presentation IS the Brand
Every screenshot a rep sends is a brand touchpoint. The presentation should be clean, professional, and on-brand. No raw data tables. No ugly grids. If a customer shows the screenshot to their boss, it should look like it came from a premium service provider — because it did.

---

## 13. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time to send first quote | < 60 seconds | Rep feedback / timing tests |
| Rep adoption | 100% of reps using it within 1 week | Observation |
| Leads responded to per day | Increase from ~50 to ~80+ (because it's faster) | Sales tracking |
| Customer response rate to quick quotes | > 30% reply back | Track in CRM |
| Add-on attach rate | > 20% of confirmed orders include an add-on the customer didn't initially ask for | DecoNetwork data |

---

## 14. Implementation Phases

### Phase 1 — MVP (This Build)
- [ ] Product search by style number (1-4 products)
- [ ] Pricing tier table with screen print + embroidery columns
- [ ] "Customer supplies blanks" toggle
- [ ] Add-ons menu (always visible)
- [ ] Assumptions banner
- [ ] Custom quantity input
- [ ] Screenshot-optimized presentation layout
- [ ] PDF download
- [ ] Decoration overrides panel (collapsible)

### Phase 2 — Enhancements (Post-Launch, Based on Feedback)
- [ ] Jumbo screen print + digital print columns in the tier table
- [ ] Color swatch strip on each product card (show available colors)
- [ ] "Copy image to clipboard" button for instant paste into iMessage
- [ ] Saved presets (e.g., "Standard Tee Quote", "Cap Quote") for one-click common products
- [ ] Quick Quote usage analytics (which products are quoted most?)
- [ ] Customer-facing version at `/quote` or `/pricing/{styleNumber}`

### Phase 3 — Future Vision
- [ ] AI-powered: rep pastes customer's message, AI extracts style number + quantity + requirements and auto-populates
- [ ] DecoNetwork integration: "Convert to DecoNetwork Quote" button
- [ ] Multi-decoration per product (e.g., screen print front + embroidery left chest)
- [ ] Live inventory indicator on product cards (in-stock vs. low stock vs. out)

---

## 15. Open Decisions (Resolve During Build)

1. **Color micro-table**: Should the "What if I need more colors?" table be expanded by default or collapsed? Leaning collapsed for cleanliness, expanded in PDF for completeness.

2. **Presentation width**: `max-w-4xl` (~896px) works well for desktop screenshots. Need to verify it looks good when cropped on a phone screen (iMessage preview). May need to test and adjust.

3. **Add-on pricing ranges**: Some add-ons (like fold & bag) vary by quantity tier. Should we show the range ($0.85-1.00) or the price at a specific tier? Leaning toward ranges for simplicity since the customer hasn't committed to a quantity yet.

---

*Last updated: March 29, 2026*
*Owner: Sales Engineering Team*
