/**
 * test_vacancy_builder_blueprint_live.js
 *
 * Live end-to-end automated test suite for the Refactored
 * AI-assisted Role Skill Blueprint Generator inside the Vacancy Builder flow.
 */

require('./backend/node_modules/dotenv').config({ path: require('path').join(__dirname, 'backend/.env') });
const pool = require('./backend/src/database/pool');
const bcrypt = require('./backend/node_modules/bcryptjs');

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
}

async function run() {
  console.log('========================================================================');
  console.log('🧪 GENUAI — VACANCY BUILDER AI BLUEPRINT INTEGRATION TEST SUITE');
  console.log('========================================================================\n');

  const app = require('./backend/src/server');
  const server = app.listen(4088, '127.0.0.1');
  const BACKEND_URL = 'http://127.0.0.1:4088/api';

  async function apiRequest(endpoint, options = {}) {
    const url = `${BACKEND_URL}${endpoint}`;
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

  const ts = Date.now();
  const compAEmail = `vbuilder_compa_${ts}@genuai.test`;
  const compBEmail = `vbuilder_compb_${ts}@genuai.test`;
  const adminEmail = `vbuilder_admin_${ts}@genuai.test`;
  const candEmail = `vbuilder_cand_${ts}@genuai.test`;
  const password = 'Password123!';

  let compAToken, compAId, compBToken, compBId, adminToken, candToken, candId;
  let deptAId, roleMasterAId, blueprintSuggestionId, approvedBlueprintId, vacancyId;

  try {
    // -------------------------------------------------------------
    // SETUP: Users & Companies
    // -------------------------------------------------------------
    console.log('📦 Setting up test users and companies...');

    // 1. Company A
    const regA = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Alice',
        lastName: 'Recruiter',
        email: compAEmail,
        password,
        companyName: `FinTech Solutions ${ts}`,
      },
    });
    assert(regA.status === 201, 'Company A registered');
    compAToken = regA.data?.token;
    compAId = regA.data?.company?.id;

    // Approve company A onboarding
    await pool.query("UPDATE companies SET verification_status = 'APPROVED', onboarding_submitted = true WHERE id = $1", [compAId]);

    // 2. Company B
    const regB = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Bob',
        lastName: 'Manager',
        email: compBEmail,
        password,
        companyName: `HealthTech Systems ${ts}`,
      },
    });
    assert(regB.status === 201, 'Company B registered');
    compBToken = regB.data?.token;
    compBId = regB.data?.company?.id;

    // 3. Admin
    const adminHash = await bcrypt.hash(password, 10);
    const adminRes = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, 'Platform', 'Admin', 'SUPER_ADMIN', true)
       RETURNING id`,
      [adminEmail, adminHash]
    );
    const loginAdmin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password },
    });
    assert(loginAdmin.status === 200, 'Admin logged in');
    adminToken = loginAdmin.data?.token;

    // 4. Candidate
    const candHash = await bcrypt.hash(password, 10);
    const candUserRes = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, 'Candidate', 'Alpha', 'CANDIDATE', true)
       RETURNING id`,
      [candEmail, candHash]
    );
    candId = candUserRes.rows[0].id;
    await pool.query(
      `INSERT INTO candidates (id, email, first_name, last_name)
       VALUES ($1, $2, 'Candidate', 'Alpha')
       ON CONFLICT (email) DO NOTHING`,
      [candId, candEmail]
    );
    const candLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: candEmail, password },
    });
    candToken = candLogin.data?.token;
    assert(Boolean(candToken), 'Candidate authenticated');

    // -------------------------------------------------------------
    // TEST 1: Company A creates Department and Role Master
    // -------------------------------------------------------------
    console.log('\n--- Step 1: Department & Role Master Creation ---');
    const deptRes = await apiRequest('/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAToken}` },
      body: { name: `Cloud Platform Eng ${ts}`, description: 'Core infrastructure team' },
    });
    assert(deptRes.status === 201 || deptRes.status === 200, 'Company A creates Department', JSON.stringify(deptRes.data));
    deptAId = deptRes.data?.department?.id || deptRes.data?.id;

    const roleMasterRes = await apiRequest('/roles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAToken}` },
      body: {
        title: 'Backend Developer',
        departmentId: deptAId,
        experienceLevel: 'senior',
        employmentType: 'full_time',
        location: 'London, UK (Hybrid)',
        vacancyCount: 3,
        jobDescription: 'Senior Backend Engineer responsible for distributed cloud microservices and databases.',
      },
    });
    assert(roleMasterRes.status === 201 || roleMasterRes.status === 200, 'Company A creates Role Master', JSON.stringify(roleMasterRes.data));
    roleMasterAId = roleMasterRes.data?.role?.id || roleMasterRes.data?.id;

    // -------------------------------------------------------------
    // TEST 2: Check existing blueprint before generation
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Check Existing Blueprint for Role Master ---');
    const checkBpRes = await apiRequest(`/company/role-masters/${roleMasterAId}/blueprint`, {
      headers: { Authorization: `Bearer ${compAToken}` },
    });
    assert(checkBpRes.status === 200 && checkBpRes.data?.blueprint === null, 'Role Master initially has no approved blueprint');

    // -------------------------------------------------------------
    // TEST 3: Generate AI Suggestions in Vacancy Builder
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Inline AI Suggestion Generation ---');
    const aiSuggestRes = await apiRequest('/company/vacancies/ai-suggest-blueprint', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAToken}` },
      body: {
        roleMasterId: roleMasterAId,
        roleTitle: 'Backend Developer',
        roleDescription: 'Senior Backend Engineer with Node.js and SQL expertise.',
        departmentId: deptAId,
        includeCommon: true,
      },
    });

    assert(aiSuggestRes.status === 200 || aiSuggestRes.status === 201, 'AI generates draft blueprint suggestions', JSON.stringify(aiSuggestRes.data));
    const suggestion = aiSuggestRes.data?.suggestion;
    blueprintSuggestionId = suggestion?.id;
    assert(blueprintSuggestionId && suggestion?.status === 'DRAFT', 'AI suggestions saved strictly in DRAFT state');
    assert(Array.isArray(suggestion?.suggested_skills) && suggestion.suggested_skills.length >= 4, 'Skills include role-specific competencies');

    // -------------------------------------------------------------
    // TEST 4: Company Edits AI Suggestions inline (add, rename, reorder)
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Company Edits AI Suggestions Inline ---');
    const currentSkills = suggestion.suggested_skills;
    currentSkills.push({
      name: 'Kafka Event Streaming',
      category: 'Infrastructure',
      importance: 'Must-have',
      description: 'Distributed event pub/sub architecture',
    });
    currentSkills[0].importance = 'Must-have';

    const editRes = await apiRequest(`/company/role-blueprints/ai-suggestions/${blueprintSuggestionId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${compAToken}` },
      body: {
        suggestedSkills: currentSkills,
        roleTitle: 'Backend Developer',
        roleMasterId: roleMasterAId,
      },
    });
    assert(editRes.status === 200, 'Company can update and customize draft blueprint suggestions', JSON.stringify(editRes.data));

    // -------------------------------------------------------------
    // TEST 5: Company Approves AI Blueprint inline
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Inline Blueprint Approval ---');
    const approveRes = await apiRequest(`/company/role-blueprints/ai-suggestions/${blueprintSuggestionId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAToken}` },
      body: {
        roleMasterId: roleMasterAId,
        approvalNotes: 'Approved directly in Vacancy Builder after review.',
      },
    });
    assert(approveRes.status === 200, 'Company approves role blueprint', JSON.stringify(approveRes.data));
    approvedBlueprintId = approveRes.data?.suggestion?.id || blueprintSuggestionId;

    // Verify Role Master now returns the approved blueprint
    const verifyBpRes = await apiRequest(`/company/role-masters/${roleMasterAId}/blueprint`, {
      headers: { Authorization: `Bearer ${compAToken}` },
    });
    assert(verifyBpRes.status === 200 && verifyBpRes.data?.blueprint?.id === approvedBlueprintId, 'Role Master is linked to the approved blueprint');
    assert(verifyBpRes.data?.blueprint?.status === 'APPROVED', 'Blueprint status is officially APPROVED');

    // -------------------------------------------------------------
    // TEST 6: Company creates Vacancy linked to Approved Blueprint
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Vacancy Creation with Approved Blueprint Link ---');
    const createVacRes = await apiRequest('/vacancies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAToken}` },
      body: {
        title: 'Backend Developer - Cloud Microservices',
        departmentId: deptAId,
        roleMasterId: roleMasterAId,
        approvedRoleBlueprintId: approvedBlueprintId,
        location: 'London, UK (Hybrid)',
        workMode: 'Hybrid',
        employmentType: 'full_time',
        experienceLevel: 'senior',
        vacancyCount: 2,
        jobDescription: 'High-scale backend developer position linked to approved role blueprint.',
        requirements: currentSkills.map(s => ({
          name: s.name,
          category: s.category,
          type: s.importance === 'Must-have' ? 'Required' : 'Preferred',
          priority: 'High',
          proficiency: 'Advanced',
          method: 'Official Technical Assessment',
        })),
      },
    });

    assert(createVacRes.status === 201 || createVacRes.status === 200, 'Vacancy created linking approvedRoleBlueprintId and roleMasterId', JSON.stringify(createVacRes.data));
    vacancyId = createVacRes.data?.vacancy?.id;
    assert(vacancyId, 'Vacancy ID received');

    // -------------------------------------------------------------
    // TEST 7: Submit, Admin Verify, and Publish Vacancy
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Submit -> Verify -> Publish Vacancy ---');
    const submitRes = await apiRequest(`/vacancies/${vacancyId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAToken}` },
    });
    assert(submitRes.status === 200, 'Vacancy submitted for platform review');

    const adminApproveRes = await apiRequest(`/admin/vacancies/${vacancyId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'APPROVED', note: 'Verified role blueprint and requirements' },
    });
    assert(adminApproveRes.status === 200, 'Admin approves vacancy requisition');

    const publishRes = await apiRequest(`/vacancies/${vacancyId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAToken}` },
    });
    assert(publishRes.status === 200, 'Company publishes vacancy with approved blueprint');

    // -------------------------------------------------------------
    // TEST 8: Candidate Target Creation with Approved Blueprint
    // -------------------------------------------------------------
    console.log('\n--- Step 8: Candidate Discovers Vacancy & Creates Target ---');
    const publicVacRes = await apiRequest(`/candidate-portal/vacancies/${vacancyId}`, {
      headers: { Authorization: `Bearer ${candToken}` },
    });
    assert(publicVacRes.status === 200, 'Candidate can view published vacancy');

    const targetRes = await apiRequest(`/candidate-portal/targets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${candToken}` },
      body: { vacancyId },
    });
    assert(targetRes.status === 201 || targetRes.status === 200, 'Candidate successfully creates Target for vacancy with approved blueprint', JSON.stringify(targetRes.data));
    const targetId = targetRes.data?.target?.id;
    assert(targetId, 'Candidate Target initialized');

    // -------------------------------------------------------------
    // TEST 9: Publication Gate: Vacancy WITHOUT approved blueprint cannot be published
    // -------------------------------------------------------------
    console.log('\n--- Step 9: Enforcement Gate: Vacancy Without Approved Blueprint Blocked ---');
    // Create an unverified vacancy without approved blueprint
    const unverifiedVacRes = await apiRequest('/vacancies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAToken}` },
      body: {
        title: 'Unverified Role Test',
        departmentId: deptAId,
        location: 'Remote',
        experienceLevel: 'senior',
        requirements: [{ name: 'Ad-hoc requirement', category: 'Technical', type: 'Required', priority: 'High', proficiency: 'Advanced', method: 'Official Technical Assessment' }],
      },
    });
    const unverifiedVacId = unverifiedVacRes.data?.vacancy?.id;

    // Try to publish directly without approved blueprint
    const badPublishRes = await apiRequest(`/vacancies/${unverifiedVacId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAToken}` },
    });
    assert(badPublishRes.status === 400 || badPublishRes.status === 403, 'Publication gate blocks vacancy without approved blueprint (returns 400/403)');

    // -------------------------------------------------------------
    // TEST 10: Multi-Tenant Isolation: Company B Cannot Access Company A Blueprint
    // -------------------------------------------------------------
    console.log('\n--- Step 10: Multi-Tenant Isolation ---');
    const crossAccessBp = await apiRequest(`/company/role-blueprints/ai-suggestions/${blueprintSuggestionId}`, {
      headers: { Authorization: `Bearer ${compBToken}` },
    });
    assert(crossAccessBp.status === 404 || crossAccessBp.status === 403, 'Company B cannot view Company A blueprint suggestion (404/403)');

    const crossAccessRm = await apiRequest(`/company/role-masters/${roleMasterAId}/blueprint`, {
      headers: { Authorization: `Bearer ${compBToken}` },
    });
    assert(crossAccessRm.status === 404 || crossAccessRm.status === 403, 'Company B cannot view Company A Role Master blueprint (404/403)');

    // -------------------------------------------------------------
    // TEST 11: Candidate cannot access Company Blueprint Management APIs
    // -------------------------------------------------------------
    console.log('\n--- Step 11: RBAC Enforcement ---');
    const candAccess = await apiRequest(`/company/vacancies/ai-suggest-blueprint`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${candToken}` },
      body: { roleTitle: 'Hacker Role' },
    });
    assert(candAccess.status === 403, 'Candidate token is blocked from Company AI Suggestion APIs with 403 Forbidden');

    // -------------------------------------------------------------
    // TEST 12: Unauthenticated returns 401
    // -------------------------------------------------------------
    console.log('\n--- Step 12: Unauthenticated Request Returns 401 ---');
    const unauthAccess = await apiRequest('/company/vacancies/ai-suggest-blueprint', {
      method: 'POST',
      body: { roleTitle: 'Secret Role' },
    });
    assert(unauthAccess.status === 401, 'Unauthenticated request returns 401 Unauthorized');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n========================================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

run();
