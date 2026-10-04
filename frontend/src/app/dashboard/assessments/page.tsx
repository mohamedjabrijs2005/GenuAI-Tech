'use client';

import { useState, useEffect } from 'react';
import {
  ClipboardList, ChevronDown, ChevronUp,
  Plus, X, BookOpen, Target, Shield, Clock
} from 'lucide-react';
import { DataService, Vacancy } from '@/lib/dataService';
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
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [expandedId, setExpandedId] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formName, setFormName] = useState('');
  const [formVacancyId, setFormVacancyId] = useState('');
  const [formType, setFormType] = useState(ASSESSMENT_TYPES[0]);
  const [formCompetency, setFormCompetency] = useState(COMPETENCY_AREAS[0]);
  const [formDifficulty, setFormDifficulty] = useState('Senior');
  const [formDuration, setFormDuration] = useState('60 min');
  const [formRequirement, setFormRequirement] = useState('');

  useEffect(() => {
    async function load() {
      const vList = await DataService.getVacancies();
      setVacancies(vList);
      if (vList.length > 0) setFormVacancyId(vList[0].id);
    }
    load();
  }, []);

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
        {
          id: 'M-01',
          name: formRequirement.trim() || formCompetency,
          requirement: formRequirement.trim() || formCompetency,
          questions: 5,
          avgScore: 'Pending',
        },
      ],
    };
    setAssessments([newAssessment, ...assessments]);
    toast.success('Assessment created successfully');
    setIsCreateOpen(false);
    resetForm();
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Assessments</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Assessment Setup</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Assessment Setup</h1>
            <p className="page-subtitle">Define requirement-based assessments linked to your vacancies and competency framework.</p>
          </div>

        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Assessments', value: assessments.length, cardClass: 'stat-card-gold' },
          { label: 'Active Assessments', value: assessments.filter(a => a.status === 'Active').length, cardClass: 'stat-card-success' },
          { label: 'Linked Vacancies', value: new Set(assessments.map(a => a.vacancyId)).size, cardClass: 'stat-card-warning' },
          { label: 'Assessment Types', value: new Set(assessments.map(a => a.assessmentType)).size || '—', cardClass: 'stat-card-brand' },
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
            Go to Requirements →
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
                        Role: <strong>{a.vacancy}</strong> • {a.duration} • {a.assessmentType}
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
                            Requirement: {m.requirement} • {m.questions} Question(s)
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
  );
}
