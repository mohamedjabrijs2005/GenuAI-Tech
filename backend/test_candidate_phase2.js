require('dotenv').config();
const http = require('http');
const pool = require('./src/database/pool');
const app = require('./src/server');

const PORT = 4098;
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

async function runPhase2Suite() {
  console.log('====================================================');
  console.log('🧪 RUNNING CANDIDATE PHASE 2 EVIDENCE & COVERAGE TEST');
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
    const candidateAEmail = `cand_a_${uniqueSuffix}@genuai.test`;
    const candidateBEmail = `cand_b_${uniqueSuffix}@genuai.test`;
    const password = 'Password123!';

    let tokenA = '';
    let tokenB = '';
    let companyAToken = '';
    let companyBToken = '';

    console.log('📋 STEP 1: Candidate & Recruiter Setup');

    // 1. Register Candidate A
    const regARes = await request(
      { method: 'POST', path: '/api/auth/register' },
      { firstName: 'Alice', lastName: 'Candidate', email: candidateAEmail, password, role: 'CANDIDATE', companyName: 'Candidate Workspace' }
    );
    assert(regARes.status === 201, 'Candidate A registered');
    tokenA = regARes.data.token;

    // 2. Register Candidate B
    const regBRes = await request(
      { method: 'POST', path: '/api/auth/register' },
      { firstName: 'Bob', lastName: 'Candidate', email: candidateBEmail, password, role: 'CANDIDATE', companyName: 'Candidate Workspace' }
    );
    tokenB = regBRes.data.token;

    // 3. Login Company A recruiter
    const compALogin = await request(
      { method: 'POST', path: '/api/auth/login' },
      { email: 'companya@genuai.test', password: 'CompanyA123!' }
    );
    companyAToken = compALogin.data.token;

    // 4. Login Company B recruiter
    const compBLogin = await request(
      { method: 'POST', path: '/api/auth/login' },
      { email: 'companyb@genuai.test', password: 'CompanyB123!' }
    );
    companyBToken = compBLogin.data.token;

    // 5. Discover published vacancy
    const vacList = await request({ method: 'GET', path: '/api/candidate-portal/vacancies' });
    assert(vacList.data.vacancies?.length > 0, 'Published vacancies available');
    const compAId = compALogin.data.company?.id;
    const vacancyA = vacList.data.vacancies.find(v => v.company_id === compAId) || vacList.data.vacancies[0];
    const vacancyIdA = vacancyA.id;

    // Fetch requirements for vacancy A
    const vacDetail = await request({ method: 'GET', path: `/api/candidate-portal/vacancies/${vacancyIdA}` });
    const reqsA = vacDetail.data.requirements || [];
    assert(reqsA.length >= 2, `Vacancy has requirements (Count: ${reqsA.length})`);
    const reqId1 = reqsA[0].id;
    const reqId2 = reqsA[1].id;

    // 6. Candidate A targets vacancy A
    const targetARes = await request(
      { method: 'POST', path: '/api/candidate-portal/targets', headers: { Authorization: `Bearer ${tokenA}` } },
      { vacancyId: vacancyIdA }
    );
    assert(targetARes.status === 201, 'Candidate A created target for Vacancy A');
    const targetIdA = targetARes.data.target.id;

    // 7. Candidate B targets vacancy A
    const targetBRes = await request(
      { method: 'POST', path: '/api/candidate-portal/targets', headers: { Authorization: `Bearer ${tokenB}` } },
      { vacancyId: vacancyIdA }
    );
    const targetIdB = targetBRes.data.target.id;

    console.log('\n📋 STEP 2: Candidate Evidence Submission & Isolation');

    // Test 1: Candidate A submits evidence to own target
    const evSubmitRes = await request(
      { method: 'POST', path: `/api/candidate-portal/targets/${targetIdA}/evidence`, headers: { Authorization: `Bearer ${tokenA}` } },
      {
        requirementId: reqId1,
        evidenceType: 'PROJECT',
        title: 'High-Throughput Microservice Ledger',
        description: 'Demonstrated concurrent memory allocation and ZGC pause tuning in production.',
        externalUrl: 'https://github.com/alice/ledger-service',
        action: 'SUBMIT',
      }
    );
    assert(evSubmitRes.status === 201, `Evidence submission returns 201 Created (Status: ${evSubmitRes.status})`);
    const evidenceId1 = evSubmitRes.data.evidence.id;
    assert(evSubmitRes.data.evidence.review_status === 'SUBMITTED', 'Evidence status is SUBMITTED');

    // Test 2: Candidate A CANNOT submit evidence to Candidate B's target
    const crossSubmitRes = await request(
      { method: 'POST', path: `/api/candidate-portal/targets/${targetIdB}/evidence`, headers: { Authorization: `Bearer ${tokenA}` } },
      {
        requirementId: reqId1,
        evidenceType: 'PROJECT',
        title: 'Unauthorized Infiltration',
        action: 'SUBMIT',
      }
    );
    assert(crossSubmitRes.status === 404, `Cross-candidate target submission rejected with 404 (Got: ${crossSubmitRes.status})`);

    // Test 3: Candidate CANNOT map evidence to an invalid/unrelated requirement
    const invalidReqRes = await request(
      { method: 'POST', path: `/api/candidate-portal/targets/${targetIdA}/evidence`, headers: { Authorization: `Bearer ${tokenA}` } },
      {
        requirementId: '00000000-0000-0000-0000-000000000000',
        evidenceType: 'PROJECT',
        title: 'Fake Requirement Map',
        action: 'SUBMIT',
      }
    );
    assert(invalidReqRes.status === 400, `Unrelated requirement rejected with 400 Bad Request (Got: ${invalidReqRes.status})`);

    // Test 4: Candidate saves a draft evidence item
    const draftRes = await request(
      { method: 'POST', path: `/api/candidate-portal/targets/${targetIdA}/evidence`, headers: { Authorization: `Bearer ${tokenA}` } },
      {
        requirementId: reqId2,
        evidenceType: 'WORK_SAMPLE',
        title: 'Draft Query Plan Benchmark',
        action: 'DRAFT',
      }
    );
    assert(draftRes.status === 201 && draftRes.data.evidence.review_status === 'DRAFT', 'Candidate successfully saved draft evidence');
    const draftEvId = draftRes.data.evidence.id;

    // Test 5: Candidate views evidence list for target
    const candEvList = await request(
      { method: 'GET', path: `/api/candidate-portal/targets/${targetIdA}/evidence`, headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(candEvList.status === 200 && candEvList.data.evidence?.length === 2, `Candidate views own target evidence list (Count: ${candEvList.data.evidence?.length})`);

    console.log('\n📋 STEP 3: Requirement Coverage Computation & Status');

    // Test 6: Check initial coverage (1 PENDING, 1 DRAFT/GAP)
    const covRes1 = await request(
      { method: 'GET', path: `/api/candidate-portal/targets/${targetIdA}/coverage`, headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(covRes1.status === 200, `Candidate coverage fetched (Pending: ${covRes1.data.coverage?.pendingCount})`);
    assert(covRes1.data.coverage.pendingCount >= 1, 'Coverage correctly counts pending submitted evidence');

    console.log('\n📋 STEP 4: Recruiter Review & Decision Workflow');

    // Test 7: Recruiter for Company A sees targets & pending evidence
    const recTargets = await request(
      { method: 'GET', path: '/api/evidence/targets', headers: { Authorization: `Bearer ${companyAToken}` } }
    );
    assert(recTargets.status === 200, `Recruiter lists company targets (Count: ${recTargets.data.targets?.length})`);

    // Test 8: Recruiter for Company B CANNOT access Company A target detail (Isolation)
    const crossCompRes = await request(
      { method: 'GET', path: `/api/evidence/targets/${targetIdA}`, headers: { Authorization: `Bearer ${companyBToken}` } }
    );
    assert(crossCompRes.status === 404, `Company B recruiter rejected from Company A target with 404 (Got: ${crossCompRes.status})`);

    // Test 9: Recruiter for Company A reviews and ACCEPTS evidence item
    const reviewAcceptRes = await request(
      { method: 'POST', path: `/api/evidence/items/${evidenceId1}/review`, headers: { Authorization: `Bearer ${companyAToken}` } },
      { decision: 'ACCEPTED', reviewerNote: 'Demonstrated solid architecture and test coverage.' }
    );
    assert(reviewAcceptRes.status === 200, `Recruiter review ACCEPTED (Status: ${reviewAcceptRes.status})`);
    assert(reviewAcceptRes.data.coverage?.supportedCount >= 1, 'Coverage automatically updated to SUPPORTED');

    // Test 10: Check updated coverage on candidate side
    const covRes2 = await request(
      { method: 'GET', path: `/api/candidate-portal/targets/${targetIdA}/coverage`, headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(covRes2.data.coverage?.supportedCount >= 1, 'Candidate sees requirement status updated to SUPPORTED');

    // Test 11: Candidate withdraws draft evidence
    const withdrawRes = await request(
      { method: 'POST', path: `/api/candidate-portal/targets/${targetIdA}/evidence/${draftEvId}/withdraw`, headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(withdrawRes.status === 200, 'Candidate successfully withdrew draft evidence item');

    // Test 12: Candidate CANNOT withdraw ACCEPTED evidence
    const withdrawLockedRes = await request(
      { method: 'POST', path: `/api/candidate-portal/targets/${targetIdA}/evidence/${evidenceId1}/withdraw`, headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(withdrawLockedRes.status === 400, `Locked evidence withdrawal blocked with 400 (Got: ${withdrawLockedRes.status})`);

    // Test 13: Verify audit log recorded review decisions
    const auditRes = await pool.query(
      "SELECT action, entity_type FROM audit_logs WHERE entity_id = $1 ORDER BY created_at DESC",
      [evidenceId1]
    );
    assert(auditRes.rows.some(r => r.action === 'EVIDENCE_ACCEPTED'), 'Audit log contains EVIDENCE_ACCEPTED entry');

    console.log('\n====================================================');
    console.log(`📊 PHASE 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('❌ Phase 2 Suite execution error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await pool.end();
  }
}

runPhase2Suite().catch(() => process.exit(1));
