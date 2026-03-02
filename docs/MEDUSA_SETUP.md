# Medusa Order Management Integration

This project syncs **confirmed orders** (after Stripe payment succeeds) to a Medusa backend for **order management** (OMS). Your existing checkout stays in place (Next.js + Supabase + Stripe); Medusa is used to manage orders (fulfillment, status, returns, etc.) via the Medusa Admin dashboard or API.

## Overview

- **When**: After a payment succeeds (Stripe webhook `payment_intent.succeeded`), the order is sent to Medusa.
- **What**: Order details (items, customer, addresses, totals, shipping) are POSTed to a custom sync endpoint on your Medusa backend.
- **Result**: Orders appear in Medusa and can be managed there (status, fulfillments, etc.).

## 1. Environment variables (this Next.js app)

Add to `.env.local`:

```bash
# Medusa backend (optional – if not set, sync is skipped)
MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_SYNC_API_KEY=your-secret-sync-key
```

- **MEDUSA_BACKEND_URL**: Base URL of your Medusa server (e.g. `http://localhost:9000` or `https://api.yourstore.com`).
- **MEDUSA_SYNC_API_KEY**: A shared secret you define. The Next.js app sends it in the `x-medusa-sync-key` header; the Medusa sync route must validate it.

## 2. Medusa backend setup

You need a **Medusa v2** backend with a custom API route that accepts our payload and creates an order.

### 2.1 Create a Medusa project (if you don’t have one)

```bash
npx create-medusa-app@latest
```

Choose a project name and complete the setup. Ensure you have at least one **Region** (e.g. US with currency USD) in Medusa Admin (Settings → Regions).

### 2.2 Add the sync API route

In your Medusa backend, add a custom route that:

1. Accepts `POST /sync/order`.
2. Verifies the `x-medusa-sync-key` header.
3. Maps the JSON body to Medusa’s order creation API and creates the order.

**Option A – Custom API route file (Medusa v2)**

Create `src/api/sync/order/route.ts` (or the path your Medusa version uses for custom routes):

```ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const SYNC_API_KEY = process.env.MEDUSA_SYNC_API_KEY || ""

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const key = req.headers["x-medusa-sync-key"] as string
  if (!SYNC_API_KEY || key !== SYNC_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const body = req.body as {
    order_id: string
    order_number: string
    email: string
    currency_code: string
    status: string
    items: Array<{ title: string; quantity: number; unit_price: number; sku?: string; metadata?: Record<string, unknown> }>
    shipping_address?: {
      first_name: string
      last_name: string
      company?: string
      address_1: string
      address_2?: string
      city: string
      province: string
      postal_code: string
      country_code: string
      phone?: string
    }
    billing_address?: Record<string, unknown>
    shipping_methods?: Array<{ name: string; amount: number }>
    metadata?: Record<string, unknown>
  }

  if (!body?.email || !body?.items?.length) {
    return res.status(400).json({ error: "email and items required" })
  }

  try {
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    const regionModuleService = req.scope.resolve(Modules.REGION)

    // Get first region (or use one matching currency_code)
    const [region] = await regionModuleService.listRegions({})
    if (!region) {
      return res.status(500).json({ error: "No region configured in Medusa" })
    }

    const createData = {
      currency_code: body.currency_code || "usd",
      region_id: region.id,
      email: body.email,
      status: body.status === "confirmed" ? "completed" : "pending",
      no_notification: true,
      items: body.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        ...(item.sku && { metadata: { sku: item.sku, ...item.metadata } }),
      })),
      ...(body.shipping_address && {
        shipping_address: {
          first_name: body.shipping_address.first_name,
          last_name: body.shipping_address.last_name,
          company: body.shipping_address.company,
          address_1: body.shipping_address.address_1,
          address_2: body.shipping_address.address_2,
          city: body.shipping_address.city,
          province: body.shipping_address.province,
          postal_code: body.shipping_address.postal_code,
          country_code: body.shipping_address.country_code.toUpperCase(),
          phone: body.shipping_address.phone,
        },
      }),
      ...(body.shipping_methods?.length && {
        shipping_methods: body.shipping_methods.map((sm) => ({
          name: sm.name,
          amount: sm.amount,
        })),
      }),
      metadata: {
        external_order_id: body.order_id,
        order_number: body.order_number,
        source: "catalog-ss-activewear",
        ...body.metadata,
      },
    }

    const [created] = await orderModuleService.createOrders(createData as any)
    return res.json({ id: created.id, order_id: created.id })
  } catch (err) {
    console.error("[Medusa] Sync order error:", err)
    return res.status(500).json({ error: "Failed to create order" })
  }
}
```

Set the same secret in the Medusa server env:

```bash
MEDUSA_SYNC_API_KEY=your-secret-sync-key
```

**Note**: Medusa v2 project structure may use a different path for API routes (e.g. under `src/api` or `api`). Refer to [Medusa – Custom API routes](https://docs.medusajs.com/learn/http-modules/custom-api-routes) for your version.

### 2.3 Ensure a region exists

In Medusa Admin: **Settings → Regions**. Create a region (e.g. United States, USD) if none exists. The sync route uses the first region returned; you can change the route to select by `currency_code` if you have multiple regions.

## 3. Flow summary

1. Customer checks out on the Next.js site → order is created in Supabase and Stripe PaymentIntent is created.
2. Customer pays → Stripe sends `payment_intent.succeeded` to your webhook.
3. Webhook updates the order to `paid` in Supabase, sends confirmation emails, then **calls the Medusa sync** (fire-and-forget).
4. Medusa sync endpoint creates the order in Medusa; you can manage it in Medusa Admin (orders, fulfillments, etc.).

## 4. Optional: Store Medusa order ID in Supabase

If you want to link Supabase orders to Medusa orders (e.g. for status display or future two-way sync), add a column to your `orders` table:

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS medusa_order_id text;
```

Then extend the sync logic in `lib/medusa.ts` to accept the returned `medusa_order_id` and call an API that updates the Supabase order (or add a small internal API route that updates the order by `order_id` with the Medusa ID). The current implementation does not persist the Medusa ID.

## 5. Troubleshooting

- **Sync not running**: Ensure `MEDUSA_BACKEND_URL` and `MEDUSA_SYNC_API_KEY` are set in `.env.local`. Sync is skipped if either is missing.
- **401 from Medusa**: `x-medusa-sync-key` must match `MEDUSA_SYNC_API_KEY` on the Medusa server.
- **500 from Medusa**: Check Medusa logs. Common causes: no region, invalid payload shape, or missing required fields for `createOrders`.
- **Orders not in Medusa Admin**: Confirm the sync route returns 200 and that you’re looking at the same Medusa environment (and same region) as the one pointed to by `MEDUSA_BACKEND_URL`.

## References

- [Medusa Order Module](https://docs.medusajs.com/resources/commerce-modules/order)
- [Medusa createOrders](https://docs.medusajs.com/resources/references/order/createOrders)
- [Medusa custom API routes](https://docs.medusajs.com/learn/http-modules/custom-api-routes)
