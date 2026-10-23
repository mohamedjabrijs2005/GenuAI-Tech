require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const SQL = `
DO $$ BEGIN

  -- 1. Add version_snapshot to assessment_attempts to freeze exact requirement and rubric criteria
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_attempts' AND column_name='version_snapshot') THEN
    ALTER TABLE assessment_attempts ADD COLUMN version_snapshot JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- 2. Add candidate_answers to assessment_requirement_scores to separate answers from rubrics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_requirement_scores' AND column_name='candidate_answers') THEN
    ALTER TABLE assessment_requirement_scores ADD COLUMN candidate_answers JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- 3. Invalidate/expire any legacy unhashed verification or reset tokens (< 60 chars)
  UPDATE users
  SET password_reset_token = NULL, password_reset_expires = NULL
  WHERE password_reset_token IS NOT NULL AND length(password_reset_token) < 60;

  UPDATE users
  SET email_verification_token = NULL, email_verification_expires = NULL
  WHERE email_verification_token IS NOT NULL AND length(email_verification_token) < 60;

END $$;
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V13 (Assessment Version Snapshot + Separate Candidate Answers + Legacy Token Expiry)...');
    await client.query('BEGIN');
    await client.query(SQL);

    // Update foreign key constraint on vacancy_version_id to RESTRICT if possible
    try {
      await client.query(`
        ALTER TABLE assessment_attempts
        DROP CONSTRAINT IF EXISTS assessment_attempts_vacancy_version_id_fkey;

        ALTER TABLE assessment_attempts
        ADD CONSTRAINT assessment_attempts_vacancy_version_id_fkey
        FOREIGN KEY (vacancy_version_id) REFERENCES vacancy_versions(id) ON DELETE RESTRICT;
      `);
      console.log('Updated assessment_attempts vacancy_version_id constraint to ON DELETE RESTRICT.');
    } catch (fkErr) {
      console.warn('Note on FK update (may not exist or referenced table not yet populated):', fkErr.message);
    }

    await client.query('COMMIT');
    console.log('Migration V13 applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V13 failed:', err.message);
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
