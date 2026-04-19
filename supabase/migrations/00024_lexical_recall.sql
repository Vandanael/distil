-- Sprint A : recall garanti sur les mots-cles declares.
-- Ajoute un pass lexical (tsvector FR) en complement du prefilter cosine, et
-- expose les keyword_hits au LLM ainsi qu'a l'UI. Voir ADR-0012.

-- 1. Extension unaccent : normalisation SQL coherente avec la normalisation TS.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. tsvector GENERATED sur items pour la recherche full-text francaise.
--    search_vector couvre title + content_text. GIN index sur la colonne pour
--    le pass lexical et la RPC list_keyword_hits.
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'french',
      coalesce(title, '') || ' ' || coalesce(content_text, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_items_search_vector
  ON items USING gin (search_vector);

-- 3. Normalisation des keywords : lowercase + unaccent + trim. IMMUTABLE pour
--    pouvoir etre reutilisee dans des index/colonnes generees plus tard.
CREATE OR REPLACE FUNCTION normalize_keyword(kw TEXT)
  RETURNS TEXT
  LANGUAGE sql
  IMMUTABLE
  SET search_path = public, pg_temp
AS $$
  SELECT btrim(lower(unaccent(kw)));
$$;

-- 4. Backfill des profiles.interests existants : normaliser + dedup.
--    Non destructif (array_length > 0 uniquement, garde l'ordre non garanti).
UPDATE profiles
SET interests = (
  SELECT ARRAY(
    SELECT DISTINCT normalize_keyword(k)
    FROM unnest(interests) k
    WHERE length(btrim(k)) > 0
  )
)
WHERE array_length(interests, 1) > 0;

-- 5. Telemetrie : ajoute 2 colonnes a ranking_runs pour mesurer le recall.
--    keyword_hits_count  = nb candidates marques is_keyword_hit dans le prompt.
--    keyword_hits_promoted = nb keyword_hits qui atteignent essential ou surprise.
ALTER TABLE ranking_runs
  ADD COLUMN IF NOT EXISTS keyword_hits_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS keyword_hits_promoted INTEGER NOT NULL DEFAULT 0;

-- 6. RPC v2 : prefilter_ranking_candidates retourne 2 pools fusionnes.
--    cosine_pool : top max_count par distance, word_count >= 300.
--    keyword_pool : items 48h qui matchent un keyword via tsvector @@ tsquery,
--                   dedupes du cosine_pool, cap keyword_cap, sans filtre densite.
--    is_keyword_hit  : true ssi l'item matche au moins un keyword utilisateur.
--    matched_keywords : liste des keywords matches (pour prompt [MATCH:...]).
DROP FUNCTION IF EXISTS prefilter_ranking_candidates(vector, UUID, TIMESTAMPTZ, INT);

CREATE OR REPLACE FUNCTION prefilter_ranking_candidates(
  user_embedding vector(1024),
  target_user_id UUID,
  cutoff_time TIMESTAMPTZ,
  max_count INT DEFAULT 40,
  keyword_cap INT DEFAULT 40
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
  matched_keywords TEXT[]
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
  cosine_pool AS (
    SELECT
      item_id, url, title, author, site_name, published_at,
      content_text, word_count, distance, unpop_score, search_vector
    FROM base_items
    WHERE COALESCE(word_count, 0) >= 300
    ORDER BY distance
    LIMIT max_count
  ),
  keyword_pool AS (
    SELECT DISTINCT ON (bi.item_id)
      bi.item_id, bi.url, bi.title, bi.author, bi.site_name, bi.published_at,
      bi.content_text, bi.word_count, bi.distance, bi.unpop_score, bi.search_vector
    FROM base_items bi
    CROSS JOIN LATERAL unnest((SELECT kws FROM user_interests)) AS kw
    WHERE bi.search_vector @@ plainto_tsquery('french', kw)
      AND bi.item_id NOT IN (SELECT item_id FROM cosine_pool)
    ORDER BY bi.item_id, bi.distance
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
    (matched.kws IS NOT NULL AND array_length(matched.kws, 1) > 0) AS is_keyword_hit,
    COALESCE(matched.kws, ARRAY[]::text[]) AS matched_keywords
  FROM all_pool ap
  CROSS JOIN LATERAL (
    SELECT ARRAY(
      SELECT kw
      FROM unnest((SELECT kws FROM user_interests)) AS kw
      WHERE ap.search_vector @@ plainto_tsquery('french', kw)
    ) AS kws
  ) matched;
$$;

-- 7. RPC UI : list_keyword_hits liste les items 48h matchant chaque keyword
--    de l'utilisateur, sans cap, pour la section "Tous vos mots-cles" du feed.
--    1 ligne par (item, keyword) : l'UI groupe cote serveur.
CREATE OR REPLACE FUNCTION list_keyword_hits(
  target_user_id UUID,
  cutoff_time TIMESTAMPTZ
)
RETURNS TABLE (
  keyword TEXT,
  item_id UUID,
  url TEXT,
  title TEXT,
  site_name TEXT,
  published_at TIMESTAMPTZ,
  word_count INT
)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    kw AS keyword,
    i.id AS item_id,
    i.url,
    i.title,
    f.site_name,
    i.published_at,
    i.word_count
  FROM profiles p
  CROSS JOIN LATERAL unnest(COALESCE(p.interests, ARRAY[]::text[])) AS kw
  JOIN items i ON i.search_vector @@ plainto_tsquery('french', kw)
  JOIN feeds f ON f.id = i.feed_id
  WHERE p.id = target_user_id
    AND i.fetched_at > cutoff_time
    AND NOT EXISTS (
      SELECT 1 FROM articles a
      WHERE a.item_id = i.id AND a.user_id = target_user_id
    )
  ORDER BY kw, i.published_at DESC NULLS LAST;
$$;

-- list_keyword_hits est appele par le user courant via la session SSR.
-- L'appelant ne peut lire que son propre profil (RLS profiles), donc
-- passer un target_user_id d'un autre user renverra 0 ligne.
REVOKE ALL ON FUNCTION list_keyword_hits(UUID, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION list_keyword_hits(UUID, TIMESTAMPTZ) TO authenticated, service_role;
