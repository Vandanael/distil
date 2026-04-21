-- Indicateur première édition vide.
-- Mis à true si le ranking onboarding produit < 5 articles (pool insuffisant ou timeout).
-- Remis à false dès que la première édition non vide est générée (cron quotidien ou retry).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_edition_empty BOOLEAN NOT NULL DEFAULT FALSE;
