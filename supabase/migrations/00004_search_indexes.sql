-- Sprint 5 : recherche full-text + sémantique

-- Colonne tsvector générée pour la recherche full-text française
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('french',
        coalesce(title, '') || ' ' ||
        coalesce(excerpt, '') || ' ' ||
        coalesce(content_text, '')
      )
    ) STORED;

-- Index GIN sur le tsvector (recherche full-text)
CREATE INDEX IF NOT EXISTS idx_articles_search_vector
  ON articles USING gin (search_vector);

-- Index HNSW pour la recherche sémantique par vecteur cosinus
-- HNSW préféré à IVFFlat pour les petits corpus solo user (< 100k vecteurs)
CREATE INDEX IF NOT EXISTS idx_articles_embedding_hnsw
  ON articles USING hnsw (embedding vector_cosine_ops);

-- Fonction RPC : recherche sémantique par similarité cosinus
CREATE OR REPLACE FUNCTION match_articles(
  query_embedding vector(1024),
  match_user_id   uuid,
  match_threshold float DEFAULT 0.7,
  match_count     int   DEFAULT 10
)
RETURNS TABLE (
  id           uuid,
  title        text,
  excerpt      text,
  site_name    text,
  score        float,
  similarity   float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    a.id,
    a.title,
    a.excerpt,
    a.site_name,
    a.score,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM articles a
  WHERE a.user_id = match_user_id
    AND a.status IN ('accepted', 'read', 'archived')
    AND a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
$$;
