-- Cleanup articles avec site_name invalide : fallback domaine depuis URL
-- Le reparse editorial via Readability est fait en script TS post-migration.
UPDATE articles
SET site_name = regexp_replace(
  regexp_replace(url, '^https?://(?:www\.)?', ''),
  '/.*$', ''
)
WHERE site_name = 'Découverte' OR site_name IS NULL OR site_name = '';