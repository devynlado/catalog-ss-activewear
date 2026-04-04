# Calculate Live Shipping Cost — Preparation Document

> **Status:** Pre-development (awaiting ShipStation API credentials)
> **Last updated:** March 26, 2026

---

## 1. Product Weight Data Coverage

### Results (verified from Supabase `product_skus` table)

| Metric | Count | Coverage |
|--------|-------|----------|
| **Total SKUs** | 203,478 | — |
| **With weight > 0** | 203,421 | **99.97%** |
| **Weight = 0** | 57 | 0.03% |
| **Weight = null** | 0 | 0% |

### By Supplier

| Supplier | Total SKUs | With Weight | Coverage |
|----------|-----------|-------------|----------|
| SS Activewear | 200,274 | 200,274 | **100%** |
| LA Apparel | 250 | 245 | **98%** |

### Missing Weight SKUs (5 total, all LA Apparel 4XL variants)

- `1801GD_VBLK_4XL`, `1801GD_ASH_4XL`, `1801GD_BLK_4XL`, `1801GD_NVY_4XL`, `1801GD_GLD_4XL`
- **Action needed:** Fill these with the average 1801GD weight (~0.55 lbs) or look up from LA Apparel data.

### Weight Distribution (SS Activewear sample, n=1000)

| Range | Count | % |
|-------|-------|---|
| Under 0.25 lbs | 160 | 16.0% |
| 0.25 – 0.5 lbs | 393 | 39.3% |
| 0.5 – 1.0 lbs | 218 | 21.8% |
| 1.0 – 2.0 lbs | 94 | 9.4% |
| Over 2.0 lbs | 135 | 13.5% |

- **Min:** 0.127 lbs | **Max:** 5.67 lbs | **Median:** 0.44 lbs | **Avg:** 0.815 lbs

### Conclusion

Weight data is **production-ready**. Only 5 LA Apparel 4XL SKUs need backfill.

---

## 2. Warehouse Origin Addresses

### SS Activewear Warehouses (13 locations)

Data sourced from the SS Activewear `/v2/daysintransit/` API endpoint.

| Abbr | City / State | Zip Code | Timezone | Origin |
|------|-------------|----------|----------|--------|
| **NV** | Reno, NV | 89506 | PT | S&S |
| **CN** | Fresno area, CA | — | PT | Alphabroder |
| **TX** | Fort Worth, TX | 76137 | CT | S&S |
| **TD** | Irving/Dallas, TX | 75261 | CT | Alphabroder (closing Sep 2026) |
| **IL** | Lockport, IL | 60441 | CT | S&S |
| **CC** | Bolingbrook, IL | 60440 | CT | Alphabroder |
| **KS** | Olathe, KS | 66061 | CT | S&S |
| **OH** | West Chester, OH | 45011 | ET | S&S |
| **GA** | McDonough, GA | 30253 | ET | S&S |
| **GD** | McDonough area, GA | 30253 | ET | Alphabroder |
| **PA** | Reading, PA | 19605 | ET | S&S |
| **MA** | Middleboro, MA | 02346 | ET | Alphabroder |
| **FO** | Orlando, FL | 32809 | ET | Alphabroder |

> **Note:** SS Activewear automatically selects the shipping warehouse based on inventory
> and proximity. The `warehouseAbbr` field on orders indicates which warehouse shipped.
> Your recent test orders both shipped from **NV** (Reno), which is consistent with
> Hollywood, CA as the destination (1-day ground from NV).

### DaysInTransit from SS Warehouses to Hollywood (90028)

| Warehouse | Days | Notes |
|-----------|------|-------|
| CN, NV | 1 day | Closest to Hollywood |
| OH, GA, GD, TX, TD, IL, CC, KS | 3 days | Mid-range |
| FO, MA, PA | 4 days | Furthest |

### Los Angeles Apparel Warehouse

| Supplier | Address | Zip | Notes |
|----------|---------|-----|-------|
| LA Apparel | 1020 E 59th St, Los Angeles, CA | 90001 | Factory + warehouse |

### Garment Decor (your factory, for decorated shipments)

| Location | Address | Zip | Notes |
|----------|---------|-----|-------|
| Montclair, CA | 4778 W Mission Blvd, Montclair, CA | 91762 | Origin for decorated orders you ship yourself |

---

## 3. Business Decisions (Confirmed)

### Shipping Display: Speed-Based Tiers

**Decision:** 2 tiers only — **"Standard"** and **"Express"**

| Tier | Description | Estimated Days |
|------|-------------|----------------|
| Standard | Ground shipping (UPS/FedEx Ground) | 3–7 business days |
| Express | Expedited (2-Day / Priority) | 1–3 business days |

### Shipping Markup

**Decision:** **$8 flat markup** on top of the carrier rate from ShipStation.

Example: If ShipStation returns $12.50 for UPS Ground → customer sees **$20.50**.

### Free Shipping Threshold

**Decision:** Keep the existing **$500 subtotal** threshold for free Standard shipping.

---

## 4. Architecture Overview (Planned)

```
Customer enters zip → Frontend requests rates
                          ↓
              /api/shipping/rates
                          ↓
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
   SS Activewear     LA Apparel      Garment Decor
   (auto-warehouse)  (LA 90001)      (Montclair 91762)
         ↓                ↓                ↓
   ShipStation API ← origin zip + weight + dest zip
         ↓
   Return carrier rates (Ground + Express)
         ↓
   Apply $8 markup per shipment
         ↓
   Show "Standard" and "Express" to customer
```

### Origin Estimation for SS Activewear

Since SS auto-selects the warehouse, we estimate the origin using the DaysInTransit
data: pick the warehouse with the **lowest transit time** for the destination zip.
For California destinations, this will almost always be NV (89506) or CN.

### Fallback Strategy

If ShipStation is unavailable or times out, fall back to current flat rates:
- Standard: $15
- Express: $25

---

## 5. Next Steps (When API Credentials Arrive)

1. [ ] Add `SHIPSTATION_API_KEY` and `SHIPSTATION_API_SECRET` to `.env.local` and Vercel
2. [ ] Create `lib/shipstation.ts` — service skeleton with rate request/response types
3. [ ] Create `/api/shipping/rates` endpoint
4. [ ] Build shipping rate selector UI on checkout page
5. [ ] Create `shipping_rate_cache` table in Supabase
6. [ ] Update order creation to store selected shipping method and cost
7. [ ] Backfill the 5 missing LA Apparel 4XL weights
8. [ ] End-to-end testing with real carrier rates
