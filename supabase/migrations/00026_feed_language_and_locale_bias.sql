-- Sprint 38.5 : biais locale dans le ranking.
-- 1. Ajoute feeds.language (fr / en) et backfill les feeds existants.
-- 2. Seed ~48 feeds FR pour equilibrer le pool (majoritairement EN jusqu'a present).
-- 3. Recree prefilter_ranking_candidates avec un parametre preferred_language :
--    90% du pool cosine dans la langue preferee, 10% dans l'autre (fallback gemmes).
--    NULL = pas de biais (comportement actuel, retro-compatible).

-- ============================================================================
-- 1. Colonne feeds.language + index partiel pour filtrage rapide
-- ============================================================================
ALTER TABLE feeds ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

CREATE INDEX IF NOT EXISTS idx_feeds_language_active
  ON feeds(language)
  WHERE active = true;

-- Backfill des 5 feeds FR existants + The Conversation FR
UPDATE feeds SET language = 'fr'
WHERE site_name IN ('lemonde.fr', 'lequipe.fr', 'lesechos.fr', 'telerama.fr', 'usbeketrica.com')
   OR url LIKE '%theconversation.com/fr%';

-- ============================================================================
-- 2. Seed 48 nouveaux feeds FR (tous themes : presse, tech, culture, sciences,
--    ecologie, musique, cinema, litterature, jeux video, photo, sante, longreads)
-- ============================================================================
INSERT INTO feeds (url, title, site_name, language) VALUES
  -- Presse generaliste
  ('https://www.mediapart.fr/articles/feed', 'Mediapart', 'mediapart.fr', 'fr'),
  ('https://www.liberation.fr/arc/outboundfeeds/rss/?outputType=xml', 'Liberation', 'liberation.fr', 'fr'),
  ('https://www.lefigaro.fr/rss/figaro_actualites.xml', 'Le Figaro', 'lefigaro.fr', 'fr'),
  ('https://www.francetvinfo.fr/titres.rss', 'France Info', 'francetvinfo.fr', 'fr'),
  ('https://www.radiofrance.fr/franceculture/rss', 'France Culture', 'radiofrance.fr', 'fr'),
  ('https://www.radiofrance.fr/franceinter/rss', 'France Inter', 'franceinter.fr', 'fr'),
  ('https://www.nouvelobs.com/rss.xml', 'L''Obs', 'nouvelobs.com', 'fr'),
  ('https://www.latribune.fr/feed.xml', 'La Tribune', 'latribune.fr', 'fr'),
  ('https://www.marianne.net/rss.xml', 'Marianne', 'marianne.net', 'fr'),
  ('https://actu.fr/rss.xml', 'Actu.fr', 'actu.fr', 'fr'),
  ('https://www.ouest-france.fr/rss/une', 'Ouest-France', 'ouest-france.fr', 'fr'),
  -- Tech / numerique
  ('https://www.numerama.com/feed/', 'Numerama', 'numerama.com', 'fr'),
  ('https://korii.slate.fr/rss.xml', 'Korii', 'korii.slate.fr', 'fr'),
  ('https://www.lesnumeriques.com/rss.xml', 'Les Numeriques', 'lesnumeriques.com', 'fr'),
  ('https://www.frandroid.com/feed', 'Frandroid', 'frandroid.com', 'fr'),
  ('https://next.ink/feed/', 'Next', 'next.ink', 'fr'),
  ('https://www.maddyness.com/feed/', 'Maddyness', 'maddyness.com', 'fr'),
  ('https://www.journaldunet.com/rss/', 'Journal du Net', 'journaldunet.com', 'fr'),
  -- Culture / idees / politique
  ('https://aoc.media/feed/', 'AOC Media', 'aoc.media', 'fr'),
  ('https://legrandcontinent.eu/fr/feed/', 'Le Grand Continent', 'legrandcontinent.eu', 'fr'),
  ('https://www.courrierinternational.com/feed/all/rss.xml', 'Courrier International', 'courrierinternational.com', 'fr'),
  ('https://www.booksmag.fr/feed', 'Books', 'booksmag.fr', 'fr'),
  ('https://www.slate.fr/rss.xml', 'Slate.fr', 'slate.fr', 'fr'),
  ('https://www.monde-diplomatique.fr/rss', 'Le Monde Diplomatique', 'monde-diplomatique.fr', 'fr'),
  ('https://diacritik.com/feed/', 'Diacritik', 'diacritik.com', 'fr'),
  ('https://www.philomag.com/feed', 'Philosophie Magazine', 'philomag.com', 'fr'),
  ('https://www.telerama.fr/rss/cinema.xml', 'Telerama Cinema', 'telerama.fr', 'fr'),
  -- Sciences
  ('https://www.pourlascience.fr/rss.xml', 'Pour la Science', 'pourlascience.fr', 'fr'),
  ('https://www.sciencesetavenir.fr/rss.xml', 'Sciences et Avenir', 'sciencesetavenir.fr', 'fr'),
  ('https://www.futura-sciences.com/rss/actualites.xml', 'Futura Sciences', 'futura-sciences.com', 'fr'),
  -- Ecologie
  ('https://reporterre.net/spip.php?page=backend', 'Reporterre', 'reporterre.net', 'fr'),
  ('https://bonpote.com/feed/', 'Bon Pote', 'bonpote.com', 'fr'),
  ('https://www.socialter.fr/rss', 'Socialter', 'socialter.fr', 'fr'),
  ('https://www.alternatives-economiques.fr/rss.xml', 'Alternatives Economiques', 'alternatives-economiques.fr', 'fr'),
  -- Musique
  ('https://www.lesinrocks.com/feed/', 'Les Inrockuptibles', 'lesinrocks.com', 'fr'),
  ('https://www.radiofrance.fr/francemusique/rss', 'France Musique', 'francemusique.fr', 'fr'),
  ('https://www.tsugi.fr/feed/', 'Tsugi', 'tsugi.fr', 'fr'),
  -- Cinema
  ('https://www.allocine.fr/rss/news.xml', 'Allocine', 'allocine.fr', 'fr'),
  -- Litterature / BD
  ('https://www.en-attendant-nadeau.fr/feed/', 'En attendant Nadeau', 'en-attendant-nadeau.fr', 'fr'),
  ('https://www.actuabd.com/spip.php?page=backend', 'ActuaBD', 'actuabd.com', 'fr'),
  -- Jeux video
  ('https://www.gamekult.com/feed.xml', 'Gamekult', 'gamekult.com', 'fr'),
  ('https://www.canardpc.com/rss.xml', 'Canard PC', 'canardpc.com', 'fr'),
  ('https://www.factornews.com/rss.xml', 'Factornews', 'factornews.com', 'fr'),
  -- Photo
  ('https://www.fisheyemagazine.fr/feed/', 'Fisheye', 'fisheyemagazine.fr', 'fr'),
  ('https://polkamagazine.com/feed/', 'Polka', 'polkamagazine.com', 'fr'),
  -- Sante / psychologie
  ('https://www.psychologies.com/rss', 'Psychologies', 'psychologies.com', 'fr'),
  -- Long reads
  ('https://www.revue21.fr/feed', 'XXI', 'revue21.fr', 'fr'),
  ('https://www.6mois.fr/feed', '6Mois', '6mois.fr', 'fr')
ON CONFLICT (url) DO NOTHING;

-- ============================================================================
-- 3. RPC v4 : prefilter_ranking_candidates avec biais locale 90/10.
--    - preferred_language = 'fr' : 90% du pool cosine reserve aux feeds fr,
--      10% aux feeds autres (pour les gemmes transversales).
--    - preferred_language = 'en' : inverse.
--    - preferred_language = NULL : pas de biais (comportement v3 conserve).
--    Si le pool primaire est sous-alimente (peu d'items dans la langue preferee),
--    le UNION avec le pool secondaire complete naturellement jusqu'a max_count.
-- ============================================================================
DROP FUNCTION IF EXISTS prefilter_ranking_candidates(vector, UUID, TIMESTAMPTZ, INT, INT) CASCADE;

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
      f.language AS feed_language,
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
    -- 90% du pool (ou 100% si preferred_language IS NULL)
    SELECT
      item_id, url, title, author, site_name, published_at,
      content_text, word_count, distance, unpop_score
    FROM base_items
    WHERE COALESCE(word_count, 0) >= 300
      AND (preferred_language IS NULL OR feed_language = preferred_language)
    ORDER BY distance
    LIMIT CASE WHEN preferred_language IS NULL THEN max_count ELSE GREATEST((max_count * 9) / 10, 1) END
  ),
  cosine_pool_secondary AS (
    -- 10% de l'autre langue (uniquement si preferred_language est defini)
    SELECT
      item_id, url, title, author, site_name, published_at,
      content_text, word_count, distance, unpop_score
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
