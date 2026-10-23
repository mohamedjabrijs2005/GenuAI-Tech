require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const SQL = `
DO $$ BEGIN

  -- ==========================================
  -- AUTH HARDENING: users table additions
  -- ==========================================

  -- Account active flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
    ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  -- Account disabled timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='disabled_at') THEN
    ALTER TABLE users ADD COLUMN disabled_at TIMESTAMPTZ;
  END IF;

  -- Email verification
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified') THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verification_token') THEN
    ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verification_expires') THEN
    ALTER TABLE users ADD COLUMN email_verification_expires TIMESTAMPTZ;
  END IF;

  -- Password reset
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_reset_token') THEN
    ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_reset_expires') THEN
    ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMPTZ;
  END IF;

  -- OAuth / Google sign-in provider
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='auth_provider') THEN
    ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='provider_id') THEN
    ALTER TABLE users ADD COLUMN provider_id VARCHAR(255);
  END IF;

  -- Mark all existing users as verified (they registered before verification existed)
  UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;

END $$;

-- ==========================================
-- TRANSACTIONAL EMAIL: email_jobs outbox
-- ==========================================
CREATE TABLE IF NOT EXISTS email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  template_name VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for processing pending emails
CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON email_jobs(status) WHERE status = 'PENDING';
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V10 (Auth hardening + Email jobs)...');
    await client.query('BEGIN');
    await client.query(SQL);
    await client.query('COMMIT');
    console.log('Migration V10 applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V10 failed:', err.message);
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
