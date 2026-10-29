'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Target,
  BookOpen,
  Cpu,
  FileCheck,
  Shield,
  Users,
  Mic,
  UserCheck,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  BarChart3,
  Zap,
  Download,
} from 'lucide-react';
import api from '@/lib/api';

/* ─── Types ────────────────────────────────────────────────────── */
interface FunnelData {
  targetsCreated: number;
  preparationStarted: number;
  practiceCompleted: number;
  assessmentSubmitted: number;
  evidenceSubmitted: number;
  coverageQualified: number;
  shortlisted: number;
  interviewed: number;
  hired: number;
}

interface ReadinessFunnelResponse {
  vacancyId: string;
  roleTitle: string;
  roleStatus: string;
  companyId: string;
  funnel: FunnelData;
}

interface ReadyCandidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  target_id: string;
  coverage_pct: number;
  application_status: string | null;
  targeted_at: string;
  last_activity_at: string;
}

/* ─── Funnel stage definitions ─────────────────────────────────── */
const FUNNEL_STAGES = [
  {
    key: 'targetsCreated' as keyof FunnelData,
    label: 'Target Created',
    sublabel: 'Candidates who committed to this role',
    icon: Target,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.3)',
  },
  {
    key: 'preparationStarted' as keyof FunnelData,
    label: 'Preparation Started',
    sublabel: 'Candidates who began learning resources',
    icon: BookOpen,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.3)',
  },
  {
    key: 'practiceCompleted' as keyof FunnelData,
    label: 'Practice Completed',
    sublabel: 'Candidates who submitted practice assessments',
    icon: Cpu,
    color: '#d97706',
    bg: 'rgba(217,119,6,0.1)',
    border: 'rgba(217,119,6,0.3)',
  },
  {
    key: 'assessmentSubmitted' as keyof FunnelData,
    label: 'Assessment Submitted',
    sublabel: 'Candidates who completed official assessments',
    icon: FileCheck,
    color: '#0284c7',
    bg: 'rgba(2,132,199,0.1)',
    border: 'rgba(2,132,199,0.3)',
  },
  {
    key: 'evidenceSubmitted' as keyof FunnelData,
    label: 'Evidence Submitted',
    sublabel: 'Candidates who provided capability evidence',
    icon: Shield,
    color: '#059669',
    bg: 'rgba(5,150,105,0.1)',
    border: 'rgba(5,150,105,0.3)',
  },
  {
    key: 'coverageQualified' as keyof FunnelData,
    label: 'Coverage Qualified',
    sublabel: 'Candidates meeting ≥60% requirement coverage',
    icon: BarChart3,
    color: '#b8860b',
    bg: 'rgba(184,134,11,0.1)',
    border: 'rgba(184,134,11,0.3)',
  },
  {
    key: 'shortlisted' as keyof FunnelData,
    label: 'Shortlisted by Recruiter',
    sublabel: 'Candidates advanced by recruiter decision',
    icon: UserCheck,
    color: '#be185d',
    bg: 'rgba(190,24,93,0.1)',
    border: 'rgba(190,24,93,0.3)',
  },
  {
    key: 'interviewed' as keyof FunnelData,
    label: 'Interviewed',
    sublabel: 'Candidates who attended an interview',
    icon: Mic,
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.1)',
    border: 'rgba(124,58,237,0.3)',
  },
  {
    key: 'hired' as keyof FunnelData,
    label: 'Hired',
    sublabel: 'Candidates selected for the role',
    icon: Zap,
    color: '#d4af37',
    bg: 'rgba(212,175,55,0.1)',
    border: 'rgba(212,175,55,0.35)',
  },
];

/* ─── Helpers ──────────────────────────────────────────────────── */
function dropPct(current: number, next: number): string {
  if (current === 0) return '—';
  const dropped = ((current - next) / current) * 100;
  return `${dropped.toFixed(0)}% drop`;
}

