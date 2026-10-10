require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const MIGRATION_SQL = `
-- Create targets table for Candidate Target Phase 1
CREATE TABLE IF NOT EXISTS targets (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id        UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vacancy_id          UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
  vacancy_version_id  UUID REFERENCES vacancy_versions(id) ON DELETE SET NULL,
  status              VARCHAR(50) NOT NULL DEFAULT 'TARGETED'
                        CHECK (status IN ('TARGETED', 'PREPARING', 'WITHDRAWN', 'CLOSED')),
  targeted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, vacancy_id)
);

CREATE INDEX IF NOT EXISTS idx_targets_candidate ON targets(candidate_id);
CREATE INDEX IF NOT EXISTS idx_targets_company ON targets(company_id);
CREATE INDEX IF NOT EXISTS idx_targets_vacancy ON targets(vacancy_id);
`;

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running Targets Migration (v4)...');
    await client.query('BEGIN');
    await client.query(MIGRATION_SQL);
    await client.query('COMMIT');
    console.log('✅ Targets Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(() => process.exit(1));
