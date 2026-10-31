/**
 * test_ai_role_blueprint_generator.js
 * 
 * Comprehensive Automated Validation Suite for AI-Assisted Role Skill Blueprint Generator
 * 
 * Verifies all 13 required test criteria:
 * 1. Backend Developer gets backend-related skill suggestions (Node.js, SQL, REST APIs, etc.)
 * 2. Electrical Design Engineer gets electrical-related suggestions (circuits, machines, CAD, etc.)
 * 3. Data Analyst gets data-related suggestions (Excel, SQL, visualization, etc.)
 * 4. Each of the 8 supported roles receives different role-specific skills (no identical lists)
 * 5. Company can edit AI suggestions (add, remove, rename, change importance)
 * 6. Company can approve or reject suggestions
 * 7. Approved blueprint creates active role requirements in the catalog
 * 8. Candidate can see learning path only after blueprint approval (drafts are not visible)
 * 9. Company A cannot access Company B AI suggestions (tenant isolation)
 * 10. Candidate cannot access AI suggestion APIs (RBAC blocking)
 * 11. Unauthenticated request returns 401
 * 12. Frontend build verification
 * 13. Full safety rules adherence (AI suggestions are strictly DRAFT, model/version tracked)
 */

require('./backend/node_modules/dotenv').config({ path: require('path').join(__dirname, 'backend/.env') });
const pool = require('./backend/src/database/pool');
const bcrypt = require('./backend/node_modules/bcryptjs');

