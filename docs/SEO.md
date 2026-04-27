# SEO metadata

Every **public** page should expose consistent technical SEO:

- **Title** – unique, descriptive
- **Description** – 155–160 characters, summarising the page
- **Canonical URL** – `alternates.canonical`
- **OpenGraph** – `title`, `description`, `url` (and optional `images`)
- **Twitter Card** – `card`, `title`, `description` (and optional `images`)

## System: `createPageMetadata` and `getSiteUrl`

- **`lib/metadata.ts`** provides:
  - **`getSiteUrl()`** – base URL (uses `NEXT_PUBLIC_SITE_URL` or `https://garmentdecor.com`).
  - **`createPageMetadata({ title, description, path, image?, noIndex?, openGraphType? })`** – returns a full `Metadata` object with title, description, canonical, OpenGraph, and Twitter Card.

Use these so all new and updated pages stay consistent and environment-aware.

## When adding a new page

1. **Static metadata (most pages)**  
   In the page or its `layout.tsx`:

   ```ts
   import { createPageMetadata } from '@/lib/metadata';

   export const metadata = createPageMetadata({
     title: 'Your Page Title | Garment Decor',
     description: 'One or two sentences describing the page for search and social.',
     path: '/your-path',   // e.g. '/about', '/services/embroidery'
   });
   ```

2. **Optional**
   - **`image`** – override default OG/Twitter image (absolute URL or path like `/images/og-custom.png`).
   - **`noIndex: true`** – for checkout, dashboard, or other utility pages you don’t want indexed.
   - **`openGraphType: 'article'`** – for blog/portfolio-style pieces (default is `'website'`).

3. **Dynamic metadata (e.g. `[slug]`)**  
   Use `generateMetadata` and build the same shape (title, description, `alternates.canonical`, `openGraph`, `twitter`). Use **`getSiteUrl()`** for the base URL and build the canonical/OG URL from the current path.

   ```ts
   const baseUrl = getSiteUrl();
   const path = `/product/${params.slug}`;
   const url = `${baseUrl}${path}`;
   return {
     title: '...',
     description: '...',
     alternates: { canonical: url },
     openGraph: { title, description, url, siteName: 'Garment Decor', type: 'website' },
     twitter: { card: 'summary_large_image', title, description },
   };
   ```

4. **Client-only routes**  
   If the route has no server component, add a **`layout.tsx`** in that segment that exports `metadata` (or `generateMetadata`) using `createPageMetadata` or the same fields.

## Checklist for new pages

- [ ] Title (unique, includes “Garment Decor” where appropriate)
- [ ] Description (155–160 chars)
- [ ] Canonical URL (`alternates.canonical`)
- [ ] OpenGraph: title, description, url
- [ ] Twitter Card: card, title, description

Using **`createPageMetadata`** for static pages covers all of the above in one call.
