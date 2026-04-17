-- RPC pour monitorer la taille de la DB et anticiper la saturation du plan Supabase free (500MB).
-- Consommee par /api/cron/budget-alert qui webhook Discord/Slack au-dessus d'un seuil.
-- Expose uniquement la taille totale (pas de donnees sensibles).

CREATE OR REPLACE FUNCTION public.db_size_bytes()
RETURNS BIGINT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT pg_database_size(current_database())::BIGINT;
$$;

REVOKE ALL ON FUNCTION public.db_size_bytes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.db_size_bytes() TO service_role;
