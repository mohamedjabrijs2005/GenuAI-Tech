require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V22 (Candidate Interest table, Target role_id link, Funnel indices)...');
    await client.query('BEGIN');

    // 1. Create candidate_interest table
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidate_interest (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        vacancy_id UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
        role_id UUID REFERENCES company_roles(id) ON DELETE CASCADE,
        vacancy_version_id UUID REFERENCES vacancy_versions(id) ON DELETE SET NULL,
        interest_status VARCHAR(50) NOT NULL DEFAULT 'EXPRESSED',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('candidate_interest table created.');

    // 2. Indexes and Unique constraints
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cand_interest_cand ON candidate_interest(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_cand_interest_vac ON candidate_interest(vacancy_id);
      CREATE INDEX IF NOT EXISTS idx_cand_interest_comp ON candidate_interest(company_id);
      CREATE INDEX IF NOT EXISTS idx_cand_interest_status ON candidate_interest(interest_status);

      CREATE UNIQUE INDEX IF NOT EXISTS uq_cand_interest_version 
      ON candidate_interest (candidate_id, vacancy_id, vacancy_version_id) 
      WHERE vacancy_version_id IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS uq_cand_interest_no_version 
      ON candidate_interest (candidate_id, vacancy_id) 
      WHERE vacancy_version_id IS NULL;
    `);
    console.log('candidate_interest constraints and indexes created.');

    // 3. Ensure targets has role_id column linking directly to company_roles
    await client.query(`
      ALTER TABLE targets ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES company_roles(id) ON DELETE CASCADE;
      UPDATE targets SET role_id = vacancy_id WHERE role_id IS NULL AND vacancy_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_targets_role_id ON targets(role_id);
    `);
    console.log('targets.role_id column linked.');

    await client.query('COMMIT');
    console.log('Migration V22 applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V22 failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  run().then(() => pool.end()).catch(() => process.exit(1));
}

module.exports = run;

