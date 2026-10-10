require('dotenv').config();
const http = require('http');
const pool = require('./src/database/pool');
const app = require('./src/server');

const PORT = 4097;
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
            resolve({ status: res.statusCode, data: parsed });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runFinalCandidateWorkspaceSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING FINAL CANDIDATE DASHBOARD WORKSPACE SUITE');
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

  server = app.listen(PORT);

  try {
    const uniqueSuffix = Date.now();
    const candidateAEmail = `final_cand_a_${uniqueSuffix}@genuai.test`;
    const candidateBEmail = `final_cand_b_${uniqueSuffix}@genuai.test`;
    const password = 'Password123!';

    let tokenA = '';
    let tokenB = '';
    let companyAToken = '';

    console.log('📋 SECTION 1: Candidate Account & Global Profile Provisioning');

    // 1. Register Candidate A
    const regARes = await request(
      { method: 'POST', path: '/api/auth/register' },
      { firstName: 'Elena', lastName: 'Rostova', email: candidateAEmail, password, role: 'CANDIDATE', companyName: 'Candidate Workspace' }
    );
    assert(regARes.status === 201, 'Candidate A registered successfully');
    tokenA = regARes.data.token;

    // 2. Register Candidate B
    const regBRes = await request(
      { method: 'POST', path: '/api/auth/register' },
      { firstName: 'Marcus', lastName: 'Vance', email: candidateBEmail, password, role: 'CANDIDATE', companyName: 'Candidate Workspace' }
    );
    assert(regBRes.status === 201, 'Candidate B registered successfully');
    tokenB = regBRes.data.token;

    // 3. Login Company A recruiter
    const compALogin = await request(
      { method: 'POST', path: '/api/auth/login' },
      { email: 'companya@genuai.test', password: 'CompanyA123!' }
    );
    companyAToken = compALogin.data.token;

    // 4. Fetch Candidate A Global Profile
    const profileRes = await request(
      { method: 'GET', path: '/api/candidate-portal/profile', headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(profileRes.status === 200, 'Candidate A fetches own global profile');
    assert(profileRes.data.completion?.percentage !== undefined, 'Profile completion percentage computed transparently');

    // 5. Update Candidate A Global Profile
    const updateProfRes = await request(
      { method: 'PUT', path: '/api/candidate-portal/profile', headers: { Authorization: `Bearer ${tokenA}` } },
      {
        phone: '+1 (555) 345-6789',
        location: 'Seattle, WA',
        resumeUrl: 'https://storage.genuai.test/elena-resume.pdf',
        generalSkills: ['Java', 'Distributed Systems', 'PostgreSQL', 'Docker'],
        experienceSummary: 'Backend engineer specializing in distributed data consensus.',
        githubUrl: 'https://github.com/elena-rostova',
      }
    );
    assert(updateProfRes.status === 200, 'Candidate profile updated successfully');
    assert(updateProfRes.data.completion.percentage > profileRes.data.completion.percentage, 'Profile completion checklist reflects updated fields');

    console.log('\n📋 SECTION 2: Vacancy Transparency & Discovery');

    // 6. Discover Published Vacancies
    const vacListRes = await request({ method: 'GET', path: '/api/candidate-portal/vacancies' });
    assert(vacListRes.status === 200 && vacListRes.data.vacancies?.length > 0, 'Candidate discovers published vacancies');
    const compAId = compALogin.data.company?.id;
    const vacancyA = vacListRes.data.vacancies.find(v => v.company_id === compAId) || vacListRes.data.vacancies[0];
    const vacancyIdA = vacancyA.id;

    // 7. Vacancy Details & Transparency
    const vacDetailRes = await request({ method: 'GET', path: `/api/candidate-portal/vacancies/${vacancyIdA}` });
    assert(vacDetailRes.status === 200, 'Vacancy transparency page loads successfully');
    assert(vacDetailRes.data.requirements?.length > 0, 'Vacancy returns structured requirements and evaluation methods');
    const targetReq = vacDetailRes.data.requirements[0];

    console.log('\n📋 SECTION 3: Multi-Target Lifecycle & Candidate Isolation');

    // 8. Candidate A targets vacancy A
    const targetARes = await request(
      { method: 'POST', path: '/api/candidate-portal/targets', headers: { Authorization: `Bearer ${tokenA}` } },
      { vacancyId: vacancyIdA }
    );
    assert(targetARes.status === 201, 'Candidate A targets Vacancy A');
    const targetIdA = targetARes.data.target.id;

    // 9. Block duplicate active target
    const dupTargetRes = await request(
      { method: 'POST', path: '/api/candidate-portal/targets', headers: { Authorization: `Bearer ${tokenA}` } },
      { vacancyId: vacancyIdA }
    );
    assert(dupTargetRes.status === 409, 'Duplicate active target blocked with 409 Conflict');

    // 10. Candidate B CANNOT access Candidate A target workspace
    const crossAccessRes = await request(
      { method: 'GET', path: `/api/candidate-portal/targets/${targetIdA}`, headers: { Authorization: `Bearer ${tokenB}` } }
    );
    assert(crossAccessRes.status === 404, 'Candidate B rejected from Candidate A target workspace with 404');

    console.log('\n📋 SECTION 4: Evidence Locker & Coverage Matrix');

    // 11. Candidate A submits evidence
    const submitEvRes = await request(
      { method: 'POST', path: `/api/candidate-portal/targets/${targetIdA}/evidence`, headers: { Authorization: `Bearer ${tokenA}` } },
      {
        requirementId: targetReq.id,
        evidenceType: 'PROJECT',
        title: 'Raft Consensus Implementation',
        description: 'Demonstrated fault tolerance and leader election across 5 distributed nodes.',
        externalUrl: 'https://github.com/elena/raft-consensus',
        action: 'SUBMIT',
      }
    );
    assert(submitEvRes.status === 201, 'Candidate A submits evidence item');
    const evidenceId = submitEvRes.data.evidence.id;

    // 12. Check Coverage Dashboard
    const covRes = await request(
      { method: 'GET', path: `/api/candidate-portal/targets/${targetIdA}/coverage`, headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(covRes.status === 200, 'Coverage fetched successfully');
    assert(covRes.data.coverage?.pendingCount >= 1, 'Coverage correctly counts pending submitted evidence');

    // 13. Recruiter reviews and accepts evidence
    const reviewRes = await request(
      { method: 'POST', path: `/api/evidence/items/${evidenceId}/review`, headers: { Authorization: `Bearer ${companyAToken}` } },
      { decision: 'ACCEPTED', reviewerNote: 'Demonstrated high architectural maturity.' }
    );
    assert(reviewRes.status === 200, 'Recruiter review accepted');

    // 14. Check Candidate Coverage reflects SUPPORTED
    const covUpdatedRes = await request(
      { method: 'GET', path: `/api/candidate-portal/targets/${targetIdA}/coverage`, headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(covUpdatedRes.data.coverage?.supportedCount >= 1, 'Candidate sees requirement status updated to SUPPORTED');

    console.log('\n📋 SECTION 5: Dashboard Metrics, Activity, & Accommodations');

    // 15. Candidate Dashboard home metrics
    const dashRes = await request(
      { method: 'GET', path: '/api/candidate-portal/dashboard', headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(dashRes.status === 200, 'Candidate dashboard metrics endpoint returns 200 OK');
    assert(dashRes.data.activeTargetsCount >= 1, 'Active targets count matches real database state');
    assert(dashRes.data.publishedVacanciesCount >= 1, 'Published vacancies count matches real database state');

    // 16. Candidate Activity Log
    const actRes = await request(
      { method: 'GET', path: '/api/candidate-portal/activity', headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(actRes.status === 200 && actRes.data.activity?.length > 0, 'Candidate activity log returns candidate-visible events');

    // 17. Submit Accommodation Request
    const accommRes = await request(
      { method: 'POST', path: '/api/candidate-portal/accommodations', headers: { Authorization: `Bearer ${tokenA}` } },
      {
        targetId: targetIdA,
        requestType: 'TIME_EXTENSION',
        description: 'Requesting 1.5x time extension for timed assessment sessions.',
      }
    );
    assert(accommRes.status === 201, 'Accommodation request submitted successfully');

    // 18. List Accommodation Requests
    const accommListRes = await request(
      { method: 'GET', path: '/api/candidate-portal/accommodations', headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(accommListRes.status === 200 && accommListRes.data.accommodations?.length >= 1, 'Candidate lists own accommodation requests');

    // 19. Withdraw Target
    const withdrawRes = await request(
      { method: 'POST', path: `/api/candidate-portal/targets/${targetIdA}/withdraw`, headers: { Authorization: `Bearer ${tokenA}` } },
      { reason: 'Accepted another position' }
    );
    assert(withdrawRes.status === 200, 'Candidate withdraws own active target');

    console.log('\n====================================================');
    console.log(`📊 FINAL CANDIDATE SUITE: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (server) server.close();
    await pool.end();
  }
}

runFinalCandidateWorkspaceSuite().catch(() => process.exit(1));
