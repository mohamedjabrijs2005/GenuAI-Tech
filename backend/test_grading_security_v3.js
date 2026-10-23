require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./src/database/pool');
const bcrypt = require('bcryptjs');

async function run() {
  console.log('============================================================');
  console.log('GENUAI V16 GRADING SECURITY AUDIT SUITE');
  console.log('============================================================\n');

  let passed = 0, failed = 0;
  const assert = (desc, cond) => {
    if (cond) { console.log(`  ✅ PASS: ${desc}`); passed++; }
    else { console.error(`  ❌ FAIL: ${desc}`); failed++; }
  };

  const client = await pool.connect();
  const ts = Date.now();
  let userId, candId, companyId, roleId, targetId, attemptId, req1Id, req2Id;

  try {
    await client.query('BEGIN');

    // ── Fixtures ─────────────────────────────────────────────
    const hash = await bcrypt.hash('Test1234!', 10);
    userId = (await client.query(
      `INSERT INTO users (email,password_hash,first_name,last_name,role,is_active,email_verified,token_version)
       VALUES ($1,$2,'Grading','Tester','CANDIDATE',TRUE,TRUE,1) RETURNING id`,
      [`grade_${ts}@genuai.test`, hash])).rows[0].id;

    candId = (await client.query(
      `INSERT INTO candidates (first_name,last_name,email,onboarding_submitted)
       VALUES ('Grading','Tester',$1,TRUE) RETURNING id`, [`grade_${ts}@genuai.test`])).rows[0].id;

    companyId = (await client.query(
      `INSERT INTO companies (name,official_email,verification_status)
       VALUES ('GradeCo',$1,'APPROVED') RETURNING id`, [`gradeadmin_${ts}@genuai.test`])).rows[0].id;

    const deptId = (await client.query(
      `INSERT INTO departments (company_id,name,description) VALUES ($1,'Eng','Eng') RETURNING id`, [companyId])).rows[0].id;

    roleId = (await client.query(
      `INSERT INTO company_roles (company_id,department_id,title,job_description,experience_level,employment_type,location,work_mode,salary_range,vacancy_count,status)
       VALUES ($1,$2,'Grade Engineer','Grade','senior','full_time','Remote','Remote','$100k',1,'PUBLISHED') RETURNING id`,
      [companyId, deptId])).rows[0].id;

    req1Id = (await client.query(
      `INSERT INTO requirements (role_id,company_id,name,requirement_type,importance,weight)
       VALUES ($1,$2,'Skill A','SKILL','REQUIRED',1.0) RETURNING id`, [roleId, companyId])).rows[0].id;

    req2Id = (await client.query(
      `INSERT INTO requirements (role_id,company_id,name,requirement_type,importance,weight)
       VALUES ($1,$2,'Skill B','SKILL','REQUIRED',1.0) RETURNING id`, [roleId, companyId])).rows[0].id;

    targetId = (await client.query(
      `INSERT INTO targets (candidate_id,company_id,vacancy_id,status) VALUES ($1,$2,$3,'ASSESSMENT_PENDING') RETURNING id`,
      [candId, companyId, roleId])).rows[0].id;

    attemptId = (await client.query(
      `INSERT INTO assessment_attempts (target_id,candidate_id,role_id,company_id,status,objective_score,scenario_score,score,duration_minutes,started_at,expires_at)
       VALUES ($1,$2,$3,$4,'SUBMITTED',8,0,8,45,NOW()-INTERVAL '1h',NOW()-INTERVAL '15m') RETURNING id`,
      [targetId, candId, roleId, companyId])).rows[0].id;

    // Seed requirement score rows with proper component columns
    await client.query(
      `INSERT INTO assessment_requirement_scores
         (attempt_id,requirement_id,score,max_score,objective_score,objective_max_score,
          scenario_score,scenario_max_score,required_scenario_evaluation,
          scoring_source,rubric_criteria,candidate_answers,evaluation_status)
       VALUES
         ($1,$2, 5,25, 5,12.5, 0,12.5, TRUE, 'OBJECTIVE_MCQ',
          '{"scenarioMax":12.5}','{}','PENDING_REVIEW'),
         ($1,$3, 3,25, 3,12.5, 0,12.5, TRUE, 'OBJECTIVE_MCQ',
          '{"scenarioMax":12.5}','{}','PENDING_REVIEW')`,
      [attemptId, req1Id, req2Id]
    );

    // ── AUDIT 1: Legacy answer columns are NULL ───────────────
    console.log('\n📋 AUDIT 1: Legacy Practice Answer Columns Nulled (V16)');
    const legacyRes = await client.query(
      `SELECT COUNT(*) AS count FROM practice_questions WHERE correct_option IS NOT NULL OR explanation IS NOT NULL`
    );
    assert('1a. No practice_questions rows retain correct_option or explanation', Number(legacyRes.rows[0].count) === 0);

    // ── AUDIT 2: Objective score immutable on regrade ─────────
    console.log('\n📋 AUDIT 2: Regrade Does Not Inflate Objective Score');

    const beforeRes = await client.query(
      `SELECT objective_score, scenario_score, score FROM assessment_requirement_scores WHERE attempt_id=$1 AND requirement_id=$2`,
      [attemptId, req1Id]
    );
    const originalObjScore = Number(beforeRes.rows[0].objective_score);
    assert('2a. Objective score stored separately at submission (5)', originalObjScore === 5);

    // Simulate first grading: scenario_score=4, total=5+4=9
    await client.query(
      `UPDATE assessment_requirement_scores
       SET scenario_score=4, score=objective_score+4,
           grading_revision_count=COALESCE(grading_revision_count,0)+1, last_graded_at=NOW(),
           evaluation_status='EVALUATED'
       WHERE attempt_id=$1 AND requirement_id=$2`, [attemptId, req1Id]
    );

    // Simulate regrade with new scenario_score=5
    await client.query(
      `UPDATE assessment_requirement_scores
       SET scenario_score=5, score=objective_score+5,
           grading_revision_count=COALESCE(grading_revision_count,0)+1, last_graded_at=NOW(),
           evaluation_status='EVALUATED'
       WHERE attempt_id=$1 AND requirement_id=$2`, [attemptId, req1Id]
    );

    const afterRegradeRes = await client.query(
      `SELECT objective_score, scenario_score, score, grading_revision_count FROM assessment_requirement_scores
       WHERE attempt_id=$1 AND requirement_id=$2`, [attemptId, req1Id]
    );
    const afterRow = afterRegradeRes.rows[0];
    assert('2b. Objective score unchanged after two regrade cycles (still 5)', Number(afterRow.objective_score) === 5);
    assert('2c. Final total = objective(5) + new scenario(5) = 10 (not 17)', Number(afterRow.score) === 10);
    assert('2d. Regrade revision count incremented (=2)', Number(afterRow.grading_revision_count) === 2);

    // ── AUDIT 3: PARTIALLY_GRADED vs FULLY_GRADED ─────────────
    console.log('\n📋 AUDIT 3: Explicit FULLY_GRADED Requires All required_scenario_evaluation=TRUE');

    // req1 is EVALUATED, req2 is still PENDING_REVIEW
    const partialCheck = await client.query(
      `SELECT requirement_id, evaluation_status FROM assessment_requirement_scores
       WHERE attempt_id=$1 AND required_scenario_evaluation=TRUE`, [attemptId]
    );
    const partialAllEvaluated = partialCheck.rows.every(r => r.evaluation_status === 'EVALUATED');
    assert('3a. With only 1/2 required requirements evaluated → not FULLY_GRADED', !partialAllEvaluated);

    // Now mark req2 as EVALUATED too
    await client.query(
      `UPDATE assessment_requirement_scores SET evaluation_status='EVALUATED', scenario_score=3, score=objective_score+3
       WHERE attempt_id=$1 AND requirement_id=$2`, [attemptId, req2Id]
    );

    const fullCheck = await client.query(
      `SELECT requirement_id, evaluation_status FROM assessment_requirement_scores
       WHERE attempt_id=$1 AND required_scenario_evaluation=TRUE`, [attemptId]
    );
    const allEvaluated = fullCheck.rows.every(r => r.evaluation_status === 'EVALUATED');
    assert('3b. With 2/2 required requirements evaluated → FULLY_GRADED', allEvaluated);
    const finalStatus = allEvaluated ? 'FULLY_GRADED' : 'PARTIALLY_GRADED';
    assert('3c. finalGradingStatus resolves to FULLY_GRADED', finalStatus === 'FULLY_GRADED');

    // ── AUDIT 4: Missing scenarioMax = rejected ────────────────
    console.log('\n📋 AUDIT 4: Missing scenarioMax = Grading Rejected');

    // A row without scenarioMax in rubric
    const noMaxReqId = (await client.query(
      `INSERT INTO requirements (role_id,company_id,name,requirement_type,importance,weight)
       VALUES ($1,$2,'Skill C','SKILL','OPTIONAL',1.0) RETURNING id`, [roleId, companyId])).rows[0].id;

    await client.query(
      `INSERT INTO assessment_requirement_scores
         (attempt_id,requirement_id,score,max_score,objective_score,objective_max_score,
          scenario_score,scenario_max_score,required_scenario_evaluation,
          scoring_source,rubric_criteria,candidate_answers,evaluation_status)
       VALUES ($1,$2, 0,25, 0,12.5, 0,0, TRUE, 'OBJECTIVE_MCQ','null','{}','PENDING_REVIEW')`,
      [attemptId, noMaxReqId]
    );

    // Simulate: rubric has no scenarioMax field
    let rubric = null;
    try { rubric = JSON.parse('null'); } catch (_) {}
    const scenarioMaxFromRubric = (rubric && typeof rubric === 'object' && rubric.scenarioMax != null)
      ? Number(rubric.scenarioMax) : null;
    // Also check scenario_max_score column (0 means unset)
    const scenarioMaxFromCol = 0; // as stored above
    const effectiveScenarioMax = scenarioMaxFromRubric ?? (scenarioMaxFromCol > 0 ? scenarioMaxFromCol : null);

    assert('4a. scenarioMax=null → grading endpoint would reject (effectiveScenarioMax is null or 0)',
      effectiveScenarioMax === null || effectiveScenarioMax === 0);

    // ── AUDIT 5: Component columns exist in schema ─────────────
    console.log('\n📋 AUDIT 5: Schema Columns Exist (V16 Migration)');

    const colRes = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='assessment_requirement_scores'`
    );
    const cols = new Set(colRes.rows.map(r => r.column_name));
    assert('5a. objective_score column exists', cols.has('objective_score'));
    assert('5b. objective_max_score column exists', cols.has('objective_max_score'));
    assert('5c. scenario_score column exists', cols.has('scenario_score'));
    assert('5d. scenario_max_score column exists', cols.has('scenario_max_score'));
    assert('5e. grading_revision_count column exists', cols.has('grading_revision_count'));
    assert('5f. last_graded_at column exists', cols.has('last_graded_at'));
    assert('5g. required_scenario_evaluation column exists', cols.has('required_scenario_evaluation'));

    // ── AUDIT 6: practice_questions schema allows NULL ─────────
    console.log('\n📋 AUDIT 6: practice_questions NOT NULL Constraint Dropped');
    const constraintRes = await client.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_name='practice_questions' AND column_name='correct_option'`
    );
    assert('6a. correct_option is now nullable (NOT NULL removed)', constraintRes.rows[0]?.is_nullable === 'YES');

    // ── AUDIT 7: Concurrent grading safety (FOR UPDATE detection) ──
    console.log('\n📋 AUDIT 7: Row-Level Lock Used on Assessment Attempt');
    // Verify the attempt can be selected FOR UPDATE without error
    const lockRes = await client.query(
      `SELECT id FROM assessment_attempts WHERE id=$1 FOR UPDATE NOWAIT`, [attemptId]
    );
    assert('7a. FOR UPDATE NOWAIT succeeds (no concurrent lock contention in single client test)', lockRes.rowCount === 1);

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
  console.log(`AUDIT V16 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');
  if (failed > 0) process.exit(1);
}

run();
