---
name: Decoration Packages Feature
overview: Implement simple decoration packages that users can add to cart directly, replacing the complex quote flow with a streamlined e-commerce experience. This plan also documents fixes needed for the product page pricing logic.
todos:
  - id: fix-discontinued-pricing
    content: Filter out discontinued colors (containing '(disc)') from 'From' price calculation in ProductDetailClient.tsx
    status: pending
  - id: define-package-pricing
    content: Define decoration package pricing tiers with business (Simple Logo, Front+Back, Custom)
    status: pending
  - id: create-decoration-types
    content: Create lib/decoration-types.ts with package definitions and pricing tiers
    status: pending
  - id: update-cart-store
    content: Update cart store to support decoration line items linked to products
    status: pending
  - id: update-decoration-pitch
    content: Replace quote buttons with package selector cards in DecorationPitch component
    status: pending
  - id: update-cart-display
    content: Display decoration items in cart drawer and cart page
    status: pending
isProject: false
---

# Decoration Packages Feature

## Context: How We Got Here

### The Problem We Identified
On the cart page, the "Perfect quantity for screen printing" pitch currently links to:
- `/services/screen-printing` - info page
- `/contact` - generic quote form

Users have to leave the cart, fill out a form, and wait for a quote. This creates friction and drops conversions.

### Options We Considered

1. **Pre-fill quote from cart** - Pass cart items to contact form, auto-generate message with sizes/quantities. Quick to implement but still requires form submission and wait.

2. **Build a calculator** - Complex pricing tool. Would take 1-2+ days minimum.

3. **Decoration packages (CHOSEN)** - Simple packages users can add to cart like any product. Best UX, aligns with e-commerce expectations.

### Why Packages Won

- 80% of decoration orders are simple: logo on front, 1-2 colors, screen print
- Users are trained to "Add to Cart" not fill forms
- Reduces decision fatigue
- Amazon-like instant gratification
- Keep "Custom Quote" as escape hatch for complex jobs

---

## Part 1: Decoration Packages Implementation

### Package Definitions

| Package | Description | Estimated Price |
|---------|-------------|-----------------|
| Simple Logo | 1 location (left chest OR full front), 1-2 colors | ~$2.50/piece |
| Front + Back | 2 locations, 1-2 colors each | ~$4.50/piece |
| Custom | Opens quote form for complex needs | Quote-based |

*Note: Prices are per-piece, tiered by quantity. Actual pricing TBD by business.*

### Implementation Approach

**Option A: Service Items in Cart**
Add decoration as a line item in the cart, linked to the blank items. Similar to how Amazon handles "gift wrap" or "installation."

**Option B: Cart-Level Modifier**
Add a decoration section to the cart/checkout that applies to all items. Simpler but less flexible.

**Recommendation: Option A** - Allows different decoration per product (e.g., logo on polos, different design on tees).

### Files to Create/Modify

1. **Create decoration types** (`lib/decoration-types.ts`)
   - Package definitions with pricing tiers
   - Decoration item type for cart

2. **Update cart store** (`lib/cart-store.ts`)
   - Add decoration items linked to product items
   - Handle decoration pricing in subtotal

3. **Update DecorationPitch component** ([components/cart/DecorationPitch.tsx](components/cart/DecorationPitch.tsx))
   - Replace "Get Custom Quote" with package selector
   - Add package cards with "Add to Order" buttons

4. **Update cart display** ([components/cart/CartDrawer.tsx](components/cart/CartDrawer.tsx), [app/cart/page.tsx](app/cart/page.tsx))
   - Show decoration line items under products
   - Allow removal/modification

---

## Part 2: Product Page Pricing Fix (Bug Found)

### The Bug
"From $X" price includes discontinued items marked with "(disc)" in color name. Users see $2.80 but that color is discontinued/limited.

### The Fix
In [app/product/[slug]/ProductDetailClient.tsx](app/product/[slug]/ProductDetailClient.tsx) line ~123, filter out discontinued colors:

```tsx
const allBasePrices = product.colors?.flatMap(color => {
  // Skip discontinued colors
  if (color.colorName.toLowerCase().includes('(disc)')) return [];
  
  return color.sizes
    .filter(size => {
      const sizeName = size.name.toUpperCase();
      return !sizeName.includes('2X') && !sizeName.includes('3X') && 
             !sizeName.includes('4X') && !sizeName.includes('5X');
    })
    .map(size => size.salePrice || size.price);
}) || [];
```

---

## Part 3: Related UX Decision (Deferred)

### Auto-select first color?
We discussed whether to auto-select the first color on product pages to match price with displayed image. Decision: **Deferred** - current "From $X" pattern is industry standard. Focus on decoration packages first.

---

## Changes Already Completed This Session

1. **Product page enhancements** ([ProductDetailClient.tsx](app/product/[slug]/ProductDetailClient.tsx))
   - Enhanced trust badges with pill-style design
   - Added "Popular for" tags based on category
   - Added subtle decoration hint linking to /services

2. **Created /services hub page** ([app/services/page.tsx](app/services/page.tsx))
   - Services grid, comparison table, decision helper
   - Links to all individual service pages

3. **Cart alignment fixes** ([CartDrawer.tsx](components/cart/CartDrawer.tsx), [cart/page.tsx](app/cart/page.tsx))
   - Moved plus size upcharge below inputs
   - Added invisible placeholders for consistent spacing

---

## Next Steps (Priority Order)

1. Fix discontinued items pricing bug (15 min)
2. Design package pricing structure with business (decision needed)
3. Implement decoration packages in cart (2-3 hours)
4. Test end-to-end flow
