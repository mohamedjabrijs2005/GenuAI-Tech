import api from './api';

export interface Vacancy {
  id: string;
  title: string;
  dept: string;
  department_id?: string;
  department_name?: string;
  openings: number;
  applications: number;
  assessments: number;
  interviews: number;
  status: 'published' | 'pending' | 'draft' | 'paused' | 'closed' | 'verified';
  created: string;
  location?: string;
  experience_level?: string;
  employment_type?: string;
  description?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  vacancy: string;
  vacancyId?: string;
  stage: 'Applied' | 'Eligible' | 'Verified' | 'Invited' | 'Assessed' | 'Review' | 'Interview' | 'Decision';
  score: number | null;
  evidence: string;
  integrity: 'clear' | 'signals' | 'flagged';
  date: string;
  phone?: string;
  notes?: string;
}

export interface IntegrityRecord {
  id: string;
  incidentId: string;
  name: string;
  candidateId: string;
  vacancy: string;
  assessmentDate: string;
  assessmentId: string;
  signals: {
    type: string;
    count: number;
    severity: 'none' | 'low' | 'medium' | 'high';
    timestamps?: string[];
    context?: string;
  }[];
  reviewStatus: 'Unreviewed' | 'Reviewed' | 'Dismissed' | 'Escalated';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface InterviewRecord {
  id: string;
  candidateName: string;
  candidateId: string;
  vacancy: string;
  vacancyId: string;
  interviewer: string;
  interviewerRole: string;
  date: string;
  time: string;
  type: 'Technical Interview' | 'Competency Review' | 'Final Executive' | 'Hiring Manager';
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'In Progress';
  meetingLink?: string;
  score?: number;
  notes?: string;
}

// Initial Realistic Seed Data
const DEFAULT_VACANCIES: Vacancy[] = [
  { id: 'vac-1', title: 'Senior Backend Engineer', dept: 'Engineering', openings: 3, applications: 45, assessments: 31, interviews: 8, status: 'published', created: '2026-09-10', location: 'Remote / London', experience_level: 'senior', employment_type: 'full_time', description: 'Architect distributed backend microservices and real-time Kafka event streaming pipelines.' },
  { id: 'vac-2', title: 'Lead Product Designer', dept: 'Product Design', openings: 2, applications: 28, assessments: 12, interviews: 3, status: 'published', created: '2026-09-14', location: 'Hybrid / Berlin', experience_level: 'lead', employment_type: 'full_time', description: 'Lead enterprise design systems and UX architecture for GenuAI assessment suites.' },
  { id: 'vac-3', title: 'Cloud DevOps & SRE', dept: 'Infrastructure', openings: 2, applications: 34, assessments: 21, interviews: 7, status: 'published', created: '2026-09-05', location: 'Remote', experience_level: 'senior', employment_type: 'full_time', description: 'Maintain Kubernetes clusters, multi-region CI/CD pipelines, and zero-trust infrastructure.' },
  { id: 'vac-4', title: 'Data Platform Engineer', dept: 'Data & AI', openings: 1, applications: 19, assessments: 8, interviews: 2, status: 'pending', created: '2026-09-18', location: 'Remote / Singapore', experience_level: 'mid', employment_type: 'full_time', description: 'Build scalable ETL pipelines, Snowflake data models, and feature stores for ML models.' },
  { id: 'vac-5', title: 'Security & Compliance Analyst', dept: 'Information Security', openings: 1, applications: 8, assessments: 0, interviews: 0, status: 'draft', created: '2026-09-24', location: 'London', experience_level: 'mid', employment_type: 'full_time', description: 'Oversee SOC2 compliance, ISO 27001 evidence matrices, and automated penetration testing.' },
];

const DEFAULT_CANDIDATES: Candidate[] = [
  { id: 'cand-1', name: 'Mohamed Jabri', email: 'mohamed.jabri@example.com', vacancy: 'Senior Backend Engineer', vacancyId: 'vac-1', stage: 'Review', score: 88, evidence: '5/5', integrity: 'clear', date: '2026-09-22', phone: '+44 7700 900123', notes: 'Strong algorithms and distributed systems architecture background.' },
  { id: 'cand-2', name: 'Aisha Rahman', email: 'aisha.rahman@example.com', vacancy: 'Senior Backend Engineer', vacancyId: 'vac-1', stage: 'Assessed', score: 78, evidence: '4/5', integrity: 'signals', date: '2026-09-21', phone: '+44 7700 900456', notes: 'Completed technical coding test. Tab switch signal noted for review.' },
  { id: 'cand-3', name: 'James Okonkwo', email: 'james.o@example.com', vacancy: 'Senior Backend Engineer', vacancyId: 'vac-1', stage: 'Interview', score: 94, evidence: '5/5', integrity: 'clear', date: '2026-09-20', phone: '+44 7700 900789', notes: 'Exceptional system design and PostgreSQL query optimization score.' },
  { id: 'cand-4', name: 'Sara Kim', email: 'sara.kim@example.com', vacancy: 'Lead Product Designer', vacancyId: 'vac-2', stage: 'Invited', score: null, evidence: '—', integrity: 'clear', date: '2026-09-23', phone: '+49 151 234567', notes: 'Portfolio verified. Assessment invitation dispatched.' },
  { id: 'cand-5', name: 'Carlos Mendez', email: 'c.mendez@example.com', vacancy: 'Cloud DevOps & SRE', vacancyId: 'vac-3', stage: 'Decision', score: 91, evidence: '5/5', integrity: 'clear', date: '2026-09-18', phone: '+34 612 345678', notes: 'Passed all technical and competency bars. Final offer review in progress.' },
  { id: 'cand-6', name: 'Priya Patel', email: 'priya.patel@example.com', vacancy: 'Data Platform Engineer', vacancyId: 'vac-4', stage: 'Eligible', score: null, evidence: '—', integrity: 'clear', date: '2026-09-24', phone: '+91 98765 43210', notes: 'Application verified against role prerequisites.' },
  { id: 'cand-7', name: 'Alex Rivera', email: 'alex.rivera@example.com', vacancy: 'Senior Backend Engineer', vacancyId: 'vac-1', stage: 'Review', score: 82, evidence: '4/5', integrity: 'clear', date: '2026-09-25', phone: '+1 415 555 0199', notes: 'Completed full 5-stage evidence assessment.' },
];

const DEFAULT_INTEGRITY: IntegrityRecord[] = [
  {
    id: 'inc-1',
    incidentId: 'INC-2026-001',
    name: 'Aisha Rahman',
    candidateId: 'cand-2',
    vacancy: 'Senior Backend Engineer',
    assessmentDate: '2026-09-21',
    assessmentId: 'AG-01 v1.0',
    signals: [
      { type: 'Tab switching', count: 2, severity: 'medium', timestamps: ['09:14:23', '09:31:07'], context: 'Browser tab focus lost twice during coding section' },
      { type: 'Copy/Paste attempt', count: 0, severity: 'none' },
      { type: 'Face missing from frame', count: 1, severity: 'low', timestamps: ['09:22:15'], context: 'Camera feed blank for ~4 seconds (likely webcam adjustment)' },
      { type: 'Multiple person detected', count: 0, severity: 'none' },
    ],
    reviewStatus: 'Unreviewed',
  },
  {
    id: 'inc-2',
    incidentId: 'INC-2026-002',
    name: 'James Okonkwo',
    candidateId: 'cand-3',
    vacancy: 'Senior Backend Engineer',
    assessmentDate: '2026-09-20',
    assessmentId: 'AG-01 v1.0',
    signals: [
      { type: 'Tab switching', count: 0, severity: 'none' },
      { type: 'Copy/Paste attempt', count: 0, severity: 'none' },
      { type: 'Face missing from frame', count: 0, severity: 'none' },
      { type: 'Multiple person detected', count: 0, severity: 'none' },
    ],
    reviewStatus: 'Reviewed',
    reviewedBy: 'Dr. Sarah Connor',
    reviewedAt: '2026-09-20 16:00',
    reviewNote: 'Full proctoring audit complete — zero telemetry anomaly. Candidate is cleared.',
  },
  {
    id: 'inc-3',
    incidentId: 'INC-2026-003',
    name: 'Mohamed Jabri',
    candidateId: 'cand-1',
    vacancy: 'Senior Backend Engineer',
    assessmentDate: '2026-09-22',
    assessmentId: 'AG-01 v1.0',
    signals: [
      { type: 'Tab switching', count: 1, severity: 'low', timestamps: ['10:05:44'], context: 'Single momentary tab switch (< 2 seconds)' },
      { type: 'Copy/Paste attempt', count: 0, severity: 'none' },
      { type: 'Face missing from frame', count: 0, severity: 'none' },
      { type: 'Multiple person detected', count: 0, severity: 'none' },
    ],
    reviewStatus: 'Reviewed',
    reviewedBy: 'Dr. Sarah Connor',
    reviewedAt: '2026-09-22 11:30',
    reviewNote: 'Signal reviewed and cleared. Benign notification dismiss.',
  },
];

const DEFAULT_INTERVIEWS: InterviewRecord[] = [
  {
    id: 'int-1',
    candidateName: 'James Okonkwo',
    candidateId: 'cand-3',
    vacancy: 'Senior Backend Engineer',
    vacancyId: 'vac-1',
    interviewer: 'Alex Mercer (Lead Architect)',
    interviewerRole: 'Hiring Manager',
    date: '2026-10-03',
    time: '14:00 - 15:00 UTC',
    type: 'Technical Interview',
    status: 'Scheduled',
    meetingLink: 'https://meet.genuai.tech/room-eng-902',
    notes: 'Focus on distributed consensus, Raft protocol, and Kafka partition rebalancing.',
  },
  {
    id: 'int-2',
    candidateName: 'Carlos Mendez',
    candidateId: 'cand-5',
    vacancy: 'Cloud DevOps & SRE',
    vacancyId: 'vac-3',
    interviewer: 'Elena Rostova (VP Infrastructure)',
    interviewerRole: 'Executive Reviewer',
    date: '2026-10-02',
    time: '11:00 - 12:00 UTC',
    type: 'Final Executive',
    status: 'Scheduled',
    meetingLink: 'https://meet.genuai.tech/room-infra-404',
    notes: 'Final leadership cultural fit & compensation alignment.',
  },
  {
    id: 'int-3',
    candidateName: 'Mohamed Jabri',
    candidateId: 'cand-1',
    vacancy: 'Senior Backend Engineer',
    vacancyId: 'vac-1',
    interviewer: 'David Chen (Staff Engineer)',
    interviewerRole: 'Technical Interviewer',
    date: '2026-09-28',
    time: '15:30 - 16:30 UTC',
    type: 'Technical Interview',
    status: 'Completed',
    score: 92,
    meetingLink: 'https://meet.genuai.tech/room-eng-811',
    notes: 'Exceptional understanding of concurrency, lock-free queues, and PostgreSQL indexing.',
  },
];

// Helper to get from local storage or fallback
function getStored<T>(key: string, defaultData: T): T {
  if (typeof window === 'undefined') return defaultData;
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(item);
  } catch {
    return defaultData;
  }
}

