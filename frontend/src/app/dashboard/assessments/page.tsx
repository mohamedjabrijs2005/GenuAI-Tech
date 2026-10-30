'use client';

import { useState, useEffect } from 'react';
import {
  ClipboardList, ChevronDown, ChevronUp,
  Plus, X, BookOpen, Target, Shield, Clock,
  CheckCircle2, AlertCircle, Award, Eye, FileText, Check, Search, Filter
} from 'lucide-react';
import { DataService, Vacancy } from '@/lib/dataService';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface EvaluationModule {
  id: string;
  name: string;
  requirement: string;
  questions: number;
  avgScore: string;
}

interface Assessment {
  id: string;
  name: string;
  vacancy: string;
  vacancyId: string;
  status: 'Active' | 'Draft';
  version: string;
  competencyArea: string;
  assessmentType: string;
  duration: string;
  difficulty: string;
  questionCount: number;
  integrity: string;
  modules: EvaluationModule[];
}

interface CandidateAttempt {
  id: string;
  target_id: string;
  candidate_id: string;
  submitted_at: string;
  score: number | null;
  objective_score: number | null;
  scenario_score: number | null;
  grading_status: string;
  status: string;
  first_name: string;
  last_name: string;
  candidate_email: string;
  vacancy_title: string;
  vacancy_id: string;
}

interface RequirementScoreItem {
  id: string;
  requirement_id: string;
  score: number;
  max_score: number;
  assessment_notes: string;
  scoring_source: string;
  rubric_criteria: any;
  candidate_answers: any;
  evaluation_status: string;
  requirement_name: string;
  importance: string;
  weight: number;
}

const ASSESSMENT_TYPES = [
  'Technical Skills Test',
  'Competency-Based Interview',
  'Situational Judgement Test',
  'Cognitive Ability Test',
  'Personality & Values Assessment',
  'Work Sample / Portfolio Review',
  'Case Study',
  'Role Play Simulation',
];

const COMPETENCY_AREAS = [
  'Technical / Domain Knowledge',
  'Problem Solving & Analytical Thinking',
  'Communication & Interpersonal Skills',
  'Leadership & Decision Making',
  'Teamwork & Collaboration',
  'Adaptability & Resilience',
  'Customer Focus & Service Orientation',
  'Innovation & Creativity',
  'Planning & Organising',
  'Integrity & Ethics',
];

const DIFFICULTY_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'];

