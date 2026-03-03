# Refund Feature Plan – Admin Dashboard

**Goal:** Admins can refund some or all of the products in a customer’s order. Only internal team (admin dashboard) can perform refunds. Customer receives an email after a refund.

**Branch:** Refund

---

## 1. Recommended flow (order-centric)

**Where refunds live:** Under **Orders**, not a separate “Refunds” section.

- Admin goes to **Orders** → clicks an order → **Order detail** page.
- On that page they see line items and an **“Issue refund”** action.
- Refund is always in the context of one order, so they don’t have to search for the order first.

**Why:** Matches how support works (customer says “refund order #X”) and keeps everything about that order in one place.

---

## 2. Two ways to refund (best practice)

### Option A: Refund entire order

- One click: “Refund full order.”
- Refund amount = order total (already paid).
- Order status → **Refunded**; dashboard and list show that clearly.

**Use when:** Customer cancels, wrong order, or “refund everything.”

### Option B: Refund by line item (partial refund)

- Admin sees the order’s **line items** (product, qty, price, line total).
- They choose **which lines** to refund (e.g. 2 of 5 items).
- System computes **refund amount** from selected lines (see section 5).
- Stripe only supports refunding by **amount**, not by “item,” so we:
  - Store which items were refunded in our DB (for history and to avoid double-refunding the same line).
  - Call Stripe’s refund API with that **amount** (in cents).

**Use when:** “Refund only the defective shirt,” or “refund 1 of 3 items.”

**Recommendation:** Support **both** in v1: “Refund full order” + “Refund selected items.” That covers almost all cases without overcomplicating the UI.

---

## 3. UI/UX layout

### 3.1 Orders list (current page)

- Keep current columns; add:
  - **Refund status** (e.g. “Paid” | “Partially refunded” | “Refunded”) and/or **Net amount** (original total minus total refunded).
- Make the **order number** (or a “View” link) open the **Order detail** page.

### 3.2 Order detail page (new)

- **Header:** Order number, date, customer name/email, current payment status.
- **Order totals:** Subtotal, shipping, tax, discount, **total** (and if partially refunded: **total refunded**, **net amount**).
- **Line items table:**

  - Columns: Product (name/sku), Qty, Unit price, Line total.
  - For **partial refund:** add a column “Refund” with:
    - Checkbox “Include in refund,” or
    - “Refund this line” button.
  - For lines **already refunded:** show a badge “Refunded” and disable the checkbox/button (no double refund).

- **Actions:**
  - **“Refund full order”** (only if order is not already fully refunded).
  - **“Refund selected items”** (only when at least one line is selected and not yet refunded).

### 3.3 Refund confirmation step (modal or inline)

- **Summary:** “You are about to refund **$X.XX** for order **#12345**.”
- **Breakdown:** List of selected lines (or “Full order”) and the total refund amount.
- **Reason (optional but useful):** Dropdown, e.g.:
  - Customer request  
  - Defective / Wrong item  
  - Duplicate order  
  - Other  
- **Internal note (optional):** Short text for your team only (e.g. “Customer called 2/27”).
- **Buttons:** “Cancel” and “Confirm refund.”
- After confirm: call your API → Stripe refund → update DB (or rely on webhook) → send email → show success and refresh order (amounts and status update immediately).

### 3.4 After refund

- **On order detail:** Totals and refund status update (e.g. “Partially refunded – $50.00 refunded” or “Refunded”).
- **On orders list:** That order’s row shows new status and/or net amount.
- **Customer:** Receives an email: “Your order #X has been refunded. Amount: $Y. Refund will appear in 5–10 business days,” etc.

---

## 4. Data and safety (avoid blind spots)

### 4.1 Prevent double refund

- **Option 1 (simplest):** Store **total_refunded** (or **refunded_amount**) on `orders`. Each time you create a refund, add to it. Refund UI only allows refunding up to **(order.total - total_refunded)**. No line-level tracking needed for the limit, but you can still show “Refunded” per line for display.
- **Option 2 (richer):** Store **refunded per line** (e.g. in `items` JSON or a small **order_refund_items** table). When building “Refund selected items,” only allow selecting lines that are not fully refunded. Refund amount = sum of (selected lines’ totals). Again enforce: **total refunded ≤ order.total**.

**Recommendation for v1:** Add **total_refunded** (or **refunded_amount**) on `orders` and optionally store each refund in **payments** (you already have `type: 'refund'`). Use **payments** to compute total_refunded if you don’t want a new column. When creating a refund, check **sum(refunds) + this_refund ≤ order.total**.

### 4.2 Stripe

- You already have **stripe_charge_id** on the order and **charge.refunded** webhook that updates **payment_status** and logs in **payments** and **order_activities**. Use that.
- Create refunds with **Stripe Refunds API** (by amount in cents). Stripe will send **charge.refunded**; your webhook can stay as-is for full/partial (it already uses `charge.amount_refunded` and `charge.refunded`). Optionally in the webhook you can update a **total_refunded** field if you add it.

### 4.3 Audit

- **order_activities** already has `activity_type: 'refunded'` and `details: { amount, full_refund }`. Add **admin user id** (and optionally reason/note) in **details** when you create the refund from the API, so you know who refunded and why.

---

## 5. Partial refund: tax and shipping

- **Simple (v1):** Refund only the **sum of selected line totals** (no tax/shipping). Customer gets a fair amount; you avoid complexity.
- **Proportional (v2):** Refund a share of tax and shipping (e.g. by value: refunded_items_value / order_subtotal × (tax + shipping)). More accurate but more logic and edge cases (rounding, discounts).
- **Recommendation:** Start with **line totals only**. You can add proportional tax/shipping later if needed.

---

## 6. Customer email

- **Current:** Your **charge.refunded** webhook does **not** send an email. So the customer is not notified by the system today.
- **Needed:** After a successful refund (either from your API response or from the webhook), send one email: “Order #X has been refunded. Amount: $Y. Refund will appear in 5–10 business days.”
- **Where to send from:**
  - **From admin refund API (recommended):** When your backend creates the Stripe refund and updates the order, also trigger the “refund confirmation” email (Resend or your current provider). Then the webhook only needs to keep DB in sync (and can also send the same email if you want a safety net, but avoid sending twice).
  - **From webhook only:** In **handleChargeRefunded**, fetch order and customer email and send the same email. Then admin UI doesn’t send email; webhook is the single source of “refund happened.” Either way is fine; pick one so the customer gets exactly one email per refund.

---

## 7. Edge cases and pushback

| Topic | Suggestion |
|-------|------------|
| **Order already shipped** | Allow refund anyway (financial only). No need to change fulfillment status in v1; you can add “Refund after ship” note in UI later if needed. |
| **Coupon on order** | Refund the amount the customer actually paid. If they had a $10 discount, you’re refunding (total - 0) for full refund, or the selected lines’ share of the discounted total for partial. No need to “re-apply” coupon logic for the refund amount. |
| **Multiple partial refunds** | Stripe allows multiple refunds until total refunded = charge amount. Your guard: **total_refunded + new_refund ≤ order.total**. |
| **Reason codes** | Optional dropdown (Customer request, Defective, etc.) helps analytics and support. Store in **order_activities.details** or in **payments.metadata**. |
| **Customer self-serve** | You said not for now. So no “Request refund” on the customer-facing site; only admin can trigger. |

---

## 8. Implementation checklist

- [ ] **Order detail page**  
  - Route: e.g. `/admin/orders/[id]`  
  - Load order (with `items`, totals, `stripe_charge_id`), and list of refunds (from **payments** where `type = 'refund'`) to show **total_refunded** and “Refunded” per line if you track by line.

- [ ] **Orders list**  
  - Add link to order detail (e.g. order number).  
  - Show refund status (Paid / Partially refunded / Refunded) and optionally net amount.

- [ ] **Refund API**  
  - POST e.g. `/api/admin/orders/[id]/refund`  
  - Body: `{ fullOrder: boolean }` or `{ lineIds: string[] }` (or line indices), optional `reason`, `note`.  
  - Auth: admin only.  
  - Logic:  
    - If full: refund amount = order.total - total_refunded.  
    - If partial: refund amount = sum of selected line totals (and optionally proportional tax/shipping later).  
  - Check: total_refunded + amount ≤ order.total; order has stripe_charge_id and payment_status = 'paid' (or partially refunded).  
  - Call Stripe: create refund for that amount (in cents).  
  - Either: (1) Update **orders** (e.g. total_refunded, payment_status) and **payments** and **order_activities** in this API and then send email, or (2) Rely on **charge.refunded** webhook to update DB and send email from webhook.  
  - Return success/error.

- [ ] **Refund confirmation email**  
  - One template: order number, refund amount, “will appear in 5–10 business days.”  
  - Trigger from API (recommended) or from webhook.

- [ ] **DB (if needed)**  
  - Either add **total_refunded** on **orders** and update it in API + webhook, or compute from **payments** (type = 'refund') when needed.

- [ ] **Admin UI**  
  - Order detail: line items table, “Refund full order,” “Refund selected items,” confirmation modal with amount and reason/note.  
  - After success: refresh or refetch order so amounts and status update immediately.

---

## 9. Summary

- **Flow:** Orders → Order detail → Refund full or Refund selected items → Confirm → Stripe refund → DB update → Email customer.  
- **Best practice:** Support both full and partial (by line); one order-centric place; clear refund status and net amount; prevent over-refund; audit who did what; optional reason; one customer email per refund.  
- **Your stack:** Orders and payments in Supabase; Stripe charge/refund; existing webhook for **charge.refunded**. Add order detail page, refund API, and refund email; optionally add **total_refunded** or use **payments** to derive it.

If you want, next step can be a short **technical spec** (exact API shape, DB changes, and UI components) so you can implement step by step on the Refund branch.
