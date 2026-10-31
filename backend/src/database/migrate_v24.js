require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V24 (Official Assessment Flow: Sessions & Questions)...');
    await client.query('BEGIN');

    // 1. Create assessment_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessment_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
        requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
        assessment_id VARCHAR(100),
        time_limit_minutes INT NOT NULL DEFAULT 20,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        submitted_at TIMESTAMPTZ,
        status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
        score NUMERIC(5,2),
        max_score NUMERIC(5,2) DEFAULT 100,
        pass_fail VARCHAR(20),
        answers JSONB DEFAULT '{}'::jsonb,
        result_summary JSONB DEFAULT '{}'::jsonb,
        attempt_number INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('assessment_sessions table created/verified.');

    // 2. Create official_assessment_questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS official_assessment_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID REFERENCES company_roles(id) ON DELETE CASCADE,
        requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) NOT NULL DEFAULT 'MCQ',
        options JSONB DEFAULT '[]'::jsonb,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        marks NUMERIC(5,2) NOT NULL DEFAULT 10,
        display_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('official_assessment_questions table created/verified.');

    // 3. Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_assessment_sessions_cand_target ON assessment_sessions(candidate_id, target_id);
      CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status ON assessment_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_assessment_sessions_target ON assessment_sessions(target_id);
      CREATE INDEX IF NOT EXISTS idx_official_questions_role ON official_assessment_questions(role_id);
      CREATE INDEX IF NOT EXISTS idx_official_questions_req ON official_assessment_questions(requirement_id);
    `);
    console.log('Indexes created/verified.');

    // 4. Update targets_status_check to include IN_PROGRESS
    await client.query(`
      ALTER TABLE targets DROP CONSTRAINT IF EXISTS targets_status_check;
      ALTER TABLE targets ADD CONSTRAINT targets_status_check CHECK (
        status = ANY (ARRAY[
          'TARGETED', 'IN_PROGRESS', 'PREPARING', 'ASSESSMENT_PENDING', 'ASSESSMENT_COMPLETED',
          'EVIDENCE_SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUESTED', 'REQUEST_MORE_EVIDENCE',
          'INTERVIEW', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'HOLD', 'DECIDED', 'SHORTLISTED',
          'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN', 'CLOSED'
        ])
      );
    `);
    console.log('targets_status_check constraint updated.');

    await client.query('COMMIT');
    console.log('Migration V24 completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V24 failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = run;
