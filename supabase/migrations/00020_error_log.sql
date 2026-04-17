-- Table de log d'erreurs server-side, alternative legere a Sentry pour MVP.
-- Requetable par user_id pour debug cible. Nettoyage : aucune retention auto
-- pour l'instant (add TTL/cron si volume devient genant).

CREATE TABLE error_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  route      TEXT NOT NULL,
  message    TEXT NOT NULL,
  stack      TEXT NULL,
  context    JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_log_recent ON error_log (created_at DESC);
CREATE INDEX idx_error_log_user ON error_log (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_error_log_route ON error_log (route, created_at DESC);

ALTER TABLE error_log ENABLE ROW LEVEL SECURITY;

-- Aucune policy : deny all pour anon/authenticated.
-- service_role bypass RLS, c'est lui qui ecrit via le helper logError.
