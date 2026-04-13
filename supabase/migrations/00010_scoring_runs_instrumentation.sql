-- Instrumentation : tracer le modele et la version du prompt par run
ALTER TABLE scoring_runs ADD COLUMN model_used TEXT;
ALTER TABLE scoring_runs ADD COLUMN prompt_version TEXT;
