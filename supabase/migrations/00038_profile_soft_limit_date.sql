-- Soft limit one-shot par édition.
-- Stocke la date du dernier affichage du message "Vous avez pas mal trié aujourd'hui"
-- pour empêcher la réapparition dans la même édition (même après refresh).
-- NULL = jamais vu. Comparé à current_date côté appli.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_soft_limit_shown_date DATE;
