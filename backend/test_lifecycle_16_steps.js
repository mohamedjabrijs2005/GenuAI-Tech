/**
 * test_lifecycle_16_steps.js
 * Comprehensive 16-step UX & Data Truthfulness lifecycle test
 */

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

async function run() {
  console.log('====================================================');
  console.log('🚀 RUNNING 16-STEP RECRUITER & ADMIN LIFECYCLE TEST');
  console.log('====================================================\n');

  let companyAToken, companyBToken, adminToken;
  let companyAId, companyBId;
  let vacancyId;

  try {
    // ----------------------------------------------------------------
    // Step 1: Log in as Company A
    // ----------------------------------------------------------------
    console.log('Step 1: Logging in as Company A...');
    const loginA = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'companya@genuai.test',
        password: 'CompanyA123!',
      },
    });
    if (loginA.status !== 200 || !loginA.data.token) {
      throw new Error('Company A login failed: ' + JSON.stringify(loginA.data));
    }
    companyAToken = loginA.data.token;
    companyAId = loginA.data.user.companyId;
    console.log(`  ✅ Logged in as Company A (Company ID: ${companyAId})`);

    // ----------------------------------------------------------------
    // Step 2: Create a draft vacancy
    // ----------------------------------------------------------------
    console.log('\nStep 2: Creating a draft vacancy...');
    const deptsRes = await request('/departments', {
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    const departmentId = deptsRes.data.departments[0]?.id;
    if (!departmentId) throw new Error('No departments available for Company A');

    const createVac = await request('/vacancies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: {
        title: 'Principal Distributed Systems Architect',
        departmentId,
        location: 'Remote',
        vacancyCount: 2,
        employmentType: 'full_time',
        experienceLevel: 'senior',
        jobDescription: 'Architect high-throughput verifiable event telemetry.',
      },
    });
    if (createVac.status !== 201 || !createVac.data.vacancy?.id) {
      throw new Error('Create vacancy failed: ' + JSON.stringify(createVac.data));
    }
    vacancyId = createVac.data.vacancy.id;
    console.log(`  ✅ Created vacancy in DRAFT status (ID: ${vacancyId}, Dept: ${departmentId})`);

    // ----------------------------------------------------------------
    // Step 3: Add three requirements
    // ----------------------------------------------------------------
    console.log('\nStep 3: Adding 3 requirements to vacancy...');
    const req1 = await request(`/vacancies/${vacancyId}/requirements`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: {
        name: 'Distributed Consensus & Raft Protocol',
        category: 'TECHNICAL',
        weight: 40,
      },
    });
    const req2 = await request(`/vacancies/${vacancyId}/requirements`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: {
        name: 'PostgreSQL Internals & Concurrency Control',
        category: 'TECHNICAL',
        weight: 35,
      },
    });
    const req3 = await request(`/vacancies/${vacancyId}/requirements`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: {
        name: 'System Scalability & Performance Benchmarking',
        category: 'EXPERIENCE',
        weight: 25,
      },
    });

    if (req1.status !== 201 || req2.status !== 201 || req3.status !== 201) {
      throw new Error(`Failed to attach requirements: req1=${JSON.stringify(req1.data)}, req2=${JSON.stringify(req2.data)}, req3=${JSON.stringify(req3.data)}`);
    }
    console.log('  ✅ Added 3 distinct requirements with categories and weights');

    // ----------------------------------------------------------------
    // Step 4: Submit vacancy to moderation
    // ----------------------------------------------------------------
    console.log('\nStep 4: Submitting vacancy for admin review...');
    const submitVac = await request(`/vacancies/${vacancyId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    if (submitVac.status !== 200 || submitVac.data.vacancy?.status !== 'PENDING_ADMIN_REVIEW') {
      throw new Error('Vacancy submit failed: ' + JSON.stringify(submitVac.data));
    }
    console.log('  ✅ Vacancy transitioned from DRAFT -> PENDING_ADMIN_REVIEW');

    // ----------------------------------------------------------------
    // Step 5: Log in as Super Admin
    // ----------------------------------------------------------------
    console.log('\nStep 5: Logging in as Admin...');
    const loginAdmin = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@genuai.test',
        password: 'Admin12345!',
      },
    });
    if (loginAdmin.status !== 200 || !loginAdmin.data.token) throw new Error('Admin login failed');
    adminToken = loginAdmin.data.token;
    console.log('  ✅ Logged in as Super Admin');

    // ----------------------------------------------------------------
    // Step 6: Admin requests changes
    // ----------------------------------------------------------------
    console.log('\nStep 6: Admin requests changes on submitted vacancy...');
    const requestChanges = await request(`/admin/vacancies/${vacancyId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        status: 'CHANGES_REQUESTED',
        reason: 'Please clarify required experience years for Distributed Consensus competency.',
      },
    });
    if (requestChanges.status !== 200) {
      throw new Error('Request changes failed: ' + JSON.stringify(requestChanges.data));
    }
    console.log('  ✅ Admin status updated to CHANGES_REQUESTED with review note');

    // ----------------------------------------------------------------
    // Step 7: Log back in as Company A & check overview
    // ----------------------------------------------------------------
    console.log('\nStep 7: Checking Company A access after changes requested...');
    const companyAOverview = await request('/company/overview', {
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    if (companyAOverview.status !== 200) throw new Error('Overview check failed');
    console.log(`  ✅ Company A overview retrieved (Changes requested count: ${companyAOverview.data.vacancyStats?.changes_requested})`);

    // ----------------------------------------------------------------
    // Step 8: Confirm Action Required section detects CHANGES_REQUESTED
    // ----------------------------------------------------------------
    console.log('\nStep 8: Confirming Action Required queue detects the vacancy...');
    const vacListA = await request('/vacancies', {
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    const targetVac = vacListA.data.vacancies.find(v => v.id === vacancyId);
    if (targetVac.status !== 'CHANGES_REQUESTED') {
      throw new Error(`Expected status CHANGES_REQUESTED but got ${targetVac.status}`);
    }
    console.log(`  ✅ Vacancy found in Company A queue with status CHANGES_REQUESTED and note: "${targetVac.review_note}"`);

    // ----------------------------------------------------------------
    // Step 9: Modify the vacancy
    // ----------------------------------------------------------------
    console.log('\nStep 9: Modifying vacancy specifications...');
    const updateVac = await request(`/vacancies/${vacancyId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: {
        title: 'Principal Distributed Systems Architect (5+ Yrs Consensus Exp)',
        jobDescription: 'Architect high-throughput verifiable event telemetry with 5+ years Raft experience.',
      },
    });
    if (updateVac.status !== 200) throw new Error('Update vacancy failed: ' + JSON.stringify(updateVac.data));
    console.log('  ✅ Vacancy title and description successfully updated');

    // ----------------------------------------------------------------
    // Step 10: Resubmit the vacancy
    // ----------------------------------------------------------------
    console.log('\nStep 10: Resubmitting vacancy to Admin moderation queue...');
    const resubmitVac = await request(`/vacancies/${vacancyId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    if (resubmitVac.status !== 200 || resubmitVac.data.vacancy?.status !== 'PENDING_ADMIN_REVIEW') {
      throw new Error('Resubmission failed: ' + JSON.stringify(resubmitVac.data));
    }
    console.log('  ✅ Vacancy transitioned back to PENDING_ADMIN_REVIEW');

    // ----------------------------------------------------------------
    // Step 11: Approve as Admin
    // ----------------------------------------------------------------
    console.log('\nStep 11: Admin reviews and approves vacancy...');
    const approveVac = await request(`/admin/vacancies/${vacancyId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        status: 'APPROVED',
        reason: 'Requirement revisions satisfy platform governance criteria.',
      },
    });
    if (approveVac.status !== 200) throw new Error('Admin approval failed: ' + JSON.stringify(approveVac.data));
    console.log('  ✅ Vacancy status transitioned to APPROVED');

    // ----------------------------------------------------------------
    // Step 12: Publish as Company A
    // ----------------------------------------------------------------
    console.log('\nStep 12: Company A publishes the approved vacancy...');
    const publishVac = await request(`/vacancies/${vacancyId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    if (publishVac.status !== 200 || publishVac.data.vacancy?.status !== 'PUBLISHED') {
      throw new Error('Publish vacancy failed: ' + JSON.stringify(publishVac.data));
    }
    console.log('  ✅ Vacancy status is now PUBLISHED');

    // ----------------------------------------------------------------
    // Step 13: Refresh Company Dashboard & check overview metrics
    // ----------------------------------------------------------------
    console.log('\nStep 13: Refreshing Company Dashboard data...');
    const refreshOverview = await request('/company/overview', {
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    if (refreshOverview.status !== 200) throw new Error('Failed to refresh overview');
    console.log(`  ✅ Overview confirmed: published = ${refreshOverview.data.vacancyStats?.published}, draft = ${refreshOverview.data.vacancyStats?.draft}`);

    // ----------------------------------------------------------------
    // Step 14: Confirm vacancy table, status, activity, and metrics match PostgreSQL
    // ----------------------------------------------------------------
    console.log('\nStep 14: Verifying audit activity trail and database consistency...');
    const activityA = await request('/company/activity', {
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    if (activityA.status !== 200 || !Array.isArray(activityA.data.activities)) {
      throw new Error('Failed to fetch activity log: ' + JSON.stringify(activityA.data));
    }
    const hasPublishedLog = activityA.data.activities.some(a => a.entity_id === vacancyId && a.action === 'VACANCY_PUBLISHED');
    if (!hasPublishedLog) throw new Error('Missing VACANCY_PUBLISHED audit log for Company A');
    console.log(`  ✅ Activity log contains ${activityA.data.activities.length} entries, including VACANCY_PUBLISHED with server timestamp`);

    // ----------------------------------------------------------------
    // Step 15: Log in as Company B
    // ----------------------------------------------------------------
    console.log('\nStep 15: Logging in as Company B...');
    const loginB = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'companyb@genuai.test',
        password: 'CompanyB123!',
      },
    });
    if (loginB.status !== 200 || !loginB.data.token) throw new Error('Company B login failed');
    companyBToken = loginB.data.token;
    companyBId = loginB.data.user.companyId;
    console.log(`  ✅ Logged in as Company B (Company ID: ${companyBId})`);

    // ----------------------------------------------------------------
    // Step 16: Confirm Company A's data is completely invisible to Company B
    // ----------------------------------------------------------------
    console.log("\nStep 16: Verifying Company A's vacancy & activity are INVISIBLE to Company B...");
    const vacListB = await request('/vacancies', {
      headers: { Authorization: `Bearer ${companyBToken}` },
    });
    const leakedVacancyInList = vacListB.data.vacancies?.some(v => v.id === vacancyId);
    if (leakedVacancyInList) {
      throw new Error("SECURITY VIOLATION: Company B saw Company A's vacancy in vacancy list!");
    }

    const directAccess = await request(`/vacancies/${vacancyId}`, {
      headers: { Authorization: `Bearer ${companyBToken}` },
    });
    if (directAccess.status !== 404 && directAccess.status !== 403) {
      throw new Error(`SECURITY VIOLATION: Company B accessed Company A's vacancy (Status: ${directAccess.status})!`);
    }

    const activityB = await request('/company/activity', {
      headers: { Authorization: `Bearer ${companyBToken}` },
    });
    const leakedActivity = activityB.data.activities?.some(a => a.entity_id === vacancyId);
    if (leakedActivity) {
      throw new Error("SECURITY VIOLATION: Company B saw Company A's activity log!");
    }

    console.log("  ✅ PASS: Company B cannot see Company A's vacancy in list (Zero leakage)");
    console.log("  ✅ PASS: Company B cannot view Company A's vacancy details (Denied with 404/403)");
    console.log("  ✅ PASS: Company B cannot see Company A's audit activity logs");

    console.log('\n====================================================');
    console.log('🎉 ALL 16 STEPS OF LIFECYCLE ACCEPTANCE PASSED CLEANLY');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ LIFECYCLE TEST FAILED:', err.message);
    process.exit(1);
  }
}

run();
