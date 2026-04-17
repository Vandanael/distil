-- Empeche les doublons articles par (user_id, url).
-- L'index existant idx_articles_user_item couvre uniquement les articles avec
-- item_id IS NOT NULL (pipeline agent). Les articles sauvegardes via
-- bookmarklet (item_id NULL) n'avaient aucune protection d'unicite.

-- Deduplication defensive : garde la row la plus recente par (user_id, url).
-- En MVP solo, le risque est faible ; la requete est idempotente.
DELETE FROM articles a
USING articles b
WHERE a.user_id = b.user_id
  AND a.url = b.url
  AND a.id <> b.id
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX idx_articles_user_url ON articles (user_id, url);
