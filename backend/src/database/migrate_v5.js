require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const MIGRATION_SQL = `
-- 1. Partial Unique Index on targets (allow new targets if old version is closed/withdrawn)
ALTER TABLE targets DROP CONSTRAINT IF EXISTS targets_candidate_id_vacancy_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_target_per_candidate_vacancy_version
ON targets (candidate_id, vacancy_id, vacancy_version_id)
WHERE status IN ('TARGETED', 'PREPARING');

-- 2. Enhance evidence table for Target-Specific Requirement Evidence
-- Make application_id nullable so target-first evidence works smoothly
ALTER TABLE evidence ALTER COLUMN application_id DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='target_id') THEN
    ALTER TABLE evidence ADD COLUMN target_id UUID REFERENCES targets(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='candidate_id') THEN
    ALTER TABLE evidence ADD COLUMN candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='company_id') THEN
    ALTER TABLE evidence ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='vacancy_id') THEN
    ALTER TABLE evidence ADD COLUMN vacancy_id UUID REFERENCES company_roles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='vacancy_version_id') THEN
    ALTER TABLE evidence ADD COLUMN vacancy_version_id UUID REFERENCES vacancy_versions(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='evidence_type') THEN
    ALTER TABLE evidence ADD COLUMN evidence_type VARCHAR(50) DEFAULT 'OTHER';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='title') THEN
    ALTER TABLE evidence ADD COLUMN title VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='description') THEN
    ALTER TABLE evidence ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='file_url') THEN
    ALTER TABLE evidence ADD COLUMN file_url VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='external_url') THEN
    ALTER TABLE evidence ADD COLUMN external_url VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='file_hash') THEN
    ALTER TABLE evidence ADD COLUMN file_hash VARCHAR(128);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='review_status') THEN
    ALTER TABLE evidence ADD COLUMN review_status VARCHAR(50) DEFAULT 'DRAFT';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='submitted_at') THEN
    ALTER TABLE evidence ADD COLUMN submitted_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='reviewed_by') THEN
    ALTER TABLE evidence ADD COLUMN reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='reviewed_at') THEN
    ALTER TABLE evidence ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='reviewer_note') THEN
    ALTER TABLE evidence ADD COLUMN reviewer_note TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='updated_at') THEN
    ALTER TABLE evidence ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_evidence_target ON evidence(target_id);
CREATE INDEX IF NOT EXISTS idx_evidence_candidate ON evidence(candidate_id);
CREATE INDEX IF NOT EXISTS idx_evidence_req ON evidence(requirement_id);
CREATE INDEX IF NOT EXISTS idx_evidence_company ON evidence(company_id);
CREATE INDEX IF NOT EXISTS idx_evidence_review_status ON evidence(review_status);

-- 3. Target Coverage Table
CREATE TABLE IF NOT EXISTS target_coverage (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_id           UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  candidate_id        UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id          UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
  vacancy_version_id  UUID REFERENCES vacancy_versions(id) ON DELETE SET NULL,
  total_requirements  INTEGER NOT NULL DEFAULT 0,
  supported_count     INTEGER NOT NULL DEFAULT 0,
  limited_count       INTEGER NOT NULL DEFAULT 0,
  pending_count       INTEGER NOT NULL DEFAULT 0,
  gap_count           INTEGER NOT NULL DEFAULT 0,
  coverage_pct        NUMERIC(5,2) DEFAULT 0,
  computed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(target_id)
);

CREATE INDEX IF NOT EXISTS idx_target_coverage_target ON target_coverage(target_id);
CREATE INDEX IF NOT EXISTS idx_target_coverage_company ON target_coverage(company_id);
`;

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running Candidate Phase 2 Evidence & Coverage Migration (v5)...');
    await client.query('BEGIN');
    await client.query(MIGRATION_SQL);
    await client.query('COMMIT');
    console.log('✅ Migration v5 completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration v5 failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(() => process.exit(1));
