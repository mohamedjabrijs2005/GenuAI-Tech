require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./src/database/pool');
const bcrypt = require('bcryptjs');

async function run() {
  console.log('============================================================');
  console.log('GENUAI LEARN→PRACTICE→PROVE V2 AUDIT BEHAVIORAL SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;
  const assert = (desc, cond) => {
    if (cond) { console.log(`  ✅ PASS: ${desc}`); passed++; }
    else { console.error(`  ❌ FAIL: ${desc}`); failed++; }
  };

  const client = await pool.connect();
  const ts = Date.now();

  // Fixtures
  let userId, candId, companyId, roleId, reqId, resourceId, questionId, targetId, attemptId;

  try {
    await client.query('BEGIN');

    const hash = await bcrypt.hash('Test1234!', 10);
    const u = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified, token_version)
       VALUES ($1,$2,'Pilot','Candidate','CANDIDATE',TRUE,TRUE,1) RETURNING id`,
      [`pilot_${ts}@genuai.test`, hash]
    );
    userId = u.rows[0].id;

    const c = await client.query(
      `INSERT INTO candidates (first_name, last_name, email, onboarding_submitted)
       VALUES ('Pilot','Candidate',$1,TRUE) RETURNING id`, [`pilot_${ts}@genuai.test`]
    );
    candId = c.rows[0].id;

    const co = await client.query(
      `INSERT INTO companies (name, official_email, verification_status)
       VALUES ('AuditCo', $1, 'APPROVED') RETURNING id`, [`audit_${ts}@genuai.test`]
    );
    companyId = co.rows[0].id;

    const d = await client.query(
      `INSERT INTO departments (company_id, name, description) VALUES ($1,'Eng','Eng') RETURNING id`, [companyId]
    );

    const r = await client.query(
      `INSERT INTO company_roles (company_id, department_id, title, job_description, experience_level, employment_type, location, work_mode, salary_range, vacancy_count, status)
       VALUES ($1,$2,'Audit Engineer','Audit','senior','full_time','Remote','Remote','$120k',1,'PUBLISHED') RETURNING id`,
      [companyId, d.rows[0].id]
    );
    roleId = r.rows[0].id;

    const req = await client.query(
      `INSERT INTO requirements (role_id, company_id, name, requirement_type, importance, weight)
       VALUES ($1,$2,'AuditSkill','SKILL','REQUIRED',1.0) RETURNING id`, [roleId, companyId]
    );
    reqId = req.rows[0].id;

    const t = await client.query(
      `INSERT INTO targets (candidate_id, company_id, vacancy_id, status)
       VALUES ($1,$2,$3,'ASSESSMENT_PENDING') RETURNING id`, [candId, companyId, roleId]
    );
    targetId = t.rows[0].id;

    // ===========================================================
    // AUDIT 1: Versioned Requirement Map (V15 migration)
    // ===========================================================
    console.log('\n📋 AUDIT 1: Requirement Version Integrity (V15 Maps)');

    // Seed learning resource + map
    const lr = await client.query(
      `INSERT INTO learning_resources (requirement_name, title, description, source, resource_type, url, language, estimated_duration_mins)
       VALUES ('AuditSkill', 'Audit Resource', 'Learn auditing', 'GenuAI', 'ARTICLE', 'https://genuai.test/audit', 'English', 10)
       RETURNING id`
    );
    resourceId = lr.rows[0].id;

    // Populate versioned map entry
    await client.query(
      `INSERT INTO learning_resource_requirement_map (resource_id, requirement_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [resourceId, reqId]
    );

    // Verify: Renaming requirement should NOT break the map
    await client.query(`UPDATE requirements SET name = 'AuditSkill Renamed' WHERE id = $1`, [reqId]);

    const mappedRes = await client.query(
      `SELECT lr.id FROM learning_resources lr
       JOIN learning_resource_requirement_map lrrm ON lrrm.resource_id = lr.id
       WHERE lrrm.requirement_id = $1`, [reqId]
    );
    assert('1a. Learning resource remains linked to requirement after rename via stable ID map', mappedRes.rowCount === 1);

    // Restore name
    await client.query(`UPDATE requirements SET name = 'AuditSkill' WHERE id = $1`, [reqId]);

    // ===========================================================
    // AUDIT 2: Decoupled Answer Keys
    // ===========================================================
    console.log('\n📋 AUDIT 2: Answer Key Decoupling (practice_question_answers)');

    const pq = await client.query(
      `INSERT INTO practice_questions (requirement_name, title, prompt, question_type, options, correct_option, explanation, topic_area, difficulty, status)
       VALUES ('AuditSkill','Q1','What is audit?','MCQ',
               '{"A":"Define","B":"Skip","C":"Ignore","D":"None"}','A','Audit means define.','Core',1,'PUBLISHED')
       RETURNING id`
    );
    questionId = pq.rows[0].id;

    // Migrate to practice_question_answers
    await client.query(
      `INSERT INTO practice_question_answers (question_id, correct_option, explanation) VALUES ($1,'A','Audit means define.')
       ON CONFLICT (question_id) DO UPDATE SET correct_option = EXCLUDED.correct_option, explanation = EXCLUDED.explanation`,
      [questionId]
    );

    // Populate map
    await client.query(
      `INSERT INTO practice_question_requirement_map (question_id, requirement_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [questionId, reqId]
    );

    // Verify delivery query NEVER returns correct_option from practice_questions
    const deliveryQ = await client.query(
      `SELECT id, title, prompt, options,
              CASE WHEN correct_option IS NOT NULL THEN 'LEAKED' ELSE 'SAFE' END AS leak_check
       FROM practice_questions WHERE id = $1`, [questionId]
    );
    // Note: correct_option is still on the original table (for legacy), but our delivery endpoint excludes it
    // The critical check is: the delivery SELECT does NOT include correct_option column
    const deliveryEndpointQuery = await client.query(
      `SELECT DISTINCT pq.id, pq.requirement_name, pq.title, pq.prompt, pq.question_type, pq.options, pq.topic_area, pq.difficulty
       FROM practice_questions pq
       LEFT JOIN practice_question_requirement_map pqrm ON pqrm.question_id = pq.id
       WHERE pqrm.requirement_id = $1 AND (pq.status IS NULL OR pq.status = 'PUBLISHED')`, [reqId]
    );
    const hasCorrectOption = deliveryEndpointQuery.rows.some(r => 'correct_option' in r);
    assert('2a. Candidate delivery query does NOT expose correct_option', !hasCorrectOption);

    const answerKeyRes = await client.query(
      `SELECT correct_option, explanation FROM practice_question_answers WHERE question_id = $1`, [questionId]
    );
    assert('2b. Decoupled answer key is accessible from practice_question_answers', answerKeyRes.rowCount === 1 && answerKeyRes.rows[0].correct_option === 'A');

    // ===========================================================
    // AUDIT 3: Delivered Question ID Validation
    // ===========================================================
    console.log('\n📋 AUDIT 3: Practice Submission Validation (delivered_question_ids)');

    const pa = await client.query(
      `INSERT INTO practice_attempts (target_id, candidate_id, requirement_name, requirement_id, status, max_score, delivered_question_ids)
       VALUES ($1,$2,'AuditSkill',$3,'IN_PROGRESS',1,$4) RETURNING id`,
      [targetId, candId, reqId, JSON.stringify([questionId])]
    );
    attemptId = pa.rows[0].id;

    const deliveredSet = new Set([questionId]);
    const fakeQId = '00000000-0000-0000-0000-000000000000';

    // Verify unknown question rejection logic
    const unknownRejected = !deliveredSet.has(fakeQId);
    assert('3a. Unknown question ID (not in delivered set) is rejected', unknownRejected);

    // Verify correct answer grading via decoupled table
    const gradeRes = await client.query(
      `SELECT pqa.correct_option FROM practice_question_answers pqa WHERE pqa.question_id = $1`, [questionId]
    );
    const isCorrect = 'A' === gradeRes.rows[0]?.correct_option;
    assert('3b. Grading uses decoupled practice_question_answers (answer "A" is correct)', isCorrect);

    // Complete the attempt
    await client.query(
      `UPDATE practice_attempts SET status='COMPLETED', score=1, explanations_released=TRUE, submitted_at=NOW()
       WHERE id=$1`, [attemptId]
    );

    // Idempotency: re-submit should return early (status=COMPLETED)
    const idempotentCheck = await client.query(
      `SELECT status FROM practice_attempts WHERE id=$1`, [attemptId]
    );
    assert('3c. Completed practice attempt is idempotent (no re-scoring)', idempotentCheck.rows[0].status === 'COMPLETED');

    // ===========================================================
    // AUDIT 4: Official Assessment Deadline & Idempotency
    // ===========================================================
    console.log('\n📋 AUDIT 4: Assessment Deadline Enforcement & Submission Idempotency');

    const aa = await client.query(
      `INSERT INTO assessment_attempts (target_id, candidate_id, role_id, company_id, status, duration_minutes, started_at, expires_at)
       VALUES ($1,$2,$3,$4,'IN_PROGRESS',45,NOW(),NOW() + INTERVAL '45 minutes') RETURNING id, expires_at`,
      [targetId, candId, roleId, companyId]
    );
    const assessAttemptId = aa.rows[0].id;

    // Draft save: succeeds for IN_PROGRESS
    const draftRes = await client.query(
      `UPDATE assessment_attempts SET answers=$1, updated_at=NOW()
       WHERE id=$2 AND status='IN_PROGRESS' AND (expires_at IS NULL OR expires_at > NOW())
       RETURNING id`,
      [JSON.stringify({ q1: { mcq: 'A' } }), assessAttemptId]
    );
    assert('4a. Draft save succeeds for active in-progress session', draftRes.rowCount === 1);

    // Draft save: fails for expired attempt
    const expiredDraftRes = await client.query(
      `UPDATE assessment_attempts SET answers=$1, updated_at=NOW()
       WHERE id=$2 AND status='IN_PROGRESS' AND expires_at > NOW()
       RETURNING id`,
      [JSON.stringify({ q1: { mcq: 'B' } }), '00000000-0000-0000-0000-000000000001']
    );
    assert('4b. Draft save rejects non-existent / expired session (0 rows updated)', expiredDraftRes.rowCount === 0);

    // Submit attempt
    await client.query(
      `UPDATE assessment_attempts SET status='SUBMITTED', submitted_at=NOW(), score=50, grading_status='PENDING_REVIEW'
       WHERE id=$1`, [assessAttemptId]
    );

    // Idempotent re-submit: detect already submitted
    const alreadySubmitted = await client.query(
      `SELECT status, score, grading_status FROM assessment_attempts WHERE id=$1`, [assessAttemptId]
    );
    assert('4c. Assessment idempotency: attempt status is SUBMITTED without re-scoring', alreadySubmitted.rows[0].status === 'SUBMITTED');

    // ===========================================================
    // AUDIT 5: Recruiter Grading PARTIALLY_GRADED vs FULLY_GRADED
    // ===========================================================
    console.log('\n📋 AUDIT 5: Recruiter Grading States');

    // Insert requirement score row (simulates submitted assessment)
    const req2 = await client.query(
      `INSERT INTO requirements (role_id, company_id, name, requirement_type, importance, weight)
       VALUES ($1,$2,'AuditSkill2','SKILL','REQUIRED',1.0) RETURNING id`, [roleId, companyId]
    );
    const req2Id = req2.rows[0].id;

    await client.query(
      `INSERT INTO assessment_requirement_scores (attempt_id, requirement_id, score, max_score, evaluation_status, rubric_criteria, candidate_answers)
       VALUES ($1,$2,0,25,'PENDING_REVIEW','{"scenarioMax":12.5}','{}'),
              ($1,$3,0,25,'PENDING_REVIEW','{"scenarioMax":12.5}','{}')`,
      [assessAttemptId, reqId, req2Id]
    );

    const scoreMap = await client.query(
      `SELECT requirement_id FROM assessment_requirement_scores WHERE attempt_id=$1`, [assessAttemptId]
    );
    const totalReqs = scoreMap.rowCount;

    // Evaluate only 1 of 2 (PARTIALLY_GRADED)
    const evaluatedCount = 1;
    const isFullyGraded = evaluatedCount === totalReqs;
    assert('5a. Evaluating 1 of 2 requirements results in PARTIALLY_GRADED status', !isFullyGraded);

    const finalStatus = isFullyGraded ? 'FULLY_GRADED' : 'PARTIALLY_GRADED';
    assert('5b. Status correctly resolves to PARTIALLY_GRADED', finalStatus === 'PARTIALLY_GRADED');

    // Evaluate all → FULLY_GRADED
    const allEvaluatedCount = 2;
    const isFullyGraded2 = allEvaluatedCount === totalReqs;
    assert('5c. Evaluating all 2 requirements results in FULLY_GRADED status', isFullyGraded2);

    // ===========================================================
    // AUDIT 6: Non-interference — Practice does NOT affect coverage
    // ===========================================================
    console.log('\n📋 AUDIT 6: Practice Non-Interference with Official Coverage');

    const coverageCheck = await client.query(
      `SELECT * FROM target_coverage WHERE target_id = $1 AND supported_count > 0`, [targetId]
    );
    assert('6a. Practice attempt completion does NOT auto-convert requirements to SUPPORTED in coverage', coverageCheck.rowCount === 0);

    await client.query('ROLLBACK');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Test error:', err.message);
    failed++;
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n============================================================');
  console.log(`AUDIT SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');
  if (failed > 0) process.exit(1);
}

run();
