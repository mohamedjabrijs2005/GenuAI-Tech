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
} from 'lucide-react';
import api from '@/lib/api';
import { DataService, Vacancy } from '@/lib/dataService';

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

/* ─── Demo Data (Alpha Technologies — Backend Developer) ────────── */
const DEMO_FUNNEL: FunnelData = {
  targetsCreated: 100,
  preparationStarted: 70,
  practiceCompleted: 50,
  assessmentSubmitted: 40,
  evidenceSubmitted: 30,
  coverageQualified: 15,
  shortlisted: 10,
  interviewed: 6,
  hired: 2,
};

const DEMO_CANDIDATES: ReadyCandidate[] = [
  {
    id: 'c-1',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    email: 'sarah.j@example.com',
    target_id: 't-1',
    coverage_pct: 92,
    application_status: 'Interview',
    targeted_at: '2026-10-14T09:00:00Z',
    last_activity_at: '2026-10-28T14:30:00Z',
  },
  {
    id: 'c-2',
    first_name: 'David',
    last_name: 'Chen',
    email: 'david.chen@example.com',
    target_id: 't-2',
    coverage_pct: 88,
    application_status: 'Review',
    targeted_at: '2026-10-15T11:20:00Z',
    last_activity_at: '2026-10-27T16:45:00Z',
  },
  {
    id: 'c-3',
    first_name: 'Priya',
    last_name: 'Sharma',
    email: 'priya.s@example.com',
    target_id: 't-3',
    coverage_pct: 84,
    application_status: 'Review',
    targeted_at: '2026-10-16T08:15:00Z',
    last_activity_at: '2026-10-26T10:10:00Z',
  },
  {
    id: 'c-4',
    first_name: 'Marcus',
    last_name: 'Vance',
    email: 'marcus.v@example.com',
    target_id: 't-4',
    coverage_pct: 76,
    application_status: 'Assessed',
    targeted_at: '2026-10-18T13:40:00Z',
    last_activity_at: '2026-10-25T17:00:00Z',
  },
  {
    id: 'c-5',
    first_name: 'Elena',
    last_name: 'Rostova',
    email: 'elena.r@example.com',
    target_id: 't-5',
    coverage_pct: 71,
    application_status: 'Assessed',
    targeted_at: '2026-10-19T10:05:00Z',
    last_activity_at: '2026-10-24T12:20:00Z',
  },
];

