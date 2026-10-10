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
  } catch (_) {}
  return { status: res.status, ok: res.ok, data };
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 GENUAI END-TO-END ACCEPTANCE & ISOLATION TEST SUITE');
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
    // -------------------------------------------------------------
    // TEST 1: New company registration creates PENDING_VERIFICATION
    // -------------------------------------------------------------
    console.log('📋 STEP 1: Company Registration');
    const uniqueEmail = `flow_test_${Date.now()}@genuai.test`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Flow',
        lastName: 'Tester',
        email: uniqueEmail,
        password: 'SecurePassword123!',
        companyName: 'Flow Test Enterprises',
        industry: 'Artificial Intelligence',
        website: 'https://flowtest.io',
      },
    });

    assert(regRes.status === 201, 'Registration returns 201 Created');
    assert(regRes.data?.company?.verificationStatus === 'PENDING_VERIFICATION', 'New company status is PENDING_VERIFICATION');
    const newCompanyToken = regRes.data?.token;
    const newCompanyId = regRes.data?.company?.id;

    // Verify in PostgreSQL
    const dbCompanyRes = await pool.query('SELECT verification_status FROM companies WHERE id = $1', [newCompanyId]);
    assert(dbCompanyRes.rows[0]?.verification_status === 'PENDING_VERIFICATION', 'PostgreSQL confirms verification_status is PENDING_VERIFICATION');

    // -------------------------------------------------------------
    // TEST 2: Unverified company cannot publish or bypass review
    // -------------------------------------------------------------
    console.log('\n📋 STEP 2: Unverified Company Restrictions');
    // Create department
    const deptRes = await request('/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${newCompanyToken}` },
      body: {
        name: 'Engineering ' + Date.now(),
        description: 'Core Engineering',
      },
    });
    assert(deptRes.status === 201, 'Approved/Pending company can create departments');
    const newDeptId = deptRes.data?.department?.id;

    // Create vacancy
    const vacRes = await request('/vacancies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${newCompanyToken}` },
      body: {
        title: 'Cloud Architect',
        departmentId: newDeptId,
        experienceLevel: 'senior',
        employmentType: 'full_time',
        location: 'Remote',
      },
    });
    assert(vacRes.status === 201, 'Vacancy created successfully');
    assert(vacRes.data?.vacancy?.status === 'DRAFT', 'New vacancy created in DRAFT status');
    const newVacId = vacRes.data?.vacancy?.id;

    // Attempt direct publish while unverified
    const unverifiedPublishRes = await request(`/vacancies/${newVacId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${newCompanyToken}` },
    });
    assert(unverifiedPublishRes.status === 403 || unverifiedPublishRes.status === 400, 'Unverified company CANNOT publish vacancy directly (403/400 Forbidden)');

    // Attempt submit with 0 requirements
    const submitZeroReqRes = await request(`/vacancies/${newVacId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${newCompanyToken}` },
    });
    assert(submitZeroReqRes.status === 400, 'Vacancy CANNOT be submitted without requirements (400 Bad Request)');

    // Add requirements
    const req1Res = await request(`/vacancies/${newVacId}/requirements`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${newCompanyToken}` },
      body: {
        name: 'Kubernetes & Docker',
        category: 'Technical',
        reqType: 'Required',
        priority: 'High',
      },
    });
    assert(req1Res.status === 201, 'Requirement 1 added');

    const req2Res = await request(`/vacancies/${newVacId}/requirements`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${newCompanyToken}` },
      body: {
        name: 'AWS Cloud Architecture',
        category: 'Technical',
        reqType: 'Required',
        priority: 'High',
      },
    });
    assert(req2Res.status === 201, 'Requirement 2 added');

    // -------------------------------------------------------------
    // TEST 3: Admin Approval Workflow for Company
    // -------------------------------------------------------------
    console.log('\n📋 STEP 3: Admin Company Verification');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@genuai.test',
        password: 'Admin12345!',
      },
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeds');
    const adminToken = adminLoginRes.data?.token;

    // Check company in admin verification queue
    const adminCompaniesRes = await request('/admin/companies?status=PENDING_VERIFICATION', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const foundPending = (adminCompaniesRes.data?.companies || []).some((c) => c.id === newCompanyId);
    assert(foundPending, 'Admin sees newly registered company in PENDING_VERIFICATION queue');

    // Admin approves company
    const approveCompRes = await request(`/admin/companies/${newCompanyId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        status: 'APPROVED',
        note: 'Corporate documents and official domain verified.',
      },
    });
    assert(approveCompRes.data?.success === true, 'Admin company approval returns success');

    // Verify in PostgreSQL
    const dbApprovedComp = await pool.query('SELECT verification_status, verification_review_note FROM companies WHERE id = $1', [newCompanyId]);
    assert(dbApprovedComp.rows[0]?.verification_status === 'APPROVED', 'PostgreSQL confirms company status is now APPROVED');

    // Verify Audit Log inserted
    const auditCompRes = await pool.query("SELECT * FROM audit_logs WHERE company_id = $1 AND action = 'COMPANY_APPROVED'", [newCompanyId]);
    assert(auditCompRes.rowCount > 0, 'Audit log created in PostgreSQL for company approval');

    // -------------------------------------------------------------
    // TEST 4: Vacancy Submission & Admin Moderation Workflow
    // -------------------------------------------------------------
    console.log('\n📋 STEP 4: Vacancy Submission & Admin Approval');
    // Submit vacancy for review
    const submitVacRes = await request(`/vacancies/${newVacId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${newCompanyToken}` },
    });
    assert(submitVacRes.data?.vacancy?.status === 'PENDING_ADMIN_REVIEW', 'Vacancy status changed to PENDING_ADMIN_REVIEW');

    // Admin sees pending vacancy
    const adminVacRes = await request('/admin/vacancies?status=PENDING_ADMIN_REVIEW', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const foundPendingVac = (adminVacRes.data?.vacancies || []).some((v) => v.id === newVacId);
    assert(foundPendingVac, 'Admin sees submitted vacancy in moderation queue');

    // Admin approves vacancy
    const approveVacRes = await request(`/admin/vacancies/${newVacId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        status: 'APPROVED',
        note: 'Requirements and evaluation methods adhere to platform taxonomy.',
      },
    });
    assert(approveVacRes.data?.success === true, 'Admin vacancy approval returns success');

    // Verify in PostgreSQL
    const dbApprovedVac = await pool.query('SELECT status, review_note FROM company_roles WHERE id = $1', [newVacId]);
    assert(dbApprovedVac.rows[0]?.status === 'APPROVED', 'PostgreSQL confirms vacancy status is APPROVED');

    // Company publishes approved vacancy
    const publishVacRes = await request(`/vacancies/${newVacId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${newCompanyToken}` },
    });
    assert(publishVacRes.data?.vacancy?.status === 'PUBLISHED', 'Approved vacancy successfully PUBLISHED by company');

    // Verify Vacancy Audit Log inserted
    const auditVacRes = await pool.query("SELECT * FROM audit_logs WHERE entity_id = $1 AND action = 'VACANCY_PUBLISHED'", [newVacId]);
    assert(auditVacRes.rowCount > 0, 'Audit log created in PostgreSQL for vacancy publication');

    // -------------------------------------------------------------
    // TEST 5: Tenant Isolation & Security Verification
    // -------------------------------------------------------------
    console.log('\n📋 STEP 5: Multi-Tenant Isolation & Security');
    // Login as Company B
    const companyBLogin = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'companyb@genuai.test',
        password: 'CompanyB123!',
      },
    });
    const companyBToken = companyBLogin.data?.token;

    // Company B attempts to read Company A's vacancy
    const isolationReadRes = await request(`/vacancies/${newVacId}`, {
      headers: { Authorization: `Bearer ${companyBToken}` },
    });
    assert(isolationReadRes.status === 404 || isolationReadRes.status === 403, 'Company B CANNOT read Company A vacancy details (404/403 Denied)');

    // Company B attempts to update Company A's vacancy
    const isolationUpdateRes = await request(`/vacancies/${newVacId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${companyBToken}` },
      body: {
        title: 'Hacked Vacancy Title',
      },
    });
    assert(isolationUpdateRes.status === 404 || isolationUpdateRes.status === 403, 'Company B CANNOT update Company A vacancy (404/403 Denied)');

    // Company user attempts to access Admin overview API
    const adminAccessRes = await request('/admin/overview', {
      headers: { Authorization: `Bearer ${companyBToken}` },
    });
    assert(adminAccessRes.status === 403, 'Company user CANNOT access Admin Platform API endpoints (403 Forbidden)');

    // Unauthenticated user attempts to access protected endpoints
    const unauthRes = await request('/vacancies');
    assert(unauthRes.status === 401, 'Unauthenticated user rejected with 401 Unauthorized');

    console.log('\n====================================================');
    console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed === 0) {
      console.log('🎉 RESULT: READY FOR CANDIDATE DEVELOPMENT');
      process.exit(0);
    } else {
      console.error('❌ RESULT: NOT READY FOR CANDIDATE DEVELOPMENT');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Suite Exception:', err);
    process.exit(1);
  }
}

setTimeout(runTestSuite, 1000);
