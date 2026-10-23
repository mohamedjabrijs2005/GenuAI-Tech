require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const SQL = `
DO $$ BEGIN

  -- 1. Create mapping tables linking learning resources & practice questions to stable versioned requirement IDs
  CREATE TABLE IF NOT EXISTS learning_resource_requirement_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (resource_id, requirement_id)
  );

  CREATE TABLE IF NOT EXISTS practice_question_requirement_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES practice_questions(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (question_id, requirement_id)
  );

  -- 2. Separate Authoring Data / Answer Keys from Candidate Delivery Table
  CREATE TABLE IF NOT EXISTS practice_question_answers (
    question_id UUID PRIMARY KEY REFERENCES practice_questions(id) ON DELETE CASCADE,
    correct_option VARCHAR(10) NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 3. Add delivered_question_ids and requirement_id to practice_attempts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='practice_attempts' AND column_name='delivered_question_ids') THEN
    ALTER TABLE practice_attempts ADD COLUMN delivered_question_ids JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='practice_attempts' AND column_name='requirement_id') THEN
    ALTER TABLE practice_attempts ADD COLUMN requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL;
  END IF;

  -- 4. Add governance lifecycle fields (status, version, review_status) to learning_resources & practice_questions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_resources' AND column_name='status') THEN
    ALTER TABLE learning_resources ADD COLUMN status VARCHAR(50) DEFAULT 'PUBLISHED';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='practice_questions' AND column_name='status') THEN
    ALTER TABLE practice_questions ADD COLUMN status VARCHAR(50) DEFAULT 'PUBLISHED';
  END IF;

  -- 5. Migrate existing correct_option and explanation from practice_questions to practice_question_answers
  INSERT INTO practice_question_answers (question_id, correct_option, explanation)
  SELECT id, correct_option, explanation
  FROM practice_questions
  WHERE correct_option IS NOT NULL AND explanation IS NOT NULL
  ON CONFLICT (question_id) DO UPDATE
  SET correct_option = EXCLUDED.correct_option, explanation = EXCLUDED.explanation;

  -- 6. Populate learning_resource_requirement_map from existing requirements matching requirement_name
  INSERT INTO learning_resource_requirement_map (resource_id, requirement_id)
  SELECT lr.id, r.id
  FROM learning_resources lr
  JOIN requirements r ON LOWER(TRIM(r.name)) = LOWER(TRIM(lr.requirement_name))
  ON CONFLICT (resource_id, requirement_id) DO NOTHING;

  -- 7. Populate practice_question_requirement_map from existing requirements matching requirement_name
  INSERT INTO practice_question_requirement_map (question_id, requirement_id)
  SELECT pq.id, r.id
  FROM practice_questions pq
  JOIN requirements r ON LOWER(TRIM(r.name)) = LOWER(TRIM(pq.requirement_name))
  ON CONFLICT (question_id, requirement_id) DO NOTHING;

  -- Create indexes for ultra-fast lookup
  CREATE INDEX IF NOT EXISTS idx_lrrm_req ON learning_resource_requirement_map(requirement_id);
  CREATE INDEX IF NOT EXISTS idx_pqrm_req ON practice_question_requirement_map(requirement_id);

END $$;
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V15 (Requirement Version Maps + Practice Answer Keys Decoupling + Governance)...');
    await client.query('BEGIN');
    await client.query(SQL);
    await client.query('COMMIT');
    console.log('Migration V15 applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V15 failed:', err.message);
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
