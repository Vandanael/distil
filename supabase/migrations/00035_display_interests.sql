-- PR4 : colonne display_interests pour conserver la forme accentuee des keywords
-- interests reste la forme normalisee (sans diacritiques) pour le matching,
-- display_interests contient la forme brute saisie par l'utilisateur.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_interests TEXT[];

-- Backfill : les comptes existants gardent la forme normalisee
-- jusqu'a re-saisie dans /profile.
UPDATE profiles SET display_interests = interests WHERE display_interests IS NULL;