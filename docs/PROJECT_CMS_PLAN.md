# Project Portfolio CMS – Plan & Design

Plan for a WordPress-style Project/Portfolio CMS so your team can upload, edit, and delete portfolio projects, with strong SEO and security. This doc covers the approach, tradeoffs, and open questions before implementation.

---

## 1. Current state

- **Portfolio today:** Content is **hardcoded** in two places:
  - `app/portfolio/page.tsx` – list of 5 projects (slug, title, category, client, image).
  - `app/portfolio/[slug]/page.tsx` – full project data in a large `portfolioProjects` object (title, slug, category, tags, product, decoration, client, quantity, turnaround, description, highlights, equipment, pricingHint, testimonial, images[], relatedService, etc.).
- **Sitemap:** `app/sitemap.ts` uses a **hardcoded** list of portfolio slugs; new projects won’t appear unless you edit code.
- **SEO:** Detail page sets `metadata` (title, description) and you have `ArticleJsonLd` in the codebase; portfolio pages could use it or a more specific schema (e.g. CreativeWork).
- **No CMS:** No admin UI to add/edit/delete projects; no Sanity (or other) integration in `package.json` yet. The branch is `sanity-cms`, so the plan assumes **Sanity.io** unless you prefer something else.

---

## 2. CMS choice: Sanity vs alternatives

| Option | Pros | Cons |
|--------|------|------|
| **Sanity.io** | Real-time, flexible schema, good DX, hosted Studio, image pipeline, free tier. Fits “content team edits without code.” | Another service and env vars; learning curve for schema (GROQ). |
| **Supabase (your existing DB)** | Single backend, you already have auth and admin patterns. | You build the whole admin UI and asset storage (or use Supabase Storage); more custom code and maintenance. |
| **Headless WordPress** | Familiar WP admin. | Heavier, often overkill for “projects + images,” and you’d host or manage WP. |

**Recommendation:** Use **Sanity** on the `sanity-cms` branch: schema fits “project + rich fields + images,” Studio gives your team a WordPress-like experience, and the Next app stays the source of truth for front-end and SEO. We keep Supabase for app data (users, orders, quotes); Sanity only for marketing/portfolio content.

**If you’d rather avoid a new vendor:** We can design a **Supabase-backed** project CMS (new `projects` table + admin UI under `/admin/projects`) and keep everything in one place; you’ll get less out-of-the-box polish than Sanity Studio but full control.

---

## 3. Data model (projects)

Mirror your current structure so we can migrate the existing 5 projects and keep the same front-end layout. Each project would have:

- **Identity:** `_id`, `slug` (unique, URL-safe), `title`.
- **Classification:** `category` (e.g. Screen Printing, Embroidery), `tags[]`.
- **Story:** `description` (long text / portable text), `highlights[]`, optional `testimonial` (quote, author, company).
- **Details:** `client`, `quantity`, `turnaround`, `decoration`, `relatedService`, `relatedServiceLink`.
- **Product:** `product` (name, style, categoryLink, categoryName, material, color).
- **Pricing hint:** optional `pricingHint` (low, high, note).
- **Media:** `images[]` (references to Sanity image assets or URLs).
- **Process:** `equipment[]` (list of strings).
- **SEO:** `metaTitle`, `metaDescription`, `ogImage` (optional override).
- **Lifecycle:** `publishedAt`, `updatedAt` (or Sanity’s `_updatedAt`); optional “draft” vs “published” if you want preview.

Slug should be editable but unique; we’ll validate and optionally auto-generate from title (like WordPress “post slug”).

---

## 4. Admin experience (WordPress-like)

- **Where:** Sanity Studio, either:
  - **Embedded** at e.g. `yoursite.com/studio` (same repo, deploy with the site), or
  - **Hosted** at a separate URL (e.g. `yourproject.sanity.studio`) and only your team has the link.
- **What editors do:** Create/edit/delete “Project” documents; set slug, title, category, description, images, client, product, etc. Preview can be “open front-end in new tab” with a draft slug or a “Preview” link that uses a draft token.
- **Roles:** Sanity supports roles (e.g. editor vs admin). Start with one role; add more if needed.
- **Media:** Upload images in Studio; we’ll use Sanity’s image URL builder for responsive/optimized images on the site (and for OG images).

If we use **Supabase instead**, the admin would be a custom UI under `/admin/projects` (list, create, edit, delete) with your existing admin auth; we’d need file upload (e.g. Supabase Storage) and a simple image pipeline (or external image CDN).

---

## 5. Public site and rendering

- **Portfolio list:** `app/portfolio/page.tsx` – fetch all *published* projects from Sanity (or Supabase), ordered by date; show category filter and cards as today.
- **Project detail:** `app/portfolio/[slug]/page.tsx` – fetch one project by `slug`; 404 if not found or not published.
- **Rendering:** Prefer **ISR** (Incremental Static Regeneration) so new/updated projects appear without a full rebuild: e.g. `revalidate = 3600` (1 hour) or on-demand revalidate when content is published. Alternative: **SSR** for always-fresh content at the cost of a bit more latency.
- **URLs:** Keep current pattern: `/portfolio`, `/portfolio/[slug]`. No change for users or existing links.

---

