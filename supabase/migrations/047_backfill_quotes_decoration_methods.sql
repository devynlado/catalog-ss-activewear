-- Backfill quotes.decoration_methods for existing rows.
--
-- Mirrors deriveQuoteDecorationMethods() in lib/quote-form-options.ts:
--   - Project quotes: each items[] element carries a `decorationMethod` id.
--   - Legacy cart quotes: the row-level `decoration` JSONB has a `type` field
--     (screen/jumbo/embroidery/digital/none) which we map to canonical ids.
--
-- Rows with no decoration data stay NULL. Idempotent: only fills NULLs.
UPDATE quotes q
SET decoration_methods = sub.methods
FROM (
  SELECT id, array_agg(DISTINCT m) AS methods
  FROM (
    -- Project quotes: decorationMethod inside each items[] element
    SELECT q2.id,
           elem->>'decorationMethod' AS m
    FROM quotes q2,
         LATERAL jsonb_array_elements(
           CASE WHEN jsonb_typeof(q2.items) = 'array' THEN q2.items ELSE '[]'::jsonb END
         ) AS elem
    WHERE coalesce(elem->>'decorationMethod', '') <> ''

    UNION ALL

    -- Legacy cart quotes: decoration.type mapped to canonical ids
    SELECT q3.id,
           CASE q3.decoration->>'type'
             WHEN 'screen' THEN 'screen-printing'
             WHEN 'jumbo' THEN 'jumbo'
             WHEN 'embroidery' THEN 'embroidery'
             WHEN 'digital' THEN 'digital'
             ELSE NULL
           END AS m
    FROM quotes q3
    WHERE coalesce(q3.decoration->>'type', 'none') <> 'none'
  ) all_methods
  WHERE m IS NOT NULL
  GROUP BY id
) sub
WHERE q.id = sub.id
  AND q.decoration_methods IS NULL;
