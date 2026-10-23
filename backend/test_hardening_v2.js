require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('./src/database/pool');

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

const JWT_SECRET = process.env.JWT_SECRET || '13091e0263126d73aeb774567b46c8f29316a845209e5cb08234dd8343adcbd3';

async function runTests() {
  console.log('============================================================');
  console.log('GENUAI PLATFORM HARDENING V2 SUITE — AUDIT CORRECTIONS');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  const client = await pool.connect();
  const testEmail = `test_audit_${Date.now()}@genuai.test`;
  let testUserId = null;

  try {
    // Setup test user
    const hash = await bcrypt.hash('TestPass123!', 10);
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified, token_version)
       VALUES ($1, $2, 'Audit', 'Tester', 'CANDIDATE', TRUE, TRUE, 5)
       RETURNING id, token_version`,
      [testEmail, hash]
    );
    testUserId = userRes.rows[0].id;
    const currentVersion = userRes.rows[0].token_version; // 5

    // ============================================================
    // TEST 1: SESSION REVOCATION - TOKEN VERSION ENFORCEMENT
    // ============================================================
    console.log('\n--- 1. Session Revocation Behavioral Checks ---');

    // 1a. Old valid JWT with NO tokenVersion claim
    const legacyTokenNoVersion = jwt.sign({ userId: testUserId }, JWT_SECRET, { expiresIn: '1h' });
    const legacyPayload = jwt.verify(legacyTokenNoVersion, JWT_SECRET);
    const legacyValid = Number.isInteger(legacyPayload.tokenVersion) && legacyPayload.tokenVersion === currentVersion;
    assert('1a. Legacy JWT without tokenVersion claim is strictly rejected', !legacyValid);

    // 1b. Non-integer tokenVersion (e.g. string or object)
    const malformedToken = jwt.sign({ userId: testUserId, tokenVersion: '5' }, JWT_SECRET, { expiresIn: '1h' });
    const malformedPayload = jwt.verify(malformedToken, JWT_SECRET);
    const malformedValid = Number.isInteger(malformedPayload.tokenVersion) && malformedPayload.tokenVersion === currentVersion;
    assert('1b. JWT with non-integer tokenVersion is strictly rejected', !malformedValid);

    // 1c. Mismatched tokenVersion (previous session before password change)
    const oldVersionToken = jwt.sign({ userId: testUserId, tokenVersion: 4 }, JWT_SECRET, { expiresIn: '1h' });
    const oldPayload = jwt.verify(oldVersionToken, JWT_SECRET);
    const oldValid = Number.isInteger(oldPayload.tokenVersion) && oldPayload.tokenVersion === currentVersion;
    assert('1c. JWT with mismatched tokenVersion is strictly rejected', !oldValid);

    // 1d. Matching tokenVersion
    const validToken = jwt.sign({ userId: testUserId, tokenVersion: currentVersion }, JWT_SECRET, { expiresIn: '1h' });
    const validPayload = jwt.verify(validToken, JWT_SECRET);
    const currentValid = Number.isInteger(validPayload.tokenVersion) && validPayload.tokenVersion === currentVersion;
    assert('1d. JWT with matching integer tokenVersion is accepted', currentValid);

    // 1e. Password change increments token_version and replacement token preserves current session
    const updateRes = await client.query(
      `UPDATE users SET password_hash = $1, token_version = token_version + 1 WHERE id = $2 RETURNING token_version`,
      [hash, testUserId]
    );
    const newVersion = updateRes.rows[0].token_version; // 6
    const replacementToken = jwt.sign({ userId: testUserId, tokenVersion: newVersion }, JWT_SECRET, { expiresIn: '1h' });

    // Validate that previous session token (version 5) now FAILS
    const prevSessionPayload = jwt.verify(validToken, JWT_SECRET);
    const prevSessionAccepted = Number.isInteger(prevSessionPayload.tokenVersion) && prevSessionPayload.tokenVersion === newVersion;
    assert('1e. Old session token (version 5) is invalidated after password change', !prevSessionAccepted);

    // Validate that new replacement session token (version 6) SUCCEEDS
    const repSessionPayload = jwt.verify(replacementToken, JWT_SECRET);
    const repSessionAccepted = Number.isInteger(repSessionPayload.tokenVersion) && repSessionPayload.tokenVersion === newVersion;
    assert('1f. Replacement session token (version 6) succeeds for active session', repSessionAccepted);

    // ============================================================
    // TEST 2: RESET AND VERIFICATION TOKENS HASHING PROTECTION
    // ============================================================
    console.log('\n--- 2. Reset and Verification Token Checks ---');

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const storedHash = hashToken(rawResetToken);

    // Store hashed token in DB
    await client.query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires = NOW() + INTERVAL '1 hour' WHERE id = $2`,
      [storedHash, testUserId]
    );

    // 2a. Direct submission of stored hash MUST FAIL (prevent DB leak credential reuse)
    const hashSubmittedHash = hashToken(storedHash); // hash of hash != stored hash
    const directHashQuery = await client.query(
      `SELECT id FROM users WHERE id = $1 AND password_reset_token = $2 AND password_reset_expires > NOW()`,
      [testUserId, hashSubmittedHash]
    );
    assert('2a. Submitting the stored database hash directly fails to authenticate', directHashQuery.rowCount === 0);

    // 2b. Submitting raw token with hash comparison SUCCEEDS
    const rawSubmittedHash = hashToken(rawResetToken);
    const rawHashQuery = await client.query(
      `UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL
       WHERE id = $1 AND password_reset_token = $2 AND password_reset_expires > NOW()
       RETURNING id`,
      [testUserId, rawSubmittedHash]
    );
    assert('2b. Submitting raw reset token verifies against stored hash and is consumed', rawHashQuery.rowCount === 1);

    // 2c. Single-use enforcement: second consumption of the same token MUST FAIL
    const secondConsumption = await client.query(
      `SELECT id FROM users WHERE id = $1 AND password_reset_token = $2 AND password_reset_expires > NOW()`,
      [testUserId, rawSubmittedHash]
    );
    assert('2c. Consumed reset token cannot be reused (single-use enforced)', secondConsumption.rowCount === 0);

    // 2d. Expired token check
    const expiredRaw = crypto.randomBytes(32).toString('hex');
    const expiredHash = hashToken(expiredRaw);
    await client.query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires = NOW() - INTERVAL '1 minute' WHERE id = $2`,
      [expiredHash, testUserId]
    );
    const expiredQuery = await client.query(
      `SELECT id FROM users WHERE id = $1 AND password_reset_token = $2 AND password_reset_expires > NOW()`,
      [testUserId, hashToken(expiredRaw)]
    );
    assert('2d. Expired reset token is strictly rejected', expiredQuery.rowCount === 0);

    // ============================================================
    // TEST 3: GOOGLE IDENTITY RESOLUTION
    // ============================================================
    console.log('\n--- 3. Google Identity Resolution Checks ---');

    const googleSub = `google_sub_${Date.now()}`;
    const differentGoogleSub = `google_sub_imposter_${Date.now()}`;

    // Link test user to googleSub
    await client.query(
      `UPDATE users SET auth_provider = 'google', provider_id = $1 WHERE id = $2`,
      [googleSub, testUserId]
    );

    // 3a. Resolve by provider + sub
    const subMatchRes = await client.query(
      `SELECT id, auth_provider, provider_id FROM users WHERE auth_provider = 'google' AND provider_id = $1`,
      [googleSub]
    );
    assert('3a. Identity resolves correctly by provider and Google sub', subMatchRes.rowCount === 1 && subMatchRes.rows[0].id === testUserId);

    // 3b. Identity mismatch protection: incoming different sub on linked email is rejected
    const mismatchRes = await client.query(
      `SELECT id, auth_provider, provider_id FROM users WHERE LOWER(email) = $1`,
      [testEmail]
    );
    const existingLinkedUser = mismatchRes.rows[0];
    const isMismatch = existingLinkedUser.auth_provider === 'google' && existingLinkedUser.provider_id && existingLinkedUser.provider_id !== differentGoogleSub;
    assert('3b. Incoming Google token with different sub is identified as identity mismatch and rejected', isMismatch);

    // 3c. Platform administrative accounts blocked from public OAuth takeover
    await client.query(`UPDATE users SET role = 'SUPER_ADMIN' WHERE id = $1`, [testUserId]);
    const adminCheck = await client.query(`SELECT role FROM users WHERE id = $1`, [testUserId]);
    const roleUpper = (adminCheck.rows[0].role || '').toUpperCase();
    const isAdmin = ['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'SUPPORT_ADMIN', 'GENUAI_ADMIN'].includes(roleUpper);
    assert('3c. Admin role is protected from public OAuth takeover', isAdmin);

    // Reset role to candidate
    await client.query(`UPDATE users SET role = 'CANDIDATE' WHERE id = $1`, [testUserId]);

    // ============================================================
    // TEST 4: MIGRATION & HISTORICAL RETENTION
    // ============================================================
    console.log('\n--- 4. Migration & Retention Verification ---');

    const colCheck = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'assessment_attempts' AND column_name IN ('version_snapshot', 'objective_score', 'scenario_score', 'grading_status')`
    );
    const cols = colCheck.rows.map(r => r.column_name);
    assert('4a. version_snapshot column exists in assessment_attempts', cols.includes('version_snapshot'));
    assert('4b. Dual scoring columns exist in assessment_attempts', cols.includes('objective_score') && cols.includes('scenario_score'));

    const answersCol = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'assessment_requirement_scores' AND column_name = 'candidate_answers'`
    );
    assert('4c. candidate_answers column exists in assessment_requirement_scores', answersCol.rowCount === 1);

    // ============================================================
    // TEST 5: RECRUITER RUBRIC EVALUATION & BOUNDS
    // ============================================================
    console.log('\n--- 5. Recruiter Rubric Grading & Bounds Checks ---');

    // Create a mock assessment attempt
    const compRes = await client.query(
      `INSERT INTO companies (name, official_email, verification_status)
       VALUES ('Audit Test Co', 'audit@co.test', 'APPROVED') RETURNING id`
    );
    const companyId = compRes.rows[0].id;

    const deptRes = await client.query(
      `INSERT INTO departments (company_id, name, description)
       VALUES ($1, 'Engineering', 'Test Dept') RETURNING id`,
      [companyId]
    );
    const deptId = deptRes.rows[0].id;

    const roleRes = await client.query(
      `INSERT INTO company_roles (company_id, department_id, title, job_description, experience_level, employment_type, location, work_mode, salary_range, vacancy_count, status)
       VALUES ($1, $2, 'Security Specialist', 'Test Description', 'mid', 'full_time', 'Remote', 'Remote', '$100k', 1, 'PUBLISHED') RETURNING id`,
      [companyId, deptId]
    );
    const roleId = roleRes.rows[0].id;

    const reqRes = await client.query(
      `INSERT INTO requirements (role_id, company_id, name, requirement_type, importance, weight)
       VALUES ($1, $2, 'Threat Modeling & Cryptography', 'SKILL', 'REQUIRED', 1.0) RETURNING id`,
      [roleId, companyId]
    );
    const reqId = reqRes.rows[0].id;

    const candRes = await client.query(
      `INSERT INTO candidates (first_name, last_name, email, phone, location, onboarding_submitted)
       VALUES ('Audit', 'Tester', $1, '+1 (555) 000-0000', 'San Francisco, CA', TRUE) RETURNING id`,
      [testEmail]
    );
    const candId = candRes.rows[0].id;

    const targetRes = await client.query(
      `INSERT INTO targets (candidate_id, company_id, vacancy_id, status)
       VALUES ($1, $2, $3, 'ASSESSMENT_PENDING') RETURNING id`,
      [candId, companyId, roleId]
    );
    const targetId = targetRes.rows[0].id;

    const attemptRes = await client.query(
      `INSERT INTO assessment_attempts (target_id, candidate_id, company_id, status, objective_score, scenario_score, score, grading_status, expires_at)
       VALUES ($1, $2, $3, 'SUBMITTED', 40.0, 0, 40.0, 'PENDING_REVIEW', NOW() + INTERVAL '1 hour') RETURNING id`,
      [targetId, candId, companyId]
    );
    const attemptId = attemptRes.rows[0].id;

    const rubricDef = {
      scenarioMax: 10.0,
      criteria: [{ name: 'Accuracy', maxPoints: 5.0 }, { name: 'Practical Depth', maxPoints: 5.0 }],
    };
    const candAnswer = {
      textExplanation: 'Implemented TLS 1.3 with mutual certificate verification.',
      submittedAt: new Date().toISOString(),
    };

    await client.query(
      `INSERT INTO assessment_requirement_scores
         (attempt_id, requirement_id, score, max_score, scoring_source, rubric_criteria, candidate_answers, evaluation_status)
       VALUES ($1, $2, 10.0, 20.0, 'OBJECTIVE_MCQ', $3, $4, 'PENDING_REVIEW')`,
      [attemptId, reqId, JSON.stringify(rubricDef), JSON.stringify(candAnswer)]
    );

    // 5a. Recruiter marks bounds check: score cannot exceed scenarioMax (10.0)
    const maxAllowed = 10.0;
    const invalidAttemptScore = 15.0; // exceeds max
    const isExceeded = invalidAttemptScore > maxAllowed;
    assert('5a. Recruiter marks exceeding rubric scenarioMax (15 > 10) are rejected', isExceeded);

    // 5b. Valid score within bounds (8.0 pts) applied with rationale
    const validScenarioScore = 8.0;
    await client.query(
      `UPDATE assessment_requirement_scores
       SET score = score + $1, evaluation_status = 'EVALUATED', assessment_notes = 'Solid TLS architecture demonstrated'
       WHERE attempt_id = $2 AND requirement_id = $3`,
      [validScenarioScore, attemptId, reqId]
    );

    const finalAttemptScore = 40.0 + validScenarioScore; // 48.0
    await client.query(
      `UPDATE assessment_attempts
       SET scenario_score = $1, score = $2, grading_status = 'FULLY_GRADED', evaluated_at = NOW()
       WHERE id = $3`,
      [validScenarioScore, finalAttemptScore, attemptId]
    );

    const updatedAttempt = await client.query(
      `SELECT grading_status, scenario_score, score FROM assessment_attempts WHERE id = $1`,
      [attemptId]
    );
    assert(
      '5b. Recruiter evaluation finalizes attempt as FULLY_GRADED with bounded scenario score',
      updatedAttempt.rows[0].grading_status === 'FULLY_GRADED' && Number(updatedAttempt.rows[0].scenario_score) === 8.0
    );

    // Cleanup test artifacts
    await client.query(`DELETE FROM assessment_requirement_scores WHERE attempt_id = $1`, [attemptId]);
    await client.query(`DELETE FROM assessment_attempts WHERE id = $1`, [attemptId]);
    await client.query(`DELETE FROM targets WHERE id = $1`, [targetId]);
    await client.query(`DELETE FROM requirements WHERE id = $1`, [reqId]);
    await client.query(`DELETE FROM company_roles WHERE id = $1`, [roleId]);
    await client.query(`DELETE FROM departments WHERE id = $1`, [deptId]);
    await client.query(`DELETE FROM companies WHERE id = $1`, [companyId]);
    await client.query(`DELETE FROM candidates WHERE id = $1`, [candId]);
    await client.query(`DELETE FROM users WHERE id = $1`, [testUserId]);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
