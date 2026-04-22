-- ============================================================================
-- 00034 : boost des feeds pinned dans le prefilter cosine
--
-- Changements :
--   1. prefilter_ranking_candidates accepte pinned_feed_ids (default '{}')
--   2. Items des feeds pinned remontent dans le pool cosine via un boost
--      de -0.1 applique a la distance (sans artificiellement gonfler le score).
--
-- Contexte : les sources pinned par l'utilisateur sont ignorees par le ranker.
-- Elles influencent ingestion et scoring mais pas le ranking. Ce boost fait
-- remonter les items des feeds pinned devant les items de meme distance cosine.
-- ============================================================================

DROP FUNCTION IF EXISTS prefilter_ranking_candidates(vector, UUID, TIMESTAMPTZ, INT, INT, TEXT, INT) CASCADE;

CREATE FUNCTION prefilter_ranking_candidates(
  user_embedding vector(1024),
  target_user_id UUID,
  cutoff_time TIMESTAMPTZ,
  max_count INT DEFAULT 40,
  keyword_cap INT DEFAULT 60,
  preferred_language TEXT DEFAULT NULL,
  min_word_count INT DEFAULT 100,
  pinned_feed_ids UUID[] DEFAULT '{}'
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
      CASE WHEN i.feed_id = ANY(pinned_feed_ids) THEN -0.1 ELSE 0 END + (ie.embedding <=> user_embedding)::FLOAT AS boosted_distance,
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
    ORDER BY boosted_distance
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
    ORDER BY boosted_distance
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