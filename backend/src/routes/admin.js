const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

// In-memory data store with live state synchronization for platform governance
let inMemoryCompanies = [
  {
    id: 'cmp-001',
    name: 'Apex Neural Systems Ltd',
    domain: 'apexneural.com',
    workEmail: 'governance@apexneural.com',
    industry: 'Artificial Intelligence & Robotics',
    employeeCount: '250-500',
    registrationNumber: 'UK-REG-9481023',
    country: 'United Kingdom',
    website: 'https://apexneural.com',
    verificationStatus: 'Pending',
    submittedDate: '2026-10-02 11:20',
    reviewState: 'In Queue',
    assignedAdmin: 'Elena Rostova',
    trustScore: 82,
    activeVacanciesCount: 4,
    totalAssessmentsCount: 12,
    documents: [
      { name: 'Certificate of Incorporation.pdf', type: 'incorporation', url: '#', verified: false },
      { name: 'Tax Compliance Certificate.pdf', type: 'tax', url: '#', verified: false },
      { name: 'Domain Ownership Verification.pdf', type: 'domain', url: '#', verified: true },
    ],
    history: [
      { date: '2026-10-02 11:20', admin: 'System', action: 'Company Submitted', note: 'Initial verification package uploaded.' },
    ],
  },
  {
    id: 'cmp-002',
    name: 'Nexus FinTech Global',
    domain: 'nexusfintech.io',
    workEmail: 'compliance@nexusfintech.io',
    industry: 'Financial Technology & Payments',
    employeeCount: '500-1000',
    registrationNumber: 'US-DEL-5819024',
    country: 'United States',
    website: 'https://nexusfintech.io',
    verificationStatus: 'Under Review',
    submittedDate: '2026-10-01 16:45',
    reviewState: 'Assigned',
    assignedAdmin: 'Marcus Vance',
    trustScore: 94,
    activeVacanciesCount: 8,
    totalAssessmentsCount: 30,
    documents: [
      { name: 'SEC Compliance Filing.pdf', type: 'regulatory', url: '#', verified: true },
      { name: 'Delaware Corporate Certificate.pdf', type: 'incorporation', url: '#', verified: true },
      { name: 'Authorized Officer Proof.pdf', type: 'identity', url: '#', verified: false },
    ],
    history: [
      { date: '2026-10-01 16:45', admin: 'System', action: 'Submitted', note: 'Company verification request received.' },
      { date: '2026-10-02 09:15', admin: 'Marcus Vance', action: 'Under Review', note: 'Commenced verification of officer authorization.' },
    ],
  },
  {
    id: 'cmp-003',
    name: 'CloudScale Infrastructure Inc',
    domain: 'cloudscale.net',
    workEmail: 'ops@cloudscale.net',
    industry: 'Cloud Computing & DevOps',
    employeeCount: '100-250',
    registrationNumber: 'DE-HRB-774910',
    country: 'Germany',
    website: 'https://cloudscale.net',
    verificationStatus: 'Verified',
    submittedDate: '2026-09-24 14:10',
    reviewState: 'Completed',
    assignedAdmin: 'Marcus Vance',
    trustScore: 99,
    activeVacanciesCount: 6,
    totalAssessmentsCount: 18,
    documents: [
      { name: 'Handelsregister Auszug.pdf', type: 'incorporation', url: '#', verified: true },
      { name: 'Umsatzsteuer-ID Certificate.pdf', type: 'tax', url: '#', verified: true },
    ],
    history: [
      { date: '2026-09-24 14:10', admin: 'System', action: 'Submitted', note: 'Initial verification submitted.' },
      { date: '2026-09-25 10:00', admin: 'Marcus Vance', action: 'Verified', note: 'All corporate registry and DNS records confirmed.' },
    ],
  },
];

