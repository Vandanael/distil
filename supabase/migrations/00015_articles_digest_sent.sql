-- Tracking des articles envoyes dans un digest email.
-- Sans cette colonne, le cron digest renvoie chaque matin les memes top-N
-- tant que l'utilisateur ne marque pas lu/archive : mauvaise UX, spam perçu.
ALTER TABLE articles
  ADD COLUMN digest_sent_at TIMESTAMPTZ;

-- Index partiel pour accelerer le filtre "jamais envoye" dans le cron digest.
CREATE INDEX idx_articles_digest_pending
  ON articles (user_id, score DESC NULLS LAST)
  WHERE digest_sent_at IS NULL AND status = 'accepted';
