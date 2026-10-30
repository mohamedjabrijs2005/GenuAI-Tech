require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./src/database/pool');
const app = require('./src/server');

const BASE_URL = 'http://127.0.0.1:4000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const config = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, config);
  let data = null;
  try {
    data = await res.json();
  } catch (_) { }
  return { status: res.status, ok: res.ok, data };
}

async function runVacancyWorkflowTests() {
  console.log('========================================================');
  console.log('🧪 GENUAI VACANCY WORKFLOW & ISOLATION TEST SUITE');
  console.log('========================================================\n');

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
    // SETUP: Register Company A and Company B
    // -------------------------------------------------------------
    console.log('📋 STEP 1: Setting up Tenant Companies');
    const ts = Date.now();
    const compAEmail = `comp_a_${ts}@genuai.test`;
    const compBEmail = `comp_b_${ts}@genuai.test`;

    const regA = await request('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'OwnerA',
        lastName: 'CompA',
        email: compAEmail,
        password: 'Password123!',
        companyName: `Company A ${ts}`,
        industry: 'Software',
        website: 'https://comp-a.test',
      },
    });

    const regB = await request('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'OwnerB',
        lastName: 'CompB',
        email: compBEmail,
        password: 'Password123!',
        companyName: `Company B ${ts}`,
        industry: 'FinTech',
        website: 'https://comp-b.test',
      },
    });

    assert(regA.status === 201, 'Company A registered successfully');
    assert(regB.status === 201, 'Company B registered successfully');

    const tokenA = regA.data?.token;
    const companyAId = regA.data?.company?.id;
    const tokenB = regB.data?.token;
    const companyBId = regB.data?.company?.id;

    // Verify companies in DB and set Company A as APPROVED for publish testing
    await pool.query("UPDATE companies SET verification_status = 'APPROVED' WHERE id = $1", [companyAId]);

    // Create a department for Company A
    const deptA = await request('/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { name: 'Core Platform Engineering', description: 'Backend and Platform Services' },
    });
    assert(deptA.status === 201, 'Department created for Company A');
    const deptAId = deptA.data?.department?.id;

    // -------------------------------------------------------------
    // TEST 1: POST /api/vacancies creates DRAFT only (Requirement 4 & 5)
    // -------------------------------------------------------------
    console.log('\n📋 STEP 2: Vacancy Draft Creation (Strict DRAFT Only)');
    const draftRes = await request('/vacancies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Senior Distributed Systems Architect',
        departmentId: deptAId,
        experienceLevel: 'senior',
        employmentType: 'full_time',
        location: 'Remote, UK',
        workMode: 'Remote',
        vacancyCount: 2,
        jobDescription: 'Architect high-throughput real-time distributed platforms with event streams.',
        // Even if someone maliciously passes autoSubmit: true, backend must force DRAFT
        autoSubmit: true,
      },
    });

    assert(draftRes.status === 201, 'Vacancy draft created with status 201');
    assert(draftRes.data?.vacancy?.status === 'DRAFT', 'Vacancy status is strictly DRAFT (autoSubmit ignored)');
    const vacancyId = draftRes.data?.vacancy?.id;

    // Direct DB check
    const dbVac1 = await pool.query('SELECT status, company_id FROM company_roles WHERE id = $1', [vacancyId]);
    assert(dbVac1.rows[0]?.status === 'DRAFT', 'PostgreSQL confirms status is DRAFT in database');
    assert(dbVac1.rows[0]?.company_id === companyAId, 'PostgreSQL confirms company isolation (assigned to Company A)');

    // -------------------------------------------------------------
    // TEST 2: Submit Endpoint Rejects Missing Requirements (Requirement 7 & 9)
    // -------------------------------------------------------------
    console.log('\n📋 STEP 3: Submit Validation: Zero Requirements Rejection');
    const submitNoReq = await request(`/vacancies/${vacancyId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(submitNoReq.status === 400, 'Submit fails with 400 when requirements count is 0');
    assert(
      submitNoReq.data?.error?.includes('without requirements'),
      `Returned specific error message: "${submitNoReq.data?.error}"`
    );

    // Verify status remains DRAFT
    const dbVac2 = await pool.query('SELECT status FROM company_roles WHERE id = $1', [vacancyId]);
    assert(dbVac2.rows[0]?.status === 'DRAFT', 'Vacancy status remains DRAFT after failed submission');

    // -------------------------------------------------------------
    // TEST 3: Add Requirement and Verify Assessment Linkage on Submit (Requirement 6 & 7)
    // -------------------------------------------------------------
    console.log('\n📋 STEP 4: Submit Validation: Requirement & Assessment Linkage');
    // Add technical requirement
    const addReqRes = await request(`/vacancies/${vacancyId}/requirements`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        name: 'Distributed Event Streaming (Apache Kafka / Pulsar)',
        category: 'Technical',
        reqType: 'Required',
        proficiency: 'Advanced',
        evalMethod: 'Official Technical Assessment',
      },
    });
    assert(addReqRes.status === 201, 'Requirement added to vacancy');

    // Now submit
    const submitOk = await request(`/vacancies/${vacancyId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(submitOk.status === 200, 'Submit succeeds with 200 after adding requirement');
    assert(submitOk.data?.vacancy?.status === 'PENDING_ADMIN_REVIEW', 'Status transitioned to PENDING_ADMIN_REVIEW');
    assert(Boolean(submitOk.data?.assessmentGroupId), 'Assessment linkage established (assessmentGroupId returned)');

    // Direct DB check for assessment_groups table
    const agCheck = await pool.query(
      'SELECT id, role_id, company_id FROM assessment_groups WHERE role_id = $1 AND company_id = $2',
      [vacancyId, companyAId]
    );
    assert(agCheck.rowCount > 0, 'PostgreSQL confirms assessment_groups linkage exists for role');

    // -------------------------------------------------------------
    // TEST 4: Prevent Duplicate Submission (Requirement 10)
    // -------------------------------------------------------------
    console.log('\n📋 STEP 5: Duplicate Submission Prevention');
    const submitDup = await request(`/vacancies/${vacancyId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(submitDup.status === 409, 'Duplicate submission blocked with 409 Conflict');
    assert(
      submitDup.data?.error?.includes('already submitted'),
      `Returned duplicate submission error: "${submitDup.data?.error}"`
    );

    // -------------------------------------------------------------
    // TEST 5: Company Isolation (Tenant Isolation) (Requirement 11)
    // -------------------------------------------------------------
    console.log('\n📋 STEP 6: Company Isolation (Tenant Boundary Security)');
    // Company B attempts to access Company A's vacancy
    const getB = await request(`/vacancies/${vacancyId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(getB.status === 404, 'Company B cannot GET Company A vacancy (404 Not Found)');

    // Company B attempts to submit Company A's vacancy
    const submitB = await request(`/vacancies/${vacancyId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(submitB.status === 404, 'Company B cannot submit Company A vacancy (404 Access Denied)');

    // Company B attempts to modify Company A's vacancy
    const updateB = await request(`/vacancies/${vacancyId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { title: 'Hijacked Role Title' },
    });
    assert(updateB.status === 404, 'Company B cannot modify Company A vacancy (404 Access Denied)');

    // -------------------------------------------------------------
    // TEST 6: Admin Review & Approval
    // -------------------------------------------------------------
    console.log('\n📋 STEP 7: Platform Admin Review & Approval');
    // Simulate governance admin approval
    const approveRes = await pool.query(
      `UPDATE company_roles
       SET status = 'APPROVED', approved_at = NOW(), review_note = 'Requirements and assessment verified'
       WHERE id = $1 RETURNING *`,
      [vacancyId]
    );
    assert(approveRes.rows[0]?.status === 'APPROVED', 'Vacancy status updated to APPROVED');

    // -------------------------------------------------------------
    // TEST 7: Publishing Approved Vacancy
    // -------------------------------------------------------------
    console.log('\n📋 STEP 8: Publishing Approved Vacancy');
    const publishRes = await request(`/vacancies/${vacancyId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(publishRes.status === 200, 'Publishing returns 200 OK');
    assert(publishRes.data?.vacancy?.status === 'PUBLISHED', 'Vacancy status is now PUBLISHED');

    const dbVacFinal = await pool.query('SELECT status, published_at FROM company_roles WHERE id = $1', [vacancyId]);
    assert(dbVacFinal.rows[0]?.status === 'PUBLISHED', 'PostgreSQL confirms vacancy is live and PUBLISHED');
    assert(Boolean(dbVacFinal.rows[0]?.published_at), 'PostgreSQL confirms published_at timestamp is set');

    console.log('\n========================================================');
    console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runVacancyWorkflowTests();
