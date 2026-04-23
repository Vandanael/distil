-- ADR-015 : log du cap diversite sources applique a l'edition.
-- NULL si cap non declenche. Voir ADR-015 pour le schema JSON.
ALTER TABLE ranking_runs
ADD COLUMN diversity_cap_rejections JSONB;

COMMENT ON COLUMN ranking_runs.diversity_cap_rejections IS
  'Log du cap diversite sources applique a l''edition. NULL si cap non declenche. Voir ADR-015.';