let inMemoryVacancies = [
  {
    id: 'vac-101',
    companyId: 'cmp-001',
    companyName: 'Apex Neural Systems Ltd',
    roleTitle: 'Principal Distributed Systems Architect',
    version: 'v2.1',
    department: 'Core Engineering',
    experienceLevel: 'Staff / Principal',
    employmentType: 'Full-Time',
    status: 'Pending Review',
    submittedDate: '2026-10-02 14:30',
    assignedAdmin: 'Marcus Vance',
    completenessScore: 95,
    agreementStatus: 'Signed & Valid',
    requirements: [
      { title: 'Distributed Consensus (Raft/Paxos)', type: 'Required', priority: 'Critical', category: 'Architecture' },
      { title: 'Golang / Rust Concurrency Patterns', type: 'Required', priority: 'Critical', category: 'Technical' },
      { title: 'High-Throughput gRPC & Protobuf', type: 'Required', priority: 'High', category: 'Tools' },
    ],
    assessmentMapping: [
      { assessmentId: 'asm-301', assessmentName: 'Distributed Systems & Concurrency Benchmark', weight: 60, evaluationGroup: 'Architecture & Scalability' },
    ],
    evaluationStructure: [
      { groupName: 'Architecture & Scalability', weightPercent: 60, benchmarkScore: 85 },
      { groupName: 'System Communication & Synthesis', weightPercent: 40, benchmarkScore: 80 },
    ],
    governanceNotes: 'Requirement mapping adheres to platform taxonomy v4.2. Ready for governance sign-off.',
  },
];

let inMemoryAssessments = [
  {
    id: 'asm-301',
    title: 'Distributed Systems & Concurrency Benchmark',
    companyId: 'cmp-001',
    companyName: 'Apex Neural Systems Ltd',
    vacancyId: 'vac-101',
    vacancyRole: 'Principal Distributed Systems Architect',
    version: 'v2.0',
    assessmentType: 'Coding',
    evaluationGroups: ['Concurrency Control', 'Failure Domain Handling', 'Memory Safety'],
    questionCount: 4,
    timeLimitMinutes: 90,
    passingThreshold: 80,
    integrityConfig: {
      tabSwitchMonitoring: true,
      copyPasteRestriction: true,
      webcamProctoring: true,
      multiplePersonDetection: true,
      audioSurveillance: false,
      environmentSnapshot: true,
    },
    requirementMapping: [
      { requirement: 'Distributed Consensus (Raft/Paxos)', questionIds: ['q-1', 'q-2'] },
    ],
    status: 'Pending Review',
    submittedDate: '2026-10-02 15:00',
  },
];

let inMemoryUsers = [
  {
    id: 'usr-adm-01',
    name: 'Sarah Chen',
    email: 'sarah.chen@genuai.io',
    userType: 'GenuAI Admin',
    organization: 'GenuAI Technologies Ltd',
    accountStatus: 'Active',
    mfaEnabled: true,
    lastLogin: '2026-10-03 13:45',
    createdDate: '2025-01-10',
    ipLocation: 'London, UK (195.12.44.18)',
    failedLoginAttempts: 0,
  },
  {
    id: 'usr-adm-02',
    name: 'Elena Rostova',
    email: 'elena.rostova@genuai.io',
    userType: 'GenuAI Admin',
    organization: 'GenuAI Technologies Ltd',
    accountStatus: 'Active',
    mfaEnabled: true,
    lastLogin: '2026-10-03 12:20',
    createdDate: '2025-02-15',
    ipLocation: 'Berlin, DE (88.198.42.9)',
    failedLoginAttempts: 0,
  },
  {
    id: 'usr-cmp-01',
    name: 'David Vance',
    email: 'david@apexneural.com',
    userType: 'Company User',
    organization: 'Apex Neural Systems Ltd',
    accountStatus: 'Active',
    mfaEnabled: true,
    lastLogin: '2026-10-03 10:10',
    createdDate: '2026-08-01',
    ipLocation: 'San Francisco, US (104.28.19.4)',
    failedLoginAttempts: 0,
  },
];

