-- 0088_beta.sql
-- Adds the reassignment audit column requested for the deal-stage report.
ALTER TABLE deals ADD COLUMN IF NOT EXISTS reassigned_at TIMESTAMPTZ;

-- trailing note added during review

-- trigger after Code Quality enablement
