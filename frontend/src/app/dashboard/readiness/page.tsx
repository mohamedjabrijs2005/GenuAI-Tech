'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingDown,
  Target,
  BookOpen,
  Cpu,
  FileCheck,
  Shield,
  Users,
  Mic,
  UserCheck,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  BarChart3,
  Zap,
  Briefcase,
  Sparkles,
  Plus,
  AlertCircle,
  Building2,
} from 'lucide-react';
import api from '@/lib/api';
import { DataService, Vacancy } from '@/lib/dataService';
import { useAuth } from '@/contexts/AuthContext';

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

/* ─── Zero Initial Funnel Data ─────────────────────────────────── */
const EMPTY_FUNNEL: FunnelData = {
  targetsCreated: 0,
  preparationStarted: 0,
  practiceCompleted: 0,
  assessmentSubmitted: 0,
  evidenceSubmitted: 0,
  coverageQualified: 0,
  shortlisted: 0,
  interviewed: 0,
  hired: 0,
};

/* ─── Funnel Stage Config ──────────────────────────────────────── */
const FUNNEL_STAGES = [
  {
    key: 'targetsCreated' as keyof FunnelData,
    label: 'Target Created',
    sublabel: 'Candidates who committed to this role',
    icon: Target,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.25)',
  },
  {
    key: 'preparationStarted' as keyof FunnelData,
    label: 'Preparation Started',
    sublabel: 'Candidates who began learning resources',
    icon: BookOpen,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
  },
  {
    key: 'practiceCompleted' as keyof FunnelData,
    label: 'Practice Completed',
    sublabel: 'Candidates who submitted practice assessments',
    icon: Cpu,
    color: '#d97706',
    bg: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.25)',
  },
  {
    key: 'assessmentSubmitted' as keyof FunnelData,
    label: 'Assessment Submitted',
    sublabel: 'Candidates who completed official assessments',
    icon: FileCheck,
    color: '#0284c7',
    bg: 'rgba(2,132,199,0.08)',
    border: 'rgba(2,132,199,0.25)',
  },
  {
    key: 'evidenceSubmitted' as keyof FunnelData,
    label: 'Evidence Submitted',
    sublabel: 'Candidates who submitted verified artifacts',
    icon: Shield,
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
    border: 'rgba(5,150,105,0.25)',
  },
  {
    key: 'coverageQualified' as keyof FunnelData,
    label: 'Coverage Qualified',
    sublabel: 'Candidates meeting minimum coverage (≥60%)',
    icon: UserCheck,
    color: '#b8860b',
    bg: 'rgba(184,134,11,0.08)',
    border: 'rgba(184,134,11,0.3)',
  },
  {
    key: 'shortlisted' as keyof FunnelData,
    label: 'Shortlisted',
    sublabel: 'Candidates advanced to recruiter review',
    icon: Users,
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.25)',
  },
  {
    key: 'interviewed' as keyof FunnelData,
    label: 'Interviewed',
    sublabel: 'Candidates who attended an interview',
    icon: Mic,
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.25)',
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

function dropPct(current: number, next: number): string {
  if (current === 0) return '—';
  const dropped = ((current - next) / current) * 100;
  return `${dropped.toFixed(0)}% drop`;
}

function barWidth(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.max(4, Math.round((value / max) * 100));
}

