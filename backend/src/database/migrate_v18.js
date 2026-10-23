require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V18 (Final Enforced Seeded Account Password Rotation)...');
    await client.query('BEGIN');

    const compromisedEmails = [
      'admin@genuai.test',
      'admin@genuai.io',
      'admin@genuaiadmin.com',
      'candidate@genuai.test',
      'companya@genuai.test',
      'companyb@genuai.test',
      'pending@genuai.test'
    ];

    let rotatedCount = 0;
    for (const email of compromisedEmails) {
      const userRes = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (userRes.rowCount > 0) {
        const userId = userRes.rows[0].id;
        const randomSecret = crypto.randomBytes(32).toString('hex');
        const secureHash = await bcrypt.hash(randomSecret, 12);

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

        await client.query(
          `INSERT INTO audit_logs 
             (actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata)
           VALUES 
             ($1, 'SYSTEM', 'SEEDED_ACCOUNT_SECURED_V18', 'User', $2, 'SECURED', 
              'Default predictable credentials permanently rotated and sessions revoked.',
              $3)`,
          [userId, String(userId), JSON.stringify({ email, rotated_at: new Date().toISOString() })]
        );

        rotatedCount++;
      }
    }

    await client.query('COMMIT');
    console.log(`Migration V18 applied successfully! (${rotatedCount} accounts rotated)`);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Migration V18 failed:', err.message);
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
