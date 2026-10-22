require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const MIGRATION_V7_SQL = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='legal_name') THEN
    ALTER TABLE companies ADD COLUMN legal_name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='registration_number') THEN
    ALTER TABLE companies ADD COLUMN registration_number VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='verification_document_url') THEN
    ALTER TABLE companies ADD COLUMN verification_document_url VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='hiring_contact_role') THEN
    ALTER TABLE companies ADD COLUMN hiring_contact_role VARCHAR(150);
  END IF;
END $$;
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V7 (Companies Enterprise Columns)...');
    await client.query('BEGIN');
    await client.query(MIGRATION_V7_SQL);
    await client.query('COMMIT');
    console.log('Migration V7 applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V7 failed:', err.message);
    throw err;
  } finally {
    client.release();
    if (require.main === module) await pool.end();
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run };
