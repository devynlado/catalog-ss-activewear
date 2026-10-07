# Artwork storage bucket setup (`quote-artwork`)

Customer artwork uploaded through the lead/quote forms is stored in a **private**
Supabase Storage bucket named `quote-artwork`. Storage buckets are not part of
the SQL schema, so they can't be created by a migration — create it once per
environment (production + any preview/staging project) using either option
below.

## What the app expects

- **Bucket name:** `quote-artwork` (exact — see `ARTWORK_BUCKET` in `lib/artwork.ts`)
- **Visibility:** Private (NOT public)
- **Allowed types:** PNG, JPG/JPEG, WEBP, PDF (SVG rejected)
- **Max file size:** 20 MB

No Row Level Security policies are required. The app only ever touches this
bucket with the **service-role key** (server-side) and with **signed
upload/download URLs**, both of which bypass RLS:

- Uploads: the browser gets a one-time *signed upload URL* from
  `POST /api/quote/artwork/upload` and PUTs the file straight to storage.
- Downloads: the server mints short-lived *signed download URLs* on demand for
  the admin dashboard (1 hour) and notification emails (7 days).

## Option A — Supabase Dashboard (quickest)

1. Open your project → **Storage** → **New bucket**.
2. Name it `quote-artwork`.
3. Leave **Public bucket** toggled **OFF** (keep it private).
4. (Optional) Set an upload file-size limit of `20 MB` and restrict allowed MIME
   types to `image/png, image/jpeg, image/webp, application/pdf`.
5. Create the bucket. Done.

## Option B — SQL (run in the SQL editor)

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quote-artwork',
  'quote-artwork',
  false,
  20971520, -- 20 MB
  array['image/png','image/jpeg','image/webp','application/pdf']
)
on conflict (id) do nothing;
```

## Required environment variables

These already exist for the rest of the app; the artwork feature reuses them:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (falls back to `SUPABASE_SERVICE_ROLE_KEY`)

## Verifying

After creating the bucket, submit a test lead/quote with an image attached:

- The notification email to `info@garmentdecor.com` should show a thumbnail +
  "Download" link.
- `/admin/contacts` (expand the lead) and `/admin/quotes` should show the
  artwork with a working download button.

If the upload endpoint returns *"Artwork storage is not configured yet"*, the
bucket is missing or misnamed.