/* ─── Funnel Stage Config ──────────────────────────────────────── */
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
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>('demo');
  const [funnelData, setFunnelData] = useState<FunnelData>(DEMO_FUNNEL);
  const [roleTitle, setRoleTitle] = useState('Backend Developer — Alpha Technologies (Interactive Walkthrough)');
  const [readyCandidates, setReadyCandidates] = useState<ReadyCandidate[]>(DEMO_CANDIDATES);
  const [showCandidates, setShowCandidates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);

  // Load company vacancies
  useEffect(() => {
    (async () => {
      try {
        const list = await DataService.getVacancies();
        setVacancies(list);
        if (list.length > 0) {
          setSelectedVacancyId(list[0].id);
          setRoleTitle(list[0].title);
        }
      } catch {
        // Fallback to demo mode
      } finally {
        setVacanciesLoading(false);
      }
    })();
  }, []);

  // Load funnel data when selected vacancy changes
  const loadFunnelForRole = useCallback(async (vacancyId: string) => {
    if (vacancyId === 'demo') {
      setFunnelData(DEMO_FUNNEL);
      setRoleTitle('Backend Developer — Alpha Technologies (Walkthrough)');
      setReadyCandidates(DEMO_CANDIDATES);
      return;
    }

    setLoading(true);
    try {
      const found = vacancies.find((v) => v.id === vacancyId);
      if (found) setRoleTitle(found.title);

      const res = await api.get(`/company/vacancies/${vacancyId}/readiness-funnel`);
      setFunnelData(res.data.funnel || DEMO_FUNNEL);

      // fetch ready candidates
      const candRes = await api.get(`/company/vacancies/${vacancyId}/ready-candidates`);
      setReadyCandidates(candRes.data.candidates || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [vacancies]);

  useEffect(() => {
    if (selectedVacancyId) {
      loadFunnelForRole(selectedVacancyId);
    }
  }, [selectedVacancyId, loadFunnelForRole]);

  const maxValue = funnelData.targetsCreated || 1;
  const filteredCandidates = Math.max(0, funnelData.targetsCreated - funnelData.coverageQualified);

  return (
    <div className="page-content">
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
                padding: '2px 10px', borderRadius: 99,
                background: selectedVacancyId === 'demo' ? 'rgba(217,119,6,0.1)' : 'rgba(5,150,105,0.1)',
                border: `1px solid ${selectedVacancyId === 'demo' ? 'rgba(217,119,6,0.3)' : 'rgba(5,150,105,0.3)'}`,
                fontSize: 11, fontWeight: 700,
                color: selectedVacancyId === 'demo' ? '#d97706' : '#059669',
              }}>
                {selectedVacancyId === 'demo' ? 'SAMPLE DATA' : 'LIVE ROLE'}
              </span>
            </div>
            <p className="page-subtitle" style={{ marginTop: 6 }}>
              {roleTitle} — see why GenuAI saves recruiter screening time
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Vacancy selector dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Select Role:</span>
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
                  maxWidth: 240,
                }}
              >
                <option value="demo">★ Alpha Tech — Backend Developer (Demo)</option>
                {vacancies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} ({v.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => loadFunnelForRole(selectedVacancyId)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            {vacancies.length === 0 && (
              <Link
                href="/dashboard/vacancies"
                className="btn btn-gold btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
              >
                <Plus size={14} />
                <span>Create Role</span>
              </Link>
            )}
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
        boxShadow: '0 8px 24px rgba(30,27,75,0.25)',
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Recruiter Time Saved Immediately
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
            Recruiter reviews only the <span style={{ color: '#fde68a' }}>{funnelData.coverageQualified} who met minimum coverage</span>, not all {funnelData.targetsCreated}.
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>
            ⚡ <strong>{filteredCandidates} candidates</strong> filtered before human review without arbitrary keyword rejection.
          </div>
        </div>

        <div className="funnel-banner-stats" style={{
          display: 'flex', gap: 20, flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 20px',
        }}>
          {[
            { label: 'Created Target', val: funnelData.targetsCreated, color: '#c7d2fe' },
            { label: 'Assessment Ready', val: funnelData.assessmentSubmitted, color: '#a5f3fc' },
            { label: 'Minimum Coverage', val: funnelData.coverageQualified, color: '#fde68a' },
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
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingDown size={18} style={{ color: '#b8860b' }} />
              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
                Candidate Readiness Pipeline
              </span>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
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
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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
                  <div className="funnel-stage-count-wrap" style={{ minWidth: 56, textAlign: 'right', flexShrink: 0 }}>
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
                    Ready Candidates ({readyCandidates.length})
                  </div>
                  <div style={{ fontSize: 12, color: '#a16207' }}>
                    Target created · Assessment completed · Evidence submitted · ≥60% Coverage
                  </div>
                </div>
              </div>
              <span style={{
                padding: '4px 14px', borderRadius: 99,
                background: '#b8860b', color: '#fff',
                fontSize: 13, fontWeight: 800,
              }}>
                Recruiter Shortlist Pool
              </span>
            </div>

            {/* Candidates Table */}
            {readyCandidates.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <Users size={36} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>No ready candidates for this vacancy yet</div>
                <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 400, margin: '0 auto' }}>
                  Candidates appear here once they complete Target creation, assessment, evidence submission, and meet the ≥60% coverage threshold.
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
                            href="/dashboard/candidates"
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
            Why this funnel matters to recruiters
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
              desc: 'Recruiters receive hundreds of resumes with no way to know who actually prepared for the role. Every applicant looks the same.',
              color: '#ef4444',
              bg: '#fef2f2',
              border: '#fecaca',
            },
            {
              title: 'With GenuAI',
              desc: `You see candidates who proved capability through structured preparation, skill assessments, and verifiable work evidence.`,
              color: '#059669',
              bg: '#f0fdf4',
              border: '#a7f3d0',
            },
            {
              title: 'Recruiter Time Saved',
              desc: `Instead of manually screening all ${funnelData.targetsCreated} applicants, your recruiter focuses on the ${funnelData.coverageQualified} who met verified criteria.`,
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
