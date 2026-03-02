# Project Portfolio CMS – Spec (Sanity)

Locked decisions and schema for the Project/Portfolio CMS. Goals: **credibility**, **show variety of services/projects**, **quality visible in photos** → **confidence to request a quote**.

---

## 1. Locked decisions

| Item | Choice |
|------|--------|
| CMS | Sanity |
| Studio | Embedded at `/studio` |
| Draft vs published | Yes – draft projects hidden from site until published |
| Who can edit | Admin only (Studio protected) |
| Images | Manual upload in CMS (Sanity assets) |
| Categories | WordPress-style: add new category or choose from existing list |
| Decoration → service link | Link to real service page (e.g. "Screen Printing" → `/services/screen-printing`) |

---

## 2. Service slug map (decoration → URL)

Decoration field in CMS will store a **slug**; we map to your existing service routes:

| Display name | Slug (value) | URL |
|--------------|--------------|-----|
| Screen Printing | screen-printing | /services/screen-printing |
| Embroidery | embroidery | /services/embroidery |
| Digital Screen Printing | digital-screen-printing | /services/digital-screen-printing |
| Puff Screen Printing | puff-screen-printing | /services/puff-screen-printing |
| Jumbo Screen Printing | jumbo-screen-printing | /services/jumbo-screen-printing |
| Simulated Process | simulated-process | /services/simulated-process |
| Retail Finishing | retail-finishing | /services/retail-finishing |
| Rush Services | rush | /services/rush |
| Live Screen Printing | live-screen-printing | /services/live-screen-printing |
| Large Orders | large-orders | /services/large-orders |

In Sanity we use a **list** of these (title + slug); when content is saved we store the slug and render links as `/services/${slug}`. New services can be added in one shared config used by both the app and the schema options.

---

## 3. Document types

### 3.1 Category (WordPress-style taxonomy)

- **Title** (string) – e.g. "Screen Printing", "Sweatshirts", "Tops"
- **Slug** (string, unique) – URL-safe, e.g. `screen-printing`, `sweatshirts`
- Optional: **Description** (text)

Editors can create new categories or pick existing ones. Projects reference category by reference to this document.

### 3.2 Project

**Core (from your list)**

| Field | Type | Notes |
|-------|------|--------|
| Title | string | Project name |
| Slug | string, unique | URL path, e.g. `custom-wholesale-puff-print-hoodies-for-awful-cloth` |
| Project Tag | array of strings | Tags for filter/display (e.g. "Puff", "Hoodies", "Rush") |
| Project Category | reference → Category | Single category; can add "Categories" (multi) later if needed |
| Product | string (or block) | Product used, e.g. "SS4500 – CLASSICS Midweight Hooded Pullover" |
| Decoration | string (select) | Options = service slugs above; we link to `/services/{slug}` |
| Materials | string | Fabric, e.g. "Cotton-Poly Blend" |
| Design Name | string | e.g. "Awful Cloth" |
| Short description | text | 1–2 sentences for cards and meta description |
| Long description | portable text (block content) | Main story; supports headings, lists, links |
| Image gallery | array of images | Sanity image type; order preserved |
| Testimonial quote | text | Optional |
| Testimonial author | string | Optional |
| Testimonial company | string | Optional |

**Included (credibility, SEO, conversion)**

| Field | Type | Notes |
|-------|------|--------|
| Client | string, optional | e.g. "Awful Cloth" – social proof |
| Quantity | string, optional | e.g. "750 units" – scale/capability |
| Turnaround | string, optional | e.g. "4 business days" – speed |
| Featured image | image, optional | Card and OG image; fallback = first gallery image |
| Meta title | string, optional | SEO override; default = Title |
| Meta description | string, optional | SEO override; default = Short description |
| Related projects | (computed on front-end) | Section showing projects with the **same decoration**; no CMS field needed – we query by decoration slug |
| One clear CTA | (in layout) | e.g. "Get a quote for a similar project" → `/quote`; single prominent CTA per project page |

**Publishing**

| Field | Type | Notes |
|-------|------|--------|
| Published | boolean, or `status` (draft/published) | Draft = not shown on site; only admins see in Studio |
| Published at | datetime | Set when first published; used for ordering and SEO datePublished |

We can use Sanity’s **drafts** (document ID prefix `drafts.`) so "Publish" creates the non-draft version; the front-end only fetches non-draft documents.

