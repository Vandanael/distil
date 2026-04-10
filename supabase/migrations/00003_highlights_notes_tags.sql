-- Sprint 4 : highlights, notes, tags

-- Table highlights
CREATE TABLE highlights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id      UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contenu
  text_content    TEXT NOT NULL,

  -- Ancrage texte (ADR-007)
  prefix_context  TEXT,         -- 30 chars avant
  suffix_context  TEXT,         -- 30 chars apres
  css_selector    TEXT,         -- selecteur CSS du parent
  text_offset     INT,          -- offset dans le parent

  -- Embedding
  embedding       vector(1024),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table notes
CREATE TABLE notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id      UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  highlight_id    UUID REFERENCES highlights(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  embedding       vector(1024),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table tags
CREATE TABLE tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  UNIQUE (user_id, name)
);

-- Table article_tags (junction)
CREATE TABLE article_tags (
  article_id      UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (article_id, tag_id)
);

-- RLS highlights
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "highlights: owner" ON highlights USING (auth.uid() = user_id);

-- RLS notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes: owner" ON notes USING (auth.uid() = user_id);

-- RLS tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags: owner" ON tags USING (auth.uid() = user_id);

-- RLS article_tags
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "article_tags: owner" ON article_tags USING (auth.uid() = user_id);

-- Trigger updated_at notes
CREATE TRIGGER set_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
