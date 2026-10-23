require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./src/database/pool');

async function runMilestoneVerification() {
  console.log('====================================================');
  console.log('🧪 MILESTONES 1-6 INTEGRATION & VERIFICATION SUITE');
  console.log('====================================================\n');

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
    // 1. Verify DB Schema additions
    console.log('📋 STEP 1: Database Schema & Auth Hardening Columns');
    const colsRes = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name IN ('is_active', 'email_verified', 'password_reset_token', 'auth_provider', 'provider_id')
    `);
    const colNames = colsRes.rows.map(r => r.column_name);
    assert(colNames.includes('is_active'), 'users.is_active column exists');
    assert(colNames.includes('email_verified'), 'users.email_verified column exists');
    assert(colNames.includes('password_reset_token'), 'users.password_reset_token column exists');
    assert(colNames.includes('auth_provider'), 'users.auth_provider column exists');

    // 2. Verify email_jobs table
    console.log('\n📋 STEP 2: Transactional Email Outbox Table');
    const emailTableRes = await pool.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_jobs')
    `);
    assert(emailTableRes.rows[0].exists, 'email_jobs table exists for transactional email outbox');

    // 3. Test Email Service Outbox Insertion
    console.log('\n📋 STEP 3: Email Service Dispatch & Outbox Persistence');
    const { sendEmail } = require('./src/services/email');
    const testEmailResult = await sendEmail({
      to: 'candidate.test@genuai.io',
      toName: 'Test Candidate',
      subject: 'Milestone Verification Test',
      html: '<p>Testing email outbox persistence</p>',
      templateName: 'verification_test',
    });

    const jobCheck = await pool.query(
      `SELECT id, recipient_email, subject, status FROM email_jobs WHERE recipient_email = 'candidate.test@genuai.io' ORDER BY created_at DESC LIMIT 1`
    );
    assert(jobCheck.rowCount > 0, 'email_jobs row was persisted into outbox');
    assert(jobCheck.rows[0]?.subject === 'Milestone Verification Test', 'email subject matches');

    // 4. Verify Assessment Tables
    console.log('\n📋 STEP 4: Official Assessment Tables');
    const attemptsTable = await pool.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assessment_attempts')
    `);
    const reqScoresTable = await pool.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assessment_requirement_scores')
    `);
    assert(attemptsTable.rows[0].exists, 'assessment_attempts table exists');
    assert(reqScoresTable.rows[0].exists, 'assessment_requirement_scores table exists');

    // 5. Test Assessment Attempt & Evidence Coverage Connection
    console.log('\n📋 STEP 5: Assessment Attempt → Requirement Scores → Coverage Connection');
    // Find or create test candidate & target
    const cand = await pool.query(`SELECT id, email FROM candidates LIMIT 1`);
    const target = await pool.query(`SELECT id, vacancy_id, company_id FROM targets LIMIT 1`);

    if (cand.rowCount > 0 && target.rowCount > 0) {
      const candidateId = cand.rows[0].id;
      const targetId = target.rows[0].id;
      const roleId = target.rows[0].vacancy_id;
      const companyId = target.rows[0].company_id;

      // Create test attempt
      const attemptRes = await pool.query(
        `INSERT INTO assessment_attempts
          (target_id, candidate_id, role_id, company_id, status, duration_minutes, started_at, expires_at, score, max_score)
         VALUES ($1, $2, $3, $4, 'SUBMITTED', 45, NOW(), NOW() + INTERVAL '45 minutes', 85, 100)
         RETURNING id`,
        [targetId, candidateId, roleId, companyId]
      );
      const attemptId = attemptRes.rows[0].id;
      assert(!!attemptId, 'Created assessment attempt record');

      // Link to requirement
      const req = await pool.query(`SELECT id FROM requirements WHERE role_id = $1 LIMIT 1`, [roleId]);
      if (req.rowCount > 0) {
        const reqId = req.rows[0].id;
        await pool.query(
          `INSERT INTO assessment_requirement_scores (attempt_id, requirement_id, score, max_score)
           VALUES ($1, $2, 85, 100)`,
          [attemptId, reqId]
        );

        // Test recomputeTargetCoverage incorporates this
        const { recomputeTargetCoverage } = require('./src/routes/evidenceService');
        await recomputeTargetCoverage(pool, targetId);

        const covRes = await pool.query(`SELECT * FROM target_coverage WHERE target_id = $1`, [targetId]);
        assert(covRes.rowCount > 0, 'Target coverage recomputed successfully');
        assert(Number(covRes.rows[0].supported_count) > 0, 'Assessment score credited requirement as SUPPORTED in target coverage');
      }

      // Cleanup test attempt
      await pool.query(`DELETE FROM assessment_attempts WHERE id = $1`, [attemptId]);
    } else {
      console.log('  ⚠️ Skipping candidate attempt test (no existing target in DB, schema verified)');
    }

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Test run error:', err);
  } finally {
    await pool.end();
  }
}

runMilestoneVerification();
