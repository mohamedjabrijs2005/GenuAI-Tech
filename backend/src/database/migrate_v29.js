require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

/**
 * Migration V29 — Additive HR Shortlist Ranking Overrides:
 * Stores explicit HR ranking overrides per vacancy × target so shortlist
 * ordering preserves both deterministic proof fit and auditable HR adjustments.
 */
async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V29 (shortlist_overrides)...');
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS shortlist_overrides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vacancy_id UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
        target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        override_rank INTEGER,
        override_fit VARCHAR(20)
          CHECK (override_fit IS NULL OR override_fit IN ('strong', 'promising', 'partial', 'not_ready')),
        reason TEXT NOT NULL,
        overridden_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (vacancy_id, target_id)
      );
      CREATE INDEX IF NOT EXISTS idx_shortlist_overrides_vacancy ON shortlist_overrides(vacancy_id);
      CREATE INDEX IF NOT EXISTS idx_shortlist_overrides_company ON shortlist_overrides(company_id);
    `);

    await client.query('COMMIT');
    console.log('Migration V29 completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V29 failed:', err);
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
