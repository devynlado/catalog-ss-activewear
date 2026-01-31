# Product Page & Decoration Flow Redesign Plan

## Executive Summary

This plan addresses the product page CTA section and decoration flow, focusing on:
1. Converting GMC (Google Merchant Center) traffic more effectively
2. Clarifying the "Buy Blank" vs "Get Decorated" funnel
3. Reducing friction in the decoration quote process
4. Applying professional copywriting and design principles

---

## Phase 1: Product Page CTA Redesign

### Current Problems
- "Buy Blank" and "Get Decorated" have equal visual weight (confusing)
- CTAs appear flat and unconvincing
- Icons feel dated/generic
- No urgency or trust signals
- "Build Quote" is a black box - users don't know what happens next

### Design Direction

#### Option A: Blanks-Primary Layout (Recommended for GMC Traffic)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [══════════════ Add to Cart ══════════════]                   │
│                                                                 │
│  ✓ In Stock • Ships within 24-48 hours • Free shipping $500+   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

    ✨ Want this decorated? See decoration options →
```

**Rationale:** GMC traffic is searching for blank apparel. Make that path frictionless. Decoration is an upsell for interested buyers.

#### Option B: Side-by-Side with Clear Differentiation

```
┌──────────────────────────────┐  ┌──────────────────────────────┐
│         BUY BLANK            │  │       ADD YOUR LOGO          │
│                              │  │                              │
│    [Simple t-shirt icon]     │  │  [T-shirt with logo mockup]  │
│                              │  │                              │
│  Ready to ship as-is         │  │  Professional decoration     │
│  Ships in 24-48 hours        │  │  From $2.00/piece            │
│                              │  │  Ready in 5-7 business days  │
│                              │  │                              │
│  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │
│  │     Add to Cart        │  │  │  │   See Options →        │  │
│  └────────────────────────┘  │  │  └────────────────────────┘  │
└──────────────────────────────┘  └──────────────────────────────┘
```

### Copywriting Changes

| Current | New | Rationale |
|---------|-----|-----------|
| "Buy Blank" | "Add to Cart" | Direct, expected e-commerce language |
| "Ships within 24-48 hours" | "✓ In Stock • Ships tomorrow" | More specific, urgency |
| "Get Decorated" | "Add Your Logo" | Clearer intent, action-oriented |
| "Screen print, embroidery & more" | "From $2/piece • Ready in 5-7 days" | Specific > vague |
| "Build Quote" | "See Options" or "Get Pricing" | Lower commitment language |

### Visual Design Specifications

**Add to Cart Button (Primary)**
- Full-width, prominent
- Background: `bg-gradient-to-r from-brand-500 to-brand-600`
- Text: White, bold, 16px+
- Shadow: `shadow-lg shadow-brand-500/25`
- Hover: Scale 1.02, deeper shadow

**Decoration CTA (Secondary)**
- Text link style OR subtle card
- Color: `text-brand-600` with underline on hover
- Icon: Sparkle or custom decoration icon
- Should feel like an "also available" option, not equal priority

### Trust Signals to Add
- "✓ In Stock" badge (green checkmark)
- "Ships tomorrow" (if before cutoff)
- "Free shipping over $500"
- "Trusted by 2,000+ businesses" (if applicable)

---

## Phase 2: Decoration Flow Architecture

### Flow Overview

```
Product Page
    │
    └── "Add Your Logo" / "See Decoration Options"
            │
            ▼
┌─────────────────────────────────────────┐
│     STEP 1: Choose Decoration Method    │
│                                         │
│  [Embroidery] [Screen Print] [Jumbo]    │
│  [Finishing Services]                   │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│     STEP 2: Configure Your Order        │
│     (varies by method)                  │
│                                         │
│  • Colors (screen print)                │
│  • Locations                            │
│  • Size/stitch count (embroidery)       │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│     STEP 3: Review Quote                │
│                                         │
│  Itemized breakdown with totals         │
│  Upload artwork option                  │
│  Request final quote OR checkout        │
└─────────────────────────────────────────┘
```

### Step 1: Method Selection

**Design: Visual Cards**

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   EMBROIDERY    │ │  SCREEN PRINT   │ │   JUMBO PRINT   │ │   FINISHING     │
│                 │ │                 │ │                 │ │                 │
│   [Icon/Image]  │ │   [Icon/Image]  │ │   [Icon/Image]  │ │   [Icon/Image]  │
│                 │ │                 │ │                 │ │                 │
│ Premium stitched│ │ Classic ink on  │ │ Oversized       │ │ Tags, labels,   │
│ logos & text    │ │ fabric printing │ │ statement prints│ │ folding & more  │
│                 │ │                 │ │                 │ │                 │
│ From $3.00/pc   │ │ From $2.00/pc   │ │ From $4.00/pc   │ │ From $0.50/pc   │
│ 5-7 days        │ │ 5-7 days        │ │ 7-10 days       │ │ 3-5 days        │
│                 │ │                 │ │                 │ │                 │
│ [Select →]      │ │ [Select →]      │ │ [Select →]      │ │ [Select →]      │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Copywriting for Each Method:**

| Method | Headline | Description | Price Anchor |
|--------|----------|-------------|--------------|
| Embroidery | "Embroidery" | "Premium stitched logos that last" | "From $3.00/piece" |
| Screen Print | "Screen Print" | "Classic ink prints for any quantity" | "From $2.00/piece" |
| Jumbo Print | "Jumbo Print" | "Oversized prints that make a statement" | "From $4.00/piece" |
| Finishing | "Finishing Services" | "Tags, labels, folding & packaging" | "From $0.50/piece" |

### Step 2: Configuration (Screen Print Example)

**Progressive Disclosure Design:**

Each question is a separate card/section. User answers one at a time.

```
┌─────────────────────────────────────────────────────────────────┐
│  How many ink colors in your design?                            │
│                                                                 │
│  [1]  [2]  [3]  [4]  [5]  [6+]                                 │
│   ↑                                                             │
│  Most popular                                                   │
│                                                                 │
│  💡 Each color requires a separate screen ($25 setup each)      │
│                                                                 │
│  Current estimate: $2.15/piece + $25 setup                      │
└─────────────────────────────────────────────────────────────────┘

                              ↓ (after selection)

