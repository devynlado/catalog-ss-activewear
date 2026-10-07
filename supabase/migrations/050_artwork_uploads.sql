-- Customer artwork uploads for leads (contacts) and quotes.
--
-- BACKGROUND
-- ----------
-- Every lead/quote form shows an artwork upload widget, but historically the
-- selected file was held client-side only and never persisted or emailed
-- (see lib/forms/DesignUpload history). This migration adds the storage
-- columns so uploads can finally be saved.
--
-- The actual file bytes live in the PRIVATE Supabase Storage bucket
-- `quote-artwork` (created manually in the dashboard — buckets are not part of
-- the SQL schema). These columns store the storage *paths*; the app mints
-- short-lived signed URLs on demand for admin download + email links.
--
-- Shape:
--   contacts.artwork_paths : TEXT[]  one or more storage paths per lead
--   quotes.artwork_paths   : TEXT[]  aggregated paths across all projects
--                                     (per-project path also lives inside
--                                      quotes.items[].artworkPath JSONB)
--
-- No backfill is possible: artwork submitted before this change never left the
-- customer's browser and is unrecoverable.

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS artwork_paths TEXT[];

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS artwork_paths TEXT[];