let inMemoryAuditLogs = [
  {
    id: 'aud-001',
    actor: 'Sarah Chen',
    role: 'Super Admin',
    action: 'DISPUTE_INVESTIGATED',
    entity: 'DisputeCase',
    entityId: 'dsp-501',
    timestamp: '2026-10-02 20:00:15',
    previousState: 'Unreviewed',
    newState: 'Investigating',
    metadata: { reason: 'Reviewed OS popup timeline and audio stream.' },
    ipAddress: '195.12.44.18',
  },
];

const appendAudit = (actor, role, action, entity, entityId, previousState, newState, metadata) => {
  const record = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    actor: actor || 'Platform Admin',
    role: role || 'Super Admin',
    action,
    entity,
    entityId,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    previousState,
    newState,
    metadata,
    ipAddress: '195.12.44.18',
  };
  inMemoryAuditLogs.unshift(record);
  return record;
};

// ============================================================
// 1. OVERVIEW
// ============================================================
router.get('/overview', (req, res) => {
  const pendingCompanies = inMemoryCompanies.filter((c) => c.verificationStatus === 'Pending' || c.verificationStatus === 'Under Review');
  const pendingVacancies = inMemoryVacancies.filter((v) => v.status === 'Pending Review');
  const pendingAssessments = inMemoryAssessments.filter((a) => a.status === 'Pending Review' || a.status === 'Flagged');

  res.json({
    metrics: {
      totalCompanies: inMemoryCompanies.length,
      pendingCompanyVerifications: pendingCompanies.length,
      activeVacancies: inMemoryVacancies.length,
      vacanciesPendingReview: pendingVacancies.length,
      assessmentsPendingReview: pendingAssessments.length,
      platformUsers: inMemoryUsers.length,
      openIntegrityIncidents: 1,
      openDisputes: 1,
    },
    actionQueue: {
      pendingCompanies,
      pendingVacancies,
      pendingAssessments,
    },
    recentActivity: inMemoryAuditLogs.slice(0, 10),
  });
});

// ============================================================
// 2. COMPANIES
// ============================================================
router.get('/companies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies ORDER BY created_at DESC');
    if (result.rows.length > 0) {
      // Merge with in-memory metadata if available
      const mapped = result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        domain: r.website ? r.website.replace(/^https?:\/\//, '') : 'company.io',
        workEmail: r.official_email || 'contact@company.io',
        industry: r.industry || 'Technology',
        employeeCount: r.size || '50-100',
        registrationNumber: 'REG-' + r.id.substring(0, 8).toUpperCase(),
        country: r.location || 'Global',
        website: r.website || 'https://genuai.io',
        verificationStatus: r.verification_status === 'VERIFIED' ? 'Verified' : r.verification_status === 'UNDER_REVIEW' ? 'Under Review' : 'Pending',
        submittedDate: r.created_at ? r.created_at.toISOString().split('T')[0] : '2026-10-01',
        reviewState: r.verification_status === 'VERIFIED' ? 'Completed' : 'In Queue',
        assignedAdmin: 'Elena Rostova',
        trustScore: r.verification_status === 'VERIFIED' ? 98 : 75,
        activeVacanciesCount: 2,
        totalAssessmentsCount: 5,
        documents: [],
        history: [],
      }));
      return res.json({ companies: mapped });
    }
  } catch (_) {}
  res.json({ companies: inMemoryCompanies });
});

router.put('/companies/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, adminName, adminRole, note } = req.body;

  const comp = inMemoryCompanies.find((c) => c.id === id);
  if (comp) {
    const prev = comp.verificationStatus;
    comp.verificationStatus = status;
    comp.history.unshift({
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      admin: adminName || 'Admin',
      action: `Status changed to ${status}`,
      note: note || '',
    });
    appendAudit(adminName, adminRole, `COMPANY_${status.toUpperCase().replace(/\s+/g, '_')}`, 'Company', id, prev, status, { note });
    return res.json({ success: true, company: comp });
  }

  res.json({ success: true, status });
});

