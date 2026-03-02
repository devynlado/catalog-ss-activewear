# Coupon Management System – Plan & Design

This document is the plan for adding a full coupon/discount manager to the Garment Decor admin dashboard and wiring it through checkout. It includes discount types, security, downstream/upstream impact, and UX guidance.

---

## 1. Current state (what exists today)

- **Admin:** Management section has Customers, Quotes, Verifications, Analytics. No Coupons.
- **Cart page:** “Have a promo code?” expandable with an input + “Apply” button that does nothing (no API, no state).
- **Checkout:** Uses `calculateOrderTotals()` with per-item `discountedPrice` (e.g. Google automated discounts). No order-level coupon.
- **Orders table:** Has `discount_amount` column (default 0) but it is never set. No `coupon_code` or `coupon_id` on orders.
- **Cart store:** No coupon state; only per-item `discountedPrice` and `discountSource: 'google'` for product-level discounts.

So: **we have a placeholder for promo entry and a column for order-level discount, but no coupon engine or admin.**

---

## 2. Discount types to support (WordPress-style + extras)

| Type | Description | Example | Notes |
|------|-------------|--------|--------|
| **Percentage (cart)** | % off subtotal | 15% off order | Apply after per-item discounts; cap optional. |
| **Fixed (cart)** | $ off subtotal | $25 off $100+ | Min cart optional; can cap at subtotal. |
| **Fixed (product)** | $ off specific product(s) | $2 off style X | Requires product/collection scope (style IDs or “all”). |
| **Percentage (product)** | % off specific product(s) | 10% off style Y | Same scope as fixed product. |
| **Free shipping** | Waive shipping | Free economy shipping | Can combine with % or $ off. |

**Recommendation:** Start with **percentage cart**, **fixed cart**, and **free shipping**. Add **fixed/percentage product** in a second phase (needs product scope and line-item logic). That keeps v1 simple and still covers most use cases.

---

## 3. Data model

### 3.1 `coupons` table (new)

- `id` (UUID, PK)
- `code` (TEXT, UNIQUE, uppercase/normalized) – what the customer types
- `description` (TEXT, optional) – internal note
- `discount_type` (TEXT): `percent_cart` | `fixed_cart` | `fixed_product` | `percent_product` | `free_shipping`
- `amount` (DECIMAL): for percent (e.g. 15 = 15%), for fixed (e.g. 25.00)
- `free_shipping` (BOOLEAN) – can sit alongside amount for “10% off + free shipping”
- **Constraints:** `min_cart_amount`, `max_discount_amount` (cap for %), optional `product_style_ids` (JSONB) for product-level later
- **Validity:** `starts_at`, `expires_at` (nullable)
- **Usage:** `usage_limit` (nullable = unlimited), `used_count` (incremented on order), `usage_limit_per_customer` (nullable)
- **Apply scope:** `applies_to`: `cart_and_packages` | `products_only`
- **Audit:** `created_at`, `updated_at`, `created_by` (admin user id)

### 3.2 Orders (existing, extend usage)

- Already: `discount_amount`
- Add: `coupon_id` (FK to coupons, nullable), `coupon_code` (TEXT, denormalized for display/receipts)

On successful payment we increment `coupons.used_count` and store `coupon_id` + `coupon_code` on the order.

---

## 4. Admin: Coupon manager

- **Dashboard:** Add a “Coupons” card in the Management section (same style as Customers, Quotes, etc.), link to `/admin/coupons`.
- **List page (`/admin/coupons`):** Table: code, type, amount, usage (used_count / usage_limit), dates, status (active/expired/scheduled). Actions: Edit, Duplicate, Deactivate/Delete. Optional: quick stats (total coupons, active, expired).
- **Create/Edit:** Form with code, type, amount, free_shipping, min cart, max discount (for %), dates, usage limit. Validation: code uniqueness, amount &gt; 0, dates logical.
- **Delete:** Soft-delete or hard delete with confirmation; if we store `coupon_id` on orders, keep referential integrity (nullable FK so delete is OK).

**Security (admin):** Reuse existing pattern: only `profile.role === 'admin'` can access `/admin/*`. All coupon mutations via server actions or API routes that verify admin again (never trust client).

---

## 5. Security (coupon validation & abuse)

- **Validate only on the server.** Never trust the client for “is this coupon valid?” or “how much discount?”. Cart and checkout send `coupon_code`; backend validates and returns discount breakdown (and optionally a short-lived token if you want to avoid re-validation on every request).
- **Rate limit** the “validate coupon” and “apply coupon” endpoints (e.g. per IP or per session) to prevent brute-force code guessing.
- **Don’t enumerate.** If the code is invalid, return a generic “Invalid or expired code” message. Don’t say “this code doesn’t exist” vs “this code is expired” to avoid leaking validity.
- **Idempotency.** Checkout already has `idempotencyKey`; ensure applying a coupon and creating the order don’t double-apply (e.g. validate once when creating PaymentIntent and use that result for order insert).
- **Recalc on server.** Checkout API must recalculate subtotal, discount, shipping (including free shipping), tax, and total using server-side logic. Never use “discount from client” as source of truth.
- **RLS / service role.** Coupons table: admin reads/writes via service role in API routes; customers never read coupons table directly. Expose only a “validate this code for this cart” endpoint that returns success + discount details (and maybe a one-time apply token).

