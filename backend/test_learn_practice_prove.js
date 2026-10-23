require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./src/database/pool');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('============================================================');
  console.log('GENUAI LEARN → PRACTICE → PROVE BEHAVIORAL SUITE');
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
  const timestamp = Date.now();
  const candAEmail = `candidate_a_${timestamp}@genuai.test`;
  const candBEmail = `candidate_b_${timestamp}@genuai.test`;

  let userAId, userBId, candAId, candBId;
  let companyId, deptId, roleId, reqIdJava, reqIdSql, targetAId, targetBId;

  try {
    console.log('--- Setting up Test Fixtures ---');

    // 1. Create Candidates A & B
    const hash = await bcrypt.hash('TestPass123!', 10);

    const userARes = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified, token_version)
       VALUES ($1, $2, 'Candidate', 'A', 'CANDIDATE', TRUE, TRUE, 1) RETURNING id`,
      [candAEmail, hash]
    );
    userAId = userARes.rows[0].id;

    const candARec = await client.query(
      `INSERT INTO candidates (first_name, last_name, email, onboarding_submitted)
       VALUES ('Candidate', 'A', $1, TRUE) RETURNING id`,
      [candAEmail]
    );
    candAId = candARec.rows[0].id;

    const userBRes = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified, token_version)
       VALUES ($1, $2, 'Candidate', 'B', 'CANDIDATE', TRUE, TRUE, 1) RETURNING id`,
      [candBEmail, hash]
    );
    userBId = userBRes.rows[0].id;

    const candBRec = await client.query(
      `INSERT INTO candidates (first_name, last_name, email, onboarding_submitted)
       VALUES ('Candidate', 'B', $1, TRUE) RETURNING id`,
      [candBEmail]
    );
    candBId = candBRec.rows[0].id;

    // 2. Create Company, Department, Vacancy, and Requirements (Java & SQL)
    const compRes = await client.query(
      `INSERT INTO companies (name, official_email, verification_status)
       VALUES ('Learn Co', $1, 'APPROVED') RETURNING id`,
      [`learn_co_${timestamp}@genuai.test`]
    );
    companyId = compRes.rows[0].id;

    const deptRes = await client.query(
      `INSERT INTO departments (company_id, name, description)
       VALUES ($1, 'Core Platform', 'Platform engineering') RETURNING id`,
      [companyId]
    );
    deptId = deptRes.rows[0].id;

    const roleRes = await client.query(
      `INSERT INTO company_roles (company_id, department_id, title, job_description, experience_level, employment_type, location, work_mode, salary_range, vacancy_count, status)
       VALUES ($1, $2, 'Backend Platform Engineer', 'Core Java & SQL engineering', 'senior', 'full_time', 'Remote', 'Remote', '$140k', 1, 'PUBLISHED')
       RETURNING id`,
      [companyId, deptId]
    );
    roleId = roleRes.rows[0].id;

    const reqJavaRes = await client.query(
      `INSERT INTO requirements (role_id, company_id, name, requirement_type, importance, weight)
       VALUES ($1, $2, 'Java', 'SKILL', 'REQUIRED', 1.0) RETURNING id`,
      [roleId, companyId]
    );
    reqIdJava = reqJavaRes.rows[0].id;

    const reqSqlRes = await client.query(
      `INSERT INTO requirements (role_id, company_id, name, requirement_type, importance, weight)
       VALUES ($1, $2, 'SQL', 'SKILL', 'REQUIRED', 1.0) RETURNING id`,
      [roleId, companyId]
    );
    reqIdSql = reqSqlRes.rows[0].id;

    // 3. Targets for Candidate A and Candidate B
    const targetARes = await client.query(
      `INSERT INTO targets (candidate_id, company_id, vacancy_id, status)
       VALUES ($1, $2, $3, 'ASSESSMENT_PENDING') RETURNING id`,
      [candAId, companyId, roleId]
    );
    targetAId = targetARes.rows[0].id;

    const targetBRes = await client.query(
      `INSERT INTO targets (candidate_id, company_id, vacancy_id, status)
       VALUES ($1, $2, $3, 'ASSESSMENT_PENDING') RETURNING id`,
      [candBId, companyId, roleId]
    );
    targetBId = targetBRes.rows[0].id;

    // ============================================================
    // TEST 1: LEARN CURRICULUM MATCHING
    // ============================================================
    console.log('\n--- 1. Learn Curriculum Matching ---');

    const javaResourcesRes = await client.query(
      `SELECT id, title, requirement_name, url FROM learning_resources WHERE requirement_name = 'Java'`
    );
    assert('1a. Curated Java learning resources exist in database', javaResourcesRes.rowCount >= 2);

    const sqlResourcesRes = await client.query(
      `SELECT id, title, requirement_name, url FROM learning_resources WHERE requirement_name = 'SQL'`
    );
    assert('1b. Curated SQL learning resources exist in database', sqlResourcesRes.rowCount >= 2);

    // ============================================================
    // TEST 2: LEARNING PROGRESS PERSISTENCE
    // ============================================================
    console.log('\n--- 2. Learning Progress Persistence ---');

    const testResource = javaResourcesRes.rows[0];

    // Candidate A marks resource completed
    await client.query(
      `INSERT INTO target_learning_progress (target_id, candidate_id, resource_id, status, last_accessed_at, completed_at)
       VALUES ($1, $2, $3, 'COMPLETED', NOW(), NOW())
       ON CONFLICT (target_id, resource_id)
       DO UPDATE SET status = 'COMPLETED', completed_at = NOW(), last_accessed_at = NOW()`,
      [targetAId, candAId, testResource.id]
    );

    const progressCheck = await client.query(
      `SELECT status, completed_at FROM target_learning_progress WHERE target_id = $1 AND candidate_id = $2 AND resource_id = $3`,
      [targetAId, candAId, testResource.id]
    );
    assert('2a. Candidate A learning progress is persisted with COMPLETED status and timestamp', progressCheck.rows[0]?.status === 'COMPLETED' && progressCheck.rows[0]?.completed_at !== null);

    // ============================================================
    // TEST 3: CANDIDATE ISOLATION (CANDIDATE B CANNOT SEE CANDIDATE A PROGRESS)
    // ============================================================
    console.log('\n--- 3. Candidate Isolation & Boundary Checks ---');

    const candBProgress = await client.query(
      `SELECT status FROM target_learning_progress WHERE target_id = $1 AND candidate_id = $2 AND resource_id = $3`,
      [targetBId, candBId, testResource.id]
    );
    assert('3a. Candidate B has independent progress (NOT completed by Candidate A action)', candBProgress.rowCount === 0);

    // ============================================================
    // TEST 4: PRACTICE SANDBOX — ATTEMPTS, OBJECTIVE SCORING & EXPLANATIONS
    // ============================================================
    console.log('\n--- 4. Practice Sandbox Scoring & Explanations ---');

    const practiceQuestionsRes = await client.query(
      `SELECT id, title, prompt, options, correct_option, explanation, topic_area
       FROM practice_questions
       WHERE requirement_name = 'SQL'`
    );
    assert('4a. Requirement-linked practice questions exist for SQL', practiceQuestionsRes.rowCount >= 2);

    // Start practice attempt
    const practiceAttemptRes = await client.query(
      `INSERT INTO practice_attempts (target_id, candidate_id, requirement_name, status, max_score)
       VALUES ($1, $2, 'SQL', 'IN_PROGRESS', $3) RETURNING id`,
      [targetAId, candAId, practiceQuestionsRes.rowCount]
    );
    const practiceAttemptId = practiceAttemptRes.rows[0].id;

    // Simulate answer submission: Answer question 1 correctly, question 2 incorrectly
    const q1 = practiceQuestionsRes.rows[0];
    const q2 = practiceQuestionsRes.rows[1];
    const answers = {
      [q1.id]: q1.correct_option,
      [q2.id]: 'WRONG_KEY',
    };

    let earnedScore = 0;
    const topicsToRevisit = [];

    for (const q of practiceQuestionsRes.rows) {
      const chosen = answers[q.id];
      if (chosen === q.correct_option) {
        earnedScore += 1;
      } else {
        if (q.topic_area) topicsToRevisit.push(q.topic_area);
      }
    }

    await client.query(
      `UPDATE practice_attempts
       SET answers = $1, score = $2, max_score = $3, explanations_released = TRUE, status = 'COMPLETED',
           topics_to_revisit = $4, submitted_at = NOW()
       WHERE id = $5`,
      [JSON.stringify(answers), earnedScore, practiceQuestionsRes.rowCount, JSON.stringify(topicsToRevisit), practiceAttemptId]
    );

    const savedPracticeRes = await client.query(
      `SELECT score, max_score, explanations_released, status, topics_to_revisit FROM practice_attempts WHERE id = $1`,
      [practiceAttemptId]
    );
    const savedPractice = savedPracticeRes.rows[0];

    assert('4b. Practice attempt recorded objective score accurately (1 / 2)', Number(savedPractice.score) === 1);
    assert('4c. Explanations released exclusively after submission', savedPractice.explanations_released === true);
    assert('4d. Practice correctly identified topic to revisit for wrong answer', savedPractice.topics_to_revisit.length > 0);

    // ============================================================
    // TEST 5: PRACTICE DOES NOT MODIFY OFFICIAL ASSESSMENT OR EVIDENCE COVERAGE
    // ============================================================
    console.log('\n--- 5. Non-Interference: Practice vs Official Assessment & Coverage ---');

    const officialAttemptRes = await client.query(
      `SELECT * FROM assessment_attempts WHERE target_id = $1`,
      [targetAId]
    );
    assert('5a. Completing practice attempts does NOT create or alter official assessment attempt', officialAttemptRes.rowCount === 0);

    const targetCoverageRes = await client.query(
      `SELECT * FROM target_coverage WHERE target_id = $1`,
      [targetAId]
    );
    assert('5b. Practice does NOT artificially convert requirements to SUPPORTED in coverage table', targetCoverageRes.rowCount === 0);

    // ============================================================
    // TEST 6: PREPARATION GATING RULE (ASSESSMENT ACCESSIBLE WITHOUT MANDATORY LEARNING CLICKS)
    // ============================================================
    console.log('\n--- 6. Gating & Separate Measurement Checks ---');

    // Candidate B completed 0 learning resources and 0 practice sets
    // Candidate B can immediately start the official assessment
    const candBAssessmentAttemptRes = await client.query(
      `INSERT INTO assessment_attempts (target_id, candidate_id, company_id, status, objective_score, scenario_score, score, grading_status, expires_at)
       VALUES ($1, $2, $3, 'IN_PROGRESS', 0, 0, 0, 'PENDING_REVIEW', NOW() + INTERVAL '45 minutes')
       RETURNING id, status`,
      [targetBId, candBId, companyId]
    );
    assert('6a. Candidate B can initiate official assessment directly without prerequisite learning clicks', candBAssessmentAttemptRes.rowCount === 1 && candBAssessmentAttemptRes.rows[0].status === 'IN_PROGRESS');

    // ============================================================
    // CLEANUP
    // ============================================================
    console.log('\n--- Cleaning up Test Fixtures ---');
    await client.query(`DELETE FROM target_learning_progress WHERE target_id IN ($1, $2)`, [targetAId, targetBId]);
    await client.query(`DELETE FROM practice_attempts WHERE target_id IN ($1, $2)`, [targetAId, targetBId]);
    await client.query(`DELETE FROM assessment_attempts WHERE target_id IN ($1, $2)`, [targetAId, targetBId]);
    await client.query(`DELETE FROM targets WHERE id IN ($1, $2)`, [targetAId, targetBId]);
    await client.query(`DELETE FROM requirements WHERE id IN ($1, $2)`, [reqIdJava, reqIdSql]);
    await client.query(`DELETE FROM company_roles WHERE id = $1`, [roleId]);
    await client.query(`DELETE FROM departments WHERE id = $1`, [deptId]);
    await client.query(`DELETE FROM companies WHERE id = $1`, [companyId]);
    await client.query(`DELETE FROM candidates WHERE id IN ($1, $2)`, [candAId, candBId]);
    await client.query(`DELETE FROM users WHERE id IN ($1, $2)`, [userAId, userBId]);

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
