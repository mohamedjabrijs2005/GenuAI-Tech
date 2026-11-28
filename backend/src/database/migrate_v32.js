require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

/**
 * Migration V32 — Pilot HR feedback table for controlled company pilot evaluation.
 */
async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V32 (pilot_feedback)...');
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS pilot_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        vacancy_id UUID REFERENCES company_roles(id) ON DELETE SET NULL,
        submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
        shortlist_usefulness SMALLINT NOT NULL CHECK (shortlist_usefulness BETWEEN 1 AND 5),
        proof_level_clarity SMALLINT NOT NULL CHECK (proof_level_clarity BETWEEN 1 AND 5),
        missing_skill_accuracy SMALLINT NOT NULL CHECK (missing_skill_accuracy BETWEEN 1 AND 5),
        interview_focus_usefulness SMALLINT NOT NULL CHECK (interview_focus_usefulness BETWEEN 1 AND 5),
        trust_in_recommendations SMALLINT NOT NULL CHECK (trust_in_recommendations BETWEEN 1 AND 5),
        time_saved_estimate VARCHAR(80),
        missing_information TEXT,
        additional_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pilot_feedback_company ON pilot_feedback(company_id, created_at DESC);
    `);

    await client.query('COMMIT');
    console.log('Migration V32 completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V32 failed:', err);
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
