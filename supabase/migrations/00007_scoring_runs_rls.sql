-- Sprint 18+ : policies INSERT et UPDATE manquantes sur scoring_runs

CREATE POLICY "scoring_runs: insert owner" ON scoring_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scoring_runs: update owner" ON scoring_runs
  FOR UPDATE USING (auth.uid() = user_id);
