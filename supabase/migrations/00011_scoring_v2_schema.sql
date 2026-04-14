-- Scoring v2 : feeds, items, embeddings, popularity, profile, ranking, feedback
-- Supports research-backed serendipity pipeline (SERAL, SerenPrompt, Kang 2025, Tokutake & Okamoto 2024)

-- feeds : source RSS, replaces hardcoded RSS_MAP for the new pipeline
CREATE TABLE feeds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url             TEXT NOT NULL UNIQUE,
  title           TEXT,
  site_name       TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  etag            TEXT,
  last_modified   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER feeds_updated_at
  BEFORE UPDATE ON feeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- items : user-agnostic RSS item pool
CREATE TABLE items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id         UUID NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  guid            TEXT,
  url             TEXT NOT NULL,
  title           TEXT,
  author          TEXT,
  published_at    TIMESTAMPTZ,
  content_text    TEXT,
  content_hash    TEXT NOT NULL,
  word_count      INT,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_items_content_hash ON items (content_hash);
CREATE INDEX idx_items_feed_fetched ON items (feed_id, fetched_at DESC);
CREATE INDEX idx_items_published ON items (published_at DESC NULLS LAST);
CREATE INDEX idx_items_fetched ON items (fetched_at DESC);

-- item_embeddings : separate to avoid bloating items table
CREATE TABLE item_embeddings (
  item_id    UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  embedding  vector(1024) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- item_popularity : cosine-based unpopularity score (Tokutake & Okamoto 2024)
CREATE TABLE item_popularity (
  item_id       UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  similar_count INT NOT NULL DEFAULT 0,
  unpop_score   FLOAT NOT NULL DEFAULT 0.0,
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_profile_text : multi-level profile per SERAL (Xi et al. 2025)
CREATE TABLE user_profile_text (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  static_profile     TEXT,
  long_term_profile  TEXT,
  short_term_profile TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_profile_text_user ON user_profile_text (user_id);

CREATE TRIGGER user_profile_text_updated_at
  BEFORE UPDATE ON user_profile_text
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- daily_ranking : per-user daily selection with SerenPrompt scores
CREATE TABLE daily_ranking (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  bucket        TEXT NOT NULL CHECK (bucket IN ('essential', 'surprise')),
  item_id       UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  rank          INT NOT NULL,
  justification TEXT,
  q1_relevance  INT,
  q2_unexpected INT,
  q3_discovery  INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_daily_ranking_user_date_item ON daily_ranking (user_id, date, item_id);
CREATE INDEX idx_daily_ranking_user_date ON daily_ranking (user_id, date DESC);

-- user_feedback : explicit feedback for profile recalculation (Kang et al. 2025)
CREATE TABLE user_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id      UUID REFERENCES articles(id) ON DELETE SET NULL,
  item_id         UUID REFERENCES items(id) ON DELETE SET NULL,
  action          TEXT NOT NULL CHECK (action IN ('read_full', 'skip', 'saved', 'surprised_useful')),
  seconds_on_page INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_feedback_user ON user_feedback (user_id, created_at DESC);

-- Link articles to items (nullable : bookmarklet articles have no item)
ALTER TABLE articles ADD COLUMN item_id UUID REFERENCES items(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX idx_articles_user_item ON articles (user_id, item_id) WHERE item_id IS NOT NULL;

-- RLS : feeds/items/item_embeddings/item_popularity are global (read all, write via service role)
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feeds: read all" ON feeds FOR SELECT USING (true);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items: read all" ON items FOR SELECT USING (true);

ALTER TABLE item_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "item_embeddings: read all" ON item_embeddings FOR SELECT USING (true);

ALTER TABLE item_popularity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "item_popularity: read all" ON item_popularity FOR SELECT USING (true);

-- RLS : user-scoped tables
ALTER TABLE user_profile_text ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profile_text: owner" ON user_profile_text
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE daily_ranking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_ranking: owner read" ON daily_ranking
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_feedback: owner" ON user_feedback
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC : pre-filter ranking candidates by cosine distance to user profile
CREATE OR REPLACE FUNCTION prefilter_ranking_candidates(
  user_embedding vector(1024),
  target_user_id UUID,
  cutoff_time TIMESTAMPTZ,
  max_count INT DEFAULT 40
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
  unpop_score FLOAT
)
LANGUAGE sql
STABLE
AS $$
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
    COALESCE(ip.unpop_score, 0.5) AS unpop_score
  FROM items i
  JOIN item_embeddings ie ON ie.item_id = i.id
  JOIN feeds f ON f.id = i.feed_id
  LEFT JOIN item_popularity ip ON ip.item_id = i.id
  WHERE i.fetched_at > cutoff_time
  AND NOT EXISTS (
    SELECT 1 FROM articles a
    WHERE a.item_id = i.id AND a.user_id = target_user_id
  )
  ORDER BY ie.embedding <=> user_embedding
  LIMIT max_count;
$$;

-- RPC : count similar items via cosine distance (for popularity computation)
CREATE OR REPLACE FUNCTION count_similar_items(
  target_item_id UUID,
  target_embedding vector(1024),
  distance_threshold FLOAT DEFAULT 0.15
)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INT
  FROM item_embeddings
  WHERE item_id != target_item_id
  AND embedding <=> target_embedding < distance_threshold;
$$;
