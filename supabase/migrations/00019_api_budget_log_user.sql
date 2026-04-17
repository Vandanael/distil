-- Budget API quotidien par user (complementaire au budget global api_budget_log).
-- Empeche un user abusif de vider le budget Gemini/Voyage des autres.
-- Le budget global reste en place comme hard cap absolu (surprise facture).

CREATE TABLE api_budget_log_user (
  date         DATE NOT NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL,
  calls_used   INT NOT NULL DEFAULT 0,
  calls_limit  INT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (date, user_id, provider)
);

CREATE INDEX idx_api_budget_log_user_recent
  ON api_budget_log_user (date DESC, user_id);

ALTER TABLE api_budget_log_user ENABLE ROW LEVEL SECURITY;

-- User peut lire son propre budget (utile pour UI transparence future).
CREATE POLICY "api_budget_log_user: own read" ON api_budget_log_user
  FOR SELECT USING (auth.uid() = user_id);

-- Aucune policy INSERT/UPDATE/DELETE : seul service_role (bypass RLS) ecrit via RPC.

-- Increment atomique par user.
CREATE OR REPLACE FUNCTION increment_api_budget_user(
  p_date      DATE,
  p_user_id   UUID,
  p_provider  TEXT,
  p_increment INT,
  p_limit     INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_count INT;
BEGIN
  INSERT INTO api_budget_log_user (date, user_id, provider, calls_used, calls_limit)
  VALUES (p_date, p_user_id, p_provider, p_increment, p_limit)
  ON CONFLICT (date, user_id, provider)
  DO UPDATE SET calls_used = api_budget_log_user.calls_used + EXCLUDED.calls_used
  RETURNING calls_used INTO new_count;
  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION increment_api_budget_user(DATE, UUID, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_api_budget_user(DATE, UUID, TEXT, INT, INT) TO service_role;