┌─────────────────────────────────────────────────────────────────┐
│  Where do you want your print?                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │              [Interactive T-shirt diagram]              │   │
│  │                                                         │   │
│  │    ☐ Left Chest     ☐ Full Front     ☐ Full Back       │   │
│  │    ☐ Right Chest    ☐ Left Sleeve    ☐ Right Sleeve    │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ☑ Front Center (+$0.00)                                       │
│                                                                 │
│  Current estimate: $2.15/piece + $25 setup                      │
└─────────────────────────────────────────────────────────────────┘
```

**Simplified Tier Option (Alternative):**

For faster checkout, offer pre-packaged tiers:

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  SIMPLE PRINT   │ │ STANDARD PRINT  │ │  CUSTOM PRINT   │
│                 │ │                 │ │                 │
│  1 color        │ │  Up to 3 colors │ │  4+ colors      │
│  1 location     │ │  1-2 locations  │ │  Any locations  │
│                 │ │                 │ │                 │
│  $2.00/piece    │ │  $3.50/piece    │ │  Get Quote      │
│  + $25 setup    │ │  + $50 setup    │ │                 │
│                 │ │                 │ │                 │
│  [Select]       │ │  [Select]       │ │  [Contact Us]   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         ↑                   ↑
    Best for           Best for
   simple logos      multi-color
```

### Step 3: Quote Summary

**Design:**

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR DECORATION QUOTE                                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GARMENTS                                                       │
│  ────────────────────────────────────────────────────────────  │
│  200× Tultex 202 - Unisex Fine Jersey T-Shirt                  │
│    • 80× Black (S-XL)                          $224.00         │
│    • 60× Navy (S-XL)                           $168.00         │
│    • 60× White (S-XL)                          $168.00         │
│                                        Subtotal: $560.00        │
│                                                                 │
│  DECORATION                                                     │
│  ────────────────────────────────────────────────────────────  │
│  Screen Print - 2 colors, front center                         │
│    • Print fee (200 × $2.15)                   $430.00         │
│    • Screen setup (2 screens × $25)             $50.00         │
│                                        Subtotal: $480.00        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  UPLOAD YOUR ARTWORK (Optional)                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Drag & drop or click to upload]                       │   │
│  │  PNG, AI, EPS, PDF • Max 10MB                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Or describe your design:                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                              ESTIMATED TOTAL: $1,040.00         │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │  Save for Later      │  │  Request Final Quote →       │    │
│  └──────────────────────┘  └──────────────────────────────┘    │
│                                                                 │
│  💡 We'll review your artwork and confirm final pricing         │
│     within 2 business hours.                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 3: Copywriting Guide

### Voice & Tone

**Brand Voice:** Professional, knowledgeable, approachable
**Tone:** Confident but not pushy, helpful, efficient

### Headlines

| Location | Copy |
|----------|------|
| Decoration method selection | "How would you like this decorated?" |
| Screen print config | "Configure your screen print" |
| Quote summary | "Your decoration quote" |
| Success/confirmation | "Quote request received!" |

### CTAs

| Action | Primary CTA | Secondary CTA |
|--------|-------------|---------------|
| Add blank to cart | "Add to Cart" | - |
| Start decoration | "See Decoration Options" | "Add Your Logo" |
| Select method | "Select" | "Learn more" |
| Submit quote | "Request Final Quote" | "Save for Later" |
| Simple order checkout | "Add Decorated Items to Cart" | - |

### Microcopy & Helper Text

| Context | Copy |
|---------|------|
| Color count selection | "Each color requires a separate screen ($25 setup each)" |
| Location selection | "Additional locations +$X.XX/piece" |
| Artwork upload | "PNG, AI, EPS, PDF • Max 10MB" |
| Quote turnaround | "We'll confirm final pricing within 2 business hours" |
| Price estimates | "Prices shown are estimates. Final pricing confirmed after artwork review." |

### Trust Signals

Place these strategically throughout:

