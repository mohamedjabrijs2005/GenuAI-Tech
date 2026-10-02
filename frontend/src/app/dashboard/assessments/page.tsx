'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronUp,
  Lock, Eye, Plus, BarChart2, Users, Calendar, Zap, Sparkles, X
} from 'lucide-react';
import { DataService, Vacancy } from '@/lib/dataService';
import toast from 'react-hot-toast';

interface AssessmentGroup {
  id: string;
  name: string;
  vacancy: string;
  status: 'Active' | 'Draft';
  version: string;
  type: string;
  duration: string;
  questionCount: number;
  difficulty: string;
  integrity: string;
  evaluationGroups: {
    id: string;
    name: string;
    requirement: string;
    questions: number;
    avgScore: string;
  }[];
}

export default function AssessmentsPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [groups, setGroups] = useState<AssessmentGroup[]>([]);
  const [expandedId, setExpandedId] = useState<string>('AG-01');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVacancy, setNewVacancy] = useState('');
  const [newDuration, setNewDuration] = useState('60 min');

  useEffect(() => {
    async function load() {
      const vList = await DataService.getVacancies();
      setVacancies(vList);
      const defaultGroups: AssessmentGroup[] = [
        {
          id: 'AG-01',
          name: 'Distributed Systems & Concurrency Sandbox',
          vacancy: vList[0]?.title || 'Senior Backend Engineer',
          status: 'Active',
          version: 'v1.0',
          type: 'Live Sandbox & Algorithmic Unit Tests',
          duration: '60 min',
          questionCount: 3,
          difficulty: 'Hard',
          integrity: 'Full Proctoring & Memory Sandboxing',
          evaluationGroups: [
            { id: 'EG-01', name: 'Lock-Free Queue Implementation', requirement: 'Concurrency & Go', questions: 1, avgScore: '88%' },
            { id: 'EG-02', name: 'PostgreSQL Index Plan Optimization', requirement: 'SQL & Database Architecture', questions: 2, avgScore: '92%' },
          ],
        },
        {
          id: 'AG-02',
          name: 'System Design & Architectural Trade-offs',
          vacancy: vList[0]?.title || 'Senior Backend Engineer',
          status: 'Active',
          version: 'v1.0',
          type: 'Interactive Architecture Simulation',
          duration: '45 min',
          questionCount: 2,
          difficulty: 'Medium → Hard',
          integrity: 'Telemetry Monitoring',
          evaluationGroups: [
            { id: 'EG-03', name: 'Kafka Partitioning & Idempotency', requirement: 'Event Streaming', questions: 1, avgScore: '85%' },
            { id: 'EG-04', name: 'Zero-Trust Authentication Audit', requirement: 'Security', questions: 1, avgScore: '81%' },
          ],
        },
      ];
      setGroups(defaultGroups);
    }
    load();
  }, []);

  const handleCreateBattery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGroup: AssessmentGroup = {
      id: 'AG-' + Math.floor(10 + Math.random() * 90),
      name: newTitle.trim(),
      vacancy: newVacancy || vacancies[0]?.title || 'Senior Backend Engineer',
      status: 'Active',
      version: 'v1.0',
      type: 'Proctored Assessment Battery',
      duration: newDuration,
      questionCount: 5,
      difficulty: 'Medium → Hard',
      integrity: 'Full Proctoring',
      evaluationGroups: [
        { id: 'EG-new', name: 'Core Competency Benchmark', requirement: 'Technical Requirements', questions: 5, avgScore: 'Pending' },
      ],
    };

    setGroups([newGroup, ...groups]);
    toast.success('Assessment battery created and linked to role');
    setIsCreateOpen(false);
    setNewTitle('');
  };

  return (
    <div className="page-content">
      {/* Header with single primary action */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Assessments</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Assessment Batteries</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              Assessment Battery Configuration
            </h1>
            <p className="page-subtitle">Configure sandboxed evaluations, proctoring security parameters, and calibrated scoring criteria.</p>
          </div>
          <button onClick={() => setIsCreateOpen(true)} className="btn btn-gold">
            <Plus size={16} />
            Create Assessment Battery
          </button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Active Assessment Suites', value: groups.length, color: 'var(--brand-light)', cardClass: 'stat-card-gold' },
          { label: 'Average Evaluation Score', value: '86.5%', color: 'var(--success)', cardClass: 'stat-card-success' },
          { label: 'Proctored Telemetry Integrity', value: '100% Monitored', color: 'var(--warning)', cardClass: 'stat-card-warning' },
          { label: 'Evidence Output Hashes', value: 'SHA-256 Hashed', color: 'var(--text-muted)', cardClass: 'stat-card-brand' },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.cardClass}`} style={{ padding: '16px 20px' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 26 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Assessment Groups List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups.map((ag) => {
          const isExpanded = expandedId === ag.id;
          return (
            <div key={ag.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                onClick={() => setExpandedId(isExpanded ? '' : ag.id)}
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: isExpanded ? '#f8fafc' : 'var(--white)',
                  borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="avatar avatar-sm" style={{ background: '#d5e3fc', color: '#00236f' }}>
                    <ClipboardList size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-primary)' }}>{ag.name}</span>
                      <span className="badge badge-green" style={{ fontSize: 10 }}>{ag.status}</span>
                      <span className="badge badge-gray" style={{ fontSize: 10 }}>{ag.version}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Role: <strong>{ag.vacancy}</strong> • {ag.duration} • {ag.type}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="badge badge-indigo" style={{ fontSize: 11 }}>
                    {ag.integrity}
                  </span>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 12 }}>
                    Evaluation Modules &amp; Sub-Competencies ({ag.evaluationGroups.length}):
                  </div>
                  <div className="grid-2" style={{ gap: 12 }}>
                    {ag.evaluationGroups.map((eg) => (
                      <div key={eg.id} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{eg.name}</span>
                          <span className="badge badge-green">{eg.avgScore} Avg</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                          Requirement: {eg.requirement} • {eg.questions} Question(s)
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

      {/* Create Assessment Modal */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Create Assessment Battery</div>
                <div className="modal-subtitle">Define module parameters and competency linkage</div>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBattery} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Battery Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Concurrency & Performance Sandbox"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Target Vacancy</label>
                    <select
                      value={newVacancy}
                      onChange={e => setNewVacancy(e.target.value)}
                      className="form-select"
                    >
                      {vacancies.map(v => (
                        <option key={v.id} value={v.title}>{v.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <select
                      value={newDuration}
                      onChange={e => setNewDuration(e.target.value)}
                      className="form-select"
                    >
                      <option value="30 min">30 min</option>
                      <option value="45 min">45 min</option>
                      <option value="60 min">60 min</option>
                      <option value="90 min">90 min</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold">
                  Create Battery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