**Keyword field (SEO):** A dedicated "keywords" field is **not recommended** for SEO. Google has ignored `<meta name="keywords">` for ranking since 2009; Bing doesn’t use it either. What actually helps: strong **title** and **meta description** (which we have), good **content** in headings and body, **structured data** (JSON-LD), and **internal links** (decoration → service, related projects). So we do **not** add a keyword field; focus stays on meta title, meta description, and content quality.

---

## 4. Studio at `/studio` and admin-only

- **Embed** Sanity Studio in the Next app at `/studio` (e.g. `app/studio/[[...index]]/page.tsx` that renders the Studio).
- **Protect** `/studio` so only admins can open it:
  - Use your existing auth (e.g. Supabase session); if not logged in or not admin, redirect to `/login` or `/dashboard`.
  - Optionally require **Sanity login** as well (Studio’s own users); then only your team has Sanity accounts. Simpler approach: protect `/studio` with your app auth only and use one Sanity project with a single dataset so only people who can hit `/studio` can edit.

---

## 5. Public site behavior

- **List:** `app/portfolio/page.tsx` – fetch all **published** projects from Sanity, order by `publishedAt` desc (or `_updatedAt`). Show category filter; categories come from Sanity (distinct from project categories). Card: featured image (or first gallery image), title, short description, client if present, category, decoration (as label and/or link to service).
- **Detail:** `app/portfolio/[slug]/page.tsx` – fetch one project by `slug`; 404 if not found or not published. Render long description with portable text component. **Decoration** → link to `/services/${decorationSlug}`. Show gallery, testimonial, product, materials, quantity, turnaround, client. **CTA:** e.g. "Get a quote for a similar project" → `/quote` or contact.
- **Sitemap:** `app/sitemap.ts` – portfolio slugs from Sanity (published only); `lastModified` from document updated/published date.
- **Rendering:** ISR (e.g. revalidate 3600) or on-demand revalidation when content is published so new/updated projects appear without full rebuild.

---

## 6. SEO

- **Meta:** Each project page: `<title>`, `<meta name="description">`, canonical URL. Use meta title/description from CMS when set, else title + short description.
- **OG/Twitter:** `og:title`, `og:description`, `og:image` (featured or first gallery image, absolute URL), `og:url`.
- **JSON-LD:** CreativeWork or Article: name, description, image, datePublished, dateModified, author (Garment Decor). Helps rich results and clarity for search engines.
- **Internal links:** Decoration → service page; "Related projects" (e.g. same category or same decoration); CTA to quote/contact.

---

## 7. Security (recap)

- **Studio:** Only admins; protect `/studio` with your auth.
- **Sanity API:** Read-only for the front-end (public token or no token for anonymous reads); write only from Studio or server with write token.
- **Content:** Portable text only (no raw HTML from CMS); images from Sanity CDN.
- **Env:** `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`; optional `SANITY_API_READ_TOKEN` for private dataset.

---

## 8. Implementation order

1. **Sanity project + schema** – Create project at sanity.io; define **Category** and **Project** document types; add decoration options (service slugs).
2. **Next + Sanity** – Install `next-sanity`, `@sanity/client`, `@sanity/image-url`; env; client and helpers (fetch projects, fetch by slug, fetch categories).
3. **Studio embed** – Mount Studio at `/studio`; protect route (admin-only).
4. **Portfolio list** – Replace hardcoded list with Sanity fetch; keep current UI; add category filter from Sanity categories.
5. **Portfolio detail** – Replace hardcoded data with Sanity fetch; portable text renderer; decoration → service link; gallery, testimonial, CTA.
6. **Sitemap** – Dynamic portfolio slugs from Sanity.
7. **SEO** – Meta, OG, JSON-LD from CMS fields.
8. **Migration** – Create the 5 existing projects (and categories) in Sanity; optionally script from current `portfolioProjects` object.
9. **Draft/publish** – Use Sanity drafts or a `published` flag; front-end only queries published; document how to publish in Studio.

---

## 9. Suggested UI/UX touches (for credibility and quotes)

- **Project cards:** Show decoration type (with link to service), category, and client when present so variety is obvious.
- **Detail page:** Near the top or after the story: **"Project at a glance"** (quantity, turnaround, decoration, product, materials) so key facts are scannable.
- **Gallery:** One main hero image; rest in a grid or lightbox so quality is clear without clutter.
- **Single clear CTA:** e.g. "Get a quote for a similar project" once per page (top or bottom), linking to `/quote` with optional query (e.g. service slug) so intent is clear.
- **Related projects:** Same category or same decoration; "More [Decoration] projects" to reinforce variety and capability.

This spec is the reference for implementation. Next step: implement Sanity project + schema, then Next integration and Studio at `/studio`.
