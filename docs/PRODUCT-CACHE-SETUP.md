# Product Cache Architecture & Setup Guide

This document outlines the Supabase product caching system that provides sub-500ms catalog page loads (vs 5-15 seconds from live SS Activewear API).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Setup Instructions](#setup-instructions)
4. [Running Syncs](#running-syncs)
5. [API Endpoints](#api-endpoints)
6. [GitHub Actions (Automated Syncs)](#github-actions-automated-syncs)
7. [GMC Feed](#gmc-feed)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### The Problem
- SS Activewear API calls take 5-15 seconds per page load
- Fetching ~5,885 styles + SKU data in batches causes latency
- Inconsistent product card display (some show prices, some show "Request Quote")

### The Solution
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Catalog Page  │────▶│  Supabase Cache  │────▶│  ~100-200ms     │
│   (User Visit)  │     │  (Pre-synced)    │     │  Response Time  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               ▲
                               │ Sync Jobs
                               │
┌─────────────────┐     ┌──────────────────┐
│  SS Activewear  │────▶│  Daily/Weekly    │
│  API            │     │  Sync Jobs       │
└─────────────────┘     └──────────────────┘
```

### Key Files
| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Database table definitions |
| `lib/product-sync.ts` | Sync functions (popular, inventory, full) |
| `lib/product-cache.ts` | Read functions for cached data |
| `app/api/sync/route.ts` | API endpoint to trigger syncs |
| `.github/workflows/sync-*.yml` | Automated sync schedules |

---

## Database Schema

### Tables

#### `products` (~5,000 rows)
Parent-level product information.

| Column | Type | Description |
|--------|------|-------------|
| `style_id` | INT | Primary key (SS Activewear style ID) |
| `style_name` | TEXT | Style number (e.g., "3001") |
| `brand_name` | TEXT | Brand (e.g., "BELLA+CANVAS") |
| `title_raw` | TEXT | Original title from SS API |
| `title_optimized` | TEXT | For future AI optimization |
| `is_popular` | BOOLEAN | Part of curated 335 products |
| `popular_tier` | TEXT | bestseller, staff-pick, streetwear, value |
| `is_active` | BOOLEAN | False if discontinued |
| `base_price` | DECIMAL | Starting "from" price |

#### `product_colors` (~250,000 rows)
Color variants with images.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (styleId-colorCode) |
| `style_id` | INT | Foreign key to products |
| `color_name` | TEXT | Color name |
| `color_code` | TEXT | Color code |
| `front_image` | TEXT | Product image URL |
| `swatch_image` | TEXT | Color swatch URL |
| `availability` | TEXT | in_stock or out_of_stock |

#### `product_skus` (~2,000,000 rows)
Full SKU-level data for GMC feed.

| Column | Type | Description |
|--------|------|-------------|
| `sku` | TEXT | Primary key |
| `style_id` | INT | Foreign key to products |
| `color_id` | TEXT | Foreign key to product_colors |
| `size_name` | TEXT | Size (S, M, L, XL, etc.) |
| `cogs` | DECIMAL | Cost of goods (wholesale price) |
| `retail_price` | DECIMAL | cogs × 1.40 |
| `auto_min_price` | DECIMAL | cogs × 1.12 (Google auto-pricing floor) |
| `gtin` | TEXT | UPC/EAN barcode |
| `qty` | INT | Current inventory quantity |
| `availability` | TEXT | in_stock or out_of_stock |

#### `sync_logs`
Tracks sync job status for monitoring.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `sync_type` | TEXT | popular, inventory, or full |
| `status` | TEXT | started, completed, failed |
| `products_synced` | INT | Count of products processed |
| `error_message` | TEXT | Error details if failed |

---

## Setup Instructions

### Step 1: Create Database Tables

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy the entire contents of `supabase/schema.sql`
5. Click **Run** to create all tables

### Step 2: Verify Environment Variables

Ensure these are in your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# SS Activewear
SS_USERNAME=your-username
SS_API_KEY=your-api-key

# Sync API Key (for cron jobs)
SYNC_API_KEY=sync_gd_8f3k2m9x4p7w1n6v
```

### Step 3: Run Initial Sync

Start with popular products only (faster, ~5 minutes):

```bash
# Using curl
curl -X POST "http://localhost:3000/api/sync?type=popular" \
  -H "x-api-key: sync_gd_8f3k2m9x4p7w1n6v"

# Or in PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/sync?type=popular" `
  -Method POST -Headers @{"x-api-key"="sync_gd_8f3k2m9x4p7w1n6v"}
```

### Step 4: Verify Cache is Working

Check sync status:
```bash
curl "http://localhost:3000/api/sync"
```

Expected response:
```json
{
  "success": true,
  "lastSync": {
    "sync_type": "popular",
    "status": "completed",
    "products_synced": 335,
    "colors_synced": 8500,
    "skus_synced": 45000
  }
}
```

---

## Running Syncs

### Sync Types

| Type | Duration | Use Case |
|------|----------|----------|
| `popular` | ~5 min | Initial setup, testing (335 curated products) |
| `inventory` | ~5-10 min | Daily updates (qty/availability only) |
| `full` | ~30-60 min | Weekly full catalog (~5,000 products) |

### Manual Sync Commands

```bash
# Popular products only (fast)
curl -X POST "https://garmentdecor.com/api/sync?type=popular" \
  -H "x-api-key: YOUR_SYNC_API_KEY"

# Inventory only (daily)
curl -X POST "https://garmentdecor.com/api/sync?type=inventory" \
  -H "x-api-key: YOUR_SYNC_API_KEY"

# Full catalog (weekly)
curl -X POST "https://garmentdecor.com/api/sync?type=full" \
  -H "x-api-key: YOUR_SYNC_API_KEY"
```

### Check Sync Status

```bash
curl "https://garmentdecor.com/api/sync"
```

---

## API Endpoints

### Products API (`/api/products`)

Now uses Supabase cache first with SS API fallback.

```
GET /api/products
GET /api/products?search=bella+canvas
GET /api/products?brand=GILDAN
GET /api/products?featured=true
GET /api/products?page=2&pageSize=20
```

**Response time:** ~100-200ms (vs 5-15s previously)

### Product Detail (`/api/products/[id]`)

Hybrid approach: cached data + optional live inventory.

```
GET /api/products/12345                    # Cached data
GET /api/products/12345?liveInventory=true # + real-time qty
```

### Sync API (`/api/sync`)

```
GET  /api/sync                    # Get sync status
POST /api/sync?type=popular       # Sync popular products
POST /api/sync?type=inventory     # Sync inventory only
POST /api/sync?type=full          # Full catalog sync
```

Requires `x-api-key` header for POST requests.

### GMC Feed (`/api/feed/gmc`)

```
GET /api/feed/gmc              # CSV format (default)
GET /api/feed/gmc?format=json  # JSON format
GET /api/feed/gmc?refresh=true # Force SS API (skip cache)
```

---

## GitHub Actions (Automated Syncs)

### Required Secrets

Add these in your GitHub repository settings:
- **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|-------|
| `SITE_URL` | `https://garmentdecor.com` |
| `SYNC_API_KEY` | `sync_gd_8f3k2m9x4p7w1n6v` |

### Workflows

#### Daily Inventory Sync
**File:** `.github/workflows/sync-inventory.yml`
**Schedule:** Every day at 6 AM UTC (1 AM EST)
**Duration:** ~5-10 minutes

#### Weekly Full Sync
**File:** `.github/workflows/sync-full.yml`
**Schedule:** Every Sunday at 2 AM UTC
**Duration:** ~30-60 minutes

### Manual Trigger

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select the workflow (Daily or Weekly)
4. Click **Run workflow** button

---

## GMC Feed

### Pricing Formula

```
COGS (cost of goods)     = SS Activewear customerPrice
Retail Price             = COGS × 1.40 (40% markup)
Auto Pricing Min Price   = COGS × 1.12 (12% floor for Google auto-discounts)
```

### Feed URL

```
https://garmentdecor.com/api/feed/gmc
```

Add this URL to Google Merchant Center as your product feed.

### Feed Fields

Key fields included:
- `id` (SKU)
- `title` (optimized product title)
- `price` / `sale_price`
- `cost_of_goods_sold`
- `auto_pricing_min_price`
- `availability` (in_stock/out_of_stock)
- `gtin` (UPC barcode)
- `item_group_id` (groups color/size variants)
- `google_product_category`

---

## Troubleshooting

### Cache Not Working

**Symptom:** Pages still loading slowly (5-15s)

**Check:**
1. Run `GET /api/sync` to verify sync completed
2. Check Supabase dashboard for row counts in `products` table
3. Look at server logs for "Using Supabase cache" vs "Using SS API fallback"

**Fix:**
```bash
# Re-run popular sync
curl -X POST "http://localhost:3000/api/sync?type=popular" \
  -H "x-api-key: sync_gd_8f3k2m9x4p7w1n6v"
```

### Sync Fails

**Symptom:** Sync returns error or status "failed"

**Check:**
1. View `sync_logs` table in Supabase for error message
2. Check that SS_USERNAME and SS_API_KEY are valid
3. Ensure SUPABASE_SERVICE_KEY has write permissions

### Products Missing

**Symptom:** Some products not appearing in catalog

**Check:**
1. Verify product is in `POPULAR_PRODUCTS` list (`lib/popular-products.ts`)
2. Check `products` table for `is_active = true`
3. Run full sync to catch new products

### GitHub Action Fails

**Symptom:** Automated sync not running

**Check:**
1. Verify secrets are set: `SITE_URL` and `SYNC_API_KEY`
2. Check Actions tab for error logs
3. Ensure production site is accessible from GitHub

---

## Architecture Decisions

### Why Supabase?
- Already integrated for quotes/contacts
- PostgreSQL with great indexing
- Built-in REST API
- Generous free tier (500MB), Pro tier (8GB) for scale

### Why Three Tables?
- **Normalized design** reduces data duplication
- **Catalog queries** only need `products` + `product_colors` (~255K rows)
- **SKU table** only queried for GMC feed and product detail

### Why Two Sync Types?
- **90% of data is static** (names, images, GTINs never change)
- **Daily inventory sync** is fast (only qty/availability)
- **Weekly full sync** catches new products and metadata changes

### Why GitHub Actions?
- Vercel cron has 60s timeout (not enough for full sync)
- GitHub Actions allows 2+ hour jobs
- Free with repository
- Easy manual trigger for testing

---

## Files Reference

```
catalog-ss-activewear-main/
├── supabase/
│   └── schema.sql              # Database schema
├── lib/
│   ├── product-sync.ts         # Sync functions
│   ├── product-cache.ts        # Cache read functions
│   ├── database.types.ts       # TypeScript types
│   └── gmc-feed.ts             # GMC feed generation
├── app/api/
│   ├── sync/route.ts           # Sync API endpoint
│   ├── products/route.ts       # Products API (cache-first)
│   └── feed/gmc/route.ts       # GMC feed endpoint
└── .github/workflows/
    ├── sync-inventory.yml      # Daily inventory sync
    └── sync-full.yml           # Weekly full sync
```

---

*Last updated: January 2026*
