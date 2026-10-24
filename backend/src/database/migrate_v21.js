require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V21 (Expand status column lengths & ensure users.status)...');
    await client.query('BEGIN');

    // 1. Expand companies.verification_status from VARCHAR(30) to VARCHAR(100)
    // 'ADDITIONAL_INFORMATION_REQUIRED' is 32 characters and caused length truncation errors
    await client.query('ALTER TABLE companies ALTER COLUMN verification_status TYPE VARCHAR(100);');
    console.log('companies.verification_status expanded to VARCHAR(100).');

    // 2. Expand company_roles.status to VARCHAR(100)
    await client.query('ALTER TABLE company_roles ALTER COLUMN status TYPE VARCHAR(100);');
    console.log('company_roles.status expanded to VARCHAR(100).');

    // 3. Expand applications.verification_status to VARCHAR(100)
    await client.query('ALTER TABLE applications ALTER COLUMN verification_status TYPE VARCHAR(100);');
    console.log('applications.verification_status expanded to VARCHAR(100).');

    // 4. Expand vacancy_versions.status to VARCHAR(100)
    await client.query('ALTER TABLE vacancy_versions ALTER COLUMN status TYPE VARCHAR(100);');
    console.log('vacancy_versions.status expanded to VARCHAR(100).');

    // 5. Expand requirements.status & req_status to VARCHAR(100)
    await client.query('ALTER TABLE requirements ALTER COLUMN status TYPE VARCHAR(100);');
    await client.query('ALTER TABLE requirements ALTER COLUMN req_status TYPE VARCHAR(100);');
    console.log('requirements status columns expanded to VARCHAR(100).');

    // 6. Expand assessment_attempts status columns to VARCHAR(100)
    await client.query('ALTER TABLE assessment_attempts ALTER COLUMN status TYPE VARCHAR(100);');
    await client.query('ALTER TABLE assessment_attempts ALTER COLUMN grading_status TYPE VARCHAR(100);');
    console.log('assessment_attempts status columns expanded to VARCHAR(100).');

    // 7. Ensure users.status column exists and is in sync with is_active
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';");
    await client.query("UPDATE users SET status = CASE WHEN is_active = FALSE THEN 'Suspended' ELSE 'Active' END WHERE status IS NULL;");
    console.log('users.status column ensured.');

    // 8. Ensure check constraint on companies allows all 7 statuses
    await client.query('ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_verification_status_check;');
    await client.query(`
      ALTER TABLE companies ADD CONSTRAINT companies_verification_status_check
        CHECK (verification_status IN (
          'PENDING_VERIFICATION',
          'UNDER_REVIEW',
          'ADDITIONAL_INFORMATION_REQUIRED',
          'APPROVED',
          'REJECTED',
          'SUSPENDED',
          'ARCHIVED'
        ));
    `);
    console.log('companies_verification_status_check validated.');

    await client.query('COMMIT');
    console.log('Migration V21 applied successfully!');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Migration V21 failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { run };
