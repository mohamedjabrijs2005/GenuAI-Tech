require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

/**
 * Migration V30 — Pilot Analytics Events:
 * Records lightweight core-loop product events:
 *   vacancy_created, checklist_approved, candidate_applied,
 *   skill_claim_confirmed, shortlist_viewed, hr_override_used, hiring_outcome_recorded
 */
async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V30 (analytics_events)...');
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_name VARCHAR(80) NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
        vacancy_id UUID REFERENCES company_roles(id) ON DELETE SET NULL,
        target_id UUID REFERENCES targets(id) ON DELETE SET NULL,
        properties JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
      CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_analytics_company ON analytics_events(company_id);
    `);

    await client.query('COMMIT');
    console.log('Migration V30 completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V30 failed:', err);
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
