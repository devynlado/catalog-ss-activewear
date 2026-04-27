# Garment Decor - SS Activewear Catalog

A modern product catalog for browsing SS Activewear products, viewing colors and inventory, and building quote lists.

## Features

- **Product Browsing** - Browse all SS Activewear products by category
- **Style Number Search** - Quick search by style numbers (G500, BC3001, etc.)
- **Color Swatches** - View all available colors with product image switching
- **Real-Time Inventory** - Size/color matrix showing exact stock quantities
- **Quote System** - Build a quote list and submit for pricing
- **Builder.io Integration** - Visual page editing for layout customization

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Visual Editor**: Builder.io
- **State Management**: Zustand
- **API**: SS Activewear REST API

## Getting Started

### Prerequisites

- Node.js 18+
- SS Activewear API credentials
- Builder.io account (optional, for visual editing)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following:

```env
# SS Activewear API Credentials
SS_USERNAME=your_ss_username
SS_API_KEY=your_ss_api_key

# Builder.io (optional)
NEXT_PUBLIC_BUILDER_API_KEY=your_builder_public_api_key

# Quote submissions email
QUOTE_EMAIL_TO=quotes@garmentdecor.com
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the catalog.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
/app
  /api                    # API routes for SS Activewear proxy
    /products             # Product endpoints
    /inventory            # Inventory endpoints
    /categories           # Category endpoints
    /quote/submit         # Quote submission
  /catalog                # Catalog browsing pages
    /[productId]          # Product detail pages
  /quote                  # Quote review and submission
  /[[...page]]            # Builder.io catch-all renderer
  
/components
  /builder                # Builder.io registered components
    ProductGrid.tsx
    ProductCard.tsx
    ColorSwatches.tsx
    InventoryMatrix.tsx
    SearchBar.tsx
    FilterSidebar.tsx
    QuickViewModal.tsx
    CategoryNav.tsx
  /layout                 # Layout components
  /quote                  # Quote-related components
  /ui                     # Base UI components
  
/lib
  ss-activewear.ts        # SS API client
  quote-store.ts          # Zustand store for quotes
  builder-registry.ts     # Builder.io component registration
  types.ts                # TypeScript interfaces
  utils.ts                # Utility functions
```

## Builder.io Setup

1. Create a Builder.io account at [builder.io](https://builder.io)
2. Create a new Space for your project
3. Get your Public API Key from Settings
4. Add it to your `.env.local` as `NEXT_PUBLIC_BUILDER_API_KEY`
5. Components are automatically registered when the app starts

### Available Builder Components

| Component | Description | Inputs |
|-----------|-------------|--------|
| ProductGrid | Grid of product cards | columns, categoryFilter, brandFilter, showPricing, maxProducts |
| InventoryMatrix | Size/color stock table | productId, lowStockThreshold, showQuantities |
| ColorSwatches | Color picker | productId, swatchSize, maxVisible |
| SearchBar | Search input | placeholder, showSuggestions |
| FilterSidebar | Filter controls | showBrands, showCategories, showPriceRange |
| CategoryNav | Category navigation | layout, showIcons |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
# Or deploy via CLI
vercel
```

## API Integration

The app proxies SS Activewear API calls through Next.js API routes to keep credentials secure.

### Endpoints

- `GET /api/products` - List/search products
- `GET /api/products/[id]` - Get product details
- `GET /api/categories` - List categories
- `GET /api/brands` - List brands
- `GET /api/inventory/[sku]` - Get inventory data
- `POST /api/quote/submit` - Submit a quote request

### SS Activewear API Docs

Refer to [SS Activewear API Documentation](https://api.ssactivewear.com/) for full API details.

## Customization

### Design Tokens

Edit `tailwind.config.ts` to customize:

- Brand colors
- Typography
- Spacing
- Shadows

### CSS Variables

Edit `app/globals.css` for quick theming:

```css
:root {
  --color-brand-primary: #0ea5e9;
  --color-brand-secondary: #0369a1;
  /* ... */
}
```

## License

Private - Garment Decor
