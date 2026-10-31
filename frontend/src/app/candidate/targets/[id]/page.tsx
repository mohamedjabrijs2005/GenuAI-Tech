'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Target,
  Layers,
  BookOpen,
  ClipboardCheck,
  BadgeCheck,
  FileCheck,
  Shield,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Briefcase,
  AlertCircle,
  ArrowLeft,
  Info,
  Check,
  Play,
  RotateCcw,
  Zap,
  ChevronRight,
  Circle,
  Minus,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Status helpers ───────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    COMPLETED:    { bg: '#dcfce7', color: '#166534', label: 'Completed' },
    IN_PROGRESS:  { bg: '#fef3c7', color: '#b45309', label: 'In Progress' },
    NOT_STARTED:  { bg: '#f1f5f9', color: '#475569', label: 'Not Started' },
    SUBMITTED:    { bg: '#eff6ff', color: '#1e40af', label: 'Submitted' },
    APPROVED:     { bg: '#dcfce7', color: '#166534', label: 'Approved' },
    FULLY_GRADED: { bg: '#dcfce7', color: '#166534', label: 'Graded' },
    AVAILABLE:    { bg: '#f1f5f9', color: '#475569', label: 'Available' },
    'N/A':        { bg: '#f8fafc', color: '#94a3b8', label: 'N/A' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', label: status };
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function reqStatusIcon(status: string) {
  if (status === 'COMPLETED') return <CheckCircle2 size={18} color="#16a34a" />;
  if (status === 'IN_PROGRESS') return <Clock size={18} color="#d97706" />;
  return <Circle size={18} color="#cbd5e1" />;
}

function coverageColor(pct: number) {
  if (pct >= 75) return '#16a34a';
  if (pct >= 40) return '#d97706';
  return '#ef4444';
}

// ─── Timeline step ────────────────────────────────────────────────────────────
function TimelineStep({ label, status, icon }: { label: string; status: 'COMPLETED' | 'ACTIVE' | 'PENDING'; icon: React.ReactNode }) {
  const bg = status === 'COMPLETED' ? '#f0fdf4' : status === 'ACTIVE' ? '#eff6ff' : '#f8fafc';
  const border = status === 'COMPLETED' ? '#bbf7d0' : status === 'ACTIVE' ? '#bfdbfe' : '#e2e8f0';
  const dot = status === 'COMPLETED' ? '#16a34a' : status === 'ACTIVE' ? '#2563eb' : '#cbd5e1';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dot }}>
        {icon}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: status === 'PENDING' ? '#94a3b8' : '#1e293b', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