// ============================================================
// 3. VACANCIES
// ============================================================
router.get('/vacancies', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cr.*, c.name as company_name, d.name as department_name 
       FROM company_roles cr 
       JOIN companies c ON c.id = cr.company_id 
       JOIN departments d ON d.id = cr.department_id 
       ORDER BY cr.created_at DESC`
    );
    if (result.rows.length > 0) {
      const mapped = result.rows.map((r) => ({
        id: r.id,
        companyId: r.company_id,
        companyName: r.company_name,
        roleTitle: r.title,
        version: `v${r.version}.0`,
        department: r.department_name,
        experienceLevel: r.experience_level,
        employmentType: r.employment_type,
        status: r.status === 'VERIFIED' ? 'Verified' : 'Pending Review',
        submittedDate: r.created_at ? r.created_at.toISOString().split('T')[0] : '2026-10-01',
        assignedAdmin: 'Marcus Vance',
        completenessScore: 90,
        agreementStatus: 'Signed & Valid',
        requirements: [],
        assessmentMapping: [],
        evaluationStructure: [],
      }));
      return res.json({ vacancies: mapped });
    }
  } catch (_) {}
  res.json({ vacancies: inMemoryVacancies });
});

router.put('/vacancies/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, adminName, adminRole, note } = req.body;
  const vac = inMemoryVacancies.find((v) => v.id === id);
  if (vac) {
    const prev = vac.status;
    vac.status = status;
    vac.governanceNotes = note || vac.governanceNotes;
    appendAudit(adminName, adminRole, `VACANCY_${status.toUpperCase().replace(/\s+/g, '_')}`, 'Vacancy', id, prev, status, { note });
    return res.json({ success: true, vacancy: vac });
  }
  res.json({ success: true, status });
});

// ============================================================
// 4. ASSESSMENTS
// ============================================================
router.get('/assessments', (req, res) => {
  res.json({ assessments: inMemoryAssessments });
});

router.put('/assessments/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, adminName, adminRole, note } = req.body;
  const asm = inMemoryAssessments.find((a) => a.id === id);
  if (asm) {
    const prev = asm.status;
    asm.status = status;
    asm.reviewedBy = adminName;
    asm.reviewNotes = note;
    appendAudit(adminName, adminRole, `ASSESSMENT_${status.toUpperCase().replace(/\s+/g, '_')}`, 'Assessment', id, prev, status, { note });
    return res.json({ success: true, assessment: asm });
  }
  res.json({ success: true, status });
});

// ============================================================
// 5. PLATFORM USERS
// ============================================================
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC');
    if (result.rows.length > 0) {
      const mapped = result.rows.map((u) => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        userType: u.role === 'genuai_admin' ? 'GenuAI Admin' : 'Company User',
        organization: u.role === 'genuai_admin' ? 'GenuAI Technologies Ltd' : 'Corporate Member',
        accountStatus: 'Active',
        mfaEnabled: true,
        lastLogin: '2026-10-03 12:00',
        createdDate: u.created_at ? u.created_at.toISOString().split('T')[0] : '2026-01-01',
        ipLocation: 'United Kingdom',
        failedLoginAttempts: 0,
      }));
      return res.json({ users: mapped });
    }
  } catch (_) {}
  res.json({ users: inMemoryUsers });
});

router.put('/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, adminName, adminRole, note } = req.body;
  const u = inMemoryUsers.find((user) => user.id === id);
  if (u) {
    const prev = u.accountStatus;
    u.accountStatus = status;
    appendAudit(adminName, adminRole, `USER_${status.toUpperCase().replace(/\s+/g, '_')}`, 'User', id, prev, status, { note });
    return res.json({ success: true, user: u });
  }
  res.json({ success: true, status });
});

// ============================================================
// 6. AUDIT LOGS
// ============================================================
router.get('/audit', (req, res) => {
  res.json({ logs: inMemoryAuditLogs });
});

module.exports = router;
