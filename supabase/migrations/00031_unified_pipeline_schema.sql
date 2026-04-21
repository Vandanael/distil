-- Unification pipelines RSS + decouverte agent.
-- 1. feeds.kind : distingue les feeds RSS classiques des feeds fictifs "agent".
-- 2. items.user_id : NULL pour RSS (pool global partage), UUID pour decouverte agent
--    (isolee par user, evite de polluer le pool des autres).
-- 3. profiles.discovery_mode : toggle user pour arbitrer l'intensite de la decouverte.
-- 4. RPC prefilter_ranking_candidates v5 : remonte source_kind + filtre sur items.user_id.
-- 5. Nouveau RPC count_relevant_rss : compte les items RSS pertinents (apres filtre cosine)
--    pour un user donne. Utilise par la ponderation adaptative du ranker (PR3).
-- Aucune donnee existante impactee : les pipelines A et B continuent de fonctionner
-- tant que le code applicatif n'a pas bascule (PR2, PR3, PR4).

-- ============================================================================
-- 1. feeds.kind
-- ============================================================================
ALTER TABLE feeds ADD COLUMN kind TEXT NOT NULL DEFAULT 'rss'
  CHECK (kind IN ('rss', 'agent'));

CREATE INDEX idx_feeds_kind_active ON feeds(kind) WHERE active = true;

-- ============================================================================
-- 2. items.user_id (NULL = RSS global, UUID = decouverte agent isolee)
-- ============================================================================
ALTER TABLE items ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_items_user_fetched ON items (user_id, fetched_at DESC)
  WHERE user_id IS NOT NULL;

-- ============================================================================
-- 3. Seed des 2 feeds fictifs "agent" (un par langue pour preserver le biais locale)
-- ============================================================================
INSERT INTO feeds (url, title, site_name, language, kind, active) VALUES
  ('internal://agent-discovery/fr', 'Decouverte agent (FR)', 'Decouverte', 'fr', 'agent', true),
  ('internal://agent-discovery/en', 'Decouverte agent (EN)', 'Decouverte', 'en', 'agent', true)
ON CONFLICT (url) DO NOTHING;

-- ============================================================================
-- 4. profiles.discovery_mode : 'active' (defaut) ou 'sources_first'
-- ============================================================================
ALTER TABLE profiles ADD COLUMN discovery_mode TEXT NOT NULL DEFAULT 'active'
  CHECK (discovery_mode IN ('active', 'sources_first'));

-- ============================================================================
-- 5. RPC prefilter_ranking_candidates v5
--    Ajouts vs v4 :
--      - source_kind TEXT en sortie (= f.kind), utilise par le ranker pour
--        appliquer la ponderation RSS/agent.
--      - Clause items.user_id IS NULL OR items.user_id = target_user_id :
--        expose les items RSS (user_id NULL) + les items decouverte agent
--        appartenant au user courant uniquement.
--    Le reste (biais locale 90/10, keyword pool, densite >= 300 mots) est inchange.
-- ============================================================================
DROP FUNCTION IF EXISTS prefilter_ranking_candidates(vector, UUID, TIMESTAMPTZ, INT, INT, TEXT) CASCADE;

CREATE FUNCTION prefilter_ranking_candidates(
  user_embedding vector(1024),
  target_user_id UUID,
  cutoff_time TIMESTAMPTZ,
  max_count INT DEFAULT 40,
  keyword_cap INT DEFAULT 60,
  preferred_language TEXT DEFAULT NULL
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
    WHERE COALESCE(word_count, 0) >= 300
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
      AND COALESCE(word_count, 0) >= 300
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
  LEFT JOIN item_kw_scores iks ON iks.item_id = ap.item_id;
$$;

-- ============================================================================
-- 6. RPC count_relevant_rss
--    Retourne le nombre d'items RSS (kind='rss', active) pertinents pour le user :
--      - fetched_at dans les N derniers jours (lookback_days, defaut 7)
--      - cosine distance < distance_max (defaut 0.5)
--      - pas encore montres (NOT EXISTS articles)
--    Utilise par rankForUser pour calculer rssRatio = clamp(rssAvailable / (dailyCap * 2), 0.25, 0.75).
-- ============================================================================
CREATE OR REPLACE FUNCTION count_relevant_rss(
  target_user_id UUID,
  user_embedding vector(1024),
  distance_max FLOAT DEFAULT 0.5,
  lookback_days INT DEFAULT 7
)
RETURNS INT
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COUNT(*)::INT
  FROM items i
  JOIN item_embeddings ie ON ie.item_id = i.id
  JOIN feeds f ON f.id = i.feed_id
  WHERE f.kind = 'rss'
    AND f.active = true
    AND i.user_id IS NULL
    AND i.fetched_at > NOW() - make_interval(days => lookback_days)
    AND (ie.embedding <=> user_embedding) < distance_max
    AND NOT EXISTS (
      SELECT 1 FROM articles a
      WHERE a.item_id = i.id AND a.user_id = target_user_id
    );
$$;
