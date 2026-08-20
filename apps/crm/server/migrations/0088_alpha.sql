-- 0088_alpha.sql
-- Applied to production 2026-07-14.
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ;
