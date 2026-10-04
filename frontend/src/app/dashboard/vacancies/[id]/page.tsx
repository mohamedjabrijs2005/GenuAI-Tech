'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Briefcase, MapPin, Clock, Users, FileCheck, Target,
  ChevronRight, Edit3, CheckCircle2, AlertTriangle, Calendar,
  ClipboardList, Shield, Download, Play, Pause, RefreshCw, Building2, Sparkles, Check
} from 'lucide-react';
import { DataService, Vacancy, Candidate, EvidenceService, VacancyVersion } from '@/lib/dataService';
import toast from 'react-hot-toast';

const STATUS_COLOR: Record<string, string> = {
  draft: 'badge-draft',
  pending: 'badge-pending',
  verified: 'badge-verified',
  published: 'badge-published',
  paused: 'badge-paused',
  closed: 'badge-closed',
};

const STAGE_COLOR: Record<string, string> = {
  Applied: 'badge-gray',
  Eligible: 'badge-blue',
  Verified: 'badge-indigo',
  Invited: 'badge-purple',
  Assessed: 'badge-yellow',
  Review: 'badge-yellow',
  Interview: 'badge-blue',
  Decision: 'badge-green',
};

export default function VacancyDetailPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const id = params?.id || 'vac-1';

  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [versions, setVersions] = useState<VacancyVersion[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'assessments' | 'applications' | 'versions'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [creatingVersion, setCreatingVersion] = useState(false);

  useEffect(() => {
    async function load() {
      const [v, c, vv] = await Promise.all([
        DataService.getVacancyById(id),
        DataService.getCandidates(),
        EvidenceService.getVacancyVersions(id),
      ]);
      setVacancy(v);
      setCandidates(c.filter(x => x.vacancyId === id));
      setVersions(vv);
      setIsLoading(false);
    }
    load();
  }, [id]);

  const handleCreateVersion = async () => {
    setCreatingVersion(true);
    const v = await EvidenceService.createVacancyVersion(id, 'Requirements or assessment configuration changed');
    if (v) { setVersions(prev => [v, ...prev]); toast.success(`Version ${v.version_number} created`); }
    else toast.error('Failed to create version');
    setCreatingVersion(false);
  };

  const handleVersionStatus = async (versionId: string, status: string) => {
    const v = await EvidenceService.updateVersionStatus(versionId, status);
    if (v) setVersions(prev => prev.map(x => x.id === versionId ? { ...x, status } : x));
  };

  const handleToggleStatus = async () => {
    if (!vacancy) return;
    const nextStatus = vacancy.status === 'paused' ? 'published' : 'paused';
    await DataService.updateVacancyStatus(vacancy.id, nextStatus);
    setVacancy({ ...vacancy, status: nextStatus });
    toast.success(`Vacancy status changed to ${nextStatus}`);
  };

  if (isLoading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <RefreshCw className="animate-spin text-muted" size={24} />
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-title">Vacancy not found</div>
          <Link href="/dashboard/vacancies" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>
            Return to Vacancies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <Link href="/dashboard/vacancies">Vacancies</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{vacancy.title}</span>
        </div>
        <div className="page-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/dashboard/vacancies" className="btn btn-ghost btn-icon">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 className="page-title" style={{ margin: 0 }}>{vacancy.title}</h1>
                <span className={`badge ${STATUS_COLOR[vacancy.status] || 'badge-gray'}`}>
                  {vacancy.status}
                </span>
              </div>
              <p className="page-subtitle" style={{ marginTop: 4 }}>
                {vacancy.dept} • {vacancy.location || 'Remote'} • {vacancy.openings} opening(s)
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleToggleStatus} className="btn btn-secondary btn-sm">
              {vacancy.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
              <span>{vacancy.status === 'paused' ? 'Resume Hiring' : 'Pause Vacancy'}</span>
            </button>
            <Link href="/dashboard/candidates" className="btn btn-gold btn-sm">
              <Users size={14} />
              <span>Pipeline ({candidates.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="stitch-tabs-container" style={{ marginBottom: 20 }}>
        <div className="stitch-tabs-list">
          {[
            { id: 'overview', label: 'Role Overview', icon: Briefcase },
            { id: 'requirements', label: 'Requirements Matrix', icon: Target },
            { id: 'assessments', label: 'Assessment Configuration', icon: ClipboardList },
            { id: 'applications', label: `Applicants (${candidates.length})`, icon: Users },
            { id: 'versions', label: `Versions (${versions.length})`, icon: CheckCircle2 },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`stitch-tab-btn ${activeTab === t.id ? 'active' : ''}`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid-3" style={{ gap: 24, alignItems: 'flex-start' }}>
          <div className="card" style={{ padding: 24, gridColumn: 'span 2' }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Job Description &amp; Scope</div>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              {vacancy.description || 'Architect distributed backend services and contribute to high-throughput data processing pipelines. You will collaborate with cross-functional product and infrastructure teams to deliver high-availability software.'}
            </p>

            <div className="card-title" style={{ fontSize: 14, marginBottom: 10 }}>Key Responsibilities</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Design, build, and maintain mission-critical backend microservices with sub-50ms latency.</li>
              <li>Collaborate with product designers and SREs to enforce automated testing and telemetry benchmarks.</li>
              <li>Participate in structured rubric evaluations with verified evidence standards.</li>
            </ul>
          </div>

          <div className="card" style={{ padding: 20, gridColumn: 'span 1' }}>
            <div className="card-title" style={{ fontSize: 14, marginBottom: 12 }}>Requisition Meta</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
              <div className="flex justify-between">
                <span className="td-muted">Department:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{vacancy.dept}</span>
              </div>
              <div className="flex justify-between">
                <span className="td-muted">Experience Level:</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-primary)' }}>{vacancy.experience_level || 'Senior'}</span>
              </div>
              <div className="flex justify-between">
                <span className="td-muted">Employment Type:</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-primary)' }}>{vacancy.employment_type?.replace('_', ' ') || 'Full Time'}</span>
              </div>
              <div className="flex justify-between">
                <span className="td-muted">Location:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{vacancy.location || 'Remote'}</span>
              </div>
              <div className="flex justify-between">
                <span className="td-muted">Created:</span>
                <span className="td-mono">{vacancy.created}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Requirements */}
      {activeTab === 'requirements' && (
        <div className="grid-2" style={{ gap: 16 }}>
          {[
            { name: 'Distributed Concurrency & Algorithms', cat: 'Technical', weight: 'High', method: 'Proctored Technical Sandbox' },
            { name: 'PostgreSQL Architecture & Query Optimization', cat: 'Technical', weight: 'High', method: 'SQL Schema & Query Execution' },
            { name: 'Kafka & Event Streaming Pipelines', cat: 'Architecture', weight: 'Medium', method: 'Simulation Scenario' },
            { name: 'Zero-Trust Microservice Security', cat: 'Security', weight: 'Medium', method: 'Security Code Audit' },
            { name: 'Technical Communication & Rubric Defense', cat: 'Soft Skills', weight: 'High', method: 'Structured Calibrated Interview' },
          ].map((r, i) => (
            <div key={i} className="card" style={{ padding: 18, borderLeft: '4px solid #00236f' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{r.name}</span>
                <span className="badge badge-gray">{r.cat}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Assessment Method: <strong>{r.method}</strong> • Priority: <strong>{r.weight}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Assessments */}
      {activeTab === 'assessments' && (
        <div className="card" style={{ padding: 24 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Assessment Battery Configuration</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Candidates are automatically dispatched a 3-part assessment module upon passing initial screening.
          </p>
          <div className="grid-3" style={{ gap: 14 }}>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>1. Algorithmic Sandbox</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>45 mins • 3 coding challenges</div>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>2. System Design Scenario</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>30 mins • Interactive architecture simulation</div>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>3. Rubric Interview Defense</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>45 mins • Calibrated interviewer session</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Applicants */}
      {activeTab === 'applications' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Stage</th>
                <th>Assessment Score</th>
                <th>Evidence Covered</th>
                <th>Integrity</th>
                <th>Applied Date</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    No candidates currently in this role pipeline.
                  </td>
                </tr>
              ) : (
                candidates.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${STAGE_COLOR[c.stage] || 'badge-gray'}`}>{c.stage}</span>
                    </td>
                    <td className="td-mono font-bold text-emerald-600">{c.score ? `${c.score}%` : '—'}</td>
                    <td className="td-mono font-semibold">{c.evidence}</td>
                    <td>
                      <span className="text-emerald-600 font-semibold" style={{ fontSize: 12 }}>
                        <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} /> Clear
                      </span>
                    </td>
                    <td className="td-muted td-mono">{c.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Tab: Versions */}
      {activeTab === 'versions' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div className="card-title">Vacancy Versions</div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                When requirements or assessment config changes after recruitment starts, create a new version.
                Candidates are always linked to the version they applied under.
              </p>
            </div>
            <button onClick={handleCreateVersion} disabled={creatingVersion}
              className="btn btn-gold btn-sm" style={{ gap: 6 }}>
              <RefreshCw size={13} className={creatingVersion ? 'animate-spin' : ''} />
              New Version
            </button>
          </div>
          {versions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">No versions yet</div>
              <div className="empty-text">Create a version to lock this vacancy configuration for official recruitment.</div>
              <button onClick={handleCreateVersion} className="btn btn-gold btn-sm" style={{ marginTop: 12 }}>Create Version 1</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {versions.map(v => {
                const statusColor: Record<string, string> = {
                  Active: '#059669', Draft: '#64748b', Verified: '#6366f1',
                  Paused: '#d97706', Closed: '#ba1a1a', Superseded: '#94a3b8',
                };
                const c = statusColor[v.status] || '#64748b';
                return (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-container-low)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: c }}>v{v.version_number}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Version {v.version_number}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {v.change_summary || 'Initial version'} · Created {new Date(v.created_at).toLocaleDateString()}
                          {v.application_count ? ` · ${v.application_count} application(s)` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: `${c}18`, color: c }}>{v.status}</span>
                      {v.status === 'Draft' && (
                        <button onClick={() => handleVersionStatus(v.id, 'Active')} className="btn btn-sm btn-secondary" style={{ fontSize: 12 }}>Activate</button>
                      )}
                      {v.status === 'Active' && (
                        <button onClick={() => handleVersionStatus(v.id, 'Paused')} className="btn btn-sm btn-secondary" style={{ fontSize: 12 }}>Pause</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
