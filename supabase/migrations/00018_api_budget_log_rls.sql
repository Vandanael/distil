-- Restreint la lecture de api_budget_log.
-- La policy initiale (migration 00013) autorisait SELECT a tous :
-- information business (cout API quotidien) lisible par anon.
-- On passe a deny all pour anon/authenticated, service_role garde tout.

DROP POLICY IF EXISTS "api_budget_log: read all" ON api_budget_log;

-- Aucune policy = deny par defaut sous RLS active.
-- service_role bypass RLS automatiquement, les RPCs continuent de fonctionner.
