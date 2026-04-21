-- Cleanup des articles orphelins issus de l'ancien Pipeline A.
-- Avant l'unification (PR2 du plan unified-pipelines), le refresh inserait directement
-- dans `articles` avec origin='agent' et item_id=NULL. Ces lignes sont desormais
-- inertes (le ranker B exige item_id NOT NULL) et bloquent la redecouverte via items
-- (le RPC prefilter exclut les urls deja presentes dans articles).
--
-- On supprime uniquement les lignes sans interaction utilisateur (status 'pending' ou
-- 'not_interested'). Les articles 'to_read' / 'read' sont des sauvegardes explicites
-- du user et doivent etre preserves meme s'ils sont orphelins cote schema.
--
-- Pas de casse sur user_feedback : user_feedback.article_id a ON DELETE SET NULL
-- (migration 00011). Aucune autre table ne reference articles(id).

DELETE FROM articles
WHERE origin = 'agent'
  AND item_id IS NULL
  AND status IN ('pending', 'not_interested')
  AND scored_at IS NOT NULL;
