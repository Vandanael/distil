-- Telemetrie du ranker quotidien : 1 ligne par run par (user, date).
-- Permet de detecter taux de fallback, latence et cohortes anormales sans
-- attendre un bug reporte. Aucune donnee sensible (pas d'URLs, pas de titres).
-- RLS deny-all : seul service_role lit (rapport expose via /api/dev/stats).

CREATE TABLE IF NOT EXISTS public.ranking_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  model_used TEXT,
  fallback BOOLEAN NOT NULL DEFAULT false,
  candidates_count INTEGER NOT NULL DEFAULT 0,
  essential_count INTEGER NOT NULL DEFAULT 0,
  surprise_count INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ranking_runs_date_idx ON public.ranking_runs (date DESC);
CREATE INDEX IF NOT EXISTS ranking_runs_user_date_idx ON public.ranking_runs (user_id, date DESC);

ALTER TABLE public.ranking_runs ENABLE ROW LEVEL SECURITY;
-- Aucune policy definie = deny par defaut pour anon/authenticated.
-- service_role bypass RLS automatiquement.
