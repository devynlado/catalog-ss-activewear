-- Add decoration_methods column to quotes table
-- Denormalizes the decoration/project category out of the `items` JSONB (and
-- the legacy row-level `decoration` blob) into an indexable TEXT[] so the
-- /admin/quotes "Project Category" filter can query it server-side.
--
-- Stores canonical decoration-method ids (see DECORATION_METHOD_OPTIONS in
-- lib/quote-form-options.ts):
--   'screen-printing' | 'embroidery' | 'digital' | 'jumbo' | 'finishing'
--
-- New quotes populate this at write time (app/api/quote/submit/route.ts);
-- existing quotes are backfilled in 047_backfill_quotes_decoration_methods.sql.
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS decoration_methods TEXT[];

-- GIN index supports fast array-containment queries (decoration_methods @> ARRAY[...]).
CREATE INDEX IF NOT EXISTS idx_quotes_decoration_methods ON quotes USING GIN (decoration_methods);
