-- Backfill orders.visitor_source for all existing rows.
--
-- This CASE expression is a 1:1 port of classifyOrderSource() in
-- lib/order-source.ts. The priority order MUST match the TS classifier so the
-- server-side filter and the live badge on OrderCard never disagree:
--   1. Google Ads : gclid present, or utm_medium in (cpc/ppc/paid)
--   2. AI/ChatGPT : utm_medium = 'ai', or utm_source matches a known AI host
--   3. Organic    : utm_medium = 'organic', or utm_source in (google/bing/yahoo)
--   4. Social     : utm_medium = 'social', or utm_source is a known social host
--   5. Referral   : utm_medium = 'referral'
--   6. Email      : utm_medium = 'email'
--   7. Other      : any other non-empty utm_source/utm_medium
--   8. Referrer fallback (only when no utm data): ai/organic/social else referral
--   9. Direct     : no attribution at all
--
-- Idempotent: only touches rows that have not been classified yet.
UPDATE orders
SET visitor_source = CASE
  -- 1. Google Ads
  WHEN gclid IS NOT NULL
       OR lower(coalesce(utm_medium, '')) IN ('cpc', 'ppc', 'paid')
    THEN 'google_ads'

  -- 2. AI / ChatGPT (via utm)
  WHEN lower(coalesce(utm_medium, '')) = 'ai'
       OR lower(coalesce(utm_source, '')) LIKE '%chatgpt%'
       OR lower(coalesce(utm_source, '')) LIKE '%chat.openai%'
       OR lower(coalesce(utm_source, '')) LIKE '%openai%'
       OR lower(coalesce(utm_source, '')) LIKE '%perplexity%'
       OR lower(coalesce(utm_source, '')) LIKE '%gemini%'
       OR lower(coalesce(utm_source, '')) LIKE '%copilot%'
       OR lower(coalesce(utm_source, '')) LIKE '%claude.ai%'
    THEN 'ai'

  -- 3. Organic Search (via utm)
  WHEN lower(coalesce(utm_medium, '')) = 'organic'
       OR lower(coalesce(utm_source, '')) IN ('google', 'bing', 'yahoo')
    THEN 'organic_search'

  -- 4. Social (via utm)
  WHEN lower(coalesce(utm_medium, '')) = 'social'
       OR lower(coalesce(utm_source, '')) IN (
         'facebook', 'instagram', 'tiktok', 'twitter', 'linkedin',
         'pinterest', 'youtube', 'reddit', 'x.com'
       )
    THEN 'social'

  -- 5. Referral (via utm)
  WHEN lower(coalesce(utm_medium, '')) = 'referral' THEN 'referral'

  -- 6. Email (via utm)
  WHEN lower(coalesce(utm_medium, '')) = 'email' THEN 'email'

  -- 7. Any other tagged-but-uncategorized utm data
  WHEN coalesce(utm_source, '') <> '' OR coalesce(utm_medium, '') <> ''
    THEN 'other'

  -- 8. Referrer fallback (only reached when no utm data at all)
  WHEN coalesce(referrer, '') <> '' THEN CASE
    WHEN lower(referrer) LIKE '%chatgpt%'
         OR lower(referrer) LIKE '%chat.openai%'
         OR lower(referrer) LIKE '%openai%'
         OR lower(referrer) LIKE '%perplexity%'
         OR lower(referrer) LIKE '%gemini%'
         OR lower(referrer) LIKE '%copilot%'
         OR lower(referrer) LIKE '%claude.ai%'
      THEN 'ai'
    WHEN lower(referrer) LIKE '%google%'
         OR lower(referrer) LIKE '%bing%'
         OR lower(referrer) LIKE '%yahoo%'
         OR lower(referrer) LIKE '%duckduckgo%'
         OR lower(referrer) LIKE '%baidu%'
         OR lower(referrer) LIKE '%yandex%'
      THEN 'organic_search'
    WHEN lower(referrer) LIKE '%facebook%'
         OR lower(referrer) LIKE '%instagram%'
         OR lower(referrer) LIKE '%tiktok%'
         OR lower(referrer) LIKE '%twitter%'
         OR lower(referrer) LIKE '%linkedin%'
         OR lower(referrer) LIKE '%pinterest%'
         OR lower(referrer) LIKE '%youtube%'
         OR lower(referrer) LIKE '%reddit%'
         OR lower(referrer) LIKE '%x.com%'
      THEN 'social'
    ELSE 'referral'
  END

  -- 9. Direct (no attribution)
  ELSE 'direct'
END
WHERE visitor_source IS NULL;