export default function TargetWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const targetId = params?.id as string;

  const [target, setTarget] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [reqStatus, setReqStatus] = useState<any>(null);  // per-requirement status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedReq, setExpandedReq] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const [ws, rs] = await Promise.all([
        api.get(`/candidate-portal/targets/${targetId}`),
        api.get(`/candidate-portal/targets/${targetId}/requirement-status`).catch(() => ({ data: null })),
      ]);
      setTarget(ws.data?.target);
      setRequirements(ws.data?.requirements || []);
      setCoverage(ws.data?.coverage);
      setProgress(ws.data?.progress);
      if (rs.data) setReqStatus(rs.data);
    } catch (err) {
      setError('Target workspace not found or access denied.');
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Target Workspace...</div>
        </div>
      </div>
    );
  }

  if (error || !target) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <AlertCircle size={36} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Workspace Unavailable</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{error}</p>
        <Link href="/candidate/targets" className="btn btn-secondary" style={{ textDecoration: 'none' }}>← Back to Targets</Link>
      </div>
    );
  }

  const summary = reqStatus?.summary;
  const coveragePct = summary?.coveragePct ?? 0;
  const nextAction = reqStatus?.nextAction;
  const reqList: any[] = reqStatus?.requirements || [];
  const assessmentStatus = reqStatus?.assessmentStatus || 'AVAILABLE';

  const totalReqs = requirements.length;
  const supportedCount = coverage?.supportedCount || 0;

  // Timeline statuses
  const learnSt = progress?.learning?.status;
  const practiceSt = progress?.practice?.status;
  const tlLearn: 'COMPLETED' | 'ACTIVE' | 'PENDING' = learnSt === 'COMPLETED' ? 'COMPLETED' : learnSt === 'IN_PROGRESS' ? 'ACTIVE' : 'PENDING';
  const tlPractice: 'COMPLETED' | 'ACTIVE' | 'PENDING' = practiceSt === 'COMPLETED' ? 'COMPLETED' : practiceSt === 'IN_PROGRESS' ? 'ACTIVE' : 'PENDING';
  const tlAssess: 'COMPLETED' | 'ACTIVE' | 'PENDING' = assessmentStatus === 'FULLY_GRADED' ? 'COMPLETED' : ['SUBMITTED', 'IN_PROGRESS', 'PARTIALLY_GRADED'].includes(assessmentStatus) ? 'ACTIVE' : 'PENDING';
  const tlEvidence: 'COMPLETED' | 'ACTIVE' | 'PENDING' = (progress?.evidence?.approved || 0) > 0 ? 'COMPLETED' : (progress?.evidence?.totalSubmitted || 0) > 0 ? 'ACTIVE' : 'PENDING';
  const tlCoverage: 'COMPLETED' | 'ACTIVE' | 'PENDING' = coveragePct === 100 ? 'COMPLETED' : coveragePct > 0 ? 'ACTIVE' : 'PENDING';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back */}
      <div>
        <Link href="/candidate/targets" style={{ fontSize: 12.5, color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <ArrowLeft size={14} />Back to All Targets
        </Link>
      </div>

      {/* ── Hero Card ─────────────────────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', borderRadius: 12, padding: '28px 32px', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 10px', borderRadius: 99, background: '#fef3c7', border: '1px solid #fde68a', fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                Target Workspace
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 99, background: '#f1f5f9', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                {target.target_status}
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 99, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 11, fontWeight: 700, color: '#1e40af' }}>
                {target.vacancy_status || 'PUBLISHED'}
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 8px', color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
              {target.vacancy_title} — {target.company_name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={14} />{target.company_name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} />{target.location || 'Remote'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} />Targeted: {new Date(target.targeted_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Coverage pill */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', minWidth: 200, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Overall Coverage</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: coverageColor(coveragePct), marginBottom: 4 }}>{coveragePct}%</div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${coveragePct}%`, background: coverageColor(coveragePct), borderRadius: 99, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b' }}>{summary?.completed || 0} of {totalReqs} requirements done</div>
          </div>
        </div>

        {/* Next Best Action */}
        {nextAction && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={16} color="#d97706" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Next Best Action</span>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href={nextAction.link}
                className="btn btn-gold"
                style={{ textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowRight size={14} />
                {nextAction.label}
              </Link>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Based on your current progress</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Progress Timeline ─────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Preparation Timeline
        </h2>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
          <TimelineStep label="Learn" status={tlLearn} icon={<BookOpen size={16} />} />
          <div style={{ flex: 0.5, height: 2, background: tlLearn === 'COMPLETED' ? '#bbf7d0' : '#e2e8f0', marginTop: 18 }} />
          <TimelineStep label="Practice" status={tlPractice} icon={<ClipboardCheck size={16} />} />
          <div style={{ flex: 0.5, height: 2, background: tlPractice === 'COMPLETED' ? '#bbf7d0' : '#e2e8f0', marginTop: 18 }} />
          <TimelineStep label="Assessment" status={tlAssess} icon={<BadgeCheck size={16} />} />
          <div style={{ flex: 0.5, height: 2, background: tlAssess === 'COMPLETED' ? '#bbf7d0' : '#e2e8f0', marginTop: 18 }} />
          <TimelineStep label="Evidence" status={tlEvidence} icon={<FileCheck size={16} />} />
          <div style={{ flex: 0.5, height: 2, background: tlEvidence === 'COMPLETED' ? '#bbf7d0' : '#e2e8f0', marginTop: 18 }} />
          <TimelineStep label="Coverage" status={tlCoverage} icon={<Shield size={16} />} />
        </div>
      </div>

      {/* ── Role Requirement Checklist ─────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Role Requirements Checklist ({totalReqs})
          </h2>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} color="#16a34a" /> {summary?.completed || 0} Done</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} color="#d97706" /> {summary?.inProgress || 0} In Progress</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Circle size={12} color="#cbd5e1" /> {summary?.notStarted || 0} Not Started</span>
          </div>
        </div>

        {reqList.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <Layers size={28} style={{ margin: '0 auto 10px', color: '#94a3b8' }} />
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>No requirements found for this role. The company may not have defined them yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reqList.map((req, idx) => {
              const isExpanded = expandedReq === req.id;
              const borderColor = req.status === 'COMPLETED' ? '#bbf7d0' : req.status === 'IN_PROGRESS' ? '#fde68a' : '#e2e8f0';
              const bg = req.status === 'COMPLETED' ? '#f0fdf4' : req.status === 'IN_PROGRESS' ? '#fffbeb' : '#ffffff';

              return (
                <div
                  key={req.id}
                  style={{ borderRadius: 10, border: `1px solid ${borderColor}`, background: bg, overflow: 'hidden' }}
                >
                  {/* Row header */}
                  <button
                    type="button"
                    onClick={() => setExpandedReq(isExpanded ? null : req.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 18px', background: 'transparent', border: 'none',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{reqStatusIcon(req.status)}</span>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginRight: 8 }}>#{idx + 1}</span>
                      {req.name}
                    </span>
                    {/* Status mini badges */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#f1f5f9', color: '#64748b' }}>
                        📚 {req.learn.status === 'N/A' ? 'N/A' : req.learn.status === 'COMPLETED' ? '✓' : req.learn.status === 'IN_PROGRESS' ? '~' : '○'}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#f1f5f9', color: '#64748b' }}>
                        🏋 {req.practice.status === 'COMPLETED' ? '✓' : req.practice.status === 'IN_PROGRESS' ? '~' : '○'}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#f1f5f9', color: '#64748b' }}>
                        📋 {req.assessment.status === 'FULLY_GRADED' ? '✓' : req.assessment.status === 'SUBMITTED' ? '~' : '○'}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#f1f5f9', color: '#64748b' }}>
                        📁 {req.evidence.status === 'APPROVED' ? '✓' : req.evidence.status === 'SUBMITTED' ? '~' : '○'}
                      </span>
                    </div>
                    <ChevronRight size={14} color="#94a3b8" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: '0.2s', flexShrink: 0 }} />
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${borderColor}` }}>
                      {req.description && (
                        <p style={{ fontSize: 12.5, color: '#475569', margin: '12px 0 14px', lineHeight: 1.5 }}>{req.description}</p>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                        {/* Learn */}
                        <div style={{ padding: '12px 14px', borderRadius: 8, background: '#fafaf9', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', marginBottom: 4 }}>📚 Learn</div>
                          {statusBadge(req.learn.status)}
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                            {req.learn.status === 'N/A' ? 'No resources' : `${req.learn.completed}/${req.learn.total} resources`}
                          </div>
                          <Link href={`/candidate/targets/${targetId}/learn`} style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
                            Open <ArrowRight size={10} />
                          </Link>
                        </div>

                        {/* Practice */}
                        <div style={{ padding: '12px 14px', borderRadius: 8, background: '#fafaf9', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', marginBottom: 4 }}>🏋 Practice</div>
                          {statusBadge(req.practice.status)}
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                            {req.practice.attempts} attempt{req.practice.attempts !== 1 ? 's' : ''}
                            {req.practice.bestScore != null ? ` · Best: ${req.practice.bestScore}%` : ''}
                          </div>
                          <Link href={`/candidate/targets/${targetId}/practice`} style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
                            Open <ArrowRight size={10} />
                          </Link>
                        </div>

                        {/* Assessment */}
                        <div style={{ padding: '12px 14px', borderRadius: 8, background: '#fafaf9', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 4 }}>📋 Assessment</div>
                          {statusBadge(req.assessment.status)}
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                            {req.assessment.score != null ? `Score: ${req.assessment.score}%` : 'Official test'}
                          </div>
                          <Link href={`/candidate/targets/${targetId}/assessment`} style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
                            Open <ArrowRight size={10} />
                          </Link>
                        </div>

                        {/* Evidence */}
                        <div style={{ padding: '12px 14px', borderRadius: 8, background: '#fafaf9', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', marginBottom: 4 }}>📁 Evidence</div>
                          {statusBadge(req.evidence.status)}
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                            {req.evidence.total} submitted · {req.evidence.approved} approved
                          </div>
                          <Link href={`/candidate/targets/${targetId}/evidence`} style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
                            Open <ArrowRight size={10} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Module Links ────────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Preparation Modules
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { href: `/candidate/targets/${targetId}/learn`, icon: <BookOpen size={18} />, color: 'rgba(212,175,55,0.15)', iconColor: '#854d0e', title: 'Target-Based Learn', desc: 'Curated resources by requirement' },
            { href: `/candidate/targets/${targetId}/practice`, icon: <ClipboardCheck size={18} />, color: 'rgba(16,185,129,0.1)', iconColor: '#10b981', title: 'Practice Sandbox', desc: 'Self-check exercises, private results' },
            { href: `/candidate/targets/${targetId}/assessment`, icon: <BadgeCheck size={18} />, color: 'rgba(139,92,246,0.1)', iconColor: '#8b5cf6', title: 'Official Assessment', desc: 'Company-graded evaluation session' },
            { href: `/candidate/targets/${targetId}/evidence`, icon: <FileCheck size={18} />, color: 'rgba(234,88,12,0.1)', iconColor: '#ea580c', title: 'Evidence Locker', desc: 'Submit work samples & credentials' },
            { href: `/candidate/targets/${targetId}/coverage`, icon: <Shield size={18} />, color: 'rgba(6,95,70,0.1)', iconColor: '#065f46', title: 'Coverage & Gaps', desc: 'Requirement coverage matrix' },
            { href: `/candidate/targets/${targetId}/requirements`, icon: <Layers size={18} />, color: 'rgba(59,130,246,0.1)', iconColor: '#3b82f6', title: 'Requirements Workspace', desc: 'Full requirement detail view' },
          ].map(m => (
            <Link key={m.href} href={m.href} style={{ textDecoration: 'none', color: 'inherit' }} className="card dashboard-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ padding: 8, borderRadius: 8, background: m.color, color: m.iconColor }}>{m.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{m.title}</h3>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px', lineHeight: 1.4 }}>{m.desc}</p>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                Open <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Privacy footer */}
      <div style={{ padding: '14px 18px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
        <strong>Privacy & Role Boundary:</strong> Recruiters at <strong>{target.company_name}</strong> see only official assessment results and submitted evidence. Private practice attempts and unsubmitted tests are never visible to them.
      </div>
    </div>
  );
}
