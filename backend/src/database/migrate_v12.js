require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const SQL = `
DO $$ BEGIN

  -- 1. Session invalidation tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='token_version') THEN
    ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 1;
  END IF;

  -- 2. Enhanced Assessment Attempt Hardening: Versions, Dual Scoring, Accommodations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_attempts' AND column_name='vacancy_version_id') THEN
    ALTER TABLE assessment_attempts ADD COLUMN vacancy_version_id UUID REFERENCES vacancy_versions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_attempts' AND column_name='objective_score') THEN
    ALTER TABLE assessment_attempts ADD COLUMN objective_score NUMERIC(5,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_attempts' AND column_name='scenario_score') THEN
    ALTER TABLE assessment_attempts ADD COLUMN scenario_score NUMERIC(5,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_attempts' AND column_name='grading_status') THEN
    ALTER TABLE assessment_attempts ADD COLUMN grading_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_attempts' AND column_name='accommodations_granted') THEN
    ALTER TABLE assessment_attempts ADD COLUMN accommodations_granted JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_attempts' AND column_name='evaluator_id') THEN
    ALTER TABLE assessment_attempts ADD COLUMN evaluator_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_attempts' AND column_name='evaluated_at') THEN
    ALTER TABLE assessment_attempts ADD COLUMN evaluated_at TIMESTAMPTZ;
  END IF;

  -- 3. Requirement Scores Provenance & Rubric
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_requirement_scores' AND column_name='scoring_source') THEN
    ALTER TABLE assessment_requirement_scores ADD COLUMN scoring_source VARCHAR(50) NOT NULL DEFAULT 'OBJECTIVE_MCQ';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_requirement_scores' AND column_name='rubric_criteria') THEN
    ALTER TABLE assessment_requirement_scores ADD COLUMN rubric_criteria JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_requirement_scores' AND column_name='evaluation_status') THEN
    ALTER TABLE assessment_requirement_scores ADD COLUMN evaluation_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW';
  END IF;

END $$;
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V12 (Session Invalidation + Assessment Versioning & Dual Grading)...');
    await client.query('BEGIN');
    await client.query(SQL);
    await client.query('COMMIT');
    console.log('Migration V12 applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V12 failed:', err.message);
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