export default function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState<'modules' | 'grading'>('grading');
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [expandedId, setExpandedId] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Submissions & Rubric Grading state
  const [attempts, setAttempts] = useState<CandidateAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');

  // Evaluation modal state
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [selectedScores, setSelectedScores] = useState<RequirementScoreItem[]>([]);
  const [evaluationInputs, setEvaluationInputs] = useState<Record<string, { score: number; feedback: string }>>({});
  const [submittingEval, setSubmittingEval] = useState(false);

  const [formName, setFormName] = useState('');
  const [formVacancyId, setFormVacancyId] = useState('');
  const [formType, setFormType] = useState(ASSESSMENT_TYPES[0]);
  const [formCompetency, setFormCompetency] = useState(COMPETENCY_AREAS[0]);
  const [formDifficulty, setFormDifficulty] = useState('Senior');
  const [formDuration, setFormDuration] = useState('60 min');
  const [formRequirement, setFormRequirement] = useState('');

  const loadPendingAttempts = async () => {
    setLoadingAttempts(true);
    try {
      const res = await api.get('/assessments/company/pending-attempts');
      setAttempts(res.data?.attempts || []);
    } catch (err: any) {
      console.warn('Load pending attempts error:', err?.message);
    } finally {
      setLoadingAttempts(false);
    }
  };

  useEffect(() => {
    async function load() {
      const vList = await DataService.getVacancies();
      setVacancies(vList);
      if (vList.length > 0) setFormVacancyId(vList[0].id);
      loadPendingAttempts();
    }
    load();
  }, []);

  const openEvaluationModal = async (attemptId: string) => {
    try {
      const res = await api.get(`/assessments/company/attempts/${attemptId}`);
      if (res.data?.attempt) {
        setSelectedAttempt(res.data.attempt);
        const scores: RequirementScoreItem[] = res.data.requirementScores || [];
        setSelectedScores(scores);

        // Pre-fill inputs with existing scores and notes
        const initialInputs: Record<string, { score: number; feedback: string }> = {};
        scores.forEach(s => {
          const maxScenario = Math.round((Number(s.max_score) * 0.5) * 10) / 10;
          let existingScenario = 0;
          if (s.evaluation_status === 'EVALUATED') {
            const objectiveBase = Math.round((Number(s.score) > maxScenario ? maxScenario : Number(s.score)) * 10) / 10;
            existingScenario = Math.max(0, Math.round((Number(s.score) - objectiveBase) * 10) / 10);
          }
          initialInputs[s.requirement_id] = {
            score: existingScenario,
            feedback: '',
          };
        });
        setEvaluationInputs(initialInputs);
        setEvalModalOpen(true);
      }
    } catch (err: any) {
      toast.error('Failed to load candidate submission details');
    }
  };

  const handleScoreChange = (requirementId: string, maxAllowed: number, rawVal: string) => {
    const valNum = Number(rawVal);
    if (isNaN(valNum)) return;
    const bounded = Math.min(maxAllowed, Math.max(0, valNum));
    setEvaluationInputs(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        score: bounded,
      },
    }));
  };

  const handleFeedbackChange = (requirementId: string, feedback: string) => {
    setEvaluationInputs(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        feedback,
      },
    }));
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedAttempt) return;
    setSubmittingEval(true);

    try {
      const evaluations = Object.entries(evaluationInputs).map(([reqId, val]) => ({
        requirementId: reqId,
        scenarioScore: val.score,
        feedback: val.feedback,
      }));

      const res = await api.post(`/assessments/company/attempts/${selectedAttempt.id}/evaluate`, {
        evaluations,
      });

      if (res.data?.success) {
        toast.success(`Evaluation finalized! Final Score: ${res.data.finalScore} pts. Coverage updated.`);
        setEvalModalOpen(false);
        loadPendingAttempts();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to submit evaluation');
    } finally {
      setSubmittingEval(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormType(ASSESSMENT_TYPES[0]);
    setFormCompetency(COMPETENCY_AREAS[0]);
    setFormDifficulty('Senior');
    setFormDuration('60 min');
    setFormRequirement('');
    if (vacancies.length > 0) setFormVacancyId(vacancies[0].id);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    const vacancy = vacancies.find(v => v.id === formVacancyId);
    const newAssessment: Assessment = {
      id: 'AS-' + Math.floor(10 + Math.random() * 90),
      name: formName.trim(),
      vacancy: vacancy?.title || 'Open Role',
      vacancyId: formVacancyId,
      status: 'Active',
      version: 'v1.0',
      competencyArea: formCompetency,
      assessmentType: formType,
      duration: formDuration,
      difficulty: formDifficulty,
      questionCount: 5,
      integrity: 'Proctored & Monitored',
      modules: [
        { id: 'm1', name: 'Core Problem Solving', requirement: formRequirement || 'Algorithmic efficiency', questions: 3, avgScore: '82%' },
        { id: 'm2', name: 'Real-world Scenario', requirement: 'Practical Architecture', questions: 2, avgScore: '78%' },
      ],
    };
    setAssessments(prev => [newAssessment, ...prev]);
    setIsCreateOpen(false);
    resetForm();
    toast.success('Assessment created successfully');
  };

  const pendingCount = attempts.filter(a => a.grading_status === 'PENDING_REVIEW').length;

  const filteredAttempts = attempts.filter(a => {
    const matchesSearch =
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.candidate_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.vacancy_title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'PENDING') return a.grading_status === 'PENDING_REVIEW';
    if (statusFilter === 'GRADED') return a.grading_status === 'FULLY_GRADED';
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Assessments</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">
            {activeTab === 'grading' ? 'Candidate Rubric Evaluations' : 'Framework Setup'}
          </span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Assessments &amp; Recruiter Rubric Evaluation</h1>
            <p className="page-subtitle">
              Evaluate candidate free-text scenario answers against explicit role rubrics, compute objective scores, and update requirement coverage.
            </p>
          </div>
          {activeTab === 'modules' && (
            <button onClick={() => setIsCreateOpen(true)} className="btn btn-gold">
              <Plus size={16} /> Create Assessment
            </button>
          )}
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        <button
          type="button"
          onClick={() => setActiveTab('grading')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: activeTab === 'grading' ? '1px solid #d4af37' : '1px solid var(--border)',
            background: activeTab === 'grading' ? 'rgba(212, 175, 55, 0.12)' : '#ffffff',
            color: activeTab === 'grading' ? '#854d0e' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Award size={15} />
          <span>Candidate Submissions &amp; Rubric Grading</span>
          {pendingCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              fontSize: 10.5,
              fontWeight: 800,
              padding: '1px 7px',
              borderRadius: 99,
            }}>
              {pendingCount} Pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: activeTab === 'modules' ? '1px solid #d4af37' : '1px solid var(--border)',
            background: activeTab === 'modules' ? 'rgba(212, 175, 55, 0.12)' : '#ffffff',
            color: activeTab === 'modules' ? '#854d0e' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ClipboardList size={15} />
          <span>Assessment Frameworks &amp; Modules</span>
        </button>
      </div>

      {activeTab === 'grading' ? (
        <div>
          {/* Stats Bar (3 Columns matching 3 Cards for perfect grid alignment) */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            <div className="stat-card stat-card-gold" style={{ padding: '16px 20px' }}>
              <div className="stat-label">Pending Recruiter Evaluation</div>
              <div className="stat-value" style={{ fontSize: 26 }}>{pendingCount}</div>
            </div>
            <div className="stat-card stat-card-success" style={{ padding: '16px 20px' }}>
              <div className="stat-label">Fully Graded Assessments</div>
              <div className="stat-value" style={{ fontSize: 26 }}>
                {attempts.filter(a => a.grading_status === 'FULLY_GRADED').length}
              </div>
            </div>
            <div className="stat-card stat-card-brand" style={{ padding: '16px 20px' }}>
              <div className="stat-label">Total Submissions</div>
              <div className="stat-value" style={{ fontSize: 26 }}>{attempts.length}</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search candidate name, email, or vacancy..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`btn btn-xs ${statusFilter === 'ALL' ? 'btn-gold' : 'btn-secondary'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`btn btn-xs ${statusFilter === 'PENDING' ? 'btn-gold' : 'btn-secondary'}`}
              >
                Pending Review
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('GRADED')}
                className={`btn btn-xs ${statusFilter === 'GRADED' ? 'btn-gold' : 'btn-secondary'}`}
              >
                Fully Graded
              </button>
            </div>
          </div>

          {/* Submissions List */}
          {loadingAttempts ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading candidate assessment submissions...
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <Award size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No Candidate Submissions Found</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 440, margin: '6px auto 0' }}>
                When candidates complete their assessment for targeted vacancies, their objective scores and written scenario responses will appear here for rubric grading.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Target Vacancy</th>
                    <th>Submitted</th>
                    <th>Objective MCQ</th>
                    <th>Scenario Score</th>
                    <th>Total Score</th>
                    <th>Grading Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttempts.map(att => {
                    const isPending = att.grading_status === 'PENDING_REVIEW';
                    return (
                      <tr key={att.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {att.first_name} {att.last_name}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{att.candidate_email}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{att.vacancy_title}</span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: '#0369a1' }}>
                          {att.objective_score != null ? `${att.objective_score} pts` : '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: '#b45309' }}>
                          {att.scenario_score != null ? `${att.scenario_score} pts` : '0 pts'}
                        </td>
                        <td>
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                            {att.score != null ? `${att.score} / 100` : '—'}
                          </span>
                        </td>
                        <td>
                          {isPending ? (
                            <span className="badge badge-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={11} /> Pending Review
                            </span>
                          ) : (
                            <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={11} /> Fully Graded
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => openEvaluationModal(att.id)}
                            className={`btn btn-xs ${isPending ? 'btn-gold' : 'btn-secondary'}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            <FileText size={12} />
                            <span>{isPending ? 'Grade Scenarios' : 'Review Rubric'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Rubric Evaluation Modal */}
          {evalModalOpen && selectedAttempt && (
            <div className="modal-overlay" onClick={() => setEvalModalOpen(false)}>
              <div
                className="modal-card"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 780, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
              >
                <div className="modal-header">
                  <div>
                    <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>Evaluate Candidate Assessment</span>
                      <span className="badge badge-indigo" style={{ fontSize: 11 }}>
                        Objective Score: {selectedAttempt.objective_score || 0} pts
                      </span>
                    </div>
                    <div className="modal-subtitle">
                      Candidate: <strong>{selectedAttempt.first_name} {selectedAttempt.last_name}</strong> ({selectedAttempt.candidate_email}) &middot; Vacancy: <strong>{selectedAttempt.vacancy_title}</strong>
                    </div>
                  </div>
                  <button onClick={() => setEvalModalOpen(false)} className="btn-icon">
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    fontSize: 12.5,
                    color: '#92400e',
                    lineHeight: 1.5,
                  }}>
                    <strong>Recruiter Governance Standard:</strong> You are evaluating free-text scenarios against defined role criteria.
                    Scores are strictly bounded. Fully grading an assessment updates target requirement evidence coverage, but never triggers automated hiring or rejection decisions.
                  </div>

                  {selectedScores.map((scoreItem, idx) => {
                    const maxAllowedScenario = Math.round((Number(scoreItem.max_score) * 0.5) * 10) / 10;
                    const answersObj = scoreItem.candidate_answers || {};
                    const rubricObj = scoreItem.rubric_criteria || {};
                    const currentInput = evaluationInputs[scoreItem.requirement_id] || { score: 0, feedback: '' };

                    return (
                      <div
                        key={scoreItem.requirement_id}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          padding: '18px 20px',
                          background: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              Requirement #{idx + 1} ({scoreItem.importance || 'REQUIRED'})
                            </span>
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                              {scoreItem.requirement_name}
                            </h3>
                          </div>
                          <span style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 99,
                            background: '#f1f5f9',
                            color: '#475569',
                          }}>
                            Max Scenario: {maxAllowedScenario} pts
                          </span>
                        </div>

                        {/* Candidate Scenario Answer */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
                            Candidate's Submitted Written Scenario Response:
                          </div>
                          <div style={{
                            padding: '12px 14px',
                            background: '#f8fafc',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            fontSize: 13,
                            color: '#1e293b',
                            lineHeight: 1.55,
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                          }}>
                            {answersObj.textExplanation || 'No written response provided by candidate.'}
                          </div>
                        </div>

                        {/* Predefined Rubric Criteria */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
                            Evaluation Rubric Criteria:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {Array.isArray(rubricObj.criteria) ? rubricObj.criteria.map((c: any, cIdx: number) => (
                              <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', background: '#fdfbf7', padding: '6px 10px', borderRadius: 6, border: '1px solid #fef3c7' }}>
                                <span>&bull; {c.name}</span>
                                <span style={{ fontWeight: 700, color: '#854d0e' }}>Up to {c.maxPoints} pts</span>
                              </div>
                            )) : (
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Evaluate technical accuracy, practical feasibility, and domain depth (Max: {maxAllowedScenario} pts).
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recruiter Evaluation Inputs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                              Awarded Marks (0 &ndash; {maxAllowedScenario}) *
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={maxAllowedScenario}
                              step={0.5}
                              value={currentInput.score}
                              onChange={e => handleScoreChange(scoreItem.requirement_id, maxAllowedScenario, e.target.value)}
                              className="form-input"
                              style={{ fontWeight: 700, fontSize: 14 }}
                              required
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                              Evaluation Rationale / Feedback
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Demonstrated strong domain comprehension with specific implementation details."
                              value={currentInput.feedback}
                              onChange={e => handleFeedbackChange(scoreItem.requirement_id, e.target.value)}
                              className="form-input"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Human Recruiter Authority &middot; Audit trail recorded
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setEvalModalOpen(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submittingEval}
                      onClick={handleSubmitEvaluation}
                      className="btn btn-gold"
                    >
                      {submittingEval ? 'Saving Evaluation...' : 'Finalize & Update Coverage'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Frameworks & Modules Tab */
        <div>
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Assessments', value: assessments.length, cardClass: 'stat-card-gold' },
              { label: 'Active Assessments', value: assessments.filter(a => a.status === 'Active').length, cardClass: 'stat-card-success' },
              { label: 'Linked Vacancies', value: new Set(assessments.map(a => a.vacancyId)).size, cardClass: 'stat-card-warning' },
              { label: 'Assessment Types', value: new Set(assessments.map(a => a.assessmentType)).size || '-', cardClass: 'stat-card-brand' },
            ].map(s => (
              <div key={s.label} className={`stat-card ${s.cardClass}`} style={{ padding: '16px 20px' }}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: 26 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {assessments.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '60px 24px', textAlign: 'center', gap: 12,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', marginBottom: 4,
              }}>
                <ClipboardList size={28} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No Assessments Configured</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 380, lineHeight: 1.5 }}>
                Assessments are linked to vacancy requirements. Define your role requirements first, then configure assessment groups from the Requirements section.
              </div>
              <a href="/dashboard/requirements" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, marginTop: 4,
                background: '#f8fafc', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}>
                Go to Requirements &rarr;
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {assessments.map(a => {
                const isExpanded = expandedId === a.id;
                return (
                  <div key={a.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div
                      onClick={() => setExpandedId(isExpanded ? '' : a.id)}
                      style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'var(--white)', borderBottom: isExpanded ? '1px solid var(--border)' : 'none' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-sm" style={{ background: '#d5e3fc', color: '#00236f' }}>
                          <ClipboardList size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-primary)' }}>{a.name}</span>
                            <span className="badge badge-green" style={{ fontSize: 10 }}>{a.status}</span>
                            <span className="badge badge-gray" style={{ fontSize: 10 }}>{a.version}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            Role: <strong>{a.vacancy}</strong> &middot; {a.duration} &middot; {a.assessmentType}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="badge badge-indigo" style={{ fontSize: 11 }}>{a.difficulty}</span>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '20px 22px' }}>
                        <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
                          {[
                            { icon: <BookOpen size={14} />, label: 'Competency Area', value: a.competencyArea },
                            { icon: <Target size={14} />, label: 'Assessment Type', value: a.assessmentType },
                            { icon: <Clock size={14} />, label: 'Duration', value: a.duration },
                            { icon: <Shield size={14} />, label: 'Integrity', value: a.integrity },
                          ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: '#f8fafc', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                              <span style={{ color: 'var(--text-muted)', marginTop: 1 }}>{item.icon}</span>
                              <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.label}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 12 }}>
                          Evaluation Modules ({a.modules.length}):
                        </div>
                        <div className="grid-2" style={{ gap: 12 }}>
                          {a.modules.map(m => (
                            <div key={m.id} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{m.name}</span>
                                <span className="badge badge-green">{m.avgScore} Avg</span>
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                                Requirement: {m.requirement} &middot; {m.questions} Question(s)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isCreateOpen && (
            <div className="modal-overlay" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                <div className="modal-header">
                  <div>
                    <div className="modal-title">Create Assessment</div>
                    <div className="modal-subtitle">Link to a vacancy and define competency requirements</div>
                  </div>
                  <button onClick={() => { setIsCreateOpen(false); resetForm(); }} className="btn-icon">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Assessment Name *</label>
                      <input type="text" required placeholder="e.g. Senior Engineer Technical Assessment" value={formName} onChange={e => setFormName(e.target.value)} className="form-input" autoFocus />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Target Vacancy *</label>
                      <select value={formVacancyId} onChange={e => setFormVacancyId(e.target.value)} className="form-select" required>
                        {vacancies.length === 0 && <option value="">No vacancies available</option>}
                        {vacancies.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                      </select>
                    </div>
                    <div className="grid-2" style={{ gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">Assessment Type *</label>
                        <select value={formType} onChange={e => setFormType(e.target.value)} className="form-select">
                          {ASSESSMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Duration</label>
                        <select value={formDuration} onChange={e => setFormDuration(e.target.value)} className="form-select">
                          {['30 min','45 min','60 min','90 min','120 min'].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid-2" style={{ gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">Competency Area *</label>
                        <select value={formCompetency} onChange={e => setFormCompetency(e.target.value)} className="form-select">
                          {COMPETENCY_AREAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Difficulty Level</label>
                        <select value={formDifficulty} onChange={e => setFormDifficulty(e.target.value)} className="form-select">
                          {DIFFICULTY_LEVELS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Specific Requirement / Skill</label>
                      <input type="text" placeholder="e.g. PostgreSQL Query Optimisation, REST API Design..." value={formRequirement} onChange={e => setFormRequirement(e.target.value)} className="form-input" />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        The specific skill or job requirement this assessment covers
                      </span>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={() => { setIsCreateOpen(false); resetForm(); }} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-gold">Create Assessment</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
