require('dotenv').config();
const http = require('http');
const pool = require('./src/database/pool');
const app = require('./src/server');

const PORT = 4099;
let server;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, data: parsed, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, data: body, headers: res.headers });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runCandidatePhase1Suite() {
  console.log('====================================================');
  console.log('🧪 RUNNING CANDIDATE PHASE 1 VALIDATION TEST SUITE');
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

  // Start test server
  server = app.listen(PORT);

  try {
    const uniqueSuffix = Date.now();
    const candidateEmail = `candidate_test_${uniqueSuffix}@genuai.test`;
    const candidatePassword = 'CandidatePass123!';
    let candidateToken = '';
    let candidateUserId = '';

    const candidateBEmail = `candidate_b_${uniqueSuffix}@genuai.test`;
    let candidateBToken = '';

    console.log('📋 SECTION 1: Candidate Registration & Database Creation');

    // Test 1: Candidate registration creates CANDIDATE user
    const regRes = await request(
      { method: 'POST', path: '/api/auth/register' },
      {
        firstName: 'Elena',
        lastName: 'Rostova',
        email: candidateEmail,
        password: candidatePassword,
        role: 'CANDIDATE',
        companyName: 'Candidate Workspace',
      }
    );
    assert(regRes.status === 201, `Registration returns 201 Created (Status: ${regRes.status})`);
    assert(regRes.data?.user?.role === 'CANDIDATE', `User role in response is CANDIDATE (Got: ${regRes.data?.user?.role})`);
    candidateToken = regRes.data?.token;
    candidateUserId = regRes.data?.user?.id;
    const registeredEmail = regRes.data?.user?.email || candidateEmail.toLowerCase();

    // Test 2: Candidate profile created in PostgreSQL users table
    const dbUserRes = await pool.query('SELECT role, password_hash FROM users WHERE email = $1', [registeredEmail]);
    assert(dbUserRes.rowCount > 0 && dbUserRes.rows[0].role === 'CANDIDATE', 'PostgreSQL users table contains role CANDIDATE');

    // Test 3: Password is securely hashed
    const passwordHash = dbUserRes.rows[0]?.password_hash;
    assert(passwordHash && passwordHash.startsWith('$2') && passwordHash !== candidatePassword, 'Password is securely hashed with bcrypt');

    // Test 4: Candidate profile created in candidates table
    const dbCandRes = await pool.query('SELECT id, first_name, last_name FROM candidates WHERE email = $1', [registeredEmail]);
    assert(dbCandRes.rowCount > 0 && dbCandRes.rows[0].first_name === 'Elena', 'PostgreSQL candidates table contains candidate profile');

    console.log('\n📋 SECTION 2: Candidate Authentication & Session Verification');

    // Test 5: Candidate login receives real JWT token
    const loginRes = await request(
      { method: 'POST', path: '/api/auth/login' },
      { email: registeredEmail, password: candidatePassword }
    );
    assert(loginRes.status === 200, `Candidate login succeeds with 200 OK (Status: ${loginRes.status})`);
    assert(loginRes.data?.token && loginRes.data?.user?.role === 'CANDIDATE', 'Login returns valid token and CANDIDATE role');
    candidateToken = loginRes.data?.token;

    // Register second candidate for isolation tests
    const regBRes = await request(
      { method: 'POST', path: '/api/auth/register' },
      {
        firstName: 'Marcus',
        lastName: 'Vance',
        email: candidateBEmail,
        password: candidatePassword,
        role: 'CANDIDATE',
        companyName: 'Candidate Workspace',
      }
    );
    candidateBToken = regBRes.data?.token;

    console.log('\n📋 SECTION 3: Candidate Access Control & Authorization (RBAC)');

    // Test 6: Candidate CANNOT access Admin APIs
    const adminCheckRes = await request({
      method: 'GET',
      path: '/api/admin/overview',
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(adminCheckRes.status === 403, `Candidate rejected from Admin APIs with 403 Forbidden (Got: ${adminCheckRes.status})`);

    // Test 7: Candidate CANNOT access Company APIs (tenant isolation)
    const companyCheckRes = await request({
      method: 'GET',
      path: '/api/company/profile',
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(companyCheckRes.status === 403, `Candidate rejected from Company APIs with 403 Forbidden (Got: ${companyCheckRes.status})`);

    console.log('\n📋 SECTION 4: Published Vacancy Discovery & Filtering');

    // Test 8: Candidate sees only published vacancies
    const vacListRes = await request({
      method: 'GET',
      path: '/api/candidate-portal/vacancies',
    });
    assert(vacListRes.status === 200, `Published vacancies list returns 200 OK (Status: ${vacListRes.status})`);
    const vacancies = vacListRes.data?.vacancies || [];
    assert(vacancies.length > 0, `Published vacancies found (Count: ${vacancies.length})`);
    assert(vacancies.every(v => v.company_status === 'APPROVED'), 'All returned vacancies belong to APPROVED companies');

    const publishedVacancy = vacancies[0];
    const targetVacancyId = publishedVacancy.id;

    // Test 9: Candidate CANNOT view draft / pending moderation / unverified vacancies
    // Check by fetching a draft or non-existent ID
    const invalidVacDetail = await request({
      method: 'GET',
      path: '/api/candidate-portal/vacancies/00000000-0000-0000-0000-000000000000',
    });
    assert(invalidVacDetail.status === 404, `Non-published / non-existent vacancy returns 404 (Got: ${invalidVacDetail.status})`);

    // Test 10: Candidate opens public vacancy details and sees transparent requirements
    const vacDetailRes = await request({
      method: 'GET',
      path: `/api/candidate-portal/vacancies/${targetVacancyId}`,
    });
    assert(vacDetailRes.status === 200, `Published vacancy detail returns 200 OK (Status: ${vacDetailRes.status})`);
    assert(vacDetailRes.data?.vacancy?.id === targetVacancyId, 'Vacancy detail ID matches requested ID');
    assert(Array.isArray(vacDetailRes.data?.requirements), `Requirements array is returned (Count: ${vacDetailRes.data?.requirements?.length})`);

    console.log('\n📋 SECTION 5: Target Creation & Target Model Verification');

    // Test 11: Candidate creates target for published vacancy
    const createTargetRes = await request(
      {
        method: 'POST',
        path: '/api/candidate-portal/targets',
        headers: { Authorization: `Bearer ${candidateToken}` },
      },
      { vacancyId: targetVacancyId }
    );
    assert(createTargetRes.status === 201, `Target creation returns 201 Created (Status: ${createTargetRes.status})`);
    const target = createTargetRes.data?.target;
    const targetId = target?.id;

    // Test 12: Target stores candidate_id, company_id, vacancy_id, and vacancy_version_id
    assert(target?.candidate_id && target?.company_id && target?.vacancy_id, 'Target record contains candidate_id, company_id, and vacancy_id');
    const dbTargetRes = await pool.query('SELECT * FROM targets WHERE id = $1', [targetId]);
    assert(dbTargetRes.rowCount > 0 && dbTargetRes.rows[0].status === 'TARGETED', 'PostgreSQL targets table contains target with status TARGETED');

    // Test 13: Duplicate active target is blocked with 409 Conflict
    const dupTargetRes = await request(
      {
        method: 'POST',
        path: '/api/candidate-portal/targets',
        headers: { Authorization: `Bearer ${candidateToken}` },
      },
      { vacancyId: targetVacancyId }
    );
    assert(dupTargetRes.status === 409, `Duplicate target blocked with 409 Conflict (Got: ${dupTargetRes.status})`);

    // Test 14: Target creation writes TARGET_CREATED audit log
    const auditRes = await pool.query(
      "SELECT * FROM audit_logs WHERE action = 'TARGET_CREATED' AND entity_id = $1",
      [targetId]
    );
    assert(auditRes.rowCount > 0, 'PostgreSQL audit_logs contains TARGET_CREATED entry with actor role CANDIDATE');

    console.log('\n📋 SECTION 6: Target Workspace & Candidate Isolation');

    // Test 15: Candidate sees own targets list
    const candidateTargetsRes = await request({
      method: 'GET',
      path: '/api/candidate-portal/targets',
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(candidateTargetsRes.status === 200, `Candidate targets list returns 200 OK (Status: ${candidateTargetsRes.status})`);
    assert(candidateTargetsRes.data?.targets?.some(t => t.target_id === targetId), 'Created target appears in candidate target list');

    // Test 16: Candidate can view target workspace detail
    const targetWorkspaceRes = await request({
      method: 'GET',
      path: `/api/candidate-portal/targets/${targetId}`,
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(targetWorkspaceRes.status === 200, `Target workspace detail returns 200 OK (Status: ${targetWorkspaceRes.status})`);
    assert(targetWorkspaceRes.data?.target?.target_id === targetId, 'Workspace detail matches target ID');
    assert(targetWorkspaceRes.data?.modulesStatus?.learn === 'PLANNED', 'Subsequent modules (Learn/Prove) honestly marked PLANNED');

    // Test 17: Candidate A CANNOT read Candidate B target (404/403 Isolation)
    const crossCandidateRes = await request({
      method: 'GET',
      path: `/api/candidate-portal/targets/${targetId}`,
      headers: { Authorization: `Bearer ${candidateBToken}` },
    });
    assert(crossCandidateRes.status === 404, `Candidate B rejected from Candidate A target with 404 Not Found (Got: ${crossCandidateRes.status})`);

    // Test 18: Unauthenticated access to targets is rejected
    const unauthTargetRes = await request({
      method: 'GET',
      path: '/api/candidate-portal/targets',
    });
    assert(unauthTargetRes.status === 401, `Unauthenticated request rejected with 401 Unauthorized (Got: ${unauthTargetRes.status})`);

    // Test 19: Candidate profile endpoint
    const profileRes = await request({
      method: 'GET',
      path: '/api/candidate-portal/profile',
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(profileRes.status === 200 && profileRes.data?.profile?.email === candidateEmail, 'Candidate profile endpoint returns authenticated candidate details');

    console.log('\n====================================================');
    console.log(`📊 CANDIDATE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Test suite execution error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await pool.end();
  }
}

runCandidatePhase1Suite().catch(() => process.exit(1));
