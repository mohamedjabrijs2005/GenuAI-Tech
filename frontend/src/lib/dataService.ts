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

export const DataService = {
  // ==================== VACANCIES ====================
  async getVacancies(): Promise<Vacancy[]> {
    try {
      const res = await api.get('/vacancies');
      if (res.data?.vacancies) {
        const mapped = res.data.vacancies.map((v: any) => ({
          id: v.id,
          title: v.title,
          dept: v.department_name || 'General',
          openings: Number(v.vacancy_count) || 1,
          applications: Number(v.applicant_count) || 0,
          assessments: Math.round((Number(v.applicant_count) || 0) * 0.7),
          interviews: Math.round((Number(v.applicant_count) || 0) * 0.2),
          status: (v.status || 'published').toLowerCase(),
          created: v.created_at ? v.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          location: v.location || 'Remote',
          experience_level: v.experience_level || 'senior',
          employment_type: v.employment_type || 'full_time',
          description: v.job_description,
        }));
        return mapped;
      }
    } catch (err) {
      console.error('Failed to fetch vacancies from API', err);
    }
    return [];
  },

  async getVacancyById(id: string): Promise<Vacancy | null> {
    try {
      const res = await api.get(`/vacancies/${id}`);
      if (res.data?.vacancy) {
        const v = res.data.vacancy;
        return {
          id: v.id,
          title: v.title,
          dept: v.department_name || 'General',
          openings: Number(v.vacancy_count) || 1,
          applications: 0,
          assessments: 0,
          interviews: 0,
          status: (v.status || 'published').toLowerCase() as Vacancy['status'],
          created: v.created_at ? v.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          location: v.location || 'Remote',
          experience_level: v.experience_level || 'senior',
          employment_type: v.employment_type || 'full_time',
          description: v.job_description,
        };
      }
    } catch (err) {
      console.error('Failed to fetch vacancy by ID', err);
    }
    return null;
  },

  async createVacancy(data: Partial<Vacancy>): Promise<Vacancy> {
    const res = await api.post('/vacancies', {
      title: data.title,
      departmentId: data.department_id,
      experienceLevel: data.experience_level || 'senior',
      employmentType: data.employment_type || 'full_time',
      location: data.location || 'Remote',
      vacancyCount: data.openings || 1,
      jobDescription: data.description || '',
    });

    const v = res.data.vacancy;
    return {
      id: v.id,
      title: v.title,
      dept: v.department_name || data.dept || 'General',
      openings: Number(v.vacancy_count) || 1,
      applications: 0,
      assessments: 0,
      interviews: 0,
      status: (v.status || 'published').toLowerCase() as Vacancy['status'],
      created: v.created_at ? v.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      location: v.location || 'Remote',
      experience_level: v.experience_level,
      employment_type: v.employment_type,
      description: v.job_description,
    };
  },

  async updateVacancyStatus(id: string, status: Vacancy['status']): Promise<void> {
    await api.patch(`/vacancies/${id}/status`, { status });
  },

  // ==================== CANDIDATES ====================
  async getCandidates(vacancyId?: string): Promise<Candidate[]> {
    try {
      const params: Record<string, string> = {};
      if (vacancyId) params.vacancy = vacancyId;
      const res = await api.get('/candidates', { params });
      if (res.data?.candidates) {
        return res.data.candidates.map((c: any) => ({
          id: c.application_id || c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Candidate',
          email: c.email,
          vacancy: c.vacancy_title || c.role_title || 'Open Role',
          vacancyId: c.vacancy_id || c.role_id,
          stage: c.status || c.stage || 'Applied',
          score: c.overall_score !== undefined && c.overall_score !== null ? Number(c.overall_score) : null,
          evidence: c.supporting_evidence !== undefined
            ? `${c.supporting_evidence}/${c.total_requirements || 5}`
            : '—',
          integrity: c.integrity_flags > 0 ? 'signals' : 'clear',
          date: c.applied_at ? c.applied_at.split('T')[0] : new Date().toISOString().split('T')[0],
          phone: c.phone,
          notes: c.notes,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch candidates', err);
    }
    return [];
  },

  async updateCandidateStage(id: string, stage: Candidate['stage']): Promise<void> {
    await api.patch(`/candidates/${id}/status`, { status: stage });
  },

  // ==================== INTEGRITY ====================
  async getIntegrityRecords(): Promise<IntegrityRecord[]> {
    try {
      const res = await api.get('/integrity');
      if (res.data?.signals) {
        return res.data.signals.map((s: any) => ({
          id: s.id,
          incidentId: s.id,
          name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Candidate',
          candidateId: s.application_id,
          vacancy: s.vacancy_title || 'Open Role',
          assessmentDate: s.signal_time ? s.signal_time.split('T')[0] : '',
          assessmentId: s.assessment_id || 'N/A',
          signals: [{
            type: s.signal_type || 'Unknown Signal',
            count: 1,
            severity: (s.severity || 'low').toLowerCase() as 'none' | 'low' | 'medium' | 'high',
            context: s.context,
          }],
          reviewStatus: s.status === 'New' ? 'Unreviewed'
            : s.status === 'Acknowledged' ? 'Reviewed'
            : s.status === 'Dismissed' ? 'Dismissed'
            : 'Unreviewed',
          reviewedBy: s.reviewer_first ? `${s.reviewer_first} ${s.reviewer_last}` : undefined,
          reviewedAt: s.reviewed_at,
          reviewNote: s.review_note,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch integrity records', err);
    }
    return [];
  },

  async updateIntegrityStatus(id: string, reviewStatus: IntegrityRecord['reviewStatus'], note?: string): Promise<void> {
    const statusMap: Record<string, string> = {
      'Reviewed': 'Acknowledged',
      'Dismissed': 'Dismissed',
      'Escalated': 'Under Review',
      'Unreviewed': 'New',
    };
    await api.patch(`/integrity/${id}`, {
      status: statusMap[reviewStatus] || reviewStatus,
      reviewNote: note,
    });
  },

  // ==================== INTERVIEWS ====================
  async getInterviews(): Promise<InterviewRecord[]> {
    try {
      const res = await api.get('/interviews');
      if (res.data?.interviews) {
        return res.data.interviews.map((i: any) => ({
          id: i.id,
          candidateName: `${i.candidate_first || ''} ${i.candidate_last || ''}`.trim() || 'Candidate',
          candidateId: i.application_id,
          vacancy: i.vacancy_title || 'Open Role',
          vacancyId: i.role_id || '',
          interviewer: i.interviewer_first
            ? `${i.interviewer_first} ${i.interviewer_last}`
            : 'Unassigned',
          interviewerRole: i.interview_type || 'Technical Interviewer',
          date: i.scheduled_at ? i.scheduled_at.split('T')[0] : '',
          time: i.scheduled_at
            ? new Date(i.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC'
            : '',
          type: (i.interview_type as InterviewRecord['type']) || 'Technical Interview',
          status: (i.status as InterviewRecord['status']) || 'Scheduled',
          meetingLink: i.video_link,
          score: i.overall_score !== null ? Number(i.overall_score) : undefined,
          notes: i.notes,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch interviews', err);
    }
    return [];
  },

  async scheduleInterview(data: Partial<InterviewRecord>): Promise<void> {
    await api.post(`/candidates/${data.candidateId}/interviews`, {
      scheduledAt: `${data.date}T${data.time?.split(' ')[0] || '14:00'}:00Z`,
      durationMins: 60,
      videoLink: data.meetingLink,
      interviewType: data.type || 'Technical Interview',
    });
  },
};

// ==================== EVIDENCE ENGINE ====================

export interface Requirement {
  id: string;
  name: string;
  description?: string;
  category: string;
  req_type: 'Required' | 'Preferred';
  priority: 'High' | 'Medium' | 'Low';
  proficiency: string;
  eval_method: string;
  req_status: 'AI Suggestion' | 'Under Review' | 'Confirmed' | 'Archived';
  suggestion_source?: string;
  vacancy_version_id?: string;
}

export interface EvidenceRecord {
  id: string;
  requirement_id: string;
  requirement_name?: string;
  status: 'Pending' | 'Supporting' | 'Limited' | 'Gap' | 'Not Applicable';
  source_type: string;
  score?: number;
  notes?: string;
  eval_group_name?: string;
  updated_at?: string;
}

export interface CoverageMatrix {
  requirement: Requirement;
  evidence: EvidenceRecord | null;
  coverage_status: string;
}

export interface CoverageSnapshot {
  total_requirements: number;
  supporting_count: number;
  pending_count: number;
  limited_count: number;
  gap_count: number;
  na_count: number;
  coverage_pct: number;
  computed_at: string;
}

export interface VacancyVersion {
  id: string;
  role_id: string;
  version_number: number;
  status: string;
  change_summary?: string;
  published_at?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  application_count?: number;
}

export const EvidenceService = {
  async getCoverageMatrix(appId: string): Promise<{ matrix: CoverageMatrix[]; coverage: CoverageSnapshot | null; total: number }> {
    try {
      const res = await api.get(`/evidence/coverage/${appId}`);
      return { matrix: res.data.matrix || [], coverage: res.data.coverage, total: res.data.total || 0 };
    } catch { return { matrix: [], coverage: null, total: 0 }; }
  },

  async recomputeCoverage(appId: string): Promise<CoverageSnapshot | null> {
    try {
      const res = await api.post(`/evidence/coverage/${appId}/recompute`);
      return res.data.coverage;
    } catch { return null; }
  },

  async generateEvidence(appId: string): Promise<{ generated: number }> {
    const res = await api.post(`/evidence/generate/${appId}`);
    return res.data;
  },

  async updateEvidence(evidenceId: string, data: { status?: string; source_type?: string; notes?: string }): Promise<EvidenceRecord | null> {
    try {
      const res = await api.patch(`/evidence/${evidenceId}`, data);
      return res.data.evidence;
    } catch { return null; }
  },

  async getVacancyVersions(roleId: string): Promise<VacancyVersion[]> {
    try {
      const res = await api.get(`/evidence/versions/${roleId}`);
      return res.data.versions || [];
    } catch { return []; }
  },

  async createVacancyVersion(roleId: string, changeSummary?: string): Promise<VacancyVersion | null> {
    try {
      const res = await api.post('/evidence/versions', { roleId, changeSummary });
      return res.data.version;
    } catch { return null; }
  },

  async updateVersionStatus(versionId: string, status: string): Promise<VacancyVersion | null> {
    try {
      const res = await api.patch(`/evidence/versions/${versionId}/status`, { status });
      return res.data.version;
    } catch { return null; }
  },

  async saveRecruiterReview(appId: string, data: {
    summary?: string; evidence_note?: string; gap_note?: string;
    integrity_note?: string; interview_note?: string; overall_note?: string;
  }): Promise<void> {
    await api.post(`/evidence/review/${appId}`, data);
  },

  async getRecruiterReviews(appId: string): Promise<any[]> {
    try {
      const res = await api.get(`/evidence/review/${appId}`);
      return res.data.reviews || [];
    } catch { return []; }
  },

  async recordDecision(appId: string, data: { decision: string; rationale?: string; evidence_summary?: string }): Promise<void> {
    await api.post(`/evidence/decision/${appId}`, data);
  },

  async getDecision(appId: string): Promise<any | null> {
    try {
      const res = await api.get(`/evidence/decision/${appId}`);
      return res.data.decision;
    } catch { return null; }
  },
};
