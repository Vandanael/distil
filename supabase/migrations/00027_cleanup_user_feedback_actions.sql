-- Nettoyage : restreindre user_feedback.action a (skip, saved)
-- Les valeurs 'read_full' et 'surprised_useful' n'ont jamais ete utilisees
-- (endpoint /api/feedback rejette deja ces valeurs en amont)

-- Par securite, purger d'eventuelles lignes orphelines
DELETE FROM user_feedback WHERE action IN ('read_full', 'surprised_useful');

-- Remplacer la contrainte CHECK
ALTER TABLE user_feedback DROP CONSTRAINT IF EXISTS user_feedback_action_check;
ALTER TABLE user_feedback
  ADD CONSTRAINT user_feedback_action_check
  CHECK (action IN ('skip', 'saved'));