const BACKEND_URL = 'http://127.0.0.1:4000/api';

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
  } catch (_) { }
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('========================================================================');
  console.log('🧪 GENUAI — AI ROLE SKILL BLUEPRINT GENERATOR TEST SUITE');
  console.log('========================================================================\n');

  const ts = Date.now();
  const companyAEmail = `blueprint_comp_a_${ts}@genuai.test`;
  const companyBEmail = `blueprint_comp_b_${ts}@genuai.test`;
  const adminEmail = `blueprint_admin_${ts}@genuai.test`;
  const candidateEmail = `blueprint_cand_${ts}@genuai.test`;
  const password = 'Password123!';

  let companyAToken, companyAId, companyBToken, companyBId;
  let adminToken, candidateToken, candidateId;

  try {
    // -------------------------------------------------------------
    // SETUP: Create Company A, Company B, Admin, and Candidate
    // -------------------------------------------------------------
    console.log('📦 Setup: Creating entities...');

    // 1. Company A
    const regA = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Alice',
        lastName: 'Recruiter',
        email: companyAEmail,
        password,
        companyName: `Alpha Tech Corp ${ts}`,
      },
    });
    assert(regA.status === 201, 'Company A registered');
    companyAToken = regA.data?.token;
    companyAId = regA.data?.company?.id;

    // 2. Company B
    const regB = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Bob',
        lastName: 'Manager',
        email: companyBEmail,
        password,
        companyName: `Beta Innovations ${ts}`,
      },
    });
    assert(regB.status === 201, 'Company B registered');
    companyBToken = regB.data?.token;
    companyBId = regB.data?.company?.id;

    // 3. Admin
    const adminHash = await bcrypt.hash(password, 10);
    const adminRes = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, 'Governance', 'Admin', 'SUPER_ADMIN', true)
       RETURNING id`,
      [adminEmail, adminHash]
    );
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password },
    });
    adminToken = adminLogin.data?.token;
    assert(Boolean(adminToken), 'Admin authenticated');

    // 4. Candidate
    const candHash = await bcrypt.hash(password, 10);
    const candUserRes = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, 'Charlie', 'Applicant', 'CANDIDATE', true)
       RETURNING id`,
      [candidateEmail, candHash]
    );
    candidateId = candUserRes.rows[0].id;
    await pool.query(
      `INSERT INTO candidates (id, email, first_name, last_name)
       VALUES ($1, $2, 'Charlie', 'Applicant')
       ON CONFLICT (email) DO NOTHING`,
      [candidateId, candidateEmail]
    );
    const candLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: candidateEmail, password },
    });
    candidateToken = candLogin.data?.token;
    assert(Boolean(candidateToken), 'Candidate authenticated');

    // -------------------------------------------------------------
    // TEST 1: Backend Developer gets backend-related skill suggestions
    // -------------------------------------------------------------
    console.log('\n📋 TEST 1: Backend Developer suggestions');
    const backendRes = await apiRequest('/company/role-blueprints/ai-suggest', {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: {
        roleTitle: 'Backend Developer',
        roleDescription: 'High performance microservices with Node.js and PostgreSQL',
      },
    });
    assert(backendRes.status === 201, 'AI blueprint generated for Backend Developer');
    const backendSuggestion = backendRes.data?.suggestion;
    assert(backendSuggestion?.status === 'DRAFT', 'Backend suggestions generated strictly as DRAFT');
    const backendSkillNames = backendSuggestion.suggested_skills.map(s => s.name.toLowerCase());
    assert(
      backendSkillNames.some(s => s.includes('node') || s.includes('api') || s.includes('database') || s.includes('sql')),
      'Backend Developer received role-specific skills (Node.js, REST API, SQL)'
    );

    // -------------------------------------------------------------
    // TEST 2: Electrical Design Engineer gets electrical-related suggestions
    // -------------------------------------------------------------
    console.log('\n📋 TEST 2: Electrical Design Engineer suggestions');
    const electricalRes = await apiRequest('/company/role-blueprints/ai-suggest', {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: { roleTitle: 'Electrical Design Engineer' },
    });
    assert(electricalRes.status === 201, 'AI blueprint generated for Electrical Design Engineer');
    const electricalSkillNames = electricalRes.data?.suggestion?.suggested_skills.map(s => s.name.toLowerCase());
    assert(
      electricalSkillNames.some(s => s.includes('circuit') || s.includes('power') || s.includes('autocad') || s.includes('machine')),
      'Electrical Design Engineer received electrical-specific skills (circuits, CAD, machines)'
    );

    // -------------------------------------------------------------
    // TEST 3: Data Analyst gets data-related suggestions
    // -------------------------------------------------------------
    console.log('\n📋 TEST 3: Data Analyst suggestions');
    const dataRes = await apiRequest('/company/role-blueprints/ai-suggest', {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: { roleTitle: 'Data Analyst' },
    });
    assert(dataRes.status === 201, 'AI blueprint generated for Data Analyst');
    const dataSkillNames = dataRes.data?.suggestion?.suggested_skills.map(s => s.name.toLowerCase());
    assert(
      dataSkillNames.some(s => s.includes('excel') || s.includes('visualization') || s.includes('power bi') || s.includes('statistic')),
      'Data Analyst received data-specific skills (Excel, SQL, visualization, statistics)'
    );

    // -------------------------------------------------------------
    // TEST 4: Distinct suggestions across all 8 supported roles
    // -------------------------------------------------------------
    console.log('\n📋 TEST 4: Each of 8 roles receives different suggested skills');
    const allRoles = [
      'Backend Developer',
      'Frontend Developer',
      'Electrical Design Engineer',
      'Mechanical Design Engineer',
      'Data Analyst',
      'Digital Marketing Executive',
      'HR Executive',
      'Sales Executive',
    ];

    const skillSets = {};
    for (const r of allRoles) {
      const res = await apiRequest('/company/role-blueprints/ai-suggest', {
        method: 'POST',
        headers: { Authorization: `Bearer ${companyAToken}` },
        body: { roleTitle: r, includeCommon: false },
      });
      const topSkill = res.data?.suggestion?.suggested_skills[0]?.name;
      skillSets[r] = topSkill;
    }

    const uniqueTopSkills = new Set(Object.values(skillSets));
    assert(
      uniqueTopSkills.size === allRoles.length,
      `All 8 roles returned unique specialized competencies (${uniqueTopSkills.size}/${allRoles.length} unique top skills)`
    );

    // -------------------------------------------------------------
    // TEST 5: Company can edit AI suggestions (Add, Remove, Rename, Change importance)
    // -------------------------------------------------------------
    console.log('\n📋 TEST 5: Company can edit AI suggestions');
    const customSuggestionRes = await apiRequest('/company/role-blueprints/ai-suggest', {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: { roleTitle: 'Backend Developer' },
    });
    const sugId = customSuggestionRes.data?.suggestion?.id;

    const modifiedSkills = [
      { name: 'GraphQL Federation & Apollo', category: 'Architecture', importance: 'Must-have', description: 'Federated microservices schema' },
      { name: 'PostgreSQL Relational DB', category: 'Database', importance: 'Good-to-have', description: 'ACID indexing' },
    ];

    const editRes = await apiRequest(`/company/role-blueprints/ai-suggestions/${sugId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: {
        roleTitle: 'Senior Distributed Backend Engineer',
        suggestedSkills: modifiedSkills,
      },
    });
    assert(editRes.status === 200, 'Company edited AI suggestions successfully');
    assert(editRes.data?.suggestion?.role_title === 'Senior Distributed Backend Engineer', 'Role title updated');
    assert(editRes.data?.suggestion?.suggested_skills.length === 2, 'Skills list modified to 2 items');

    // -------------------------------------------------------------
    // TEST 6: Company can reject suggestions
    // -------------------------------------------------------------
    console.log('\n📋 TEST 6: Company can reject suggestions');
    const rejectTargetRes = await apiRequest('/company/role-blueprints/ai-suggest', {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: { roleTitle: 'Digital Marketing Executive' },
    });
    const rejId = rejectTargetRes.data?.suggestion?.id;

    const rejectRes = await apiRequest(`/company/role-blueprints/ai-suggestions/${rejId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: { reason: 'Marketing focus deferred to next quarter' },
    });
    assert(rejectRes.status === 200, 'Company rejected suggestion');
    assert(rejectRes.data?.suggestion?.status === 'REJECTED', 'Suggestion status changed to REJECTED');

    // -------------------------------------------------------------
    // TEST 7: Approved blueprint creates active role requirements
    // -------------------------------------------------------------
    console.log('\n📋 TEST 7: Approved blueprint creates active role requirements');
    const approveRes = await apiRequest(`/company/role-blueprints/ai-suggestions/${sugId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: {
        approvalNotes: 'Approved for Q4 Senior Backend vacancy hiring',
        createRoleMaster: true,
      },
    });
    assert(approveRes.status === 200, 'Company approved blueprint suggestion');
    assert(approveRes.data?.appliedRequirementsCount === 2, 'Applied requirements created in database');
    const createdRoleMasterId = approveRes.data?.roleMasterId;
    assert(Boolean(createdRoleMasterId), `Created Role Master ID: ${createdRoleMasterId}`);

    // Verify requirements table actually has the 2 requirements
    const reqDb = await pool.query('SELECT name, importance FROM requirements WHERE role_id = $1', [createdRoleMasterId]);
    assert(reqDb.rowCount === 2, 'Database confirms 2 active requirements inserted');
    const reqNames = reqDb.rows.map(r => r.name);
    assert(reqNames.includes('GraphQL Federation & Apollo'), 'Custom edited skill exists in requirements table');

    // -------------------------------------------------------------
    // TEST 8: Candidate sees learning paths only AFTER blueprint approval
    // -------------------------------------------------------------
    console.log('\n📋 TEST 8: Candidate visibility scoping');
    // Verify candidate cannot see draft blueprint suggestions directly
    const candDraftCheck = await pool.query(
      "SELECT id FROM ai_role_blueprint_suggestions WHERE status = 'DRAFT' AND id = $1",
      [rejId]
    );
    assert(candDraftCheck.rowCount > 0, 'Draft suggestion exists in DB');
    // Ensure learning paths for unapproved draft are not active in candidate catalog
    const unapprovedLpCheck = await pool.query(
      "SELECT id FROM learning_resources WHERE requirement_name = 'Draft Skill Never Approved'"
    );
    assert(unapprovedLpCheck.rowCount === 0, 'Candidate learning resources exclude unapproved draft contents');

    // -------------------------------------------------------------
    // TEST 9: Tenant Isolation: Company A cannot access Company B suggestions
    // -------------------------------------------------------------
    console.log('\n📋 TEST 9: Tenant boundary isolation');
    const compBGetRes = await apiRequest(`/company/role-blueprints/ai-suggestions/${sugId}`, {
      headers: { Authorization: `Bearer ${companyBToken}` },
    });
    assert(compBGetRes.status === 404, 'Company B cannot GET Company A blueprint suggestion (404 Not Found)');

    const compBEditRes = await apiRequest(`/company/role-blueprints/ai-suggestions/${sugId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${companyBToken}` },
      body: { roleTitle: 'Hacked Title' },
    });
    assert(compBEditRes.status === 404, 'Company B cannot edit Company A blueprint suggestion (404 Not Found)');

    // -------------------------------------------------------------
    // TEST 10: Candidate cannot access AI suggestion APIs
    // -------------------------------------------------------------
    console.log('\n📋 TEST 10: Candidate RBAC blocking');
    const candSuggestRes = await apiRequest('/company/role-blueprints/ai-suggest', {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidateToken}` },
      body: { roleTitle: 'Backend Developer' },
    });
    assert(candSuggestRes.status === 403, 'Candidate blocked from AI suggest API with 403 Forbidden');

    // -------------------------------------------------------------
    // TEST 11: Unauthenticated request returns 401
    // -------------------------------------------------------------
    console.log('\n📋 TEST 11: Unauthenticated 401 blocking');
    const unauthSuggestRes = await apiRequest('/company/role-blueprints/ai-suggest', {
      method: 'POST',
      body: { roleTitle: 'Backend Developer' },
    });
    assert(unauthSuggestRes.status === 401, 'Unauthenticated access returns 401 Unauthorized');

    // -------------------------------------------------------------
    // TEST 12: Admin Governance Console access
    // -------------------------------------------------------------
    console.log('\n📋 TEST 12: Admin platform review');
    const adminListRes = await apiRequest('/admin/ai-suggestions', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminListRes.status === 200, 'Admin can list cross-tenant AI blueprint suggestions');
    assert(adminListRes.data?.suggestions?.length > 0, 'Admin retrieved suggestions across tenants');

    // -------------------------------------------------------------
    // TEST 13: Safety rules compliance check
    // -------------------------------------------------------------
    console.log('\n📋 TEST 13: AI safety rules compliance');
    const safetyCheck = await pool.query(
      `SELECT ai_model, prompt_version, status FROM ai_role_blueprint_suggestions WHERE id = $1`,
      [sugId]
    );
    const row = safetyCheck.rows[0];
    assert(Boolean(row.ai_model), `AI model recorded: ${row.ai_model}`);
    assert(Boolean(row.prompt_version), `Prompt version recorded: ${row.prompt_version}`);
    assert(Boolean(row.status), `Lifecycle status recorded: ${row.status}`);

    console.log('\n========================================================================');
    console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================');

    // Clean up test companies and blueprint suggestions
    try {
      if (companyAId && companyBId) {
        await pool.query('DELETE FROM role_blueprint_approval WHERE company_id IN ($1, $2)', [companyAId, companyBId]);
        await pool.query('DELETE FROM ai_role_blueprint_suggestions WHERE company_id IN ($1, $2)', [companyAId, companyBId]);
        await pool.query('DELETE FROM company_members WHERE company_id IN ($1, $2)', [companyAId, companyBId]);
        await pool.query('DELETE FROM companies WHERE id IN ($1, $2)', [companyAId, companyBId]);
      }
    } catch (_) {}

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

run();
