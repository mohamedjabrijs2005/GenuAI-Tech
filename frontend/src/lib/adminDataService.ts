// GenuAI Technologies - Platform Governance & Trust Center
// Enterprise Admin Data Service & Mock Store with Audit Recording & Realtime Event Dispatcher
import api from './api';

export type AdminRole = 
  | 'Super Admin' 
  | 'Verification Admin' 
  | 'Trust & Safety Admin' 
  | 'Support Admin' 
  | 'Read-only Admin';

export type VerificationStatus = 'Pending' | 'Under Review' | 'Needs Correction' | 'Verified' | 'Rejected' | 'Suspended';
export type VacancyGovStatus = 'Pending Review' | 'Verified' | 'Needs Correction' | 'Rejected' | 'Suspended';
export type AssessmentGovStatus = 'Pending Review' | 'Approved' | 'Needs Correction' | 'Flagged' | 'Suspended';
export type UserStatus = 'Active' | 'Suspended' | 'Pending MFA' | 'Deactivated';
export type UserRole = 'Candidate' | 'Company User' | 'Interviewer' | 'Hiring Manager' | 'GenuAI Admin' | 'Support / Operations';
export type ModerationCategory = 'Company Content' | 'Vacancy Content' | 'Assessment Content' | 'User Reports' | 'Abuse Reports' | 'Fraud Reports' | 'Policy Violations';
export type ModerationStatus = 'Open' | 'Investigating' | 'Action Required' | 'Resolved' | 'Dismissed';
export type DisputeStatus = 'Open' | 'Investigating' | 'Action Required' | 'Resolved' | 'Escalated' | 'Dismissed';
export type IntegritySignalType = 'Tab Switch' | 'Copy/Paste Attempt' | 'Camera Unavailable' | 'Multiple-Person Signal' | 'Environment Change' | 'Session Interruption';
export type IncidentStatus = 'Open' | 'Under Investigation' | 'Resolved' | 'Dismissed';
export type SecuritySeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type SecurityStatus = 'Active' | 'Mitigated' | 'Investigating' | 'Resolved';
export type SubsystemHealth = 'Operational' | 'Degraded' | 'Incident';

