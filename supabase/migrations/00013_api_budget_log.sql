-- API budget tracking : daily call counts per provider
CREATE TABLE api_budget_log (
  date     DATE NOT NULL,
  provider TEXT NOT NULL,
  calls_used  INT NOT NULL DEFAULT 0,
  calls_limit INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (date, provider)
);

ALTER TABLE api_budget_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_budget_log: read all" ON api_budget_log FOR SELECT USING (true);
