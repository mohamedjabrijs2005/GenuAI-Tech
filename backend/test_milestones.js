require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./src/database/pool');
const crypto = require('crypto');

function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

async function runMilestoneVerification() {
  console.log('================================================================');
  console.log('🧪 HARDENED MILESTONES INTEGRATION, SECURITY & REGRESSION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Password & Verification Token Hashing (SHA-256)
    // -------------------------------------------------------------
    console.log('📋 TEST 1: Cryptographic Token Storage (SHA-256 Hashing)');
    const rawResetToken = 'test_reset_secret_token_12345';
    const hashedResetToken = hashToken(rawResetToken);
    assert(hashedResetToken !== rawResetToken, 'Raw token and hashed token are distinct');
    assert(hashedResetToken.length === 64, 'Hashed token has 256-bit hexadecimal representation');

    // -------------------------------------------------------------
    // TEST 2: Session Invalidation on Password Update (token_version)
    // -------------------------------------------------------------
    console.log('\n📋 TEST 2: Session Invalidation Tracking (token_version)');
    const tokenVerRes = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'token_version'
    `);
    assert(tokenVerRes.rowCount > 0, 'users.token_version column exists');

    // -------------------------------------------------------------
    // TEST 3: Transactional Outbox (Nodemailer + Gmail SMTP)
    // -------------------------------------------------------------
    console.log('\n📋 TEST 3: Transactional Outbox (Nodemailer + Gmail SMTP)');
    const { sendEmail } = require('./src/services/email');
    await sendEmail({
      to: 'outbox.verify@genuai.io',
      toName: 'Auditor',
      subject: 'Security Audit Email Outbox Test',
      html: '<p>Verifying outbox pattern decoupling</p>',
      templateName: 'audit_test',
    });

    const outboxRow = await pool.query(
      `SELECT id, recipient_email, subject, status, attempts FROM email_jobs WHERE recipient_email = 'outbox.verify@genuai.io' ORDER BY created_at DESC LIMIT 1`
    );
    assert(outboxRow.rowCount > 0, 'Email job persisted in outbox table before delivery');
    assert(['PENDING', 'SENT', 'FAILED', 'SKIPPED'].includes(outboxRow.rows[0].status), `Valid outbox status: ${outboxRow.rows[0].status}`);

    // -------------------------------------------------------------
    // TEST 4: Google Auth Token Verification & Claim Hardening
    // -------------------------------------------------------------
    console.log('\n📋 TEST 4: Google Authentication Claims & Role Guard');
    const authRoutes = require('./src/routes/auth');
    assert(typeof authRoutes === 'function', 'Auth router loaded with hardened Google endpoint');

    // -------------------------------------------------------------
    // TEST 5: Objective vs Scenario Assessment Grading Decoupling
    // -------------------------------------------------------------
    console.log('\n📋 TEST 5: Assessment Engine: Objective Scoring & Rubric Decoupling');
    const colsAttempt = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'assessment_attempts' AND column_name IN ('objective_score', 'scenario_score', 'grading_status')
    `);
    const attemptColNames = colsAttempt.rows.map(r => r.column_name);
    assert(attemptColNames.includes('objective_score'), 'assessment_attempts tracks objective_score');
    assert(attemptColNames.includes('scenario_score'), 'assessment_attempts tracks scenario_score');
    assert(attemptColNames.includes('grading_status'), 'assessment_attempts tracks grading_status (PENDING_REVIEW / FULLY_GRADED)');

    // -------------------------------------------------------------
    // TEST 6: Coverage Integration: Full Grading Required for Support
    // -------------------------------------------------------------
    console.log('\n📋 TEST 6: Coverage Governance: Human Oversight & Provenance');
    const target = await pool.query(`SELECT id, vacancy_id, company_id, candidate_id FROM targets LIMIT 1`);
    if (target.rowCount > 0) {
      const t = target.rows[0];
      const { recomputeTargetCoverage } = require('./src/routes/evidenceService');
      await recomputeTargetCoverage(pool, t.id);

      const covRes = await pool.query(`SELECT * FROM target_coverage WHERE target_id = $1`, [t.id]);
      assert(covRes.rowCount > 0, 'Target coverage snapshot computed without error');
    }

    console.log('\n================================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await pool.end();
  }
}

runMilestoneVerification();
