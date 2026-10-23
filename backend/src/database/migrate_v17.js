require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const MIGRATION_V17_SQL = `
-- Create migration ledger if not already created
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  filename    TEXT NOT NULL,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V17 (Schema Migrations Ledger & Seed Account Remediation)...');
    await client.query('BEGIN');

    // 1. Ensure schema_migrations table exists
    await client.query(MIGRATION_V17_SQL);

    // 2. Remediate known default seeded accounts
    const compromisedEmails = [
      'admin@genuai.test',
      'admin@genuai.io',
      'admin@genuaiadmin.com',
      'candidate@genuai.test',
      'companya@genuai.test',
      'companyb@genuai.test',
      'pending@genuai.test'
    ];

    let remediatedCount = 0;
    for (const email of compromisedEmails) {
      const userRes = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (userRes.rowCount > 0) {
        const userId = userRes.rows[0].id;
        // Generate long cryptographically secure random password
        const randomSecret = crypto.randomBytes(32).toString('hex');
        const secureHash = await bcrypt.hash(randomSecret, 12);

        // Update password and revoke all active JWT sessions
        await client.query(
          `UPDATE users 
           SET password_hash = $1, 
               token_version = token_version + 1,
               password_reset_token = NULL,
               password_reset_expires = NULL,
               updated_at = NOW()
           WHERE id = $2`,
          [secureHash, userId]
        );

        // Audit the remediation (never logging the password)
        await client.query(
          `INSERT INTO audit_logs 
             (actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata)
           VALUES 
             ($1, 'SYSTEM', 'SEEDED_ACCOUNT_SECURED', 'User', $2, 'SECURED', 
              'Default predictable credentials rotated to cryptographically secure random secret and sessions revoked.',
              $3)`,
          [userId, String(userId), JSON.stringify({ email, remediated_at: new Date().toISOString() })]
        );

        remediatedCount++;
      }
    }

    await client.query('COMMIT');
    console.log(`Migration V17 applied successfully! (${remediatedCount} seeded accounts remediated)`);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Migration V17 failed:', err.message);
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