- "Free artwork review on all orders"
- "Satisfaction guaranteed"
- "Trusted by 2,000+ businesses" (if true)
- "Questions? Call (808) 845-7836"
- "Professional decoration since [year]"

### Error States & Validation

| State | Copy |
|-------|------|
| No quantities entered | "Enter quantities for at least one size to continue" |
| Artwork required | "Upload your artwork or describe your design" |
| Minimum not met | "Minimum order: 24 pieces for decoration" |

---

## Phase 4: UI/UX Specifications

### Design System Application

All new components should follow the Soft Craft design system:

**Cards:**
- `rounded-2xl`
- `border border-stone-200/80`
- `bg-white/70 backdrop-blur-sm`
- `shadow-lg shadow-stone-200/50`

**Buttons (Primary):**
- `bg-gradient-to-r from-brand-500 to-brand-600`
- `text-white font-semibold`
- `rounded-xl`
- `shadow-lg shadow-brand-500/25`
- Hover: `scale-[1.02]`

**Buttons (Secondary):**
- `bg-white border border-stone-200`
- `text-slate-700`
- `rounded-xl`
- Hover: `border-stone-300 bg-stone-50`

**Selection Cards (Method/Tier):**
- Default: `border-stone-200 bg-white`
- Hover: `border-stone-300 shadow-md`
- Selected: `border-brand-500 ring-2 ring-brand-200 bg-brand-50/50`

### Animation & Transitions

**Page/Step Transitions:**
- Use Framer Motion
- Fade in + slight slide up
- Stagger children for lists
- Duration: 200-300ms

**Selection Feedback:**
- Scale pulse on selection
- Checkmark animation
- Price update with number animation

### Responsive Behavior

**Desktop (lg+):**
- Method cards: 4-column grid
- Configuration: 2-column layout (options left, preview right)
- Quote summary: Full width with clear sections

**Mobile:**
- Method cards: 2-column grid or horizontal scroll
- Configuration: Single column, sticky "running total" at bottom
- Quote summary: Collapsible sections

---

## Phase 5: Implementation Roadmap

### Sprint 1: Product Page CTA Redesign
- [ ] Redesign CTA section with blanks-primary layout
- [ ] Update copy per guidelines
- [ ] Add trust signals
- [ ] Implement new button styles
- [ ] A/B test against current version (if possible)

### Sprint 2: Decoration Method Selection
- [ ] Create decoration method selection page/modal
- [ ] Design method cards with icons/images
- [ ] Implement selection state
- [ ] Add "starting from" pricing
- [ ] Link from product page CTA

### Sprint 3: Screen Print Configuration
- [ ] Build color count selector with price impact
- [ ] Build location selector with visual diagram
- [ ] Implement running total calculator
- [ ] Create simplified tier option (Simple/Standard/Custom)
- [ ] Add helpful microcopy

### Sprint 4: Other Methods + Quote Summary
- [ ] Build embroidery configuration (stitch count, location)
- [ ] Build finishing services selection
- [ ] Create quote summary page
- [ ] Implement artwork upload
- [ ] Build quote request submission flow

### Sprint 5: Polish & Integration
- [ ] Animation and transitions
- [ ] Mobile optimization
- [ ] Error states and validation
- [ ] Email notifications for quotes
- [ ] Admin view for incoming quotes

---

## Success Metrics

### Conversion Metrics
- Blank add-to-cart rate (target: +15%)
- Decoration flow start rate (target: +25%)
- Quote request completion rate (target: 60%)
- Quote-to-order conversion (target: 40%)

### UX Metrics
- Time to complete quote request (target: <3 minutes)
- Drop-off rate per step (target: <20% per step)
- Mobile completion rate (target: within 10% of desktop)

### Business Metrics
- Average order value for decorated orders
- Quote turnaround time
- Customer satisfaction (post-order survey)

---

## Open Questions

1. **DTF/Heat Transfer:** Should we add this as a "fast lane" option with instant checkout?
2. **Minimum Orders:** What are the minimums for each decoration method?
3. **Artwork Requirements:** Do we need specific artwork specs by method?
4. **Quote Validity:** How long should quotes be valid?
5. **Deposit Requirements:** Do decorated orders require deposits?

---

## Appendix: Pricing Reference

*To be filled in with actual pricing tables*

### Screen Print Pricing
| Quantity | 1 Color | 2 Colors | 3 Colors | 4+ Colors |
|----------|---------|----------|----------|-----------|
| 24-47    | $X.XX   | $X.XX    | $X.XX    | Quote     |
| 48-143   | $X.XX   | $X.XX    | $X.XX    | Quote     |
| 144-287  | $X.XX   | $X.XX    | $X.XX    | Quote     |
| 288+     | $X.XX   | $X.XX    | $X.XX    | Quote     |

### Embroidery Pricing
| Stitch Count | Per Piece |
|--------------|-----------|
| Up to 5K     | $X.XX     |
| 5K-10K       | $X.XX     |
| 10K-15K      | $X.XX     |
| 15K+         | Quote     |

---

*Document created: January 29, 2026*
*Last updated: January 29, 2026*
