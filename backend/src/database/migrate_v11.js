require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const SQL = `
DO $$ BEGIN

  -- ============================================================
  -- ASSESSMENT ENGINE: Attempts, Answers & Requirement Scores
  -- ============================================================

  CREATE TABLE IF NOT EXISTS assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID REFERENCES targets(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    role_id UUID REFERENCES company_roles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    duration_minutes INT NOT NULL DEFAULT 45,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    score NUMERIC(5,2),
    max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    evaluation_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_assessment_attempts_target ON assessment_attempts(target_id);
  CREATE INDEX IF NOT EXISTS idx_assessment_attempts_candidate ON assessment_attempts(candidate_id);
  CREATE INDEX IF NOT EXISTS idx_assessment_attempts_role ON assessment_attempts(role_id);

  CREATE TABLE IF NOT EXISTS assessment_requirement_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
    assessment_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_req_scores_attempt ON assessment_requirement_scores(attempt_id);
  CREATE INDEX IF NOT EXISTS idx_req_scores_requirement ON assessment_requirement_scores(requirement_id);

END $$;
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V11 (Assessment attempts and requirement scores)...');
    await client.query('BEGIN');
    await client.query(SQL);
    await client.query('COMMIT');
    console.log('Migration V11 applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V11 failed:', err.message);
    throw err;
  } finally {
    client.release();
    if (require.main === module) await pool.end();
  }
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { run };
