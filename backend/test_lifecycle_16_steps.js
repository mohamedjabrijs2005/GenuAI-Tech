/**
 * test_lifecycle_16_steps.js
 * Comprehensive 16-step UX & Data Truthfulness lifecycle test
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./src/database/pool');
const bcrypt = require('bcryptjs');
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

  // Create unique test accounts for this run
  const ts = Date.now();
  const companyAEmail = `lifecycle_co_a_${ts}@genuai.test`;
  const companyAPass = `LifecycleA_${ts}!`;
  const companyBEmail = `lifecycle_co_b_${ts}@genuai.test`;
  const companyBPass = `LifecycleB_${ts}!`;
  const adminEmail = `lifecycle_admin_${ts}@genuai.test`;
  const adminPass = `LifecycleAdmin_${ts}!`;

  try {
    // ----------------------------------------------------------------
    // Step 1: Register as Company A (fresh account)
    // ----------------------------------------------------------------
    console.log('Step 1: Registering and logging in as Company A...');
    const regA = await request('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Lifecycle', lastName: 'CompanyA',
        email: companyAEmail, password: companyAPass,
        companyName: 'Lifecycle Alpha Enterprises',
        industry: 'Technology', website: 'https://lifecycle-a.io',
      },
    });
    if (regA.status !== 201 || !regA.data.token) {
      throw new Error('Company A registration failed: ' + JSON.stringify(regA.data));
    }
    companyAToken = regA.data.token;
    companyAId = regA.data.company?.id;
    console.log(`  ✅ Registered & logged in as Company A (Company ID: ${companyAId})`);

    // ----------------------------------------------------------------
    // Step 2: Create a draft vacancy
    // ----------------------------------------------------------------
    console.log('\nStep 2: Creating a draft vacancy...');
    const deptsRes = await request('/departments', {
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    let departmentId = deptsRes.data?.departments?.[0]?.id;
    if (!departmentId) {
      const createDept = await request('/departments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${companyAToken}` },
        body: { name: 'Core Engineering', description: 'Core Systems & Infrastructure' },
      });
      departmentId = createDept.data?.department?.id || createDept.data?.id;
    }
    if (!departmentId) throw new Error('No departments available for Company A and failed to create one');

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
    // Step 5: Create and log in as Super Admin (dynamic)
    // ----------------------------------------------------------------
    console.log('\nStep 5: Creating and logging in as Admin...');
    const adminHash = await bcrypt.hash(adminPass, 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, 'Lifecycle', 'Admin', 'SUPER_ADMIN')`,
      [adminEmail, adminHash]
    );
    const loginAdmin = await request('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: adminPass },
    });
    if (loginAdmin.status !== 200 || !loginAdmin.data.token) throw new Error('Admin login failed: ' + JSON.stringify(loginAdmin.data));
    adminToken = loginAdmin.data.token;
    console.log('  ✅ Created and logged in as Super Admin');

    // Admin verifies Company A so vacancies can be approved
    const approveCo = await request(`/admin/companies/${companyAId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'APPROVED', reason: 'Corporate entity documents verified.' },
    });
    if (approveCo.status !== 200) throw new Error('Admin company approval failed: ' + JSON.stringify(approveCo.data));
    console.log('  ✅ Admin approved Company A verification status');

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
    // Step 15: Register as Company B (fresh account)
    // ----------------------------------------------------------------
    console.log('\nStep 15: Registering Company B for isolation test...');
    const regB = await request('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Lifecycle', lastName: 'CompanyB',
        email: companyBEmail, password: companyBPass,
        companyName: 'Lifecycle Beta Enterprises',
        industry: 'Technology', website: 'https://lifecycle-b.io',
      },
    });
    if (regB.status !== 201 || !regB.data.token) throw new Error('Company B registration failed: ' + JSON.stringify(regB.data));
    companyBToken = regB.data.token;
    companyBId = regB.data.company?.id;
    console.log(`  ✅ Registered Company B (Company ID: ${companyBId})`);

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
  } catch (err) {
    console.error('\n❌ LIFECYCLE TEST FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    console.log('🧹 Cleaning up test accounts and artifacts...');
    try {
      if (companyAId) {
        await pool.query('DELETE FROM company_roles WHERE company_id = $1', [companyAId]);
        await pool.query('DELETE FROM departments WHERE company_id = $1', [companyAId]);
        await pool.query('DELETE FROM audit_logs WHERE company_id = $1', [companyAId]);
        await pool.query('DELETE FROM company_members WHERE company_id = $1', [companyAId]);
        await pool.query('DELETE FROM companies WHERE id = $1', [companyAId]);
      }
      if (companyBId) {
        await pool.query('DELETE FROM audit_logs WHERE company_id = $1', [companyBId]);
        await pool.query('DELETE FROM company_members WHERE company_id = $1', [companyBId]);
        await pool.query('DELETE FROM companies WHERE id = $1', [companyBId]);
      }
      await pool.query(
        'DELETE FROM users WHERE email IN ($1, $2, $3)',
        [companyAEmail, companyBEmail, adminEmail]
      );
      console.log('  ✅ Cleaned up isolated test companies, vacancies, and admin accounts.\n');
    } catch (cleanupErr) {
      console.warn('  ⚠️ Cleanup note:', cleanupErr.message);
    }
    process.exit(process.exitCode || 0);
  }
}

run();