export default function RoleReadinessPage() {
  const router = useRouter();
  const { company } = useAuth();

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>('');
  const [funnelData, setFunnelData] = useState<FunnelData>(EMPTY_FUNNEL);
  const [roleTitle, setRoleTitle] = useState('');
  const [readyCandidates, setReadyCandidates] = useState<ReadyCandidate[]>([]);
  const [showCandidates, setShowCandidates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);

  // Load company's actual vacancies
  useEffect(() => {
    (async () => {
      try {
        const list = await DataService.getVacancies();
        setVacancies(list);
        if (list.length > 0) {
          setSelectedVacancyId(list[0].id);
          setRoleTitle(list[0].title);
        }
      } catch (err) {
        console.error('Failed to load vacancies:', err);
      } finally {
        setVacanciesLoading(false);
      }
    })();
  }, []);

  // Load funnel data when selected vacancy changes
  const loadFunnelForRole = useCallback(async (vacancyId: string) => {
    if (!vacancyId) return;

    setLoading(true);
    try {
      const found = vacancies.find((v) => v.id === vacancyId);
      if (found) setRoleTitle(found.title);

      const res = await api.get(`/company/vacancies/${vacancyId}/readiness-funnel`);
      setFunnelData(res.data.funnel || EMPTY_FUNNEL);

      // fetch ready candidates
      const candRes = await api.get(`/company/vacancies/${vacancyId}/ready-candidates`);
      setReadyCandidates(candRes.data.candidates || []);
    } catch (err) {
      console.error('Failed to load funnel for role:', err);
      setFunnelData(EMPTY_FUNNEL);
      setReadyCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [vacancies]);

  useEffect(() => {
    if (selectedVacancyId) {
      loadFunnelForRole(selectedVacancyId);
    }
  }, [selectedVacancyId, loadFunnelForRole]);

  const companyDisplayName = company?.name || 'Company Workspace';
  const maxValue = funnelData.targetsCreated || 1;
  const filteredCandidates = Math.max(0, funnelData.targetsCreated - funnelData.coverageQualified);

  return (
    <div className="page-content" style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="breadcrumbs">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Role Readiness Funnel</span>
        </div>

        <div className="page-header-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 className="page-title" style={{ margin: 0 }}>Company Role Readiness Funnel</h1>
              <span style={{
                padding: '3px 10px', borderRadius: 99,
                background: 'rgba(5,150,105,0.08)',
                border: '1px solid rgba(5,150,105,0.25)',
                fontSize: 11.5, fontWeight: 700,
                color: '#059669',
              }}>
                {companyDisplayName}
              </span>
            </div>
            <p className="page-subtitle" style={{ marginTop: 6 }}>
              {vacanciesLoading
                ? 'Loading role readiness pipeline…'
                : roleTitle
                ? `${roleTitle} — candidate qualification pipeline`
                : 'Track verified candidate readiness across your active vacancies'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Vacancy selector dropdown */}
            {vacancies.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Select Role:</span>
                <select
                  value={selectedVacancyId}
                  onChange={(e) => setSelectedVacancyId(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    maxWidth: 260,
                  }}
                >
                  {vacancies.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title} ({v.raw_status || v.status})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => loadFunnelForRole(selectedVacancyId)}
                  disabled={loading}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            )}

            <Link
              href="/dashboard/vacancies"
              className="btn btn-gold btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <Plus size={14} />
              <span>Manage Vacancies</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Loading State ── */}
      {vacanciesLoading ? (
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid var(--border)',
          padding: '60px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '340px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            border: '3px solid #e2e8f0', borderTopColor: '#b8860b',
            animation: 'spin 0.8s linear infinite', marginBottom: 14,
          }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Loading Readiness Pipeline
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Retrieving real vacancy metrics for {companyDisplayName}…
          </div>
        </div>
      ) : vacancies.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid var(--border)',
          padding: '48px 32px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: 'rgba(184,134,11,0.1)', color: '#b8860b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Briefcase size={26} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            No Vacancies Created Yet
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.5 }}>
            Create your first vacancy to start tracking candidate preparation, assessments, evidence, and recruiter readiness for {companyDisplayName}.
          </p>
          <Link
            href="/dashboard/vacancies"
            className="btn btn-gold"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={16} />
            <span>Create First Vacancy</span>
          </Link>
        </div>
      ) : (
        <>
          {/* ── Executive Value Proposition Summary Card (Clean, light theme) ── */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 18,
          }}>
            <div style={{ flex: '1 1 320px', minWidth: 260 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11.5, fontWeight: 700, color: '#b8860b',
                textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6,
              }}>
                <Zap size={13} style={{ color: '#b8860b' }} />
                Recruiter Screening Efficiency
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.35, letterSpacing: '-0.2px' }}>
                Recruiter reviews only the <span style={{ color: '#059669', background: 'rgba(5,150,105,0.08)', padding: '1px 6px', borderRadius: 4 }}>{funnelData.coverageQualified} candidates meeting coverage</span>, not all {funnelData.targetsCreated}.
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                {filteredCandidates} candidates filter themselves before human review through transparent competency thresholds — no arbitrary keyword rejection.
              </div>
            </div>

            <div style={{
              display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
            }}>
              {[
                { label: 'Targets Created', val: funnelData.targetsCreated, badgeBg: '#eff6ff', badgeColor: '#1d4ed8', border: '#bfdbfe' },
                { label: 'Assessment Ready', val: funnelData.assessmentSubmitted, badgeBg: '#f0fdf4', badgeColor: '#15803d', border: '#bbf7d0' },
                { label: 'Coverage Qualified', val: funnelData.coverageQualified, badgeBg: '#fefce8', badgeColor: '#a16207', border: '#fef08a' },
                { label: 'Hired', val: funnelData.hired, badgeBg: '#faf5ff', badgeColor: '#7e22ce', border: '#e9d5ff' },
              ].map(({ label, val, badgeBg, badgeColor, border }) => (
                <div key={label} style={{
                  background: badgeBg,
                  border: `1px solid ${border}`,
                  borderRadius: 10,
                  padding: '12px 18px',
                  textAlign: 'center',
                  minWidth: 105,
                  flex: '1 1 auto',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: badgeColor, lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 4, fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Funnel Bars ─────────────────────────────────────────── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}>
              {/* Header */}
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TrendingDown size={18} style={{ color: '#b8860b' }} />
                  <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
                    Candidate Readiness Pipeline
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                    ({FUNNEL_STAGES.length} measurable stages)
                  </span>
                </div>

                <button
                  onClick={() => setShowCandidates(!showCandidates)}
                  className="btn btn-gold btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Users size={14} />
                  <span>{showCandidates ? 'Hide Ready Candidates' : `View Ready Candidates (${funnelData.coverageQualified})`}</span>
                </button>
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
                    >
                      {/* Step icon */}
                      <div style={{ minWidth: 32, flexShrink: 0 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: stage.bg,
                          border: `1px solid ${stage.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                          height: 10, background: '#f1f5f9', borderRadius: 99,
                          overflow: 'hidden', position: 'relative',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${width}%`,
                            background: stage.color,
                            borderRadius: 99,
                            transition: 'width 0.4s ease',
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
                      <div className="funnel-stage-count-wrap" style={{ minWidth: 56, textAlign: 'right', flexShrink: 0 }}>
                        <span style={{
                          fontSize: 20,
                          fontWeight: 800,
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

          {/* ── Stage Cards Grid (responsive summary cards) ──────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}>
            {FUNNEL_STAGES.map((stage) => {
              const val = funnelData[stage.key];
              const Icon = stage.icon;
              return (
                <div key={stage.key} style={{
                  background: '#fff',
                  border: `1px solid ${stage.border}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: stage.bg, border: `1px solid ${stage.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 8,
                  }}>
                    <Icon size={15} style={{ color: stage.color }} />
                  </div>
                  <div style={{
                    fontSize: 24, fontWeight: 900, color: val > 0 ? stage.color : '#cbd5e1',
                    lineHeight: 1, marginBottom: 3,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {val}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {stage.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── View Ready Candidates Panel ──────────────────────────── */}
          {showCandidates && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}>
                {/* Panel Header */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  background: '#fffdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8,
                      background: 'rgba(184,134,11,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <UserCheck size={16} style={{ color: '#b8860b' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14.5, color: '#92400e' }}>
                        Ready Candidates ({readyCandidates.length})
                      </div>
                      <div style={{ fontSize: 11.5, color: '#a16207' }}>
                        Target created · Assessment completed · Evidence submitted · ≥60% Coverage
                      </div>
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 12px', borderRadius: 99,
                    background: '#b8860b', color: '#fff',
                    fontSize: 12, fontWeight: 800,
                  }}>
                    Recruiter Shortlist Pool
                  </span>
                </div>

                {/* Candidates Table */}
                {readyCandidates.length === 0 ? (
                  <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <Users size={32} style={{ color: '#cbd5e1', marginBottom: 10 }} />
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                      No ready candidates for this vacancy yet
                    </div>
                    <div style={{ fontSize: 12.5, color: '#94a3b8', maxWidth: 420, margin: '0 auto' }}>
                      Candidates appear here once they complete Target creation, assessment, evidence submission, and meet the ≥60% coverage threshold.
                    </div>
                  </div>
                ) : (
                  <div className="table-wrapper" style={{ overflowX: 'auto' }}>
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
                          <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>
                                {c.first_name} {c.last_name}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{c.email}</div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  height: 6, width: 60, background: '#e2e8f0',
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
                                  fontSize: 12.5, fontWeight: 800,
                                  color: c.coverage_pct >= 80 ? '#059669' : c.coverage_pct >= 60 ? '#d97706' : '#ef4444',
                                }}>
                                  {Math.round(c.coverage_pct)}%
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {c.application_status ? (
                                <span className="badge badge-gray" style={{ fontSize: 11.5 }}>
                                  {c.application_status}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                              {new Date(c.last_activity_at).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <Link
                                href="/dashboard/candidates"
                                className="btn btn-secondary btn-sm"
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}
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
            borderRadius: 12,
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 14,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(99,102,241,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BarChart3 size={16} style={{ color: '#6366f1' }} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text-primary)' }}>
                Why this funnel saves recruiter screening time
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}>
              {[
                {
                  title: 'Without GenuAI',
                  desc: 'Recruiters sift through hundreds of unverified resumes without knowing who genuinely prepared. Screening is slow and keyword-biased.',
                  color: '#ef4444',
                  bg: '#fef2f2',
                  border: '#fecaca',
                },
                {
                  title: 'With GenuAI',
                  desc: 'Candidates systematically demonstrate competency via targeted practice, official assessments, and verifiable evidence.',
                  color: '#059669',
                  bg: '#f0fdf4',
                  border: '#a7f3d0',
                },
                {
                  title: 'Measurable Efficiency',
                  desc: `Your team reviews only the ${funnelData.coverageQualified} candidates meeting verified role criteria, saving substantial manual evaluation time.`,
                  color: '#b8860b',
                  bg: '#fffbeb',
                  border: '#fde68a',
                },
              ].map(({ title, desc, color, bg, border }) => (
                <div key={title} style={{
                  background: bg, border: `1px solid ${border}`,
                  borderRadius: 8, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
