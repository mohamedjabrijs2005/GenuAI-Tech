process.env.NODE_ENV = 'test';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const pool = require('../src/database/pool');
const app = require('../src/server');
const { computeProofForRequirement, computeOverallFit } = require('../src/services/skillProofService');

function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, tokenVersion: user.token_version },
    process.env.JWT_SECRET || 'test-secret-fallback',
    { expiresIn: '1h' }
  );
}

function requestJson(baseUrl, method, path, { token = null, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      url,
      {
        method,
        agent: false,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          let data = null;
          try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
          resolve({ status: res.statusCode, data });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe('Unit: skillProofService deterministic proof engine', () => {
  const reqNode = { id: 'req-1', name: 'Node.js & Express Ecosystem', importance: 'REQUIRED' };
  const reqDocker = { id: 'req-2', name: 'Docker', importance: 'REQUIRED' };
  const reqNice = { id: 'req-3', name: 'GraphQL', importance: 'PREFERRED' };

  test('computes not_assessed / missing when no claim, evidence, or assessment exists', () => {
    const res = computeProofForRequirement(reqNode, {});
    assert.equal(res.proofLevel, 'not_assessed');
    assert.equal(res.status, 'missing');
  });

  test('computes claimed / partial when candidate confirms claim', () => {
    const res = computeProofForRequirement(reqNode, {
      confirmedClaims: [{ id: 'clm-1', skill_name: 'Node.js & Express Ecosystem', source: 'manual' }],
    });
    assert.equal(res.proofLevel, 'claimed');
    assert.equal(res.status, 'partial');
  });

  test('computes assessed / meets (>=70%) and assessed / partial (40-69%)', () => {
    const passRes = computeProofForRequirement(reqNode, {
      assessments: [{ requirement_id: 'req-1', score: 85, max_score: 100, attempt_id: 'att-1' }],
    });
    assert.equal(passRes.proofLevel, 'assessed');
    assert.equal(passRes.status, 'meets');

    const partialRes = computeProofForRequirement(reqNode, {
      assessments: [{ requirement_id: 'req-1', score: 55, max_score: 100, attempt_id: 'att-2' }],
    });
    assert.equal(partialRes.proofLevel, 'assessed');
    assert.equal(partialRes.status, 'partial');
  });

  test('computes verified / meets when external evidence is accepted', () => {
    const res = computeProofForRequirement(reqNode, {
      evidence: [{ id: 'ev-1', requirement_id: 'req-1', review_status: 'ACCEPTED', evidence_type: 'REPO', title: 'API Repo' }],
    });
    assert.equal(res.proofLevel, 'verified');
    assert.equal(res.status, 'meets');
  });

  test('marks trainable gap for adjacent skill or preferred skill', () => {
    const adjacent = computeProofForRequirement(reqDocker, { hasStrongAdjacentEvidence: true });
    assert.equal(adjacent.proofLevel, 'not_assessed');
    assert.equal(adjacent.status, 'trainable');
    assert.equal(adjacent.trainable, true);

    const pref = computeProofForRequirement(reqNice, {});
    assert.equal(pref.status, 'trainable');
  });

  test('computeOverallFit returns vacancy-specific categorical fit', () => {
    assert.equal(computeOverallFit([{ importance: 'REQUIRED', status: 'meets' }]), 'strong');
    assert.equal(computeOverallFit([
      { importance: 'REQUIRED', status: 'meets' },
      { importance: 'REQUIRED', status: 'partial' },
    ]), 'promising');
    assert.equal(computeOverallFit([
      { importance: 'REQUIRED', status: 'meets' },
      { importance: 'REQUIRED', status: 'meets' },
      { importance: 'REQUIRED', status: 'missing' },
    ]), 'partial');
    assert.equal(computeOverallFit([{ importance: 'REQUIRED', status: 'missing' }]), 'not_ready');
  });
});

describe('Integration: Core Product Spine & Tenant Isolation', () => {
  let server;
  let baseUrl;
  const runTag = crypto.randomBytes(4).toString('hex');

  const ids = {
    adminUserId: null,
    companyAId: null,
    companyBId: null,
    ownerAUserId: null,
    ownerBUserId: null,
    candAUserId: null,
    candBUserId: null,
    candAId: null,
    candBId: null,
    vacancyId: null,
    targetId: null,
    claimId: null,
  };

  const tokens = {};

  before(async () => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-secret-fallback';
    }

    // Clean any orphaned rows from prior interrupted runs
    await pool.query("DELETE FROM companies WHERE name LIKE 'CoreTest Org%'").catch(() => {});
    await pool.query("DELETE FROM candidates WHERE email LIKE 'coretest-%@genuai.test'").catch(() => {});
    await pool.query("DELETE FROM users WHERE email LIKE 'coretest-%@genuai.test'").catch(() => {});

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    // Seed isolated ephemeral users & companies
    const createUser = async (email, role, first, last) => {
      const r = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified, token_version)
         VALUES ($1, 'test-hash', $2, $3, $4, TRUE, TRUE, 0)
         RETURNING id, email, first_name, last_name, role, token_version`,
        [email, first, last, role]
      );
      return r.rows[0];
    };

    const adminUser = await createUser(`coretest-admin-${runTag}@genuai.test`, 'SUPER_ADMIN', 'Test', 'Admin');
    const ownerA = await createUser(`coretest-ownera-${runTag}@genuai.test`, 'COMPANY_OWNER', 'Owner', 'Alpha');
    const ownerB = await createUser(`coretest-ownerb-${runTag}@genuai.test`, 'COMPANY_OWNER', 'Owner', 'Beta');
    const candA = await createUser(`coretest-canda-${runTag}@genuai.test`, 'CANDIDATE', 'Alice', 'Tester');
    const candB = await createUser(`coretest-candb-${runTag}@genuai.test`, 'CANDIDATE', 'Bob', 'Tester');

    ids.adminUserId = adminUser.id;
    ids.ownerAUserId = ownerA.id;
    ids.ownerBUserId = ownerB.id;
    ids.candAUserId = candA.id;
    ids.candBUserId = candB.id;

    tokens.admin = signToken(adminUser);
    tokens.ownerA = signToken(ownerA);
    tokens.ownerB = signToken(ownerB);
    tokens.candA = signToken(candA);
    tokens.candB = signToken(candB);

    const compA = await pool.query(
      `INSERT INTO companies (name, official_email, verification_status)
       VALUES ($1, $2, 'PENDING_VERIFICATION') RETURNING id`,
      [`CoreTest Org A ${runTag}`, `hr-a-${runTag}@genuai.test`]
    );
    const compB = await pool.query(
      `INSERT INTO companies (name, official_email, verification_status)
       VALUES ($1, $2, 'APPROVED') RETURNING id`,
      [`CoreTest Org B ${runTag}`, `hr-b-${runTag}@genuai.test`]
    );
    ids.companyAId = compA.rows[0].id;
    ids.companyBId = compB.rows[0].id;

    await pool.query(
      `INSERT INTO company_members (company_id, user_id, member_role) VALUES ($1, $2, 'COMPANY_OWNER'), ($3, $4, 'COMPANY_OWNER')`,
      [ids.companyAId, ids.ownerAUserId, ids.companyBId, ids.ownerBUserId]
    );
  });

  after(async () => {
    try {
      const userIds = [ids.adminUserId, ids.ownerAUserId, ids.ownerBUserId, ids.candAUserId, ids.candBUserId].filter(Boolean);
      const compIds = [ids.companyAId, ids.companyBId].filter(Boolean);
      const candEmails = [`coretest-canda-${runTag}@genuai.test`, `coretest-candb-${runTag}@genuai.test`];

      if (compIds.length) {
        await pool.query('DELETE FROM audit_logs WHERE company_id = ANY($1)', [compIds]).catch(() => {});
        await pool.query('DELETE FROM shortlist_overrides WHERE company_id = ANY($1)', [compIds]).catch(() => {});
        await pool.query('DELETE FROM hiring_outcomes WHERE company_id = ANY($1)', [compIds]).catch(() => {});
        await pool.query('DELETE FROM companies WHERE id = ANY($1)', [compIds]).catch(() => {});
      }
      await pool.query('DELETE FROM candidates WHERE email = ANY($1)', [candEmails]).catch(() => {});
      await pool.query("DELETE FROM email_jobs WHERE recipient_email LIKE 'coretest-%@genuai.test'").catch(() => {});
      if (userIds.length) {
        await pool.query('DELETE FROM audit_logs WHERE actor_user_id = ANY($1) OR user_id = ANY($1)', [userIds]).catch(() => {});
        await pool.query('DELETE FROM users WHERE id = ANY($1)', [userIds]).catch(() => {});
      }
    } finally {
      if (server) {
        server.closeAllConnections?.();
        await new Promise((resolve) => server.close(resolve));
      }
      await pool.end();
    }
  });

  test('1. Admin approves Company A and records audit log', async () => {
    const res = await requestJson(baseUrl, 'PUT', `/api/admin/companies/${ids.companyAId}/status`, {
      token: tokens.admin,
      body: { status: 'APPROVED', reason: 'Core flow verification' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.company.verificationStatus, 'APPROVED');
  });

  test('2. Company A creates vacancy, generates checklist, approves & locks it', async () => {
    // Create vacancy
    const createVac = await requestJson(baseUrl, 'POST', '/api/vacancies', {
      token: tokens.ownerA,
      body: {
        title: 'Backend Developer',
        experienceLevel: 'senior',
        employmentType: 'full_time',
        location: 'Remote',
        jobDescription: 'Node.js & PostgreSQL backend role',
      },
    });
    assert.equal(createVac.status, 201, JSON.stringify(createVac.data));
    ids.vacancyId = createVac.data.vacancy.id;
    assert.ok(ids.vacancyId);

    // Generate rules-based checklist (draft -> ai_generated)
    const genRes = await requestJson(baseUrl, 'POST', `/api/vacancies/${ids.vacancyId}/checklist/generate`, {
      token: tokens.ownerA,
      body: { includeCommon: false },
    });
    assert.equal(genRes.status, 201, JSON.stringify(genRes.data));
    assert.equal(genRes.data.checklist.status, 'ai_generated');
    assert.ok(genRes.data.items.length >= 6);

    // Approve checklist (ai_generated -> approved)
    const appRes = await requestJson(baseUrl, 'POST', `/api/vacancies/${ids.vacancyId}/checklist/approve`, {
      token: tokens.ownerA,
      body: { notes: 'HR approved skills' },
    });
    assert.equal(appRes.status, 200);
    assert.equal(appRes.data.checklist.status, 'approved');

    // Lock checklist (approved -> locked)
    const lockRes = await requestJson(baseUrl, 'POST', `/api/vacancies/${ids.vacancyId}/checklist/lock`, {
      token: tokens.ownerA,
      body: { notes: 'Locked for applicants' },
    });
    assert.equal(lockRes.status, 200);
    assert.equal(lockRes.data.checklist.status, 'locked');

    // Verify locked checklist rejects mutations (409)
    const editLocked = await requestJson(baseUrl, 'PUT', `/api/vacancies/${ids.vacancyId}/checklist/items`, {
      token: tokens.ownerA,
      body: { items: [{ name: 'Tampered Skill', importance: 'REQUIRED' }] },
    });
    assert.equal(editLocked.status, 409);

    // Admin approves & Company publishes vacancy so candidates can apply
    const adminVac = await requestJson(baseUrl, 'PUT', `/api/admin/vacancies/${ids.vacancyId}/status`, {
      token: tokens.admin,
      body: { status: 'APPROVED', note: 'Approved for core flow' },
    });
    assert.equal(adminVac.status, 200);

    const pubVac = await requestJson(baseUrl, 'POST', `/api/vacancies/${ids.vacancyId}/publish`, {
      token: tokens.ownerA,
    });
    assert.equal(pubVac.status, 200, JSON.stringify(pubVac.data));
  });

  test('3. Candidate A applies and confirms skill claims -> proof level updates', async () => {
    const targetRes = await requestJson(baseUrl, 'POST', '/api/candidate-portal/targets', {
      token: tokens.candA,
      body: { vacancyId: ids.vacancyId },
    });
    assert.equal(targetRes.status, 201, JSON.stringify(targetRes.data));
    ids.targetId = targetRes.data.target.id;

    // Create unconfirmed claim
    const claimCreate = await requestJson(baseUrl, 'POST', '/api/candidate/skill-claims', {
      token: tokens.candA,
      body: {
        claims: [{ skillName: 'Node.js & Express Ecosystem', claimText: '4 years API work', source: 'manual' }],
      },
    });
    assert.equal(claimCreate.status, 201, JSON.stringify(claimCreate.data));
    ids.claimId = claimCreate.data.claims[0].id;
    assert.equal(claimCreate.data.claims[0].confirmed_by_candidate, false);

    // Confirm claim explicitly
    const confirmRes = await requestJson(baseUrl, 'PATCH', `/api/candidate/skill-claims/${ids.claimId}/confirm`, {
      token: tokens.candA,
    });
    assert.equal(confirmRes.status, 200);
    assert.equal(confirmRes.data.claim.confirmed_by_candidate, true);

    // Verify target proof reflects 'claimed' on Node.js skill
    const proofRes = await requestJson(baseUrl, 'GET', `/api/candidate/skill-claims/targets/${ids.targetId}/proof`, {
      token: tokens.candA,
    });
    assert.equal(proofRes.status, 200);
    const nodeProof = proofRes.data.skills.find((s) => s.skillName === 'Node.js & Express Ecosystem');
    assert.ok(nodeProof);
    assert.equal(nodeProof.proofLevel, 'claimed');
    assert.equal(nodeProof.status, 'partial');
  });

  test('4. Tenant isolation: Candidate B and Company B are blocked from Tenant A resources', async () => {
    // Candidate B cannot confirm/withdraw Candidate A's claim or view Candidate A's target proof
    const candBConfirm = await requestJson(baseUrl, 'PATCH', `/api/candidate/skill-claims/${ids.claimId}/confirm`, {
      token: tokens.candB,
    });
    assert.equal(candBConfirm.status, 404);

    const candBProof = await requestJson(baseUrl, 'GET', `/api/candidate/skill-claims/targets/${ids.targetId}/proof`, {
      token: tokens.candB,
    });
    assert.equal(candBProof.status, 404);

    // Company B cannot view Company A's checklist, shortlist, override, or record hiring outcome
    const compBChecklist = await requestJson(baseUrl, 'GET', `/api/vacancies/${ids.vacancyId}/checklist`, {
      token: tokens.ownerB,
    });
    assert.equal(compBChecklist.status, 404);

    const compBShortlist = await requestJson(baseUrl, 'GET', `/api/company/vacancies/${ids.vacancyId}/shortlist`, {
      token: tokens.ownerB,
    });
    assert.equal(compBShortlist.status, 404);

    const compBOutcome = await requestJson(
      baseUrl,
      'POST',
      `/api/company/vacancies/${ids.vacancyId}/candidates/${ids.targetId}/hiring-outcome`,
      { token: tokens.ownerB, body: { decision: 'offered' } }
    );
    assert.equal(compBOutcome.status, 404);
  });

  test('5. Company A views explainable shortlist, overrides rank, records outcome, and verifies audit logs', async () => {
    const shortlistRes = await requestJson(baseUrl, 'GET', `/api/company/vacancies/${ids.vacancyId}/shortlist`, {
      token: tokens.ownerA,
    });
    assert.equal(shortlistRes.status, 200, JSON.stringify(shortlistRes.data));
    assert.equal(shortlistRes.data.checklistStatus, 'locked');
    assert.equal(shortlistRes.data.candidates.length, 1);

    const cand = shortlistRes.data.candidates[0];
    assert.equal(cand.targetId, ids.targetId);
    assert.ok(Array.isArray(cand.skills));
    assert.ok(Array.isArray(cand.missingSkills));
    assert.ok(Array.isArray(cand.trainableGaps));
    assert.ok(Array.isArray(cand.interviewFocus));

    // Override ranking
    const overrideRes = await requestJson(
      baseUrl,
      'POST',
      `/api/company/vacancies/${ids.vacancyId}/candidates/${ids.targetId}/shortlist-override`,
      {
        token: tokens.ownerA,
        body: { overrideRank: 1, overrideFit: 'strong', reason: 'Strong OSS Node portfolio verified in call' },
      }
    );
    assert.equal(overrideRes.status, 200, JSON.stringify(overrideRes.data));

    // Reject invalid hiring outcome cleanly with 422
    const invalidOutcome = await requestJson(
      baseUrl,
      'POST',
      `/api/company/vacancies/${ids.vacancyId}/candidates/${ids.targetId}/hiring-outcome`,
      { token: tokens.ownerA, body: { decision: 'maybe_later' } }
    );
    assert.equal(invalidOutcome.status, 422);

    // Record valid hiring outcome
    const outcomeRes = await requestJson(
      baseUrl,
      'POST',
      `/api/company/vacancies/${ids.vacancyId}/candidates/${ids.targetId}/hiring-outcome`,
      { token: tokens.ownerA, body: { decision: 'offered', reasonCode: 'TECH_FIT', notes: 'Strong backend fundamentals' } }
    );
    assert.equal(outcomeRes.status, 201, JSON.stringify(outcomeRes.data));
    assert.equal(outcomeRes.data.outcome.decision, 'offered');

    // Re-read shortlist and verify override + hiringOutcome appear
    const shortlistAfter = await requestJson(baseUrl, 'GET', `/api/company/vacancies/${ids.vacancyId}/shortlist`, {
      token: tokens.ownerA,
    });
    assert.equal(shortlistAfter.status, 200);
    assert.equal(shortlistAfter.data.candidates[0].overallFit, 'strong');
    assert.equal(shortlistAfter.data.candidates[0].override.overrideRank, 1);
    assert.equal(shortlistAfter.data.candidates[0].hiringOutcome.decision, 'offered');

    // Verify audit logs exist for checklist, override, and outcome
    const logs = await pool.query(
      `SELECT action FROM audit_logs WHERE company_id = $1 ORDER BY created_at ASC`,
      [ids.companyAId]
    );
    const actions = logs.rows.map((r) => r.action);
    assert.ok(actions.includes('COMPANY_APPROVED'));
    assert.ok(actions.includes('VACANCY_CHECKLIST_GENERATED'));
    assert.ok(actions.includes('VACANCY_CHECKLIST_APPROVED'));
    assert.ok(actions.includes('VACANCY_CHECKLIST_LOCKED'));
    assert.ok(actions.includes('TARGET_CREATED'));
    assert.ok(actions.includes('SHORTLIST_RANK_OVERRIDDEN'));
    assert.ok(actions.includes('RECRUITER_HIRING_OUTCOME'));
  });
});
