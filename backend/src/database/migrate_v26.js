require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

/**
 * Migration V26:
 * 1. user_notification_preferences table:
 *    - user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
 *    - assessment_invitation BOOLEAN DEFAULT TRUE
 *    - shortlist_update BOOLEAN DEFAULT TRUE
 *    - interview_schedule BOOLEAN DEFAULT TRUE
 *    - new_candidate_interest BOOLEAN DEFAULT TRUE
 *    - vacancy_updates BOOLEAN DEFAULT TRUE
 *    - product_updates BOOLEAN DEFAULT TRUE
 *    - created_at, updated_at
 * 2. college_institutions & college_members tables for College role support
 * 3. email_jobs status migration:
 *    - update legacy statuses to canonical 'queued', 'sent', 'failed' (or keep case-insensitive)
 *    - ensure status check / default 'queued'
 * 4. google_oauth_states table for CSRF state validation with expiry
 */
async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V26 (Notification Preferences, Google OAuth States, College Support)...');
    await client.query('BEGIN');

    // 1. Notification Preferences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        assessment_invitation BOOLEAN NOT NULL DEFAULT TRUE,
        shortlist_update BOOLEAN NOT NULL DEFAULT TRUE,
        interview_schedule BOOLEAN NOT NULL DEFAULT TRUE,
        new_candidate_interest BOOLEAN NOT NULL DEFAULT TRUE,
        vacancy_updates BOOLEAN NOT NULL DEFAULT TRUE,
        product_updates BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('user_notification_preferences table ensured.');

    // 2. Google OAuth state cache for CSRF protection
    await client.query(`
      CREATE TABLE IF NOT EXISTS oauth_states (
        state VARCHAR(128) PRIMARY KEY,
        return_to VARCHAR(500),
        role VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
      );
      CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
    `);
    console.log('oauth_states table ensured.');

    // 3. College Institutions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS colleges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        official_email VARCHAR(255),
        website VARCHAR(255),
        location VARCHAR(255) DEFAULT 'Global',
        verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS college_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        member_role VARCHAR(50) NOT NULL DEFAULT 'COLLEGE_ADMIN',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(college_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_college_members_user ON college_members(user_id);
    `);
    console.log('colleges and college_members tables ensured.');

    // 4. Update email_jobs status column default to 'queued' and align statuses
    await client.query(`
      ALTER TABLE email_jobs ALTER COLUMN status SET DEFAULT 'queued';
      UPDATE email_jobs SET status = 'queued' WHERE LOWER(status) IN ('pending', 'queued');
      UPDATE email_jobs SET status = 'sent' WHERE LOWER(status) = 'sent';
      UPDATE email_jobs SET status = 'failed' WHERE LOWER(status) IN ('failed', 'skipped');
    `);
    console.log('email_jobs canonical status updated.');

    await client.query('COMMIT');
    console.log('Migration V26 completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V26 failed:', err);
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