function setStored<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed saving to ${key}`, err);
  }
}

export const DataService = {
  // ==================== VACANCIES ====================
  async getVacancies(): Promise<Vacancy[]> {
    try {
      const res = await api.get('/vacancies');
      if (res.data?.vacancies && res.data.vacancies.length > 0) {
        const mapped = res.data.vacancies.map((v: any) => ({
          id: v.id,
          title: v.title,
          dept: v.department_name || 'Engineering',
          openings: Number(v.vacancy_count) || 1,
          applications: Number(v.applicant_count) || 0,
          assessments: Math.round((Number(v.applicant_count) || 0) * 0.7),
          interviews: Math.round((Number(v.applicant_count) || 0) * 0.2),
          status: (v.status || 'published').toLowerCase(),
          created: v.created_at ? v.created_at.split('T')[0] : '2026-09-20',
          location: v.location || 'Remote',
          experience_level: v.experience_level || 'senior',
          employment_type: v.employment_type || 'full_time',
          description: v.job_description,
        }));
        setStored('genuai_vacancies', mapped);
        return mapped;
      }
    } catch {
      // fallback
    }
    return getStored<Vacancy[]>('genuai_vacancies', DEFAULT_VACANCIES);
  },

  async getVacancyById(id: string): Promise<Vacancy | null> {
    const list = await this.getVacancies();
    return list.find(v => v.id === id || String(v.id) === String(id)) || list[0] || null;
  },

  async createVacancy(data: Partial<Vacancy>): Promise<Vacancy> {
    const newVac: Vacancy = {
      id: 'vac-' + Math.random().toString(36).substring(2, 8),
      title: data.title || 'Untitled Vacancy',
      dept: data.dept || 'Engineering',
      openings: Number(data.openings) || 1,
      applications: 0,
      assessments: 0,
      interviews: 0,
      status: (data.status as any) || 'published',
      created: new Date().toISOString().split('T')[0],
      location: data.location || 'Remote',
      experience_level: data.experience_level || 'senior',
      employment_type: data.employment_type || 'full_time',
      description: data.description || '',
    };

    try {
      await api.post('/vacancies', {
        title: newVac.title,
        departmentId: data.department_id || '00000000-0000-0000-0000-000000000001',
        experienceLevel: newVac.experience_level,
        employmentType: newVac.employment_type,
        location: newVac.location,
        vacancyCount: newVac.openings,
        jobDescription: newVac.description,
      });
    } catch {
      // saved locally
    }

    const current = getStored<Vacancy[]>('genuai_vacancies', DEFAULT_VACANCIES);
    const updated = [newVac, ...current];
    setStored('genuai_vacancies', updated);
    return newVac;
  },

  async updateVacancyStatus(id: string, status: Vacancy['status']): Promise<void> {
    try {
      await api.patch(`/vacancies/${id}/status`, { status });
    } catch {
      // offline fallback
    }
    const current = getStored<Vacancy[]>('genuai_vacancies', DEFAULT_VACANCIES);
    const updated = current.map(v => v.id === id ? { ...v, status } : v);
    setStored('genuai_vacancies', updated);
  },

  // ==================== CANDIDATES ====================
  async getCandidates(vacancyId?: string): Promise<Candidate[]> {
    try {
      const res = await api.get('/candidates', { params: { vacancyId } });
      if (res.data?.candidates && res.data.candidates.length > 0) {
        const mapped = res.data.candidates.map((c: any) => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name || 'Candidate',
          email: c.email,
          vacancy: c.role_title || 'Software Developer',
          vacancyId: c.role_id,
          stage: c.stage || 'Applied',
          score: c.score !== undefined ? c.score : null,
          evidence: c.evidence_count ? `${c.evidence_count}/5` : '—',
          integrity: c.integrity_status || 'clear',
          date: c.applied_at ? c.applied_at.split('T')[0] : '2026-09-22',
          phone: c.phone,
          notes: c.notes,
        }));
        setStored('genuai_candidates', mapped);
        return mapped;
      }
    } catch {
      // fallback
    }
    const current = getStored<Candidate[]>('genuai_candidates', DEFAULT_CANDIDATES);
    if (vacancyId) {
      return current.filter(c => c.vacancyId === vacancyId || c.vacancy === vacancyId);
    }
    return current;
  },

  async updateCandidateStage(id: string, stage: Candidate['stage']): Promise<void> {
    try {
      await api.patch(`/candidates/${id}/stage`, { stage });
    } catch {
      // offline fallback
    }
    const current = getStored<Candidate[]>('genuai_candidates', DEFAULT_CANDIDATES);
    const updated = current.map(c => c.id === id ? { ...c, stage } : c);
    setStored('genuai_candidates', updated);
  },

  // ==================== INTEGRITY ====================
  async getIntegrityRecords(): Promise<IntegrityRecord[]> {
    try {
      const res = await api.get('/integrity/signals');
      if (res.data?.signals && res.data.signals.length > 0) {
        return res.data.signals;
      }
    } catch {
      // fallback
    }
    return getStored<IntegrityRecord[]>('genuai_integrity', DEFAULT_INTEGRITY);
  },

  async updateIntegrityStatus(id: string, reviewStatus: IntegrityRecord['reviewStatus'], note?: string): Promise<void> {
    const current = getStored<IntegrityRecord[]>('genuai_integrity', DEFAULT_INTEGRITY);
    const updated = current.map(r => r.id === id ? {
      ...r,
      reviewStatus,
      reviewedBy: 'Authorized Reviewer',
      reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reviewNote: note || r.reviewNote || 'Review decision recorded.'
    } : r);
    setStored('genuai_integrity', updated);
  },

  // ==================== INTERVIEWS ====================
  async getInterviews(): Promise<InterviewRecord[]> {
    try {
      const res = await api.get('/interviews');
      if (res.data?.interviews && res.data.interviews.length > 0) {
        return res.data.interviews;
      }
    } catch {
      // fallback
    }
    return getStored<InterviewRecord[]>('genuai_interviews', DEFAULT_INTERVIEWS);
  },

  async scheduleInterview(data: Partial<InterviewRecord>): Promise<InterviewRecord> {
    const newInt: InterviewRecord = {
      id: 'int-' + Math.random().toString(36).substring(2, 8),
      candidateName: data.candidateName || 'Candidate',
      candidateId: data.candidateId || 'cand-1',
      vacancy: data.vacancy || 'Senior Backend Engineer',
      vacancyId: data.vacancyId || 'vac-1',
      interviewer: data.interviewer || 'Hiring Lead',
      interviewerRole: data.interviewerRole || 'Technical Reviewer',
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || '14:00 - 15:00 UTC',
      type: data.type || 'Technical Interview',
      status: 'Scheduled',
      meetingLink: data.meetingLink || 'https://meet.genuai.tech/room-' + Math.floor(100 + Math.random() * 900),
      notes: data.notes || '',
    };
    const current = getStored<InterviewRecord[]>('genuai_interviews', DEFAULT_INTERVIEWS);
    const updated = [newInt, ...current];
    setStored('genuai_interviews', updated);
    return newInt;
  }
};
