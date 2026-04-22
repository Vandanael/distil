-- ============================================================================
-- 00033 : prefilter parametrable (min_word_count) + instrumentation cosine
--
-- Changements :
--   1. prefilter_ranking_candidates accepte min_word_count (default 100, ancien 300)
--   2. ranking_runs : colonnes cosine_p25/p50/p75 + guard_downgrades_count
--
-- Contexte : le seuil hardcode word_count >= 300 eliminait 94.6% du pool RSS
-- (mediane word_count = 41). Les feeds litteraires produisent exclusivement des
-- items courts (41-63 mots). Abaisser a 100 capture ~10% du pool au lieu de 5.4%.
-- ============================================================================

-- 1. Instrumentation : colonnes cosine sur ranking_runs
ALTER TABLE ranking_runs ADD COLUMN IF NOT EXISTS cosine_p25 FLOAT;
ALTER TABLE ranking_runs ADD COLUMN IF NOT EXISTS cosine_p50 FLOAT;
ALTER TABLE ranking_runs ADD COLUMN IF NOT EXISTS cosine_p75 FLOAT;
ALTER TABLE ranking_runs ADD COLUMN IF NOT EXISTS guard_downgrades_count INT DEFAULT 0;

-- 2. Recreer prefilter_ranking_candidates avec parametre min_word_count
DROP FUNCTION IF EXISTS prefilter_ranking_candidates(vector, UUID, TIMESTAMPTZ, INT, INT, TEXT) CASCADE;

CREATE FUNCTION prefilter_ranking_candidates(
  user_embedding vector(1024),
  target_user_id UUID,
  cutoff_time TIMESTAMPTZ,
  max_count INT DEFAULT 40,
  keyword_cap INT DEFAULT 60,
  preferred_language TEXT DEFAULT NULL,
  min_word_count INT DEFAULT 100
)
RETURNS TABLE (
  item_id UUID,
  url TEXT,
  title TEXT,
  author TEXT,
  site_name TEXT,
  published_at TIMESTAMPTZ,
  content_text TEXT,
  word_count INT,
  distance FLOAT,
  unpop_score FLOAT,
  is_keyword_hit BOOLEAN,
  matched_keywords TEXT[],
  keyword_rank FLOAT,
  source_kind TEXT
)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  WITH user_interests AS (
    SELECT COALESCE(interests, ARRAY[]::text[]) AS kws
    FROM profiles
    WHERE id = target_user_id
  ),
  base_items AS (
    SELECT
      i.id AS item_id,
      i.url,
      i.title,
      i.author,
      f.site_name,
      f.language AS feed_language,
      f.kind AS source_kind,
      i.published_at,
      i.content_text,
      i.word_count,
      (ie.embedding <=> user_embedding)::FLOAT AS distance,
      COALESCE(ip.unpop_score, 0.5) AS unpop_score,
      i.search_vector
    FROM items i
    JOIN item_embeddings ie ON ie.item_id = i.id
    JOIN feeds f ON f.id = i.feed_id
    LEFT JOIN item_popularity ip ON ip.item_id = i.id
    WHERE i.fetched_at > cutoff_time
      AND (i.user_id IS NULL OR i.user_id = target_user_id)
      AND NOT EXISTS (
        SELECT 1 FROM articles a
        WHERE a.item_id = i.id AND a.user_id = target_user_id
      )
  ),
  item_kw_scores AS (
    SELECT
      bi.item_id,
      MAX(ts_rank(bi.search_vector, plainto_tsquery('french', kw))) AS keyword_rank,
      ARRAY_AGG(DISTINCT kw ORDER BY kw) AS matched_keywords
    FROM base_items bi
    CROSS JOIN LATERAL unnest((SELECT kws FROM user_interests)) AS kw
    WHERE bi.search_vector @@ plainto_tsquery('french', kw)
    GROUP BY bi.item_id
  ),
  cosine_pool_primary AS (
    SELECT
      item_id, url, title, author, site_name, published_at,
      content_text, word_count, distance, unpop_score, source_kind
    FROM base_items
    WHERE COALESCE(word_count, 0) >= min_word_count
      AND (preferred_language IS NULL OR feed_language = preferred_language)
    ORDER BY distance
    LIMIT CASE WHEN preferred_language IS NULL THEN max_count ELSE GREATEST((max_count * 9) / 10, 1) END
  ),
  cosine_pool_secondary AS (
    SELECT
      item_id, url, title, author, site_name, published_at,
      content_text, word_count, distance, unpop_score, source_kind
    FROM base_items
    WHERE preferred_language IS NOT NULL
      AND feed_language <> preferred_language
      AND COALESCE(word_count, 0) >= min_word_count
      AND item_id NOT IN (SELECT item_id FROM cosine_pool_primary)
    ORDER BY distance
    LIMIT CASE WHEN preferred_language IS NULL THEN 0 ELSE GREATEST(max_count / 10, 1) END
  ),
  cosine_pool AS (
    SELECT * FROM cosine_pool_primary
    UNION ALL
    SELECT * FROM cosine_pool_secondary
  ),
  keyword_pool AS (
    SELECT
      bi.item_id, bi.url, bi.title, bi.author, bi.site_name, bi.published_at,
      bi.content_text, bi.word_count, bi.distance, bi.unpop_score, bi.source_kind
    FROM base_items bi
    JOIN item_kw_scores iks ON iks.item_id = bi.item_id
    WHERE bi.item_id NOT IN (SELECT item_id FROM cosine_pool)
    ORDER BY iks.keyword_rank DESC
    LIMIT keyword_cap
  ),
  all_pool AS (
    SELECT * FROM cosine_pool
    UNION ALL
    SELECT * FROM keyword_pool
  )
  SELECT
    ap.item_id,
    ap.url,
    ap.title,
    ap.author,
    ap.site_name,
    ap.published_at,
    ap.content_text,
    ap.word_count,
    ap.distance,
    ap.unpop_score,
    (iks.item_id IS NOT NULL) AS is_keyword_hit,
    COALESCE(iks.matched_keywords, ARRAY[]::text[]) AS matched_keywords,
    COALESCE(iks.keyword_rank, 0)::FLOAT AS keyword_rank,
    ap.source_kind
  FROM all_pool ap
  LEFT JOIN item_kw_scores iks ON iks.item_id = ap.item_id
  ORDER BY ap.distance;
$$;