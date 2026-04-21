-- Schema v2 : nouvelles colonnes articles pour le modele 4 actions (ADR-013)
-- et la composition d'edition avec carry-over et seuil adaptatif (ADR-014).
-- Base clean supposee : pas de script de conversion des anciens statuts.

-- Documenter les 4 valeurs autorisees de status (pas d'enum dur : reste TEXT)
--   pending          : etat neutre par defaut, aucune action utilisateur
--   not_interested   : rejete explicitement par l'utilisateur
--   to_read          : marque pour lecture differee
--   read             : lu
-- Note : les anciennes valeurs ('accepted', 'rejected', 'archived') peuvent
-- subsister dans les donnees existantes jusqu'au wipe ; ne pas migrer ici.
COMMENT ON COLUMN articles.status IS
  'Valeurs autorisees : pending | not_interested | to_read | read';

-- Seuil adaptatif (ADR-014) : vrai si l'edition du jour est sous le seuil normal de qualite
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS below_normal_threshold BOOLEAN NOT NULL DEFAULT FALSE;

-- Carry-over (ADR-014) : nombre de fois que cet article a ete reporte au lendemain
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS carry_over_count SMALLINT NOT NULL DEFAULT 0;

-- Derniere apparition dans une edition (ADR-014) : permet de detecter le vieillissement
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS last_shown_in_edition_at TIMESTAMPTZ;

-- Index partiel pour les candidats carry-over : articles pending jamais reportes,
-- tries par score pour selectionner les meilleurs repechables
CREATE INDEX IF NOT EXISTS idx_articles_carry_over_candidates
  ON articles (user_id, score DESC)
  WHERE status = 'pending' AND carry_over_count = 0;
