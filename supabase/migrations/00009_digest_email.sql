-- Sprint 27 prep : flag opt-in email digest
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digest_email BOOLEAN NOT NULL DEFAULT false;