export interface AuditRecord {
  id: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  previousState?: string;
  newState?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export interface AdminCompany {
  id: string;
  name: string;
  domain: string;
  workEmail: string;
  industry: string;
  employeeCount: string;
  registrationNumber: string;
  country: string;
  website: string;
  verificationStatus: VerificationStatus;
  submittedDate: string;
  reviewState: 'In Queue' | 'Assigned' | 'Awaiting Documents' | 'Completed';
  assignedAdmin: string;
  trustScore: number;
  activeVacanciesCount: number;
  totalAssessmentsCount: number;
  documents: { name: string; type: string; url: string; verified: boolean }[];
  history: { date: string; admin: string; action: string; note: string }[];
}

export interface AdminVacancy {
  id: string;
  companyId: string;
  companyName: string;
  roleTitle: string;
  version: string;
  department: string;
  experienceLevel: string;
  employmentType: string;
  status: VacancyGovStatus;
  submittedDate: string;
  assignedAdmin: string;
  completenessScore: number;
  agreementStatus: 'Signed & Valid' | 'Pending Review' | 'Revision Required';
  requirements: {
    title: string;
    type: 'Required' | 'Preferred';
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    category: 'Technical' | 'Soft Skills' | 'Domain' | 'Architecture' | 'Tools';
  }[];
  assessmentMapping: {
    assessmentId: string;
    assessmentName: string;
    weight: number;
    evaluationGroup: string;
  }[];
  evaluationStructure: {
    groupName: string;
    weightPercent: number;
    benchmarkScore: number;
  }[];
  governanceNotes?: string;
}

export interface AdminAssessment {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  vacancyId: string;
  vacancyRole: string;
  version: string;
  assessmentType: 'Technical' | 'Coding' | 'SQL' | 'Problem Solving' | 'Communication' | 'Domain Knowledge' | 'Structured Interview' | 'Project Evaluation';
  evaluationGroups: string[];
  questionCount: number;
  timeLimitMinutes: number;
  passingThreshold: number;
  integrityConfig: {
    tabSwitchMonitoring: boolean;
    copyPasteRestriction: boolean;
    webcamProctoring: boolean;
    multiplePersonDetection: boolean;
    audioSurveillance: boolean;
    environmentSnapshot: boolean;
  };
  requirementMapping: { requirement: string; questionIds: string[] }[];
  status: AssessmentGovStatus;
  submittedDate: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface AdminPlatformUser {
  id: string;
  name: string;
  email: string;
  userType: UserRole;
  organization: string;
  accountStatus: UserStatus;
  mfaEnabled: boolean;
  lastLogin: string;
  createdDate: string;
  ipLocation: string;
  failedLoginAttempts: number;
  governanceNotes?: string;
}

export interface ModerationReport {
  id: string;
  category: ModerationCategory;
  title: string;
  status: ModerationStatus;
  reporter: { name: string; type: string; email: string };
  affectedEntity: { type: string; id: string; name: string };
  evidence: { description: string; timestamp: string; flags: string[] };
  assignedAdmin: string;
  createdDate: string;
  actionHistory: { date: string; admin: string; action: string; note: string }[];
  resolution?: { date: string; admin: string; verdict: string; notes: string };
}

export interface DisputeCase {
  id: string;
  type: 
    | 'Candidate disputes assessment process'
    | 'Candidate disputes integrity signal'
    | 'Company disputes verification'
    | 'Company disputes platform action'
    | 'User disputes account suspension';
  companyName: string;
  candidateName?: string;
  status: DisputeStatus;
  createdDate: string;
  assignedAdmin: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  caseSummary: string;
  claimedIssue: string;
  evidenceRef?: string;
  history: { date: string; admin: string; step: string; note: string }[];
  resolution?: string;
}

export interface IntegrityIncident {
  id: string;
  sessionId: string;
  companyName: string;
  vacancyRole: string;
  candidateMaskedId: string;
  signals: {
    type: IntegritySignalType;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
    context: string;
  }[];
  observableStatus: string;
  status: IncidentStatus;
  detectedAt: string;
  assignedAdmin: string;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface EvidenceOversightRecord {
  id: string;
  companyName: string;
  vacancyRole: string;
  candidateMaskedId: string;
  requirementName: string;
  sourceType: 'Coding Test' | 'Audio/Video Interview' | 'Technical Quiz' | 'Architecture Diagram' | 'SQL Query Exec';
  evidenceVersion: string;
  createdDate: string;
  storageRef: string;
  accessLogs: {
    adminName: string;
    role: string;
    timestamp: string;
    reason: string;
    approvedBySuperAdmin?: boolean;
  }[];
}

export interface RoleTaxonomyItem {
  id: string;
  roleName: string;
  family: string;
  skillCategories: {
    categoryName: string;
    skills: string[];
  }[];
  requirementTypes: string[];
  evaluationCategories: string[];
  standardBenchmarkScore: number;
  lastUpdated: string;
}

export interface AssessmentTaxonomyItem {
  id: string;
  name: string;
  category: 'Technical' | 'Coding' | 'SQL' | 'Problem Solving' | 'Communication' | 'Domain Knowledge' | 'Structured Interview' | 'Project Evaluation';
  description: string;
  standardDurationMin: number;
  defaultEvaluationMetrics: string[];
  supportedQuestionTypes: string[];
  integrityProfile: 'Standard' | 'Strict' | 'High-Trust';
  activeUsageCount: number;
}

export interface SecurityEvent {
  id: string;
  type: 'Failed Login Spikes' | 'Permission Failures' | 'Rate Limit Events' | 'Suspicious Access' | 'Account Lockouts' | 'Unusual API Activity' | 'Security Incidents';
  timestamp: string;
  actor: string;
  ipAddress: string;
  affectedResource: string;
  severity: SecuritySeverity;
  status: SecurityStatus;
  details: string;
  mitigationTaken?: string;
}

export interface AdminNotification {
  id: string;
  type: 'company_verification' | 'vacancy_submitted' | 'assessment_flagged' | 'integrity_incident' | 'security_incident' | 'dispute_opened' | 'system_incident' | 'user_access';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'info' | 'warning' | 'danger' | 'success';
  link: string;
  entityId?: string;
}

export interface SystemHealthMetrics {
  subsystems: {
    name: string;
    status: SubsystemHealth;
    latencyMs: number;
    uptimePercent: number;
    lastIncident?: string;
  }[];
  telemetry: {
    avgResponseTime: number;
    errorRate: number;
    realtimeConnections: number;
    failedJobs: number;
    queueDepth: number;
    databasePoolActive: number;
    storageUsedGB: number;
    storageTotalGB: number;
  };
}

export interface PlatformSettings {
  verification: {
    autoCheckDomainMX: boolean;
    requireBusinessTaxDoc: boolean;
    turnaroundSLAHours: number;
    minCompanyTrustThreshold: number;
  };
  governance: {
    strictIntegrityEnforcement: boolean;
    evidenceAccessRequiresSuperAdminApproval: boolean;
    auditLogRetentionDays: number;
    autoFlagSuspiciousSessions: boolean;
  };
  security: {
    enforceAdminMFA: boolean;
    sessionTimeoutMinutes: number;
    maxFailedAttemptsBeforeLockout: number;
    rateLimitPerMinute: number;
  };
  maintenance: {
    isMaintenanceMode: boolean;
    maintenanceMessage: string;
  };
}

// ==================== INITIAL DATA SEED ====================

// No pre-seeded company data -------- admin dashboard loads real companies from the backend.
const INITIAL_COMPANIES: AdminCompany[] = [];

// All data collections start empty -------- real data is loaded from the backend API.
// Company-specific data (vacancies, assessments, users) belongs in the company dashboard only.
const INITIAL_VACANCIES: AdminVacancy[] = [];
const INITIAL_ASSESSMENTS: AdminAssessment[] = [];
const INITIAL_USERS: AdminPlatformUser[] = [];
const INITIAL_MODERATION: ModerationReport[] = [];
const INITIAL_DISPUTES: DisputeCase[] = [];
const INITIAL_INTEGRITY: IntegrityIncident[] = [];
const INITIAL_EVIDENCE: EvidenceOversightRecord[] = [];
const INITIAL_SECURITY_EVENTS: SecurityEvent[] = [];
const INITIAL_AUDIT_LOGS: AuditRecord[] = [];
const INITIAL_NOTIFICATIONS: AdminNotification[] = [];

const INITIAL_ROLE_TAXONOMY: RoleTaxonomyItem[] = [
  {
    id: 'tax-role-01',
    roleName: 'Distributed Systems Engineer',
    family: 'Software Engineering',
    skillCategories: [
      { categoryName: 'Core Architecture', skills: ['Raft/Paxos Consensus', 'Vector Clocks', 'Gossip Protocols', 'Eventual Consistency'] },
      { categoryName: 'Concurrency & Languages', skills: ['Go Concurrency (Channels/Goroutines)', 'Rust Async (Tokio)', 'C++ Memory Model', 'Thread Safety'] },
      { categoryName: 'Data & Networking', skills: ['gRPC / Protocol Buffers', 'ZeroMQ / Kafka', 'Linux TCP/IP Tuning', 'Distributed Tracing'] },
    ],
    requirementTypes: ['Architectural Design', 'Concurrency Implementation', 'Failure Recovery', 'Benchmarking'],
    evaluationCategories: ['Algorithmic Efficiency', 'Fault Tolerance', 'System Telemetry', 'Code Correctness'],
    standardBenchmarkScore: 82,
    lastUpdated: '2026-09-15',
  },
  {
    id: 'tax-role-02',
    roleName: 'Cybersecurity & Application Security Lead',
    family: 'Security & Trust',
    skillCategories: [
      { categoryName: 'Application Defense', skills: ['OWASP Top 10', 'Threat Modeling (STRIDE)', 'SAST / DAST Integration', 'Zero-Trust Architecture'] },
      { categoryName: 'Cryptography', skills: ['PKI & Certificate Management', 'HSM Integration', 'AES-GCM / ChaCha20', 'Key Rotation Schemes'] },
      { categoryName: 'Compliance & Governance', skills: ['PCI-DSS v4.0', 'SOC2 Type II', 'ISO 27001', 'GDPR Data Isolation'] },
    ],
    requirementTypes: ['Vulnerability Remediation', 'Threat Matrix Analysis', 'Cryptographic Proof', 'Audit Trail Architecture'],
    evaluationCategories: ['Exploit Resilience', 'Cryptographic Soundness', 'Compliance Accuracy', 'Incident Response'],
    standardBenchmarkScore: 88,
    lastUpdated: '2026-09-20',
  },
  {
    id: 'tax-role-03',
    roleName: 'Machine Learning & AI Research Engineer',
    family: 'Artificial Intelligence',
    skillCategories: [
      { categoryName: 'Model Architecture', skills: ['Transformer Attention Mechanisms', 'Diffusion Models', 'Quantization (GPTQ/AWQ)', 'LoRA/QLoRA Fine-Tuning'] },
      { categoryName: 'MLOps & Inference', skills: ['vLLM / TensorRT-LLM', 'Ray Distributed Training', 'Triton Inference Server', 'CUDA Kernels'] },
      { categoryName: 'Evaluation & Benchmarking', skills: ['Perplexity & BLEU/ROUGE', 'Hallucination Detection', 'Adversarial Jailbreak Defense', 'RLHF / DPO'] },
    ],
    requirementTypes: ['Model Mathematical Derivation', 'Inference Optimization', 'Safety & Alignment', 'Pipeline Architecture'],
    evaluationCategories: ['Mathematical Rigor', 'Latency & Memory Optimization', 'Safety Evaluation', 'Empirical Proof'],
    standardBenchmarkScore: 85,
    lastUpdated: '2026-09-28',
  },
];

const INITIAL_ASSESSMENT_TAXONOMY: AssessmentTaxonomyItem[] = [
  {
    id: 'tax-asm-01',
    name: 'Algorithmic Coding & Concurrency Sandbox',
    category: 'Coding',
    description: 'Isolated ephemeral sandbox executing live unit tests, time complexity profilers, and memory leak analyzers.',
    standardDurationMin: 90,
    defaultEvaluationMetrics: ['Time Complexity O(N)', 'Memory Allocation Peak', 'Edge Case Coverage', 'Idempotency'],
    supportedQuestionTypes: ['Interactive Code Editor', 'Multi-file Repo Debugging', 'Unit Test Suite Expansion'],
    integrityProfile: 'Strict',
    activeUsageCount: 42,
  },
  {
    id: 'tax-asm-02',
    name: 'Relational & Distributed SQL Engine Benchmark',
    category: 'SQL',
    description: 'PostgreSQL and CockroachDB performance test evaluating EXPLAIN ANALYZE, indexing strategies, and deadlock mitigation.',
    standardDurationMin: 60,
    defaultEvaluationMetrics: ['Execution Buffer Hits', 'Sequential Scan Elimination', 'Lock Contention Index', 'Query Plan Cost'],
    supportedQuestionTypes: ['Live Schema Optimization', 'Complex Aggregation Query', 'Migration Script Design'],
    integrityProfile: 'Standard',
    activeUsageCount: 28,
  },
  {
    id: 'tax-asm-03',
    name: 'Structured Competency & Technical Interview Protocol',
    category: 'Structured Interview',
    description: 'Evidence-backed structured rubric scoring for live technical oral examinations and architecture reviews.',
    standardDurationMin: 45,
    defaultEvaluationMetrics: ['Architectural Clarity', 'Trade-off Articulation', 'Scalability Reasoning', 'Failure Mode Analysis'],
    supportedQuestionTypes: ['Live Audio/Video Structured Rubric', 'Interactive System Architecture Canvas'],
    integrityProfile: 'High-Trust',
    activeUsageCount: 35,
  },
];


const INITIAL_HEALTH: SystemHealthMetrics = {
  subsystems: [
    { name: 'Core API Gateway', status: 'Operational', latencyMs: 38, uptimePercent: 99.98 },
    { name: 'Primary Database Cluster', status: 'Operational', latencyMs: 12, uptimePercent: 99.99 },
    { name: 'Authentication & IAM Service', status: 'Operational', latencyMs: 24, uptimePercent: 99.97 },
    { name: 'Realtime WebSocket Cluster', status: 'Operational', latencyMs: 15, uptimePercent: 99.95 },
    { name: 'Evidence Vault Storage (S3-Encrypted)', status: 'Operational', latencyMs: 65, uptimePercent: 100 },
    { name: 'Assessment Sandbox Execution Engine', status: 'Operational', latencyMs: 142, uptimePercent: 99.91 },
    { name: 'Notification & Email Dispatcher', status: 'Operational', latencyMs: 45, uptimePercent: 99.96 },
  ],
  telemetry: {
    avgResponseTime: 42,
    errorRate: 0.04,
    realtimeConnections: 1842,
    failedJobs: 0,
    queueDepth: 4,
    databasePoolActive: 28,
    storageUsedGB: 412.8,
    storageTotalGB: 2048.0,
  },
};

const INITIAL_SETTINGS: PlatformSettings = {
  verification: {
    autoCheckDomainMX: true,
    requireBusinessTaxDoc: true,
    turnaroundSLAHours: 24,
    minCompanyTrustThreshold: 75,
  },
  governance: {
    strictIntegrityEnforcement: true,
    evidenceAccessRequiresSuperAdminApproval: false,
    auditLogRetentionDays: 365,
    autoFlagSuspiciousSessions: true,
  },
  security: {
    enforceAdminMFA: true,
    sessionTimeoutMinutes: 30,
    maxFailedAttemptsBeforeLockout: 5,
    rateLimitPerMinute: 600,
  },
  maintenance: {
    isMaintenanceMode: false,
    maintenanceMessage: 'GenuAI Technologies Platform undergoing scheduled maintenance. All active sessions remain secure.',
  },
};

// ==================== STORE IMPLEMENTATION WITH LOCALSTORAGE PERSISTENCE ====================

class AdminDataStore {
  private companies: AdminCompany[] = [];
  private vacancies: AdminVacancy[] = [];
  private assessments: AdminAssessment[] = [];
  private users: AdminPlatformUser[] = [];
  private moderation: ModerationReport[] = [];
  private disputes: DisputeCase[] = [];
  private integrity: IntegrityIncident[] = [];
  private evidence: EvidenceOversightRecord[] = [];
  private roleTaxonomy: RoleTaxonomyItem[] = [];
  private assessmentTaxonomy: AssessmentTaxonomyItem[] = [];
  private securityEvents: SecurityEvent[] = [];
  private auditLogs: AuditRecord[] = [];
  private notifications: AdminNotification[] = [];
  private health: SystemHealthMetrics = INITIAL_HEALTH;
  private settings: PlatformSettings = INITIAL_SETTINGS;
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
    if (typeof window !== 'undefined') {
      this.syncWithBackend().catch(() => {});
    }
  }

