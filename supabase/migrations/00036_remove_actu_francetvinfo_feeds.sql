-- Retire actu.fr et francetvinfo/titres des feeds par defaut.
-- actu.fr : contenu trop local/automatise, peu de valeur editoriale.
-- francetvinfo/titres : fil express sans contenu, seulement des titres.
-- ON DELETE CASCADE sur items.feed_id => les items orphelins sont supprimes automatiquement.

DELETE FROM feeds
WHERE url IN (
  'https://actu.fr/rss.xml',
  'https://www.francetvinfo.fr/titres.rss'
);