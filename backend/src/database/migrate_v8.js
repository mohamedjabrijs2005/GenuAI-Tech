require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const SQL = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='onboarding_submitted') THEN
    ALTER TABLE companies ADD COLUMN onboarding_submitted BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V8 (Company onboarding_submitted flag)...');
    await client.query('BEGIN');
    await client.query(SQL);
    await client.query('COMMIT');
    console.log('Migration V8 applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V8 failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { run };
