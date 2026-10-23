require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const pool = require('./pool');

const MIGRATIONS = [
  { version: 'v1', file: 'migrate.js' },
  { version: 'v2', file: 'migrate_v2.js' },
  { version: 'v3', file: 'migrate_v3.js' },
  { version: 'v4', file: 'migrate_v4.js' },
  { version: 'v5', file: 'migrate_v5.js' },
  { version: 'v6', file: 'migrate_v6.js' },
  { version: 'v7', file: 'migrate_v7.js' },
  { version: 'v8', file: 'migrate_v8.js' },
  { version: 'v9', file: 'migrate_v9.js' },
  { version: 'v10', file: 'migrate_v10.js' },
  { version: 'v11', file: 'migrate_v11.js' },
  { version: 'v12', file: 'migrate_v12.js' },
  { version: 'v13', file: 'migrate_v13.js' },
  { version: 'v14', file: 'migrate_v14.js' },
  { version: 'v15', file: 'migrate_v15.js' },
  { version: 'v16', file: 'migrate_v16.js' },
  { version: 'v17', file: 'migrate_v17.js' }
];

// Advisory lock key to serialize concurrent deployment migration runs
const ADVISORY_LOCK_ID = 88442211;

async function runAll() {
  console.log('============================================================');
  console.log('🚀 GenuAI Migration Ledger Runner');
  console.log('============================================================');

  // Step 1: Pre-flight validation - Ensure NO required migration file is missing
  for (const m of MIGRATIONS) {
    const fullPath = path.join(__dirname, m.file);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ CRITICAL: Required migration file "${m.file}" (${m.version}) is missing on disk!`);
      console.error('Migration process aborted. Deploy cannot proceed with missing migration files.');
      process.exit(1);
    }
  }

  const client = await pool.connect();
  let lockAcquired = false;

  try {
    // Step 2: Acquire database advisory lock for deployment concurrency protection
    console.log('Acquiring database migration advisory lock...');
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_ID]);
    lockAcquired = true;
    console.log('🔒 Advisory lock acquired.');

    // Step 3: Create schema_migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version     TEXT PRIMARY KEY,
        filename    TEXT NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Step 4: Fetch already applied migration versions
    const ledgerRes = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(ledgerRes.rows.map(r => r.version));
    console.log(`Found ${appliedVersions.size} existing recorded migration(s) in schema_migrations ledger.`);

    // Step 5: Execute only unapplied migrations
    for (const m of MIGRATIONS) {
      const fullPath = path.join(__dirname, m.file);

      if (appliedVersions.has(m.version)) {
        console.log(`⏭️  ${m.file} (${m.version}) already applied. Skipping.`);
        continue;
      }

      console.log(`\n▶️  Applying unapplied migration: ${m.file} (${m.version})...`);
      try {
        execFileSync(process.execPath, [fullPath], {
          stdio: 'inherit',
          env: process.env
        });

        // Record successful application in the ledger
        await client.query(
          `INSERT INTO schema_migrations (version, filename, applied_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (version) DO UPDATE SET filename = EXCLUDED.filename, applied_at = NOW()`,
          [m.version, m.file]
        );
        console.log(`✅ ${m.file} (${m.version}) recorded in schema_migrations ledger.`);
      } catch (err) {
        console.error(`\n❌ Migration ${m.file} (${m.version}) execution failed!`);
        console.error('Stopping migration runner immediately. Database remains at last stable migration.');
        process.exit(1);
      }
    }

    console.log('\n============================================================');
    console.log('✅ ALL DATABASE MIGRATIONS UP TO DATE & RECORDED IN LEDGER');
    console.log('============================================================\n');
  } finally {
    if (lockAcquired) {
      try {
        await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_ID]);
        console.log('🔓 Advisory lock released.');
      } catch (e) {
        console.warn('Warning: Could not release advisory lock cleanly:', e.message);
      }
    }
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  runAll().catch(err => {
    console.error('Fatal migration ledger error:', err);
    process.exit(1);
  });
}

module.exports = { runAll, MIGRATIONS, ADVISORY_LOCK_ID };
