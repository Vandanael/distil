-- Sprint 2 : articles + scoring_runs

-- Table articles
CREATE TABLE articles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contenu parsé
  url                  TEXT NOT NULL,
  title                TEXT,
  author               TEXT,
  site_name            TEXT,
  published_at         TIMESTAMPTZ,
  content_html         TEXT,
  content_text         TEXT,
  excerpt              TEXT,
  word_count           INT,
  reading_time_minutes INT,

  -- Scoring
  score                FLOAT,
  justification        TEXT,
  is_serendipity       BOOLEAN NOT NULL DEFAULT FALSE,
  rejection_reason     TEXT,
  kept_anyway          BOOLEAN NOT NULL DEFAULT FALSE,

  -- Cycle de vie
  origin               TEXT NOT NULL DEFAULT 'agent', -- 'agent' | 'bookmarklet'
  status               TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected' | 'archived' | 'read'
  scored_at            TIMESTAMPTZ,
  read_at              TIMESTAMPTZ,
  archived_at          TIMESTAMPTZ,

  -- Embedding
  embedding            vector(1024),

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index articles
CREATE INDEX idx_articles_user_status    ON articles (user_id, status);
CREATE INDEX idx_articles_user_scored    ON articles (user_id, scored_at DESC NULLS LAST);
CREATE INDEX idx_articles_content_trgm   ON articles USING gin (content_text gin_trgm_ops);

-- Table scoring_runs
CREATE TABLE scoring_runs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at         TIMESTAMPTZ,
  articles_analyzed    INT NOT NULL DEFAULT 0,
  articles_accepted    INT NOT NULL DEFAULT 0,
  articles_rejected    INT NOT NULL DEFAULT 0,
  agent_type           TEXT NOT NULL DEFAULT 'managed', -- 'managed' | 'messages'
  error                TEXT,
  duration_ms          INT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS articles
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "articles: lecture owner" ON articles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "articles: insert owner" ON articles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "articles: update owner" ON articles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "articles: delete owner" ON articles
  FOR DELETE USING (auth.uid() = user_id);

-- RLS scoring_runs
ALTER TABLE scoring_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scoring_runs: lecture owner" ON scoring_runs
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger updated_at articles
CREATE TRIGGER set_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
