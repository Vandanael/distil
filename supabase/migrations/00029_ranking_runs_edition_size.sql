-- Telemetrie edition variable : taille effective de l'edition produite par le ranker.
-- Permet de suivre les editions sous-8 et de detecter les jours de moisson legere.

ALTER TABLE public.ranking_runs
  ADD COLUMN IF NOT EXISTS edition_size INTEGER NOT NULL DEFAULT 0;