  public async syncWithBackend(): Promise<void> {
    try {
      const [compRes, vacRes, userRes, auditRes] = await Promise.allSettled([
        api.get('/admin/companies'),
        api.get('/admin/vacancies'),
        api.get('/admin/users'),
        api.get('/admin/audit'),
      ]);

      if (compRes.status === 'fulfilled' && compRes.value.data?.companies?.length) {
        this.companies = compRes.value.data.companies;
      }
      if (vacRes.status === 'fulfilled' && vacRes.value.data?.vacancies?.length) {
        this.vacancies = vacRes.value.data.vacancies;
      }
      if (userRes.status === 'fulfilled' && userRes.value.data?.users?.length) {
        this.users = userRes.value.data.users;
      }
      if (auditRes.status === 'fulfilled' && auditRes.value.data?.logs?.length) {
        this.auditLogs = auditRes.value.data.logs;
      }
      this.notify();
    } catch {
      // Graceful fallback to cached/initial data
    }
  }

  private init() {
    if (typeof window === 'undefined') {
      this.companies = INITIAL_COMPANIES;
      this.vacancies = INITIAL_VACANCIES;
      this.assessments = INITIAL_ASSESSMENTS;
      this.users = INITIAL_USERS;
      this.moderation = INITIAL_MODERATION;
      this.disputes = INITIAL_DISPUTES;
      this.integrity = INITIAL_INTEGRITY;
      this.evidence = INITIAL_EVIDENCE;
      this.roleTaxonomy = INITIAL_ROLE_TAXONOMY;
      this.assessmentTaxonomy = INITIAL_ASSESSMENT_TAXONOMY;
      this.securityEvents = INITIAL_SECURITY_EVENTS;
      this.auditLogs = INITIAL_AUDIT_LOGS;
      this.notifications = INITIAL_NOTIFICATIONS;
      return;
    }

    // Flush any previously cached fake/seeded data from localStorage.
    // If the data version doesn't match, clear all admin store keys.
    const DATA_VERSION = 'v2';
    const storedVersion = localStorage.getItem('genuai_admin_data_version');
    if (storedVersion !== DATA_VERSION) {
      const keysToFlush = [
        'companies', 'vacancies', 'assessments', 'users', 'moderation',
        'disputes', 'integrity', 'evidence', 'security_events', 'audit_logs', 'notifications',
      ];
      keysToFlush.forEach((k) => localStorage.removeItem(`genuai_admin_${k}`));
      localStorage.setItem('genuai_admin_data_version', DATA_VERSION);
    }

    try {
      const getOrSet = <T>(key: string, initial: T): T => {
        const stored = localStorage.getItem(`genuai_admin_${key}`);
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch {
            return initial;
          }
        }
        localStorage.setItem(`genuai_admin_${key}`, JSON.stringify(initial));
        return initial;
      };

      this.companies = getOrSet('companies', INITIAL_COMPANIES);
      this.vacancies = getOrSet('vacancies', INITIAL_VACANCIES);
      this.assessments = getOrSet('assessments', INITIAL_ASSESSMENTS);
      this.users = getOrSet('users', INITIAL_USERS);
      this.moderation = getOrSet('moderation', INITIAL_MODERATION);
      this.disputes = getOrSet('disputes', INITIAL_DISPUTES);
      this.integrity = getOrSet('integrity', INITIAL_INTEGRITY);
      this.evidence = getOrSet('evidence', INITIAL_EVIDENCE);
      this.roleTaxonomy = getOrSet('role_taxonomy', INITIAL_ROLE_TAXONOMY);
      this.assessmentTaxonomy = getOrSet('assessment_taxonomy', INITIAL_ASSESSMENT_TAXONOMY);
      this.securityEvents = getOrSet('security_events', INITIAL_SECURITY_EVENTS);
      this.auditLogs = getOrSet('audit_logs', INITIAL_AUDIT_LOGS);
      this.notifications = getOrSet('notifications', INITIAL_NOTIFICATIONS);
      this.settings = getOrSet('settings', INITIAL_SETTINGS);
      this.health = INITIAL_HEALTH;
    } catch {
      this.companies = INITIAL_COMPANIES;
      this.vacancies = INITIAL_VACANCIES;
      this.assessments = INITIAL_ASSESSMENTS;
      this.users = INITIAL_USERS;
      this.moderation = INITIAL_MODERATION;
      this.disputes = INITIAL_DISPUTES;
      this.integrity = INITIAL_INTEGRITY;
      this.evidence = INITIAL_EVIDENCE;
      this.roleTaxonomy = INITIAL_ROLE_TAXONOMY;
      this.assessmentTaxonomy = INITIAL_ASSESSMENT_TAXONOMY;
      this.securityEvents = INITIAL_SECURITY_EVENTS;
      this.auditLogs = INITIAL_AUDIT_LOGS;
      this.notifications = INITIAL_NOTIFICATIONS;
      this.settings = INITIAL_SETTINGS;
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private persist(key: string, data: any) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`genuai_admin_${key}`, JSON.stringify(data));
      } catch (e) {
        console.error('LocalStorage write error', e);
      }
    }
    this.notify();
  }

  // ==================== AUDIT RECORDING ====================
  public logAudit(record: Omit<AuditRecord, 'id' | 'timestamp'>) {
    const newRecord: AuditRecord = {
      ...record,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ipAddress: record.ipAddress,
    };
    this.auditLogs = [newRecord, ...this.auditLogs];
    this.persist('audit_logs', this.auditLogs);
    return newRecord;
  }

  // ==================== COMPANIES ====================
  public getCompanies(): AdminCompany[] {
    return [...this.companies];
  }

  public getCompanyById(id: string): AdminCompany | undefined {
    return this.companies.find((c) => c.id === id);
  }

  public updateCompanyStatus(
    companyId: string,
    newStatus: VerificationStatus,
    adminName: string,
    adminRole: string,
    note: string
  ) {
    const company = this.companies.find((c) => c.id === companyId);
    if (!company) return null;

    const prevStatus = company.verificationStatus;
    company.verificationStatus = newStatus;
    if (newStatus === 'Verified') {
      company.reviewState = 'Completed';
      company.trustScore = Math.max(company.trustScore, 95);
    } else if (newStatus === 'Rejected' || newStatus === 'Suspended') {
      company.reviewState = 'Completed';
    } else if (newStatus === 'Needs Correction') {
      company.reviewState = 'Awaiting Documents';
    } else if (newStatus === 'Under Review') {
      company.reviewState = 'Assigned';
    }

    company.history.unshift({
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      admin: adminName,
      action: `Status changed to ${newStatus}`,
      note: note || `Verification status updated to ${newStatus}`,
    });

    this.persist('companies', this.companies);
    api.put(`/admin/companies/${companyId}/status`, { status: newStatus, adminName, adminRole, note }).catch(() => {});

    this.logAudit({
      actor: adminName,
      role: adminRole,
      action: `COMPANY_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
      entity: 'Company',
      entityId: company.id,
      previousState: prevStatus,
      newState: newStatus,
      metadata: { companyName: company.name, domain: company.domain, note },
    });

    // Create Notification
    this.addNotification({
      type: 'company_verification',
      title: `Company ${company.name} -------- ${newStatus}`,
      message: `${adminName} set verification status to ${newStatus}. Note: ${note || 'None'}`,
      severity: newStatus === 'Verified' ? 'success' : newStatus === 'Needs Correction' ? 'warning' : 'danger',
      link: '/admin/verification/companies',
      entityId: company.id,
    });

    return company;
  }

  // ==================== VACANCIES ====================
  public getVacancies(): AdminVacancy[] {
    return [...this.vacancies];
  }

  public getVacancyById(id: string): AdminVacancy | undefined {
    return this.vacancies.find((v) => v.id === id);
  }

  public updateVacancyStatus(
    vacancyId: string,
    newStatus: VacancyGovStatus,
    adminName: string,
    adminRole: string,
    note: string
  ) {
    const vac = this.vacancies.find((v) => v.id === vacancyId);
    if (!vac) return null;

    const prevStatus = vac.status;
    vac.status = newStatus;
    vac.governanceNotes = note || vac.governanceNotes;

    this.persist('vacancies', this.vacancies);
    api.put(`/admin/vacancies/${vacancyId}/status`, { status: newStatus, adminName, adminRole, note }).catch(() => {});

    this.logAudit({
      actor: adminName,
      role: adminRole,
      action: `VACANCY_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
      entity: 'Vacancy',
      entityId: vac.id,
      previousState: prevStatus,
      newState: newStatus,
      metadata: { roleTitle: vac.roleTitle, companyName: vac.companyName, note },
    });

    this.addNotification({
      type: 'vacancy_submitted',
      title: `Vacancy ${vac.roleTitle} -------- ${newStatus}`,
      message: `${adminName} marked governance review as ${newStatus}.`,
      severity: newStatus === 'Verified' ? 'success' : 'warning',
      link: '/admin/verification/vacancies',
      entityId: vac.id,
    });

    return vac;
  }

  // ==================== ASSESSMENTS ====================
  public getAssessments(): AdminAssessment[] {
    return [...this.assessments];
  }

  public updateAssessmentStatus(
    assessmentId: string,
    newStatus: AssessmentGovStatus,
    adminName: string,
    adminRole: string,
    note: string
  ) {
    const asm = this.assessments.find((a) => a.id === assessmentId);
    if (!asm) return null;

    const prevStatus = asm.status;
    asm.status = newStatus;
    asm.reviewedBy = adminName;
    asm.reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    asm.reviewNotes = note;

    this.persist('assessments', this.assessments);
    api.put(`/admin/assessments/${assessmentId}/status`, { status: newStatus, adminName, adminRole, note }).catch(() => {});

    this.logAudit({
      actor: adminName,
      role: adminRole,
      action: `ASSESSMENT_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
      entity: 'Assessment',
      entityId: asm.id,
      previousState: prevStatus,
      newState: newStatus,
      metadata: { assessmentTitle: asm.title, companyName: asm.companyName, note },
    });

    return asm;
  }

  // ==================== PLATFORM USERS ====================
  public getUsers(): AdminPlatformUser[] {
    return [...this.users];
  }

  public updateUserStatus(
    userId: string,
    newStatus: UserStatus,
    adminName: string,
    adminRole: string,
    note: string
  ) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;

    const prevStatus = user.accountStatus;
    user.accountStatus = newStatus;
    user.governanceNotes = note || user.governanceNotes;

    this.persist('users', this.users);
    api.put(`/admin/users/${userId}/status`, { status: newStatus, adminName, adminRole, note }).catch(() => {});

    this.logAudit({
      actor: adminName,
      role: adminRole,
      action: `USER_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
      entity: 'User',
      entityId: user.id,
      previousState: prevStatus,
      newState: newStatus,
      metadata: { email: user.email, userType: user.userType, note },
    });

    return user;
  }

  // ==================== MODERATION ====================
  public getModerationReports(): ModerationReport[] {
    return [...this.moderation];
  }

  public updateModerationReport(
    reportId: string,
    newStatus: ModerationStatus,
    verdict: string,
    notes: string,
    adminName: string,
    adminRole: string
  ) {
    const report = this.moderation.find((r) => r.id === reportId);
    if (!report) return null;

    const prevStatus = report.status;
    report.status = newStatus;
    report.resolution = {
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      admin: adminName,
      verdict,
      notes,
    };
    report.actionHistory.unshift({
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      admin: adminName,
      action: `Case ${newStatus}: ${verdict}`,
      note: notes,
    });

    this.persist('moderation', this.moderation);

    this.logAudit({
      actor: adminName,
      role: adminRole,
      action: `MODERATION_RESOLVED`,
      entity: 'ModerationReport',
      entityId: report.id,
      previousState: prevStatus,
      newState: newStatus,
      metadata: { verdict, notes, affectedEntity: report.affectedEntity },
    });

    return report;
  }

  // ==================== DISPUTES ====================
  public getDisputes(): DisputeCase[] {
    return [...this.disputes];
  }

  public updateDisputeStatus(
    disputeId: string,
    newStatus: DisputeStatus,
    resolutionNote: string,
    adminName: string,
    adminRole: string
  ) {
    const dispute = this.disputes.find((d) => d.id === disputeId);
    if (!dispute) return null;

    const prevStatus = dispute.status;
    dispute.status = newStatus;
    dispute.resolution = resolutionNote;
    dispute.history.unshift({
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      admin: adminName,
      step: `Status set to ${newStatus}`,
      note: resolutionNote,
    });

    this.persist('disputes', this.disputes);

    this.logAudit({
      actor: adminName,
      role: adminRole,
      action: `DISPUTE_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
      entity: 'DisputeCase',
      entityId: dispute.id,
      previousState: prevStatus,
      newState: newStatus,
      metadata: { resolutionNote, type: dispute.type, company: dispute.companyName },
    });

    return dispute;
  }

  // ==================== INTEGRITY ====================
  public getIntegrityIncidents(): IntegrityIncident[] {
    return [...this.integrity];
  }

  public updateIntegrityIncident(
    incidentId: string,
    newStatus: IncidentStatus,
    resolutionNote: string,
    adminName: string,
    adminRole: string
  ) {
    const inc = this.integrity.find((i) => i.id === incidentId);
    if (!inc) return null;

    const prevStatus = inc.status;
    inc.status = newStatus;
    inc.resolutionNote = resolutionNote;
    inc.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    inc.resolvedBy = adminName;

    this.persist('integrity', this.integrity);

    this.logAudit({
      actor: adminName,
      role: adminRole,
      action: `INTEGRITY_INCIDENT_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
      entity: 'IntegrityIncident',
      entityId: inc.id,
      previousState: prevStatus,
      newState: newStatus,
      metadata: { resolutionNote, sessionId: inc.sessionId, candidateMaskedId: inc.candidateMaskedId },
    });

    return inc;
  }

  // ==================== EVIDENCE OVERSIGHT ====================
  public getEvidenceRecords(): EvidenceOversightRecord[] {
    return [...this.evidence];
  }

  public logEvidenceAccess(
    evidenceId: string,
    adminName: string,
    role: string,
    reason: string
  ) {
    const evi = this.evidence.find((e) => e.id === evidenceId);
    if (!evi) return null;

    const logEntry = {
      adminName,
      role,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      reason,
      approvedBySuperAdmin: role === 'Super Admin',
    };

    evi.accessLogs.unshift(logEntry);
    this.persist('evidence', this.evidence);

    this.logAudit({
      actor: adminName,
      role,
      action: 'EVIDENCE_ACCESSED',
      entity: 'EvidenceVault',
      entityId: evidenceId,
      metadata: { reason, storageRef: evi.storageRef, candidateMaskedId: evi.candidateMaskedId },
    });

    return logEntry;
  }

  // ==================== ROLE TAXONOMY ====================
  public getRoleTaxonomy(): RoleTaxonomyItem[] {
    return [...this.roleTaxonomy];
  }

  public addRoleTaxonomy(role: Omit<RoleTaxonomyItem, 'id' | 'lastUpdated'>, adminName: string, adminRole: string) {
    const newRole: RoleTaxonomyItem = {
      ...role,
      id: `tax-role-${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    this.roleTaxonomy.unshift(newRole);
    this.persist('role_taxonomy', this.roleTaxonomy);

    this.logAudit({
      actor: adminName,
      role: adminRole,
      action: 'ROLE_TAXONOMY_CREATED',
      entity: 'RoleTaxonomy',
      entityId: newRole.id,
      metadata: { roleName: newRole.roleName, family: newRole.family },
    });
    return newRole;
  }

  public updateRoleTaxonomy(roleId: string, updates: Partial<RoleTaxonomyItem>, adminName: string, adminRole: string) {
    const idx = this.roleTaxonomy.findIndex((r) => r.id === roleId);
    if (idx === -1) return null;
    this.roleTaxonomy[idx] = {
      ...this.roleTaxonomy[idx],
      ...updates,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    this.persist('role_taxonomy', this.roleTaxonomy);

    this.logAudit({
      actor: adminName,
      role: adminRole,
      action: 'ROLE_TAXONOMY_UPDATED',
      entity: 'RoleTaxonomy',
      entityId: roleId,
      metadata: updates,
    });
    return this.roleTaxonomy[idx];
  }

  // ==================== ASSESSMENT TAXONOMY ====================
  public getAssessmentTaxonomy(): AssessmentTaxonomyItem[] {
    return [...this.assessmentTaxonomy];
  }

  public addAssessmentTaxonomy(item: Omit<AssessmentTaxonomyItem, 'id' | 'activeUsageCount'>, adminName: string, adminRole: string) {
    const newItem: AssessmentTaxonomyItem = {
      ...item,
      id: `tax-asm-${Date.now()}`,
      activeUsageCount: 1,
    };
    this.assessmentTaxonomy.unshift(newItem);
    this.persist('assessment_taxonomy', this.assessmentTaxonomy);

    this.logAudit({
      actor: adminName,
      role: adminRole,
      action: 'ASSESSMENT_TAXONOMY_CREATED',
      entity: 'AssessmentTaxonomy',
      entityId: newItem.id,
      metadata: { name: newItem.name, category: newItem.category },
    });
    return newItem;
  }

  // ==================== SECURITY EVENTS ====================
  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  public mitigateSecurityEvent(eventId: string, mitigationAction: string, adminName: string, adminRole: string) {
    const ev = this.securityEvents.find((s) => s.id === eventId);
    if (!ev) return null;

    ev.status = 'Mitigated';
    ev.mitigationTaken = mitigationAction;
    this.persist('security_events', this.securityEvents);

    this.logAudit({
      actor: adminName,
      role: adminRole,
      action: 'SECURITY_EVENT_MITIGATED',
      entity: 'SecurityEvent',
      entityId: ev.id,
      metadata: { mitigationAction, eventType: ev.type, ipAddress: ev.ipAddress },
    });
    return ev;
  }

  // ==================== AUDIT LOGS ====================
  public getAuditLogs(): AuditRecord[] {
    return [...this.auditLogs];
  }

  // ==================== NOTIFICATIONS ====================
  public getNotifications(): AdminNotification[] {
    return [...this.notifications];
  }

  public markNotificationAsRead(id: string) {
    const n = this.notifications.find((notif) => notif.id === id);
    if (n) {
      n.read = true;
      this.persist('notifications', this.notifications);
    }
  }

  public markAllNotificationsAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.persist('notifications', this.notifications);
  }

  public addNotification(notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotif: AdminNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: 'Just now',
      read: false,
    };
    this.notifications = [newNotif, ...this.notifications];
    this.persist('notifications', this.notifications);
    return newNotif;
  }

  // ==================== SYSTEM HEALTH ====================
  public getSystemHealth(): SystemHealthMetrics {
    return { ...this.health };
  }

  // ==================== SETTINGS ====================
  public getSettings(): PlatformSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<PlatformSettings>, adminName: string, adminRole: string) {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    this.persist('settings', this.settings);

    this.logAudit({
      actor: adminName,
      role: adminRole,
      action: 'PLATFORM_SETTINGS_UPDATED',
      entity: 'PlatformSettings',
      entityId: 'global-config',
      metadata: newSettings,
    });
    return this.settings;
  }
}

export const adminDataService = new AdminDataStore();
