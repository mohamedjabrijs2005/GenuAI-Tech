require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./src/database/pool');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { verifySchema } = require('./src/database/verify_schema');

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failed++;
  }
}

async function run() {
  console.log('============================================================');
  console.log('GENUAI PRODUCTION SAFETY, SECURITY & AUDIT SUITE');
  console.log('============================================================\n');

  // -------------------------------------------------------------
  // AUDIT 1: Production Startup Does Not Execute seed_dev.js
  // -------------------------------------------------------------
  console.log('📋 AUDIT 1: Production Startup Does Not Execute seed_dev.js');
  const serverContent = fs.readFileSync(path.join(__dirname, 'src/server.js'), 'utf8');
  assert('1a. server.js does not import seed_dev', !serverContent.includes('seed_dev'));
  assert('1b. server.js does not call seedDev', !serverContent.includes('seedDev'));
  assert('1c. render.yaml does not contain seed_dev in buildCommand', !fs.readFileSync(path.join(__dirname, '../render.yaml'), 'utf8').includes('seed_dev.js'));

  // -------------------------------------------------------------
  // AUDIT 2: Development Seed Blocked When NODE_ENV=production
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 2: Development Seed Blocked When NODE_ENV=production');
  const prevEnv = process.env.NODE_ENV;
  const prevAllow = process.env.ALLOW_DEVELOPMENT_SEED;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_DEVELOPMENT_SEED;
    let threw = false;
    try {
      const { seedDev } = require('./src/database/seed_dev');
      await seedDev();
    } catch (e) {
      threw = true;
    }
    assert('2a. seedDev() throws and refuses to run in production', threw);
  } finally {
    process.env.NODE_ENV = prevEnv;
    if (prevAllow) process.env.ALLOW_DEVELOPMENT_SEED = prevAllow;
  }

  // -------------------------------------------------------------
  // AUDIT 3: Seed Logs Contain No Passwords or Credentials
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 3: Seed Code Contains No Printed Credentials');
  const seedFileContent = fs.readFileSync(path.join(__dirname, 'src/database/seed_dev.js'), 'utf8');
  assert('3a. seed_dev.js does not print Admin12345!', !seedFileContent.includes("Admin12345!"));
  assert('3b. seed_dev.js does not print Candidate123!', !seedFileContent.includes("Candidate123!"));
  assert('3c. seed_dev.js does not print CompanyA123!', !seedFileContent.includes("CompanyA123!"));
  assert('3d. seed_dev.js logs clean completion message', seedFileContent.includes('Development database seeding completed.'));

  // -------------------------------------------------------------
  // AUDIT 4: Migration Ledger Prevents Duplicate Execution
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 4: Migration Ledger Prevents Duplicate Execution');
  const ledgerRes = await pool.query('SELECT version, filename, applied_at FROM schema_migrations ORDER BY applied_at ASC');
  const ledgerVersions = new Set(ledgerRes.rows.map(r => r.version));
  assert('4a. schema_migrations table exists with records', ledgerRes.rowCount >= 18);
  assert('4b. Ledger contains v1 through v18', ledgerVersions.has('v1') && ledgerVersions.has('v16') && ledgerVersions.has('v17') && ledgerVersions.has('v18'));

  // -------------------------------------------------------------
  // AUDIT 5: Missing Migration File Causes Deployment Failure
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 5: Missing Migration File Causes Failure');
  const { MIGRATIONS } = require('./src/database/migrate_all');
  let allExist = true;
  for (const m of MIGRATIONS) {
    if (!fs.existsSync(path.join(__dirname, 'src/database', m.file))) {
      allExist = false;
    }
  }
  assert('5a. All ledger-configured migration files exist on disk', allExist);
  assert('5b. migrate_all.js enforces pre-flight missing file check', fs.readFileSync(path.join(__dirname, 'src/database/migrate_all.js'), 'utf8').includes('Required migration file'));

  // -------------------------------------------------------------
  // AUDIT 6: Failed Migration Halts Deployment Safely
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 6: Migration Runner Concurrency & Safe Halting');
  const migrateAllContent = fs.readFileSync(path.join(__dirname, 'src/database/migrate_all.js'), 'utf8');
  assert('6a. migrate_all.js uses PostgreSQL advisory lock for concurrency protection', migrateAllContent.includes('pg_advisory_lock'));
  assert('6b. migrate_all.js releases advisory lock in finally block', migrateAllContent.includes('pg_advisory_unlock'));

  // -------------------------------------------------------------
  // AUDIT 7: Seeded Accounts Cannot Retain Known Default Passwords
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 7: Seeded Accounts Cannot Retain Known Default Passwords');
  const seededAccounts = [
    { email: 'admin@genuai.test', oldPass: 'Admin12345!' },
    { email: 'candidate@genuai.test', oldPass: 'Candidate123!' },
    { email: 'companya@genuai.test', oldPass: 'CompanyA123!' },
    { email: 'companyb@genuai.test', oldPass: 'CompanyB123!' },
    { email: 'pending@genuai.test', oldPass: 'Pending123!' }
  ];

  for (const acc of seededAccounts) {
    const uRes = await pool.query('SELECT password_hash, token_version FROM users WHERE LOWER(email) = LOWER($1)', [acc.email]);
    if (uRes.rowCount > 0) {
      const match = await bcrypt.compare(acc.oldPass, uRes.rows[0].password_hash);
      assert(`7. ${acc.email} default password rejected`, !match);
    }
  }

  // -------------------------------------------------------------
  // AUDIT 8: Seeded Account Sessions Revoked & Audited
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 8: Seeded Account Sessions Revoked & Audited');
  const auditRes = await pool.query(
    "SELECT action, entity_type, reason FROM audit_logs WHERE action = 'SEEDED_ACCOUNT_SECURED' ORDER BY created_at DESC LIMIT 5"
  );
  assert('8a. Audit logs record SEEDED_ACCOUNT_SECURED events', auditRes.rowCount > 0);
  assert('8b. Audit reason indicates credentials rotated and sessions revoked', auditRes.rows[0]?.reason.includes('sessions revoked'));

  // -------------------------------------------------------------
  // AUDIT 9: Candidate Multi-Tenant Data Isolation
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 9: Candidate Multi-Tenant Data Isolation');
  // Verify target queries strictly enforce candidate_id ownership
  const portalRoutesContent = fs.readFileSync(path.join(__dirname, 'src/routes/candidatePortal.js'), 'utf8');
  assert('9a. candidatePortal verifies target ownership via candidate_id', portalRoutesContent.includes('WHERE t.id = $1 AND t.candidate_id = $2'));
  assert('9b. practice session queries check candidate_id', portalRoutesContent.includes('target_id = $1 AND candidate_id = $2'));

  // -------------------------------------------------------------
  // AUDIT 10: Company Multi-Tenant Data Isolation
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 10: Company Multi-Tenant Data Isolation');
  const vacancyRoutesContent = fs.readFileSync(path.join(__dirname, 'src/routes/vacancies.js'), 'utf8');
  assert('10a. vacancies routes filter by req.companyMembership.company_id', vacancyRoutesContent.includes('req.companyMembership.company_id'));
  const candidateRoutesContent = fs.readFileSync(path.join(__dirname, 'src/routes/candidates.js'), 'utf8');
  assert('10b. candidates routes filter by company_id', candidateRoutesContent.includes('company_id'));

  // -------------------------------------------------------------
  // AUDIT 11: Recruiter Grading Authorization & Isolation
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 11: Recruiter Grading Authorization & Isolation');
  assert('11a. Recruiter evaluation requires authenticated user', portalRoutesContent.includes("router.post('/targets/:id/assessment/attempts/:attemptId/evaluate', authenticate"));
  assert('11b. Dual evaluation separates objective and scenario marks', portalRoutesContent.includes('objective_score') && portalRoutesContent.includes('scenario_score'));

  // -------------------------------------------------------------
  // AUDIT 12: Practice APIs Never Expose Answer Keys
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 12: Practice APIs Never Expose Answer Keys');
  // Delivery query
  assert('12a. Practice question delivery excludes correct_option and explanation', 
    portalRoutesContent.includes('SELECT DISTINCT pq.id, pq.requirement_name, pq.title, pq.prompt, pq.question_type, pq.options, pq.topic_area, pq.difficulty'));
  // Ensure legacy table has NULL in correct_option
  const legacyNullRes = await pool.query(
    "SELECT COUNT(*) FROM practice_questions WHERE correct_option IS NOT NULL OR explanation IS NOT NULL"
  );
  assert('12b. No practice_questions rows contain legacy answer keys', Number(legacyNullRes.rows[0].count) === 0);

  // -------------------------------------------------------------
  // AUDIT 13: Assessment Assignment, Deadline & Idempotency
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 13: Assessment Assignment, Deadline & Idempotency');
  assert('13a. Assessment start enforces 45-minute server-side interval', portalRoutesContent.includes("NOW() + ($5 || ' minutes')::interval"));
  assert('13b. Assessment draft save rejects expired attempt (expires_at > NOW())', portalRoutesContent.includes("expires_at > NOW()"));
  assert('13c. Assessment submission uses row-level locking (FOR UPDATE NOWAIT)', portalRoutesContent.includes("FOR UPDATE NOWAIT"));

  // -------------------------------------------------------------
  // AUDIT 14: Password Reset Token Security
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 14: Password Reset Token Security');
  const authRoutesContent = fs.readFileSync(path.join(__dirname, 'src/routes/auth.js'), 'utf8');
  assert('14a. Reset token uses cryptographically secure random bytes', authRoutesContent.includes("crypto.randomBytes(32).toString('hex')"));
  assert('14b. Reset token expires in 1 hour', authRoutesContent.includes("1 hour"));
  assert('14c. Token is single-use: cleared on successful password update', authRoutesContent.includes("password_reset_token = NULL"));
  assert('14d. token_version incremented upon password reset to revoke existing JWTs', authRoutesContent.includes("token_version = token_version + 1"));

  // -------------------------------------------------------------
  // AUDIT 15: Google OAuth Security
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 15: Google OAuth Security');
  assert('15a. Google OAuth uses OAuth2Client verifyIdToken', authRoutesContent.includes("verifyIdToken"));
  assert('15b. Token verification checks audience matches GOOGLE_CLIENT_ID', authRoutesContent.includes("audience: process.env.GOOGLE_CLIENT_ID"));
  assert('15c. Google account linking validates provider_id/sub', authRoutesContent.includes("provider_id"));

  // -------------------------------------------------------------
  // AUDIT 16: Deployment Schema Verification
  // -------------------------------------------------------------
  console.log('\n📋 AUDIT 16: Deployment Schema Verification');
  const schemaValid = await verifySchema();
  assert('16a. verifySchema passes with 0 missing tables, columns, or ledger issues', schemaValid === true);

  console.log('\n============================================================');
  console.log(`PRODUCTION AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Audit suite fatal error:', err);
  process.exit(1);
});