## 6. SEO

- **Meta:** Every project page: `<title>`, `<meta name="description">`, canonical URL. Prefer fields from CMS (`metaTitle`, `metaDescription`); fallback to `title` and first 160 chars of `description`.
- **Open Graph / Twitter:** `og:title`, `og:description`, `og:image`, `og:url`. Use project image(s) or `ogImage`; absolute URLs.
- **Structured data:** Use **CreativeWork** (or **Article**) in JSON-LD: name, description, image, datePublished, dateModified, author (e.g. Garment Decor). Already have `ArticleJsonLd`; we can add a `CreativeWorkJsonLd` or map projects to Article if that fits your content type.
- **Sitemap:** `app/sitemap.ts` – replace hardcoded portfolio slugs with a **dynamic** list from Sanity (or Supabase): all published projects’ slugs; set `lastModified` from CMS date so search engines see updates.
- **Internal links:** Keep “Related projects,” “Related service,” and category links so new projects get linked naturally.
- **Performance:** Use Sanity’s image CDN (or optimized images) so LCP and Core Web Vitals stay good; lazy-load below-the-fold images.

---

## 7. Security

- **Sanity:** Studio is not public by default; you protect it by not linking it from the marketing site or by putting it behind auth (e.g. Next auth middleware for `/studio`). Sanity’s API is read-only for anonymous by default; write access only with tokens. **Never** expose a write token in the front-end; use it only in Studio or in server-side scripts (e.g. seed data). Use **CORS** and **dataset** permissions in the Sanity project settings.
- **Content safety:** Store content in Sanity (or DB); render with React. Avoid `dangerouslySetInnerHTML` for rich text; use Sanity’s portable text renderer so we don’t inject raw HTML from the CMS.
- **File uploads:** In Sanity, asset type and size limits are configurable; restrict to images (and allowed MIME types) so we don’t accept executables or scripts. If you add Supabase Storage for a custom CMS, validate file type and size and scan if needed.
- **Env:** Store `SANITY_PROJECT_ID`, `SANITY_DATASET`, and any server-side token in env vars; never in client bundles.

---

## 8. Downstream impact

- **Sitemap:** Will depend on CMS data; no more hardcoded portfolio list.
- **Portfolio list and detail:** Will fetch from CMS; existing layout and components can stay, we only swap data source.
- **Guides / services / home:** Any component that links to “portfolio” or “recent projects” can use the same CMS query (e.g. “last 3 projects”) so new projects show up automatically.
- **Build/deploy:** With ISR, first load after deploy might still need to hit Sanity; ensure env is available at build time for any static generation you keep.

---

## 9. Upstream impact

- **Dependencies:** Add `next-sanity`, `@sanity/client`, `@sanity/image-url`, and optionally `styled-components` (if we embed Studio and it’s required by the Studio version).
- **Env:** `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`; optionally `SANITY_API_READ_TOKEN` if the dataset is private.
- **Content migration:** The 5 existing projects need to be created in Sanity (or Supabase) once; we can provide a one-off script that reads the current `portfolioProjects` object and creates documents.

---

## 10. Implementation order (suggested)

1. **Sanity project + schema:** Create project on sanity.io, define “Project” document type with fields above.
2. **Next + Sanity:** Install deps, env, client, and a small fetch helper (get all projects, get by slug).
3. **Migrate content:** Script or manual entry of the 5 existing projects into Sanity.
4. **Portfolio list page:** Replace hardcoded list with CMS fetch; keep UI.
5. **Portfolio detail page:** Replace hardcoded object with CMS fetch by slug; keep layout and components; add metadata and JSON-LD from CMS.
6. **Sitemap:** Dynamic portfolio slugs from Sanity.
7. **Studio:** Embed or deploy Sanity Studio; restrict access; document how the team edits.
8. **SEO pass:** Meta, OG, JSON-LD, and image URLs verified; optional `CreativeWorkJsonLd` if we add it.
9. **Optional:** Draft/preview and on-demand revalidation when content is published.

---

## 11. Open questions for you

1. **CMS lock-in:** Are you set on **Sanity** for this branch, or do you want to compare with a **Supabase-only** project CMS (no Sanity)?
2. **Studio access:** Prefer Studio **embedded** at e.g. `/studio` (behind your auth?) or **hosted** at a separate Sanity URL and only shared with the team?
3. **Draft vs published:** Do you need “draft” projects that don’t show on the site until someone clicks “Publish,” or is “save = live” enough for now?
4. **Who edits:** Only admins, or also e.g. sales reps? (Affects whether we reuse your existing admin auth for Studio or rely on Sanity’s own login.)
5. **Images:** Are current project images only external URLs (e.g. Unsplash), or do you already have assets you want to upload? (Determines whether we need to migrate image URLs or only content.)
6. **Categories:** Should categories be **free text** (as now) or a **fixed list** (e.g. dropdown in CMS) so the filter on `/portfolio` and schema stay consistent?
7. **Related service / product links:** Keep as manual text + URL fields, or do you want to link to “Service” or “Product” entities in the CMS/catalog later?

Once you answer these, we can lock the approach and implement step by step (starting with Sanity project + schema, or with Supabase schema + admin UI if you choose that path).