function barWidth(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.max(4, Math.round((value / max) * 100));
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function RoleReadinessFunnelPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const vacancyId = params?.id;

  const [funnel, setFunnel] = useState<ReadinessFunnelResponse | null>(null);
  const [readyCandidates, setReadyCandidates] = useState<ReadyCandidate[]>([]);
  const [showCandidates, setShowCandidates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [error, setError] = useState('');

  const loadFunnel = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/company/vacancies/${vacancyId}/readiness-funnel`);
      setFunnel(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load readiness funnel.');
    } finally {
      setLoading(false);
    }
  }, [vacancyId]);

  useEffect(() => {
    loadFunnel();
  }, [loadFunnel]);

  const handleViewReadyCandidates = async () => {
    if (showCandidates) {
      setShowCandidates(false);
      return;
    }
    setCandidatesLoading(true);
    try {
      const res = await api.get(`/company/vacancies/${vacancyId}/ready-candidates`);
      setReadyCandidates(res.data.candidates || []);
      setShowCandidates(true);
    } catch {
      setReadyCandidates([]);
      setShowCandidates(true);
    } finally {
      setCandidatesLoading(false);
    }
  };

  /* ── Loading ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '3px solid #e2e8f0',
          borderTopColor: '#b8860b',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Loading Role Readiness Funnel…</p>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────────── */
  if (error || !funnel) {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center', padding: '0 16px' }}>
        <div style={{
          background: '#fff', borderRadius: 14, padding: '36px 32px',
          border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: 12 }} />
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Funnel Unavailable</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{error || 'Vacancy not found or access denied.'}</p>
          <Link href="/dashboard/vacancies" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            ← Back to Vacancies
          </Link>
        </div>
      </div>
    );
  }

  const funnelData = funnel.funnel;
  const maxValue = funnelData.targetsCreated || 1;

  /* ── Main render ─────────────────────────────────────────────── */
  return (
    <div className="page-content">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="breadcrumbs">
          <Link href="/dashboard/vacancies">Vacancies</Link>
          <span className="breadcrumb-sep">/</span>
          <Link href={`/dashboard/vacancies/${vacancyId}`}>{funnel.roleTitle}</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Role Readiness Funnel</span>
        </div>

        <div className="page-header-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <Link href={`/dashboard/vacancies/${vacancyId}`} className="btn btn-ghost btn-icon" style={{ marginTop: 4 }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Role Readiness Funnel</h1>
                <span style={{
                  padding: '2px 10px', borderRadius: 99,
                  background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)',
                  fontSize: 11, fontWeight: 700, color: '#059669',
                }}>
                  LIVE
                </span>
              </div>
              <p className="page-subtitle" style={{ marginTop: 6 }}>
                {funnel.roleTitle} — track how candidates move from Target to Hire
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={loadFunnel} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} />
              Refresh
            </button>
            <button
              onClick={handleViewReadyCandidates}
              disabled={candidatesLoading}
              className="btn btn-gold"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px' }}
            >
              <Users size={15} />
              <span>{candidatesLoading ? 'Loading…' : showCandidates ? 'Hide Candidates' : 'View Ready Candidates'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Value Proposition Banner ─────────────────────────────── */}
      <div className="funnel-value-banner" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
        borderRadius: 14,
        padding: '22px 28px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            GenuAI Reduces Screening Time
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
            From <span style={{ color: '#fde68a' }}>{funnelData.targetsCreated} total candidates</span> to{' '}
            <span style={{ color: '#a5f3fc' }}>{funnelData.coverageQualified} evidence-backed</span> — ready for recruiter review
          </div>
        </div>
        <div className="funnel-banner-stats" style={{
          display: 'flex', gap: 20, flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 20px',
        }}>
          {[
            { label: 'Targeted', val: funnelData.targetsCreated, color: '#c7d2fe' },
            { label: 'Assessment Ready', val: funnelData.assessmentSubmitted, color: '#a5f3fc' },
            { label: 'Evidence Backed', val: funnelData.coverageQualified, color: '#fde68a' },
            { label: 'Hired', val: funnelData.hired, color: '#bbf7d0' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Funnel Bars ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          {/* Header */}
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <TrendingDown size={18} style={{ color: '#b8860b' }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
              Candidate Pipeline Funnel
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              {FUNNEL_STAGES.length} stages
            </span>
          </div>

          {/* Stage rows */}
          <div style={{ padding: '8px 0' }}>
            {FUNNEL_STAGES.map((stage, idx) => {
              const stageVal = funnelData[stage.key];
              const nextStage = FUNNEL_STAGES[idx + 1];
              const nextVal = nextStage ? funnelData[nextStage.key] : null;
              const width = barWidth(stageVal, maxValue);
              const Icon = stage.icon;

              return (
                <div
                  key={stage.key}
                  className="funnel-stage-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 24px',
                    borderBottom: idx < FUNNEL_STAGES.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Step number + icon */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    minWidth: 32, flexShrink: 0,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: stage.bg,
                      border: `1px solid ${stage.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={15} style={{ color: stage.color }} />
                    </div>
                  </div>

                  {/* Label */}
                  <div className="funnel-stage-label-wrap" style={{ minWidth: 0, flex: '0 0 220px', flexShrink: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {stage.label}
                    </div>
                    <div className="funnel-stage-sublabel" style={{ fontSize: 11, color: '#94a3b8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {stage.sublabel}
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="funnel-stage-bar-wrap" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      height: 12, background: '#f1f5f9', borderRadius: 99,
                      overflow: 'hidden', position: 'relative',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${width}%`,
                        background: `linear-gradient(90deg, ${stage.color}aa, ${stage.color})`,
                        borderRadius: 99,
                        transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                      }} />
                    </div>
                    {nextVal !== null && stageVal > 0 && (
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>
                        <ChevronRight size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
                        {dropPct(stageVal, nextVal)} to next stage
                      </div>
                    )}
                  </div>

                  {/* Count */}
                  <div className="funnel-stage-count-wrap" style={{
                    minWidth: 56, textAlign: 'right', flexShrink: 0,
                  }}>
                    <span style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: stageVal > 0 ? stage.color : '#cbd5e1',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1,
                      display: 'block',
                    }}>
                      {stageVal}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                      {maxValue > 0 ? Math.round((stageVal / maxValue) * 100) : 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Stage Cards Grid (mobile-friendly overview) ──────────── */}
      <div className="stage-cards-auto-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 28,
      }}>
        {FUNNEL_STAGES.map((stage) => {
          const val = funnelData[stage.key];
          const Icon = stage.icon;
          return (
            <div key={stage.key} style={{
              background: '#fff',
              border: `1px solid ${stage.border}`,
              borderRadius: 12,
              padding: '16px 18px',
              transition: 'transform 0.15s, box-shadow 0.15s',
              cursor: 'default',
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${stage.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: stage.bg, border: `1px solid ${stage.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 10,
              }}>
                <Icon size={17} style={{ color: stage.color }} />
              </div>
              <div style={{
                fontSize: 28, fontWeight: 900, color: val > 0 ? stage.color : '#cbd5e1',
                lineHeight: 1, marginBottom: 4,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {val}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── View Ready Candidates Panel ──────────────────────────── */}
      {showCandidates && (
        <div style={{ marginBottom: 28 }}>
          <div style={{
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            {/* Panel Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'rgba(184,134,11,0.15)',
                  border: '1px solid rgba(184,134,11,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <UserCheck size={18} style={{ color: '#b8860b' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#92400e' }}>
                    Ready Candidates
                  </div>
                  <div style={{ fontSize: 12, color: '#a16207' }}>
                    Created Target · Submitted Assessment · Submitted Evidence · ≥60% Coverage
                  </div>
                </div>
              </div>
              <span style={{
                padding: '4px 14px', borderRadius: 99,
                background: '#b8860b', color: '#fff',
                fontSize: 13, fontWeight: 800,
              }}>
                {readyCandidates.length} candidate{readyCandidates.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Candidates Table */}
            {readyCandidates.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <Users size={36} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>No ready candidates yet</div>
                <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 400, margin: '0 auto' }}>
                  Candidates appear here once they complete Target creation, assessment, evidence submission, and meet coverage requirements.
                </div>
              </div>
            ) : (
              <div className="ready-candidates-table-wrap" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                      {['Candidate', 'Coverage', 'Application Status', 'Last Activity', 'Actions'].map((h) => (
                        <th key={h} style={{
                          padding: '10px 16px', textAlign: 'left',
                          fontSize: 11, fontWeight: 700, color: '#64748b',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {readyCandidates.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                            {c.first_name} {c.last_name}
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.email}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              height: 6, width: 64, background: '#e2e8f0',
                              borderRadius: 99, overflow: 'hidden',
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${Math.min(100, c.coverage_pct)}%`,
                                background: c.coverage_pct >= 80 ? '#059669' : c.coverage_pct >= 60 ? '#d97706' : '#ef4444',
                                borderRadius: 99,
                              }} />
                            </div>
                            <span style={{
                              fontSize: 13, fontWeight: 800,
                              color: c.coverage_pct >= 80 ? '#059669' : c.coverage_pct >= 60 ? '#d97706' : '#ef4444',
                            }}>
                              {Math.round(c.coverage_pct)}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {c.application_status ? (
                            <span style={{
                              padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                              background: '#f1f5f9', color: '#475569',
                              border: '1px solid #e2e8f0',
                            }}>
                              {c.application_status}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(c.last_activity_at).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <Link
                            href={`/dashboard/candidates`}
                            className="btn btn-secondary btn-sm"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
                          >
                            <ExternalLink size={12} />
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Business Value Explainer ─────────────────────────────── */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '24px 28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 16,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChart3 size={17} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
            Why this funnel matters
          </div>
        </div>

        <div className="value-explainer-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 14,
        }}>
          {[
            {
              title: 'Without GenuAI',
              desc: 'You receive 500+ resumes with no way to know who prepared for the role. Every candidate looks the same.',
              color: '#ef4444',
              bg: '#fef2f2',
              border: '#fecaca',
            },
            {
              title: 'With GenuAI',
              desc: `You see exactly ${funnelData.coverageQualified} candidates who proved capability through preparation, assessment, and evidence.`,
              color: '#059669',
              bg: '#f0fdf4',
              border: '#a7f3d0',
            },
            {
              title: 'Recruiter Time Saved',
              desc: `Instead of screening ${funnelData.targetsCreated} candidates, your recruiter focuses on ${funnelData.coverageQualified} evidence-backed candidates.`,
              color: '#b8860b',
              bg: '#fffbeb',
              border: '#fde68a',
            },
          ].map(({ title, desc, color, bg, border }) => (
            <div key={title} style={{
              background: bg, border: `1px solid ${border}`,
              borderRadius: 10, padding: '16px 18px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
