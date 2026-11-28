require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

/**
 * Migration V31 — RBAC team lifecycle, interview stages, assessment invite tracking,
 * and candidate privacy requests (export, deletion, correction).
 */
async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V31 (team lifecycle, target stages, privacy requests)...');
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE company_members
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      ALTER TABLE targets
        ADD COLUMN IF NOT EXISTS interview_stage VARCHAR(50) NOT NULL DEFAULT 'not_started',
        ADD COLUMN IF NOT EXISTS interview_stage_updated_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS assessment_invited_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS assessment_invited_by UUID REFERENCES users(id) ON DELETE SET NULL;

      CREATE TABLE IF NOT EXISTS candidate_privacy_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        request_type VARCHAR(40) NOT NULL CHECK (request_type IN ('export', 'deletion', 'correction')),
        status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed', 'rejected')),
        details JSONB NOT NULL DEFAULT '{}'::jsonb,
        resolution_note TEXT,
        resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_privacy_req_candidate ON candidate_privacy_requests(candidate_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_privacy_req_status ON candidate_privacy_requests(status);
    `);

    await client.query('COMMIT');
    console.log('Migration V31 completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V31 failed:', err);
    throw err;
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = run;
