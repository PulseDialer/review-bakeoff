-- 0087_add_consent.sql
-- Applied to production 2026-07-02. Recorded in schema_migrations with a
-- checksum over the whole file.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_captured_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_leads_consent ON leads (consent_captured_at);
