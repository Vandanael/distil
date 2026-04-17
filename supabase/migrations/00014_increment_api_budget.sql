-- Increment atomique du compteur de budget API.
-- Necessaire car Supabase serverless (Netlify) remet la memoire a zero
-- a chaque cold start, donc le compteur in-memory seul ne bloque rien.
CREATE OR REPLACE FUNCTION increment_api_budget(
  p_date     DATE,
  p_provider TEXT,
  p_increment INT,
  p_limit    INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INT;
BEGIN
  INSERT INTO api_budget_log (date, provider, calls_used, calls_limit)
  VALUES (p_date, p_provider, p_increment, p_limit)
  ON CONFLICT (date, provider)
  DO UPDATE SET calls_used = api_budget_log.calls_used + EXCLUDED.calls_used
  RETURNING calls_used INTO new_count;
  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION increment_api_budget(DATE, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_api_budget(DATE, TEXT, INT, INT) TO service_role;
