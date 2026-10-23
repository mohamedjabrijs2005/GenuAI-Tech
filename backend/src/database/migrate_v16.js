require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

/**
 * Migration V16 — Pilot Security & Score-Component Hardening
 *
 * 1. NULL legacy answer columns in practice_questions (data already in practice_question_answers)
 * 2. Add score component columns to assessment_requirement_scores:
 *      objective_score, objective_max_score, scenario_score, scenario_max_score
 * 3. Backfill those columns from existing rows (objective_score from score, scenario_score = 0)
 * 4. Add grading_revision_count + last_graded_at to assessment_requirement_scores for regrade tracking
 * 5. Add required_scenario_evaluation flag to assessment_requirement_scores
 *    so FULLY_GRADED detection uses an explicit list, not scoreMap.size
 */
const SQL = `
DO $$ BEGIN

  -- 1. Drop NOT NULL constraints on legacy answer columns, then NULL them
  --    (data already safely migrated to practice_question_answers in V15)
  ALTER TABLE practice_questions ALTER COLUMN correct_option DROP NOT NULL;
  ALTER TABLE practice_questions ALTER COLUMN explanation DROP NOT NULL;

  UPDATE practice_questions
  SET correct_option = NULL, explanation = NULL
  WHERE correct_option IS NOT NULL OR explanation IS NOT NULL;

  -- 2. Add score component columns to assessment_requirement_scores
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='assessment_requirement_scores' AND column_name='objective_score') THEN
    ALTER TABLE assessment_requirement_scores ADD COLUMN objective_score NUMERIC(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='assessment_requirement_scores' AND column_name='objective_max_score') THEN
    ALTER TABLE assessment_requirement_scores ADD COLUMN objective_max_score NUMERIC(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='assessment_requirement_scores' AND column_name='scenario_score') THEN
    ALTER TABLE assessment_requirement_scores ADD COLUMN scenario_score NUMERIC(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='assessment_requirement_scores' AND column_name='scenario_max_score') THEN
    ALTER TABLE assessment_requirement_scores ADD COLUMN scenario_max_score NUMERIC(10,2) DEFAULT 0;
  END IF;

  -- 3. Add regrade tracking columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='assessment_requirement_scores' AND column_name='grading_revision_count') THEN
    ALTER TABLE assessment_requirement_scores ADD COLUMN grading_revision_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='assessment_requirement_scores' AND column_name='last_graded_at') THEN
    ALTER TABLE assessment_requirement_scores ADD COLUMN last_graded_at TIMESTAMPTZ;
  END IF;

  -- 4. Explicit required_scenario_evaluation flag (true = must be evaluated for FULLY_GRADED)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='assessment_requirement_scores' AND column_name='required_scenario_evaluation') THEN
    ALTER TABLE assessment_requirement_scores ADD COLUMN required_scenario_evaluation BOOLEAN DEFAULT TRUE;
  END IF;

  -- 5. Backfill component columns for existing rows:
  --    objective_score = score (what was stored at submit time for MCQ-only rows)
  --    scenario_score  = 0 (pre-V16 rows had no scenario grading)
  --    Both max cols derived from rubric_criteria or max_score
  UPDATE assessment_requirement_scores
  SET
    objective_score     = COALESCE(score, 0),
    objective_max_score = COALESCE(max_score, 0),
    scenario_score      = 0,
    scenario_max_score  = COALESCE(
      CASE
        WHEN rubric_criteria::text != 'null' AND rubric_criteria IS NOT NULL
        THEN (rubric_criteria->>'scenarioMax')::numeric
        ELSE NULL
      END,
      0
    )
  WHERE objective_score = 0 AND objective_max_score = 0;

END $$;
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V16 (Pilot Security & Score-Component Hardening)...');
    await client.query('BEGIN');
    await client.query(SQL);
    await client.query('COMMIT');
    console.log('Migration V16 applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V16 failed:', err.message);
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
