-- Sprint A PR2 : weighted tsvector + ts_rank + telemetrie force-inject.
-- Un match dans le titre pese beaucoup plus qu'un match dans le corps
-- (setweight A vs B). Le keyword_pool est trie par ts_rank DESC, donc les
-- meilleurs matches entrent meme si le pool est sature. Expose keyword_rank
-- pour que le ranking-agent puisse injecter de force les top N keyword_hits
-- si le LLM les exclut a tort.

-- 1. Remplace search_vector par une version weighted.
--    GENERATED STORED ne peut pas etre ALTER en place -> DROP + recreate.
--    Le index GIN est reconstruit dans la foulee.
DROP INDEX IF EXISTS idx_items_search_vector;
ALTER TABLE items DROP COLUMN IF EXISTS search_vector;

ALTER TABLE items
  ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(content_text, '')), 'B')
  ) STORED;

CREATE INDEX idx_items_search_vector
  ON items USING gin (search_vector);

-- 2. Telemetrie : nb keyword_hits force-injectes dans essential apres LLM.
--    Si ce compteur est non-nul, le LLM ignore la regle [MATCH]. Si il est
--    toujours 0, la regle tient (ou on n'a jamais de keyword_hit eligible).
ALTER TABLE ranking_runs
  ADD COLUMN IF NOT EXISTS keyword_hits_force_injected INTEGER NOT NULL DEFAULT 0;

-- 3. RPC v3 : ajoute keyword_rank dans la sortie, trie keyword_pool par
--    ts_rank DESC. Cap par defaut monte a 60 pour laisser respirer le pool
--    apres ponderation (les items faibles sortent, ceux qui restent sont
--    mieux qualifies).
DROP FUNCTION IF EXISTS prefilter_ranking_candidates(vector, UUID, TIMESTAMPTZ, INT, INT);

CREATE OR REPLACE FUNCTION prefilter_ranking_candidates(
  user_embedding vector(1024),
  target_user_id UUID,
  cutoff_time TIMESTAMPTZ,
  max_count INT DEFAULT 40,
  keyword_cap INT DEFAULT 60
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
  keyword_rank FLOAT
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
      AND NOT EXISTS (
        SELECT 1 FROM articles a
        WHERE a.item_id = i.id AND a.user_id = target_user_id
      )
  ),
  -- ts_rank aggregé : pour chaque item qui matche au moins un keyword,
  -- on garde le meilleur rank (max) + la liste triée des keywords matchés.
  -- setweight A (titre) donne un rank 5-10x superieur a B (corps).
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
  cosine_pool AS (
    SELECT
      item_id, url, title, author, site_name, published_at,
      content_text, word_count, distance, unpop_score
    FROM base_items
    WHERE COALESCE(word_count, 0) >= 300
    ORDER BY distance
    LIMIT max_count
  ),
  keyword_pool AS (
    SELECT
      bi.item_id, bi.url, bi.title, bi.author, bi.site_name, bi.published_at,
      bi.content_text, bi.word_count, bi.distance, bi.unpop_score
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
    COALESCE(iks.keyword_rank, 0)::FLOAT AS keyword_rank
  FROM all_pool ap
  LEFT JOIN item_kw_scores iks ON iks.item_id = ap.item_id;
$$;