---

## 6. Downstream & upstream impact

### 6.1 Downstream (after we add coupons)

- **Orders:** Will show `discount_amount` and `coupon_code` in admin and in any order confirmation/emails. Reports/analytics that show “revenue” may need to show “discount” and “net” (you may already have this with `discount_amount`).
- **Stripe:** PaymentIntent amount must equal `total` after discount (and free shipping). So checkout creation flow already uses one source of truth for total; we just feed it the discounted total.
- **Tax:** If you later use Stripe Tax or a tax engine, tax should be computed on post-discount amount (e.g. subtotal − discount). Current simple % tax should use the same.
- **Packages checkout:** If you have a separate flow (e.g. screen-printing packages), decide whether coupons apply there. If yes, same validate/apply API and same rules; if no, leave that for a later phase.

### 6.2 Upstream (what we depend on)

- **Cart contents:** Validation needs current cart (items + quantities + prices). So “validate coupon” accepts cart snapshot and returns discount; checkout sends same cart + coupon and server recalculates.
- **Free shipping rule:** Your existing rule (“economy free over $500”) must be consistent: e.g. “free shipping” coupon forces shipping to 0 regardless of subtotal; otherwise we need a clear rule (e.g. coupon free shipping overrides threshold, or only applies when under threshold). Recommendation: coupon “free shipping” = set shipping to 0 for that order.

---

## 7. Checkout flow (where discount is applied)

- **Cart page:** User enters code, clicks Apply → call `POST /api/coupons/validate` (or similar) with `{ code, items }`. Server returns `{ valid, discountType, discountAmount, freeShipping, message }`. Store in cart store: `appliedCoupon: { code, ... }` and optionally `orderLevelDiscount`, `freeShippingFromCoupon`. Cart UI and Order Summary show “Discount (CODE): -$X” and “Shipping: $0 (promo)”.
- **Checkout page:** Reads `appliedCoupon` from cart store; Order Summary shows same. On “Place order”, checkout sends `items + shippingMethod + couponCode` (and idempotency key). Server re-validates coupon, recalculates totals, creates order with `discount_amount` and `coupon_code`, creates PaymentIntent for the final total.
- **If coupon expires between cart and checkout:** Server validation fails; return clear message (“This code has expired”) and remove coupon from client state so user can change code or continue without.

---

## 8. UX: “Coupon activated” and clarity

- **Where to enter:** Keep “Have a promo code?” on cart (and optionally repeat a compact “Promo code” field on checkout). One place (cart) is enough if the applied state is visible in the order summary on both cart and checkout.
- **On success:** After Apply and server returns valid:
  - Show a short, positive message: “You saved $X with CODE” or “CODE applied – 15% off your order.”
  - In the order summary, show a clear line: “Discount (CODE): -$X” in green or with a small checkmark.
  - If free shipping applied: “Shipping: $0 (promo)” or “Free shipping applied.”
- **Microcopy:** Avoid “Promo code applied” only; add the benefit: “You’re saving $12.50 with SAVE10.”
- **Remove coupon:** Allow “Remove” next to the applied code so users can try another code; recalc totals immediately.
- **Error:** Generic “This code isn’t valid or has expired” (no enumeration). Optionally: “This code doesn’t apply to your current cart” if you add min cart or product rules.

---

## 9. Implementation order (suggested)

1. **DB:** Migration for `coupons` table; add `coupon_id` + `coupon_code` to orders (migration).
2. **API:** `POST /api/coupons/validate` (public, rate-limited) and admin CRUD (e.g. server actions or `/api/admin/coupons` with admin check).
3. **Admin UI:** Management link → `/admin/coupons` list → create/edit/delete coupons.
4. **Cart store:** Add `appliedCoupon`, `orderLevelDiscount`, `freeShippingFromCoupon`; persist applied code in cart persistence so it survives refresh.
5. **Cart page:** Wire Apply to validate API; show discount line and success/error; Remove coupon.
6. **Checkout:** Send `couponCode` in create-session request; server re-validates, recalculates, sets `discount_amount` and `coupon_id`/`coupon_code` on order; PaymentIntent amount = discounted total.
7. **Order confirmation / emails:** Include “Discount (CODE): -$X” and coupon code in summary.
8. **Optional:** Free shipping coupon logic in `calculateOrderTotals` (or dedicated helper).

---

## 10. Decisions (locked)

- **V1 discount types:** Percentage cart, fixed cart, and free shipping only.
- **Free shipping coupon:** Sets shipping to $0 for economy only (same-day still charged).
- **Apply scope (per coupon):** Admin chooses: apply to total cart (include packages) or main products only.
- **Usage limits:** Both in v1: total usage limit and usage limit per user.
- **Min / max:** Minimum cart amount and max discount cap (set manually in admin).
- **Admin orders list:** Show coupon_code and discount_amount in the orders list.

