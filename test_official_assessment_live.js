const http = require('http');
const jwt = require('./backend/node_modules/jsonwebtoken');
require('./backend/node_modules/dotenv').config({ path: require('path').join(__dirname, 'backend/.env') });
const pool = require('./backend/src/database/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-12345';
const PORT = 4000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (_) {
            parsed = body;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
    failed++;
  }
}

async function run() {
  console.log('============================================================');
  console.log('🧪 OFFICIAL ASSESSMENT FLOW: COMPREHENSIVE AUTOMATED TEST');
  console.log('============================================================\n');

  const stamp = Date.now();
  const candEmail1 = `cand_assess_1_${stamp}@genuai.test`;
  const candEmail2 = `cand_assess_2_${stamp}@genuai.test`;
  const compEmail = `comp_assess_${stamp}@genuai.test`;

  try {
    // 1. Setup Company & User
    const compUserRes = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, status)
       VALUES ($1, 'hash', 'Corp', 'Admin', 'COMPANY_ADMIN', 'ACTIVE') RETURNING id`,
      [compEmail]
    );
    const compUserId = compUserRes.rows[0].id;

    const compRes = await pool.query(
      `INSERT INTO companies (name, official_email, verification_status)
       VALUES ($1, $2, 'APPROVED') RETURNING id`,
      [`Test Assessment Corp ${stamp}`, compEmail]
    );
    const companyId = compRes.rows[0].id;

    await pool.query(
      `INSERT INTO company_members (company_id, user_id, member_role)
       VALUES ($1, $2, 'ADMIN')`,
      [companyId, compUserId]
    );

    const deptRes = await pool.query(
      `INSERT INTO departments (company_id, name)
       VALUES ($1, 'Engineering') RETURNING id`,
      [companyId]
    );
    const departmentId = deptRes.rows[0].id;

    // 2. Setup Role / Vacancy
    const roleRes = await pool.query(
      `INSERT INTO company_roles (company_id, department_id, title, status, job_description, location, experience_level, employment_type)
       VALUES ($1, $2, $3, 'PUBLISHED', 'Senior Fullstack Engineer', 'Remote', 'mid', 'full_time') RETURNING id`,
      [companyId, departmentId, `Role Assess ${stamp}`]
    );
    const roleId = roleRes.rows[0].id;

    // 3. Setup Requirements
    const req1Res = await pool.query(
      `INSERT INTO requirements (role_id, company_id, name, description, weight, importance)
       VALUES ($1, $2, 'Distributed Systems Architecture', 'Microservices resilience', 1.0, 'REQUIRED')
       RETURNING id`,
      [roleId, companyId]
    );
    const req1Id = req1Res.rows[0].id;

    const req2Res = await pool.query(
      `INSERT INTO requirements (role_id, company_id, name, description, weight, importance)
       VALUES ($1, $2, 'PostgreSQL Database Performance', 'Indexes and transactions', 1.0, 'REQUIRED')
       RETURNING id`,
      [roleId, companyId]
    );
    const req2Id = req2Res.rows[0].id;

    // 4. Setup Candidates
    const candUser1Res = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, status)
       VALUES ($1, 'hash', 'Alice', 'Engineer', 'CANDIDATE', 'ACTIVE') RETURNING id`,
      [candEmail1]
    );
    const candidate1Id = candUser1Res.rows[0].id;

    await pool.query(
      `INSERT INTO candidates (id, email, first_name, last_name)
       VALUES ($1, $2, 'Alice', 'Engineer')`,
      [candidate1Id, candEmail1]
    );

    const candUser2Res = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, status)
       VALUES ($1, 'hash', 'Bob', 'Tester', 'CANDIDATE', 'ACTIVE') RETURNING id`,
      [candEmail2]
    );
    const candidate2Id = candUser2Res.rows[0].id;

    await pool.query(
      `INSERT INTO candidates (id, email, first_name, last_name)
       VALUES ($1, $2, 'Bob', 'Tester')`,
      [candidate2Id, candEmail2]
    );

    const token1 = signToken({ userId: candidate1Id, email: candEmail1, role: 'CANDIDATE', tokenVersion: 1 });
    const token2 = signToken({ userId: candidate2Id, email: candEmail2, role: 'CANDIDATE', tokenVersion: 1 });

    // 5. Setup Target for Candidate 1
    const targetRes = await pool.query(
      `INSERT INTO targets (candidate_id, company_id, vacancy_id, status)
       VALUES ($1, $2, $3, 'IN_PROGRESS') RETURNING id`,
      [candidate1Id, companyId, roleId]
    );
    const target1Id = targetRes.rows[0].id;

    console.log('--- TEST STEP 1: Unauthenticated Request Returns 401 ---');
    const unauthRes = await makeRequest('GET', `/api/candidate-portal/targets/${target1Id}/assessment/eligibility`);
    assert(unauthRes.status === 401, 'Unauthenticated request returns 401', `Got status ${unauthRes.status}`);

    console.log('\n--- TEST STEP 2: Eligibility Check Blocks Incomplete Learn & Practice ---');
    const eligRes1 = await makeRequest('GET', `/api/candidate-portal/targets/${target1Id}/assessment/eligibility`, null, token1);
    assert(eligRes1.status === 200, 'Eligibility endpoint responds 200', JSON.stringify(eligRes1.body));
    assert(eligRes1.body.eligible === false, 'Candidate is initially ineligible (practice not submitted)', `Eligible: ${eligRes1.body.eligible}`);
    assert(eligRes1.body.reasons.length > 0, 'Ineligible reasons returned', eligRes1.body.reasons.join(', '));

    console.log('\n--- TEST STEP 3: Complete Learn & Submit Practice Prerequisite ---');
    // Create learning resource
    const resRes = await pool.query(
      `INSERT INTO learning_resources (title, description, source, resource_type, requirement_name, status)
       VALUES ('Distributed Systems Guide', 'Official Guide', 'Official Docs', 'DOCUMENTATION', 'Distributed Systems Architecture', 'PUBLISHED')
       RETURNING id`
    );
    const resourceId = resRes.rows[0].id;

    // Complete Learn
    await pool.query(
      `INSERT INTO target_learning_progress (target_id, candidate_id, resource_id, status)
       VALUES ($1, $2, $3, 'COMPLETED')`,
      [target1Id, candidate1Id, resourceId]
    );
    // Submit Practice
    await pool.query(
      `INSERT INTO practice_attempts (target_id, candidate_id, requirement_name, requirement_id, status, score, max_score, submitted_at)
       VALUES ($1, $2, 'Distributed Systems Architecture', $3, 'SUBMITTED', 90, 100, NOW())`,
      [target1Id, candidate1Id, req1Id]
    );

    const eligRes2 = await makeRequest('GET', `/api/candidate-portal/targets/${target1Id}/assessment/eligibility`, null, token1);
    assert(eligRes2.body.eligible === true, 'Candidate becomes eligible after Learn & Practice', JSON.stringify(eligRes2.body.reasons));
    assert(eligRes2.body.checks.learnCompleted === true, 'Learn check is true');
    assert(eligRes2.body.checks.practiceSubmitted === true, 'Practice check is true');
    assert(eligRes2.body.checks.questionsExist === true, 'Questions exist is true');
    assert(eligRes2.body.remainingAttempts === 2, '2 attempts initially remaining');

    console.log('\n--- TEST STEP 4: Start Official Assessment Session (Questions Sanitized) ---');
    const startRes1 = await makeRequest(
      'POST',
      `/api/candidate-portal/targets/${target1Id}/assessment/session/start`,
      { timeLimitMinutes: 20 },
      token1
    );
    assert(startRes1.status === 201, 'Session start returns 201 Created', JSON.stringify(startRes1.body));
    const session1 = startRes1.body.session;
    const questions1 = startRes1.body.questions;

    assert(Boolean(session1?.id), 'Session ID created', session1?.id);
    assert(session1?.status === 'IN_PROGRESS', 'Session status is IN_PROGRESS');
    assert(session1?.time_limit_minutes === 20, 'Time limit is 20 minutes');
    assert(Boolean(session1?.expires_at), 'Expires at is set');

    // Verify expiry is ~20 minutes in the future
    const expDiff = new Date(session1.expires_at) - new Date(session1.started_at);
    assert(Math.round(expDiff / 60000) === 20, 'Expiry exactly 20 minutes from started_at');

    // Security Rule: NO correct answers or explanations leaked to candidate!
    const leaksAnswers = questions1.some((q) => q.correct_answer || q.correctAnswer || q.explanation);
    assert(!leaksAnswers, 'SECURITY: Questions returned WITHOUT correct answers or explanations');

    // Verify Question Types (MCQ, True/False, Short Answer)
    const types = new Set(questions1.map((q) => q.question_type));
    assert(types.has('MCQ'), 'Contains Multiple Choice Questions (MCQ)');
    assert(types.has('TRUE_FALSE'), 'Contains True/False Questions');
    assert(types.has('SHORT_ANSWER'), 'Contains Short Answer Questions');

    console.log('\n--- TEST STEP 5: Page Refresh / Re-start Resumes Ongoing Session ---');
    const resumeRes = await makeRequest(
      'POST',
      `/api/candidate-portal/targets/${target1Id}/assessment/session/start`,
      {},
      token1
    );
    assert(resumeRes.status === 200, 'Resume endpoint returns 200');
    assert(resumeRes.body.resumed === true, 'Session resumes without creating duplicate attempt');
    assert(resumeRes.body.session.id === session1.id, 'Resumed session matches original session ID');

    console.log('\n--- TEST STEP 6: Multi-Tenant & Candidate Access Isolation ---');
    // Candidate 2 attempts to submit Candidate 1's session
    const hackRes = await makeRequest(
      'POST',
      `/api/candidate-portal/targets/${target1Id}/assessment/session/submit`,
      { sessionId: session1.id, answers: {} },
      token2
    );
    assert(hackRes.status === 404 || hackRes.status === 403, 'Cross-candidate submission blocked with 403/404');

    console.log('\n--- TEST STEP 7: Submit Official Assessment Session & Calculate Score ---');
    // Prepare answers: answer all correctly
    const answers1 = {};
    for (const q of questions1) {
      if (q.question_type === 'MCQ') answers1[q.id] = 'B';
      else if (q.question_type === 'TRUE_FALSE') answers1[q.id] = 'TRUE';
      else if (q.question_type === 'SHORT_ANSWER') {
        answers1[q.id] = 'Automated unit and integration test suite, synthetic staging load simulation, and migration checks.';
      }
    }

    const submitRes = await makeRequest(
      'POST',
      `/api/candidate-portal/targets/${target1Id}/assessment/session/submit`,
      { sessionId: session1.id, answers: answers1 },
      token1
    );

    assert(submitRes.status === 200, 'Submit responds 200 OK', JSON.stringify(submitRes.body));
    assert(submitRes.body.status === 'SUBMITTED', 'Status is SUBMITTED');
    assert(submitRes.body.passFail === 'PASS', 'Assessment result is PASS');
    assert(Number(submitRes.body.score) >= 70, `Score is passing (>=70%): ${submitRes.body.score}%`);
    assert(submitRes.body.timeTakenSeconds >= 0, `Time taken recorded: ${submitRes.body.timeTakenSeconds}s`);

    // Verify correct answers and explanations ARE provided AFTER submission
    const review = submitRes.body.resultSummary?.questionsReview || [];
    assert(review.length > 0, 'Question review breakdown returned');
    assert(review.every((r) => r.correct_answer && r.explanation), 'Review includes correct answers and explanations');

    // Verify Target Coverage updated immediately
    const covVal = submitRes.body.coverage?.coveragePct ?? submitRes.body.coverage?.coverage_pct;
    assert(covVal > 0, `Coverage updated immediately: ${covVal}%`);

    console.log('\n--- TEST STEP 8: Idempotent Submission Handling ---');
    const doubleSubmitRes = await makeRequest(
      'POST',
      `/api/candidate-portal/targets/${target1Id}/assessment/session/submit`,
      { sessionId: session1.id, answers: answers1 },
      token1
    );
    assert(doubleSubmitRes.status === 200, 'Duplicate submission handled gracefully (200)');
    assert(doubleSubmitRes.body.status === 'SUBMITTED', 'Status remains SUBMITTED');

    console.log('\n--- TEST STEP 9: Attempt Count & Attempt Limit Enforcement ---');
    const eligRes3 = await makeRequest('GET', `/api/candidate-portal/targets/${target1Id}/assessment/eligibility`, null, token1);
    assert(eligRes3.body.remainingAttempts === 1, `1 attempt remaining (got ${eligRes3.body.remainingAttempts})`);

    // Start Attempt 2
    const startRes2 = await makeRequest(
      'POST',
      `/api/candidate-portal/targets/${target1Id}/assessment/session/start`,
      {},
      token1
    );
    assert(startRes2.status === 201, 'Attempt 2 successfully started');
    const session2 = startRes2.body.session;

    // Submit Attempt 2
    const submitRes2 = await makeRequest(
      'POST',
      `/api/candidate-portal/targets/${target1Id}/assessment/session/submit`,
      { sessionId: session2.id, answers: {} },
      token1
    );
    assert(submitRes2.status === 200, 'Attempt 2 submitted');

    // Now attempt limit of 2 should be exhausted
    const startRes3 = await makeRequest(
      'POST',
      `/api/candidate-portal/targets/${target1Id}/assessment/session/start`,
      {},
      token1
    );
    assert(startRes3.status === 403, 'Attempt 3 blocked with 403 Forbidden (Max attempts reached)');

    console.log('\n--- TEST STEP 10: Expired Session Handling ---');
    // Create an expired session directly in DB to test timer expiration
    const expTargetRes = await pool.query(
      `INSERT INTO targets (candidate_id, company_id, vacancy_id, status)
       VALUES ($1, $2, $3, 'IN_PROGRESS') RETURNING id`,
      [candidate2Id, companyId, roleId]
    );
    const expTargetId = expTargetRes.rows[0].id;
    await pool.query(`INSERT INTO target_learning_progress (target_id, candidate_id, resource_id, status) VALUES ($1, $2, $3, 'COMPLETED')`, [expTargetId, candidate2Id, resourceId]);
    await pool.query(`INSERT INTO practice_attempts (target_id, candidate_id, requirement_name, requirement_id, status, score, max_score, submitted_at) VALUES ($1, $2, 'Distributed Systems Architecture', $3, 'SUBMITTED', 90, 100, NOW())`, [expTargetId, candidate2Id, req1Id]);

    const expSessionRes = await pool.query(
      `INSERT INTO assessment_sessions (candidate_id, target_id, started_at, expires_at, status, time_limit_minutes)
       VALUES ($1, $2, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '10 minutes', 'IN_PROGRESS', 20)
       RETURNING id`,
      [candidate2Id, expTargetId]
    );
    const expSessionId = expSessionRes.rows[0].id;

    // Submit expired session
    const expSubmitRes = await makeRequest(
      'POST',
      `/api/candidate-portal/targets/${expTargetId}/assessment/session/submit`,
      { sessionId: expSessionId, answers: {} },
      token2
    );
    assert(expSubmitRes.status === 200, 'Expired submission processed');
    assert(expSubmitRes.body.status === 'EXPIRED', `Session marked EXPIRED: ${expSubmitRes.body.status}`);

    // Automatic cleanup of test artifacts so no mock companies/roles persist
    if (companyId) {
      await pool.query(`DELETE FROM assessment_sessions WHERE target_id IN (SELECT id FROM targets WHERE company_id = $1)`, [companyId]);
      await pool.query(`DELETE FROM official_assessment_questions WHERE role_id = $1`, [roleId]);
      await pool.query(`DELETE FROM assessment_requirement_scores WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE company_id = $1)`, [companyId]);
      await pool.query(`DELETE FROM assessment_attempts WHERE company_id = $1`, [companyId]);
      await pool.query(`DELETE FROM target_coverage WHERE company_id = $1`, [companyId]);
      await pool.query(`DELETE FROM practice_attempts WHERE target_id IN (SELECT id FROM targets WHERE company_id = $1)`, [companyId]);
      await pool.query(`DELETE FROM target_learning_progress WHERE target_id IN (SELECT id FROM targets WHERE company_id = $1)`, [companyId]);
      await pool.query(`DELETE FROM targets WHERE company_id = $1`, [companyId]);
      await pool.query(`DELETE FROM requirements WHERE role_id = $1`, [roleId]);
      await pool.query(`DELETE FROM company_roles WHERE id = $1`, [roleId]);
      await pool.query(`DELETE FROM departments WHERE company_id = $1`, [companyId]);
      await pool.query(`DELETE FROM company_members WHERE company_id = $1`, [companyId]);
      await pool.query(`DELETE FROM companies WHERE id = $1`, [companyId]);
    }
    await pool.query(`DELETE FROM candidates WHERE id IN ($1, $2)`, [candidate1Id, candidate2Id]);
    await pool.query(`DELETE FROM users WHERE id IN ($1, $2, $3)`, [candidate1Id, candidate2Id, compUserId]);

    console.log('\n============================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('============================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
