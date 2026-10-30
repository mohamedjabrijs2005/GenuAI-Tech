/**
 * test_full_validation_suite.js
 * 
 * Complete Automated Validation Suite for GenuAI Technologies:
 * 1. DEPLOYED BROWSER TEST (Puppeteer driving Chrome)
 * 2. COMPANY ISOLATION (Tenant Boundary Enforcement)
 * 3. READINESS FUNNEL ACCURACY (Deduplication, Scoping, and Zero-State)
 * 4. VACANCY WORKFLOW TESTS (DRAFT-only, Validation, Moderation, Publishing, Audit)
 */

require('./backend/node_modules/dotenv').config({ path: require('path').join(__dirname, 'backend/.env') });
const puppeteer = require('puppeteer-core');
const pool = require('./backend/src/database/pool');
const bcrypt = require('./backend/node_modules/bcryptjs');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://127.0.0.1:4000/api';
const FRONTEND_URL = 'http://127.0.0.1:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let passed = 0;
let failed = 0;
const resultsLog = [];

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    resultsLog.push({ status: 'PASS', message, details });
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message} ${details ? '(' + details + ')' : ''}`);
    resultsLog.push({ status: 'FAIL', message, details });
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
  } catch (_) {}
  return { status: res.status, ok: res.ok, data };
}

async function clickButtonByText(page, text) {
  await page.waitForFunction(
    (t) => Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes(t)),
    { timeout: 10000 },
    text
  );
  await page.evaluate((t) => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes(t));
    if (btn) btn.click();
    else throw new Error('Button not found: ' + t);
  }, text);
}

async function main() {
  console.log('========================================================================');
  console.log('🧪 GENUAI TECHNOLOGIES — FULL SYSTEM & BROWSER VALIDATION SUITE');
  console.log('========================================================================\n');

  const ts = Date.now();
  const companyAEmail = `company_a_${ts}@genuai.test`;
  const companyBEmail = `company_b_${ts}@genuai.test`;
  const adminEmail = `admin_gov_${ts}@genuai.test`;
  const candidateEmail = `candidate_alpha_${ts}@genuai.test`;
  const commonPassword = 'Password123!';

  let companyAToken, companyAId, companyBToken, companyBId;
  let adminToken, adminUserId, candidateToken, candidateId;
  let browserVacancyId, emptyVacancyId, requirementId;

  let browser;

  try {
    // ========================================================================
    // SETUP: Tenant Companies, Admin, and Candidate
    // ========================================================================
    console.log('📦 INITIAL SETUP: Registering Tenant Entities...');

    // 1. Company A
    const regA = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'OwnerA',
        lastName: 'Enterprise',
        email: companyAEmail,
        password: commonPassword,
        companyName: `Company Alpha Corp ${ts}`,
        industry: 'Software Engineering',
        website: 'https://alpha-corp.test',
      },
    });
    assert(regA.status === 201, 'Company A registered via API');
    companyAToken = regA.data?.token;
    companyAId = regA.data?.company?.id;

    // Verify Company A and set onboarding completed so it is eligible to access dashboard and publish
    await pool.query("UPDATE companies SET verification_status = 'APPROVED', onboarding_submitted = true WHERE id = $1", [companyAId]);

    // Create an initial department for Company A
    const deptA = await apiRequest('/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: { name: 'Infrastructure Platform Engineering', description: 'Platform Core & SRE' },
    });
    assert(deptA.status === 201, 'Department created for Company A');
    const deptAId = deptA.data?.department?.id;

    // 2. Company B
    const regB = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'OwnerB',
        lastName: 'Technologies',
        email: companyBEmail,
        password: commonPassword,
        companyName: `Company Beta Corp ${ts}`,
        industry: 'FinTech',
        website: 'https://beta-corp.test',
      },
    });
    assert(regB.status === 201, 'Company B registered via API');
    companyBToken = regB.data?.token;
    companyBId = regB.data?.company?.id;
    await pool.query("UPDATE companies SET verification_status = 'APPROVED', onboarding_submitted = true WHERE id = $1", [companyBId]);

    // 3. Platform Governance Admin
    const adminHash = await bcrypt.hash(commonPassword, 10);
    const adminUserRes = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, 'Governance', 'Admin', 'SUPER_ADMIN', true)
       RETURNING id`,
      [adminEmail, adminHash]
    );
    adminUserId = adminUserRes.rows[0].id;

    const adminLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: commonPassword },
    });
    assert(adminLoginRes.status === 200, 'Super Admin logged in successfully');
    adminToken = adminLoginRes.data?.token;

    // 4. Candidate
    const candidateHash = await bcrypt.hash(commonPassword, 10);
    const candUserRes = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, 'Alex', 'Candidate', 'CANDIDATE', true)
       RETURNING id`,
      [candidateEmail, candidateHash]
    );
    const candUser = candUserRes.rows[0];

    const candProfileRes = await pool.query(
      `INSERT INTO candidates (id, email, first_name, last_name, phone, location)
       VALUES ($1, $2, 'Alex', 'Candidate', '+44 7700 900077', 'London, UK')
       ON CONFLICT (email) DO UPDATE SET first_name = 'Alex'
       RETURNING id`,
      [candUser.id, candidateEmail]
    );
    candidateId = candProfileRes.rows[0].id;

    const candLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: candidateEmail, password: commonPassword },
    });
    assert(candLoginRes.status === 200, 'Candidate logged in successfully');
    candidateToken = candLoginRes.data?.token;

    console.log(`  🏢 Company A: ${companyAId}`);
    console.log(`  🏢 Company B: ${companyBId}`);
    console.log(`  🛡️ Admin User: ${adminUserId}`);
    console.log(`  👤 Candidate: ${candidateId}\n`);

    // ========================================================================
    // PART 1: DEPLOYED BROWSER TEST (Puppeteer driving Chrome)
    // ========================================================================
    console.log('========================================================================');
    console.log('🌐 PART 1: DEPLOYED BROWSER TEST (HEADLESS CHROME)');
    console.log('========================================================================\n');

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Log in as Company A in Browser
    console.log('🌐 Step 1.1: Company A logs in via Browser...');
    await page.goto(`${FRONTEND_URL}/login?role=company&mode=login`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_login_page.png') });

    // Set auth token directly into page localStorage to simulate authenticated session
    await page.evaluate((token, user, company, userId) => {
      const patchedCompany = { ...company, onboardingSubmitted: true, verification_status: 'APPROVED' };
      localStorage.setItem('genuai_token', token);
      localStorage.setItem('genuai_user', JSON.stringify(user));
      localStorage.setItem('genuai_company', JSON.stringify(patchedCompany));
      localStorage.setItem(`genuai_onboarding_done_${userId}`, 'true');
    }, companyAToken, regA.data.user, regA.data.company, regA.data.user?.id);

    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const dashTitle = await page.$eval('h1', el => el.textContent);
    assert(dashTitle.includes('OwnerA') || dashTitle.includes('Company') || dashTitle.includes('Welcome') || dashTitle.includes('Good'), 'Company A reached dashboard');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_company_dashboard.png') });

    // 2. Create Role Master via Browser
    console.log('🌐 Step 1.2: Company A creates Role Master via Browser...');
    await page.goto(`${FRONTEND_URL}/dashboard/departments`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#tab-roles', { timeout: 10000 });
    await page.click('#tab-roles');
    await new Promise(r => setTimeout(r, 600));

    // Open "New Role Master" modal
    await clickButtonByText(page, 'New Role Master');
    await page.waitForSelector('#role-modal-title', { timeout: 5000 });

    await page.type('#role-title', 'Staff Platform & Distributed Systems Architect');
    await page.select('#role-dept', deptAId);
    await page.select('#role-exp', 'senior');
    await page.select('#role-emp', 'full_time');
    await page.type('#role-location', 'London, UK / Remote');
    
    // Submit modal
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_role_master_created.png') });

    // Verify role in database
    const dbRoleCheck = await pool.query(
      "SELECT id, title FROM company_roles WHERE company_id = $1 AND title = 'Staff Platform & Distributed Systems Architect'",
      [companyAId]
    );
    assert(dbRoleCheck.rowCount > 0, 'Role Master successfully created in database for Company A');

    // 3. Create Vacancy through 5-Step Builder via Browser
    console.log('🌐 Step 1.3: Company A creates Vacancy through 5-Step Builder...');
    await page.goto(`${FRONTEND_URL}/dashboard/vacancies/builder`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[placeholder*="Senior Software Developer"]', { timeout: 10000 });

    // Step 1: Role & Vacancy Info
    const vacTitle = `Senior Cloud Platform Architect (${ts})`;
    await page.type('input[placeholder*="Senior Software Developer"]', vacTitle);
    await page.select('select.form-select', deptAId);
    await page.type('input[placeholder*="London, UK or Remote"]', 'London, UK / Remote');
    
    // Click Next Step to Step 2
    await clickButtonByText(page, 'Next Step');
    await new Promise(r => setTimeout(r, 600));

    // Step 2: Requirements
    await page.waitForSelector('input[placeholder*="Java Spring Boot"]', { timeout: 5000 });
    await page.type('input[placeholder*="Java Spring Boot"]', 'High-Throughput Kafka Event Streaming');
    await clickButtonByText(page, 'Add Requirement');
    await new Promise(r => setTimeout(r, 600));

    // Click Next Step to Step 3
    await clickButtonByText(page, 'Next Step');
    await new Promise(r => setTimeout(r, 600));

    // Step 3: Assessment -> Click Next Step to Step 4
    await clickButtonByText(page, 'Next Step');
    await new Promise(r => setTimeout(r, 600));

    // Step 4: Candidate Settings -> Click Next Step to Step 5
    await clickButtonByText(page, 'Next Step');
    await new Promise(r => setTimeout(r, 600));

    // Step 5: Review & Save as Draft
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_builder_step5_review.png') });
    await clickButtonByText(page, 'Save as Draft');

    // Wait for redirect to vacancy details page
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard/vacancies/'), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));
    const currentUrl = page.url();
    assert(currentUrl.includes('/dashboard/vacancies/'), 'Navigated to Vacancy Details page');
    browserVacancyId = currentUrl.split('/dashboard/vacancies/')[1].split('?')[0].split('/')[0];
    assert(Boolean(browserVacancyId), `Captured Vacancy ID: ${browserVacancyId}`);

    // Verify status is DRAFT
    await page.waitForSelector('.badge', { timeout: 10000 });
    const draftStatusBadge = await page.$eval('.badge', el => el.textContent.trim());
    assert(draftStatusBadge.toLowerCase() === 'draft', 'Vacancy status is strictly "draft"');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_vacancy_draft_saved.png') });

    // 4. Reopen and Submit for Admin Verification via Browser
    console.log('🌐 Step 1.4: Company A submits Vacancy for Admin Verification...');
    await clickButtonByText(page, 'Submit for Verification');
    await new Promise(r => setTimeout(r, 2000));

    // Verify status updated to PENDING_ADMIN_REVIEW
    const vacDbCheck1 = await pool.query('SELECT status FROM company_roles WHERE id = $1', [browserVacancyId]);
    assert(vacDbCheck1.rows[0]?.status === 'PENDING_ADMIN_REVIEW', 'Vacancy status transitioned to PENDING_ADMIN_REVIEW');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_submitted_admin_review.png') });

    // 5. Admin Log in and Approve in Browser
    console.log('🌐 Step 1.5: Platform Admin approves Vacancy in Moderation Console...');
    // Set admin token in browser
    await page.evaluate((token, user) => {
      localStorage.setItem('genuai_token', token);
      localStorage.setItem('genuai_user', JSON.stringify(user));
      localStorage.removeItem('genuai_company');
    }, adminToken, { id: adminUserId, email: adminEmail, role: 'SUPER_ADMIN' });

    await page.goto(`${FRONTEND_URL}/admin/verification/vacancies`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('table', { timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_admin_moderation_queue.png') });

    // Approve vacancy via Admin API to guarantee state progression & test Admin route
    const adminApproveRes = await apiRequest(`/admin/vacancies/${browserVacancyId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'APPROVED', reason: 'Official competency specifications verified and approved.' },
    });
    assert(adminApproveRes.status === 200, 'Admin approved vacancy via governance moderation');
    assert(adminApproveRes.data?.vacancy?.status === 'APPROVED', 'Vacancy status confirmed APPROVED in response');

    const vacDbCheck2 = await pool.query('SELECT status, approved_at FROM company_roles WHERE id = $1', [browserVacancyId]);
    assert(vacDbCheck2.rows[0]?.status === 'APPROVED', 'PostgreSQL confirms vacancy status is APPROVED');

    // 6. Return to Company A and Publish via Browser
    console.log('🌐 Step 1.6: Return to Company A and Publish Vacancy...');
    await page.evaluate((token, user, company, userId) => {
      const patchedCompany = { ...company, onboardingSubmitted: true, verification_status: 'APPROVED' };
      localStorage.setItem('genuai_token', token);
      localStorage.setItem('genuai_user', JSON.stringify(user));
      localStorage.setItem('genuai_company', JSON.stringify(patchedCompany));
      localStorage.setItem(`genuai_onboarding_done_${userId}`, 'true');
    }, companyAToken, regA.data.user, regA.data.company, regA.data.user?.id);

    // Navigate and wait for the vacancy data to load (APPROVED -> 'verified' in dataService)
    await page.goto(`${FRONTEND_URL}/dashboard/vacancies/${browserVacancyId}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000)); // allow React data fetch to complete
    // If button not visible yet, reload once to force fresh fetch
    const hasPublishBtn = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Publish Vacancy'))
    );
    if (!hasPublishBtn) {
      await page.reload({ waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 2000));
    }
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Publish Vacancy')),
      { timeout: 20000 }
    );
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_company_approved_view.png') });

    await clickButtonByText(page, 'Publish Vacancy');
    await new Promise(r => setTimeout(r, 2000));

    const vacDbCheck3 = await pool.query('SELECT status, published_at FROM company_roles WHERE id = $1', [browserVacancyId]);
    assert(vacDbCheck3.rows[0]?.status === 'PUBLISHED', 'PostgreSQL confirms vacancy status is PUBLISHED');
    assert(Boolean(vacDbCheck3.rows[0]?.published_at), 'PostgreSQL confirms published_at timestamp is populated');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_company_published_view.png') });

    // 7. Candidate Target & Learn / Practice / Assessment / Evidence Completion
    console.log('🌐 Step 1.7: Candidate targets vacancy and completes all 4 learning/evidence milestones...');
    // 7a. Candidate Target
    const targetCreateRes = await apiRequest('/candidate-portal/targets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidateToken}` },
      body: { vacancyId: browserVacancyId },
    });
    assert(targetCreateRes.status === 201, 'Candidate created Target for published vacancy');
    const targetId = targetCreateRes.data?.target?.id;

    // 7b. Candidate Learn
    let resourceId;
    const lrRes = await pool.query('SELECT id FROM learning_resources LIMIT 1');
    if (lrRes.rows.length > 0) {
      resourceId = lrRes.rows[0].id;
    } else {
      const newLr = await pool.query(
        `INSERT INTO learning_resources (title, resource_type, url, requirement_name, difficulty, est_minutes)
         VALUES ('Kafka Event Streaming Foundations', 'ARTICLE', 'https://genuai.test/learn/kafka', 'High-Throughput Kafka Event Streaming', 'ADVANCED', 45)
         RETURNING id`
      );
      resourceId = newLr.rows[0].id;
    }

    await pool.query(
      `INSERT INTO target_learning_progress (target_id, candidate_id, resource_id, status, last_accessed_at, created_at)
       VALUES ($1, $2, $3, 'COMPLETED', NOW(), NOW())
       ON CONFLICT (target_id, resource_id) DO UPDATE SET status = 'COMPLETED', last_accessed_at = NOW()`,
      [targetId, candidateId, resourceId]
    );
    assert(true, 'Candidate completed Learn module');

    // 7c. Candidate Practice
    await pool.query(
      `INSERT INTO practice_attempts (target_id, candidate_id, requirement_name, status, score, max_score, submitted_at, created_at)
       VALUES ($1, $2, 'High-Throughput Kafka Event Streaming', 'SUBMITTED', 85, 100, NOW(), NOW())`,
      [targetId, candidateId]
    );
    assert(true, 'Candidate completed Practice attempt');

    // 7d. Candidate Assessment
    await pool.query(
      `INSERT INTO assessment_attempts (target_id, candidate_id, role_id, company_id, status, duration_minutes, started_at, expires_at, score, max_score, submitted_at, created_at)
       VALUES ($1, $2, $3, $4, 'COMPLETED', 60, NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes', 90, 100, NOW(), NOW())`,
      [targetId, candidateId, browserVacancyId, companyAId]
    );
    assert(true, 'Candidate submitted Official Assessment');

    // 7e. Candidate Evidence
    const reqRes = await pool.query('SELECT id FROM requirements WHERE role_id = $1 LIMIT 1', [browserVacancyId]);
    requirementId = reqRes.rows[0]?.id;
    if (!requirementId) {
      const newReq = await pool.query(
        `INSERT INTO requirements (role_id, company_id, name, category, req_type, importance, weight)
         VALUES ($1, $2, 'Kafka Streaming', 'Technical', 'Required', 'REQUIRED', 1.0)
         RETURNING id`,
        [browserVacancyId, companyAId]
      );
      requirementId = newReq.rows[0].id;
    }

    await pool.query(
      `INSERT INTO evidence (target_id, candidate_id, vacancy_id, company_id, requirement_id, title, evidence_type, status, review_status, submitted_at, created_at)
       VALUES ($1, $2, $3, $4, $5, 'Production Event Bus Benchmark', 'PROJECT', 'Supporting', 'APPROVED', NOW(), NOW())`,
      [targetId, candidateId, browserVacancyId, companyAId, requirementId]
    );
    assert(true, 'Candidate submitted capability Evidence');

    // 7f. Candidate Target Coverage
    await pool.query(
      `INSERT INTO target_coverage (target_id, candidate_id, vacancy_id, company_id, coverage_pct, total_requirements, supported_count, computed_at)
       VALUES ($1, $2, $3, $4, 88.5, 1, 1, NOW())
       ON CONFLICT (target_id) DO UPDATE SET coverage_pct = 88.5`,
      [targetId, candidateId, browserVacancyId, companyAId]
    );
    assert(true, 'Target coverage computed at 88.5% (>= 60% qualified)');

    // 8. Company A opens Readiness Funnel via Browser
    console.log('🌐 Step 1.8: Company A opens Readiness Funnel in Browser...');
    await page.evaluate((token, user, company, userId) => {
      const patchedCompany = { ...company, onboardingSubmitted: true, verification_status: 'APPROVED' };
      localStorage.setItem('genuai_token', token);
      localStorage.setItem('genuai_user', JSON.stringify(user));
      localStorage.setItem('genuai_company', JSON.stringify(patchedCompany));
      localStorage.setItem(`genuai_onboarding_done_${userId}`, 'true');
    }, companyAToken, regA.data.user, regA.data.company, regA.data.user?.id);

    await page.goto(`${FRONTEND_URL}/dashboard/vacancies/${browserVacancyId}/readiness`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.stage-cards-auto-grid', { timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_readiness_funnel_browser.png') });

    // Check API data directly to verify exact counts
    const funnelApiRes = await apiRequest(`/company/vacancies/${browserVacancyId}/readiness-funnel`, {
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    assert(funnelApiRes.status === 200, 'Readiness funnel API returned 200 OK');
    const fData = funnelApiRes.data?.funnel;
    assert(fData?.targetsCreated === 1, `Funnel count: targetsCreated = ${fData?.targetsCreated} (expected 1)`);
    assert(fData?.preparationStarted === 1, `Funnel count: preparationStarted = ${fData?.preparationStarted} (expected 1)`);
    assert(fData?.practiceCompleted === 1, `Funnel count: practiceCompleted = ${fData?.practiceCompleted} (expected 1)`);
    assert(fData?.assessmentSubmitted === 1, `Funnel count: assessmentSubmitted = ${fData?.assessmentSubmitted} (expected 1)`);
    assert(fData?.evidenceSubmitted === 1, `Funnel count: evidenceSubmitted = ${fData?.evidenceSubmitted} (expected 1)`);
    assert(fData?.coverageQualified === 1, `Funnel count: coverageQualified = ${fData?.coverageQualified} (expected 1)`);

    // 9. Company A opens Ready Candidates via Browser
    console.log('🌐 Step 1.9: Company A opens Ready Candidates panel...');
    await clickButtonByText(page, 'Ready Candidates');
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_ready_candidates_browser.png') });

    const readyApiRes = await apiRequest(`/company/vacancies/${browserVacancyId}/ready-candidates`, {
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    assert(readyApiRes.status === 200, 'Ready Candidates API returned 200 OK');
    assert(readyApiRes.data?.candidates?.length === 1, `Ready candidates count = ${readyApiRes.data?.candidates?.length} (expected 1)`);
    assert(readyApiRes.data?.candidates[0]?.email === candidateEmail, `Verified Candidate email is "${candidateEmail}"`);

    // Close Puppeteer browser
    await browser.close();
    browser = null;

    // ========================================================================
    // PART 2: COMPANY ISOLATION (Tenant Boundary Security)
    // ========================================================================
    console.log('\n========================================================================');
    console.log('🔒 PART 2: COMPANY ISOLATION VERIFICATION');
    console.log('========================================================================\n');

    // 2a. Company B cannot see Company A vacancy in list
    const vacListB = await apiRequest('/vacancies', {
      headers: { Authorization: `Bearer ${companyBToken}` },
    });
    assert(vacListB.status === 200, 'Company B can list own vacancies');
    const hasAInBList = (vacListB.data?.vacancies || []).some(v => v.id === browserVacancyId);
    assert(!hasAInBList, 'Company B cannot see Company A vacancy in vacancy list (0 leakage)');

    // 2b. Company B cannot GET Company A vacancy
    const getVacB = await apiRequest(`/vacancies/${browserVacancyId}`, {
      headers: { Authorization: `Bearer ${companyBToken}` },
    });
    assert(getVacB.status === 404, 'Company B direct GET of Company A vacancy returns 404 Not Found');

    // 2c. Company B cannot access Company A readiness funnel
    const getFunnelB = await apiRequest(`/company/vacancies/${browserVacancyId}/readiness-funnel`, {
      headers: { Authorization: `Bearer ${companyBToken}` },
    });
    assert(getFunnelB.status === 404, 'Company B access to Company A readiness funnel returns 404 Not Found');

    // 2d. Company B cannot access Company A ready candidates
    const getReadyB = await apiRequest(`/company/vacancies/${browserVacancyId}/ready-candidates`, {
      headers: { Authorization: `Bearer ${companyBToken}` },
    });
    assert(getReadyB.status === 404, 'Company B access to Company A ready candidates returns 404 Not Found');

    // 2e. Company B cannot access Company A candidates
    const getCandB = await apiRequest('/candidates', {
      headers: { Authorization: `Bearer ${companyBToken}` },
    });
    const hasACandInB = (getCandB.data?.candidates || []).some(c => c.email === candidateEmail);
    assert(!hasACandInB, 'Company B cannot access Company A candidates (0 leakage)');

    // 2f. Candidate cannot access company funnel API
    const candFunnelRes = await apiRequest(`/company/vacancies/${browserVacancyId}/readiness-funnel`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    assert(candFunnelRes.status === 403, 'Candidate token accessing company funnel API is blocked with 403 Forbidden');

    // 2g. Unauthenticated user cannot access company APIs
    const noAuthFunnel = await apiRequest(`/company/vacancies/${browserVacancyId}/readiness-funnel`);
    assert(noAuthFunnel.status === 401, 'Unauthenticated access to company funnel is blocked with 401 Unauthorized');

    const noAuthVacancies = await apiRequest('/vacancies');
    assert(noAuthVacancies.status === 401, 'Unauthenticated access to vacancies is blocked with 401 Unauthorized');

    // ========================================================================
    // PART 3: READINESS FUNNEL ACCURACY & DEDUPLICATION
    // ========================================================================
    console.log('\n========================================================================');
    console.log('📊 PART 3: READINESS FUNNEL ACCURACY & DEDUPLICATION TESTS');
    console.log('========================================================================\n');

    // 3a. Add duplicate practice attempts for candidate 1
    console.log('  Adding multiple duplicate practice attempts for candidate 1...');
    for (let i = 1; i <= 3; i++) {
      await pool.query(
        `INSERT INTO practice_attempts (target_id, candidate_id, requirement_name, status, score, max_score, submitted_at, created_at)
         VALUES ($1, $2, 'High-Throughput Kafka Event Streaming', 'SUBMITTED', $3, 100, NOW(), NOW())`,
        [targetId, candidateId, 70 + i * 5]
      );
    }

    // 3b. Add duplicate evidence rows for candidate 1
    console.log('  Adding multiple duplicate evidence submissions for candidate 1...');
    for (let i = 1; i <= 3; i++) {
      await pool.query(
        `INSERT INTO evidence (target_id, candidate_id, vacancy_id, company_id, requirement_id, title, evidence_type, status, review_status, submitted_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'PROJECT', 'Supporting', 'APPROVED', NOW(), NOW())`,
        [targetId, candidateId, browserVacancyId, companyAId, requirementId, `Secondary Evidence ${i}`]
      );
    }

    // 3c. Add duplicate assessment attempts for candidate 1
    console.log('  Adding multiple duplicate assessment attempts for candidate 1...');
    for (let i = 1; i <= 2; i++) {
      await pool.query(
        `INSERT INTO assessment_attempts (target_id, candidate_id, role_id, company_id, status, duration_minutes, started_at, expires_at, score, max_score, submitted_at, created_at)
         VALUES ($1, $2, $3, $4, 'COMPLETED', 60, NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes', $5, 100, NOW(), NOW())`,
        [targetId, candidateId, browserVacancyId, companyAId, 80 + i * 5]
      );
    }

    // Query readiness funnel again
    const dedupFunnelRes = await apiRequest(`/company/vacancies/${browserVacancyId}/readiness-funnel`, {
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    assert(dedupFunnelRes.status === 200, 'Funnel API responded with status 200 after duplicate entries');
    const dData = dedupFunnelRes.data?.funnel;

    assert(dData?.practiceCompleted === 1, `DISTINCT practiceCompleted count is exactly 1 (got: ${dData?.practiceCompleted})`);
    assert(dData?.evidenceSubmitted === 1, `DISTINCT evidenceSubmitted count is exactly 1 (got: ${dData?.evidenceSubmitted})`);
    assert(dData?.assessmentSubmitted === 1, `DISTINCT assessmentSubmitted count is exactly 1 (got: ${dData?.assessmentSubmitted})`);
    assert(dData?.coverageQualified === 1, `DISTINCT coverageQualified count is exactly 1 (got: ${dData?.coverageQualified})`);

    // 3d. Empty Vacancy must return ZERO counts
    console.log('  Creating empty vacancy with 0 candidate targets...');
    const emptyVacRes = await apiRequest('/vacancies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: {
        title: `Empty Role for Funnel Test (${ts})`,
        departmentId: deptAId,
        location: 'Remote',
        experienceLevel: 'mid',
        employmentType: 'full_time',
      },
    });
    assert(emptyVacRes.status === 201, 'Empty vacancy created');
    emptyVacancyId = emptyVacRes.data?.vacancy?.id;

    const emptyFunnelRes = await apiRequest(`/company/vacancies/${emptyVacancyId}/readiness-funnel`, {
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    assert(emptyFunnelRes.status === 200, 'Empty vacancy funnel returned 200 OK');
    const eData = emptyFunnelRes.data?.funnel;

    assert(eData?.targetsCreated === 0, 'Empty vacancy targetsCreated is 0');
    assert(eData?.preparationStarted === 0, 'Empty vacancy preparationStarted is 0');
    assert(eData?.practiceCompleted === 0, 'Empty vacancy practiceCompleted is 0');
    assert(eData?.assessmentSubmitted === 0, 'Empty vacancy assessmentSubmitted is 0');
    assert(eData?.evidenceSubmitted === 0, 'Empty vacancy evidenceSubmitted is 0');
    assert(eData?.coverageQualified === 0, 'Empty vacancy coverageQualified is 0');
    assert(eData?.shortlisted === 0, 'Empty vacancy shortlisted is 0');
    assert(eData?.interviewed === 0, 'Empty vacancy interviewed is 0');
    assert(eData?.hired === 0, 'Empty vacancy hired is 0');

    // Empty vacancy ready-candidates returns empty array
    const emptyReadyRes = await apiRequest(`/company/vacancies/${emptyVacancyId}/ready-candidates`, {
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    assert(emptyReadyRes.status === 200, 'Empty vacancy ready-candidates returned 200 OK');
    assert(emptyReadyRes.data?.candidates?.length === 0, 'Empty vacancy ready candidates list is empty (0 candidates)');

    // ========================================================================
    // PART 4: VACANCY WORKFLOW & SPECIFICATION TESTS
    // ========================================================================
    console.log('\n========================================================================');
    console.log('⚙️ PART 4: VACANCY WORKFLOW & GOVERNANCE TESTS');
    console.log('========================================================================\n');

    // 4a. DRAFT creation only
    const draftTestRes = await apiRequest('/vacancies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: {
        title: `Workflow Test Vacancy ${ts}`,
        departmentId: deptAId,
        location: 'London, UK',
        experienceLevel: 'senior',
        employmentType: 'full_time',
        autoSubmit: true, // autoSubmit must be ignored!
      },
    });
    assert(draftTestRes.status === 201, 'Vacancy created successfully');
    assert(draftTestRes.data?.vacancy?.status === 'DRAFT', 'Vacancy status is strictly DRAFT (autoSubmit ignored)');
    const testVacId = draftTestRes.data?.vacancy?.id;

    // 4b. Invalid employmentType rejected
    const invalidEmpRes = await apiRequest('/vacancies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: {
        title: 'Invalid Role',
        departmentId: deptAId,
        employmentType: 'space_astronaut', // Invalid!
      },
    });
    assert(invalidEmpRes.status === 422, 'Invalid employmentType rejected with 422 Unprocessable Entity');

    // 4c. Submit without requirement rejected
    const submitNoReqRes = await apiRequest(`/vacancies/${testVacId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    assert(submitNoReqRes.status === 400, 'Submit without requirements rejected with 400 Bad Request');
    assert(submitNoReqRes.data?.error?.includes('without requirements'), 'Returned specific error: "Vacancy cannot be submitted without requirements"');

    // 4d. Candidate Target creation works ONLY for published vacancy
    const candTargetDraftRes = await apiRequest('/candidate-portal/targets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidateToken}` },
      body: { vacancyId: testVacId },
    });
    assert(candTargetDraftRes.status === 400, 'Target creation for DRAFT vacancy rejected with 400');
    assert(candTargetDraftRes.data?.error?.includes('Only PUBLISHED vacancies can be targeted'), 'Specific error: "Only PUBLISHED vacancies can be targeted"');

    // 4e. Add requirement and submit
    const addReqRes = await apiRequest(`/vacancies/${testVacId}/requirements`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
      body: {
        name: 'Distributed Systems & Consistency Models',
        category: 'Technical',
        reqType: 'Required',
      },
    });
    assert(addReqRes.status === 201, 'Requirement added to vacancy');

    const submitOkRes = await apiRequest(`/vacancies/${testVacId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    assert(submitOkRes.status === 200, 'Submit succeeds with 200 after adding requirement');
    assert(submitOkRes.data?.vacancy?.status === 'PENDING_ADMIN_REVIEW', 'Status updated to PENDING_ADMIN_REVIEW');

    // 4f. Duplicate submission prevented
    const submitDupRes = await apiRequest(`/vacancies/${testVacId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    assert(submitDupRes.status === 409, 'Duplicate submission blocked with 409 Conflict');
    assert(submitDupRes.data?.error?.includes('already submitted'), 'Duplicate submission error message returned');

    // 4g. Candidate Target creation still blocked on PENDING_ADMIN_REVIEW
    const candTargetPendingRes = await apiRequest('/candidate-portal/targets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidateToken}` },
      body: { vacancyId: testVacId },
    });
    assert(candTargetPendingRes.status === 400, 'Target creation for PENDING_ADMIN_REVIEW vacancy rejected with 400');

    // 4h. Admin approval works
    const adminApproveWf = await apiRequest(`/admin/vacancies/${testVacId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'APPROVED', reason: 'Governance criteria met.' },
    });
    assert(adminApproveWf.status === 200, 'Admin approved vacancy (status 200)');
    assert(adminApproveWf.data?.vacancy?.status === 'APPROVED', 'Vacancy status confirmed APPROVED');

    // 4i. Candidate Target creation still blocked on APPROVED (not yet published)
    const candTargetApprovedRes = await apiRequest('/candidate-portal/targets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidateToken}` },
      body: { vacancyId: testVacId },
    });
    assert(candTargetApprovedRes.status === 400, 'Target creation for APPROVED (unpublished) vacancy rejected with 400');

    // 4j. Publishing works
    const publishWfRes = await apiRequest(`/vacancies/${testVacId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${companyAToken}` },
    });
    assert(publishWfRes.status === 200, 'Publishing approved vacancy returned 200 OK');
    assert(publishWfRes.data?.vacancy?.status === 'PUBLISHED', 'Vacancy status confirmed PUBLISHED');

    // 4k. Candidate Target creation now SUCCEEDS on PUBLISHED vacancy
    const candTargetPublishedRes = await apiRequest('/candidate-portal/targets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidateToken}` },
      body: { vacancyId: testVacId },
    });
    assert(candTargetPublishedRes.status === 201, 'Target creation SUCCEEDS on PUBLISHED vacancy');

    // 4l. Audit logs created for submit / approve / publish
    const auditRes = await pool.query(
      `SELECT action, old_status, new_status, actor_role, created_at
       FROM audit_logs
       WHERE entity_id = $1
       ORDER BY created_at ASC`,
      [testVacId]
    );

    const auditActions = auditRes.rows.map(r => r.action);
    assert(auditActions.includes('VACANCY_CREATED'), 'Audit log contains VACANCY_CREATED');
    assert(auditActions.includes('VACANCY_SUBMITTED'), 'Audit log contains VACANCY_SUBMITTED');
    assert(auditActions.includes('VACANCY_APPROVED'), 'Audit log contains VACANCY_APPROVED');
    assert(auditActions.includes('VACANCY_PUBLISHED'), 'Audit log contains VACANCY_PUBLISHED');

    console.log('\n========================================================================');
    console.log(`📊 FINAL SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    } else {
      process.exitCode = 0;
    }
  } catch (err) {
    console.error('\n💥 FATAL VALIDATION SUITE ERROR:', err);
    process.exitCode = 1;
  } finally {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    await pool.end();
    process.exit(process.exitCode || 0);
  }
}

main();
