-- Fige search_path sur les fonctions SECURITY definer/invoker
-- pour prevenir le schema-hijacking (linter Supabase 0011).
-- public + pg_temp : les fonctions dependent du type vector et des operateurs
-- pgvector/pg_trgm installes dans public.

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.match_articles(vector, uuid, float, int)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.prefilter_ranking_candidates(vector, uuid, timestamptz, int)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.count_similar_items(uuid, vector, float)
  SET search_path = public, pg_temp;
