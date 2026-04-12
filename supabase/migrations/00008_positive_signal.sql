-- Sprint 25 : signal positif "Plus comme ca"
ALTER TABLE articles
  ADD COLUMN positive_signal BOOLEAN NOT NULL DEFAULT FALSE;
