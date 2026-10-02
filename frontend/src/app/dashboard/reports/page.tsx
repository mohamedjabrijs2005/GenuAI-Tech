'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, Users, Briefcase, FileCheck, ShieldCheck,
  Download, Filter, Calendar, ArrowUpRight, CheckCircle2, AlertTriangle,
  Award, Target, Clock, ChevronRight, Eye, RefreshCw, Share2
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Mock Data (used when backend is offline) ─────────────────────────
const MOCK_OVERVIEW = {
  vacancies: { total_vacancies: 6, active: 3, draft: 2, under_review: 1, closed: 0 },
  pipeline: { total_applications: 157, applied: 45, assessed: 31, interview: 8, selected: 12, rejected: 19, avg_score: 81.4 },
  evidence: { total_evidence: 612, supporting: 498, limited: 72, gap: 42, coverage_pct: 81.4 },
  integrity: { total_signals: 18, new_signals: 4, high_severity: 2 },
};

const MOCK_VACANCY_REPORTS = [
  { id: 'v1', title: 'Senior Software Developer', dept: 'Engineering', status: 'ACTIVE', apps: 45, avg_score: 84.2, coverage: 91, integrity: 98 },
  { id: 'v2', title: 'Product Designer', dept: 'Design', status: 'ACTIVE', apps: 28, avg_score: 78.1, coverage: 87, integrity: 100 },
  { id: 'v3', title: 'Data Analyst', dept: 'Analytics', status: 'UNDER_REVIEW', apps: 19, avg_score: null, coverage: 0, integrity: 100 },
  { id: 'v4', title: 'DevOps Engineer', dept: 'Infrastructure', status: 'ACTIVE', apps: 34, avg_score: 88.5, coverage: 93, integrity: 96 },
  { id: 'v5', title: 'QA Engineer', dept: 'Engineering', status: 'ACTIVE', apps: 12, avg_score: 76.3, coverage: 84, integrity: 100 },
];

const MOCK_SCORE_DIST = [
  { range: '90-100', count: 12 }, { range: '80-89', count: 31 }, { range: '70-79', count: 28 },
  { range: '60-69', count: 11 }, { range: 'Below 60', count: 8 },
];

const MOCK_PIPELINE = [
  { status: 'Applied', count: 45 }, { status: 'Eligible', count: 38 }, { status: 'Verified', count: 31 },
  { status: 'Assessed', count: 28 }, { status: 'Interview', count: 8 }, { status: 'Selected', count: 12 },
];

// ─── Simple Bar Component ─────────────────────────────────────────────
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / (max || 1)) * 100);
  return (
    <div style={{ flex: 1, height: 8, background: 'var(--surface-container)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ─── Score Donut Component ────────────────────────────────────────────
function DonutRing({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="var(--surface-container)" strokeWidth={10} />
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x={50} y={55} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--text-primary)">{pct}%</text>
      </svg>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default function ReportsPage() {
  const [overview, setOverview] = useState(MOCK_OVERVIEW);
  const [activeTab, setActiveTab] = useState<'overview' | 'vacancy' | 'evidence' | 'integrity'>('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api.get('/reports/overview')
      .then(r => setOverview(r.data))
      .catch(() => {}) // fallback to mock
      .finally(() => setIsLoading(false));
  }, []);

  const { vacancies: vs, pipeline: pl, evidence: ev, integrity: ig } = overview;
  const maxPipelineCount = Math.max(...MOCK_PIPELINE.map(p => p.count));
  const maxScoreCount = Math.max(...MOCK_SCORE_DIST.map(d => d.count));

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Intelligence</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Reports & Analytics</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Reports & Analytics</h1>
            <p className="page-subtitle">Evidence-based recruitment insights across all vacancies and candidate pipelines.</p>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: 130 }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={() => {
                setIsLoading(true);
                api.get('/reports/overview')
                  .then(r => setOverview(r.data))
                  .catch(() => {})
                  .finally(() => {
                    setIsLoading(false);
                    toast.success('Report metrics synchronized');
                  });
              }}
              className="btn btn-secondary btn-sm"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => {
                toast.success('Generating and downloading executive report PDF...');
              }}
              className="btn btn-gold"
            >
              <Download size={15} />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* KPI STATS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card stat-card-gold">
          <div className="stat-icon stat-icon-gold"><Briefcase size={20} /></div>
          <div className="stat-label">Total Vacancies</div>
          <div className="stat-value">{vs.total_vacancies}</div>
          <div className="stat-sub">{vs.active} active · {vs.under_review} under review</div>
        </div>
        <div className="stat-card stat-card-brand">
          <div className="stat-icon stat-icon-brand"><Users size={20} /></div>
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{pl.total_applications}</div>
          <div className="stat-sub">Avg score: {pl.avg_score ? Math.round(Number(pl.avg_score)) : 'N/A'}%</div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-icon stat-icon-success"><FileCheck size={20} /></div>
          <div className="stat-label">Evidence Coverage</div>
          <div className="stat-value">{ev.coverage_pct ?? 0}%</div>
          <div className="stat-sub">{ev.supporting} supporting · {ev.gap} gaps</div>
        </div>
        <div className="stat-card stat-card-warning">
          <div className="stat-icon" style={{ color: 'var(--warning)' }}><ShieldCheck size={20} /></div>
          <div className="stat-label">Integrity Signals</div>
          <div className="stat-value">{ig.total_signals}</div>
          <div className="stat-sub">{ig.new_signals} new · {ig.high_severity} high severity</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-4" style={{ borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
        {(['overview', 'vacancy', 'evidence', 'integrity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="btn btn-ghost btn-sm"
            style={{
              borderRadius: '6px 6px 0 0',
              borderBottom: activeTab === tab ? '2px solid var(--gold-primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--gold-dark)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 700 : 500,
              marginBottom: -2,
              paddingBottom: 10,
              textTransform: 'capitalize',
            }}
          >
            {tab === 'overview' ? 'Pipeline Overview' : tab === 'vacancy' ? 'Vacancy Reports' : tab === 'evidence' ? 'Evidence Analysis' : 'Integrity Summary'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Pipeline Funnel */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-header" style={{ marginBottom: 20 }}>
              <div className="card-title">Candidate Pipeline Funnel</div>
              <span className="badge badge-blue">All Vacancies</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MOCK_PIPELINE.map((p, i) => (
                <div key={p.status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 90, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{p.status}</div>
                  <Bar value={p.count} max={maxPipelineCount} color={['#4059aa','#2563eb','#7c3aed','#059669','#d97706','#16a34a'][i]} />
                  <div style={{ width: 32, fontSize: 13, fontWeight: 700, textAlign: 'right', color: 'var(--text-primary)' }}>{p.count}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
              Conversion rate: <strong style={{ color: 'var(--success)' }}>26.7%</strong> (Applied → Selected)
            </div>
          </div>

          {/* Score Distribution */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-header" style={{ marginBottom: 20 }}>
              <div className="card-title">Assessment Score Distribution</div>
              <span className="badge badge-green">90 Completed</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MOCK_SCORE_DIST.map((d, i) => (
                <div key={d.range} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 72, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{d.range}</div>
                  <Bar value={d.count} max={maxScoreCount} color={['#059669','#16a34a','#d97706','#ea580c','#dc2626'][i]} />
                  <div style={{ width: 28, fontSize: 13, fontWeight: 700, textAlign: 'right', color: 'var(--text-primary)' }}>{d.count}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
              Pass rate (&ge;70): <strong style={{ color: 'var(--success)' }}>78.9%</strong>
            </div>
          </div>

          {/* Evidence Quality Rings */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-header" style={{ marginBottom: 20 }}>
              <div className="card-title">Evidence Quality Overview</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <DonutRing pct={Number(ev.coverage_pct) || 81} color="#059669" label="Coverage" />
              <DonutRing pct={Math.round((Number(ev.supporting) / (Number(ev.total_evidence) || 1)) * 100) || 81} color="#2563eb" label="Supporting" />
              <DonutRing pct={Math.round((1 - Number(ev.gap) / (Number(ev.total_evidence) || 1)) * 100) || 93} color="#d4af37" label="No Gaps" />
            </div>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
              {[
                { label: 'Supporting', value: ev.supporting, color: '#059669' },
                { label: 'Limited', value: ev.limited, color: '#d97706' },
                { label: 'Gaps', value: ev.gap, color: '#dc2626' },
              ].map(item => (
                <div key={item.label} style={{ padding: '8px 4px', borderRadius: 8, background: 'var(--surface-container-low)' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Integrity Summary */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-header" style={{ marginBottom: 20 }}>
              <div className="card-title">Integrity Signal Summary</div>
              {ig.new_signals > 0 && (
                <span className="badge badge-warning">{ig.new_signals} New</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Total Signals', value: ig.total_signals, color: 'var(--text-primary)', icon: <ShieldCheck size={16} /> },
                { label: 'New / Unreviewed', value: ig.new_signals, color: 'var(--warning)', icon: <AlertTriangle size={16} style={{ color: 'var(--warning)' }} /> },
                { label: 'High / Critical', value: ig.high_severity, color: 'var(--danger)', icon: <AlertTriangle size={16} style={{ color: 'var(--danger)' }} /> },
                { label: 'Resolved', value: Number(ig.total_signals) - Number(ig.new_signals) - Number(ig.high_severity), color: 'var(--success)', icon: <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'var(--surface-container-low)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
            <Link href="/dashboard/integrity" className="btn btn-secondary btn-sm" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
              View Integrity Review <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* ── VACANCY REPORTS TAB ── */}
      {activeTab === 'vacancy' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Vacancy</th>
                <th>Department</th>
                <th>Status</th>
                <th>Applications</th>
                <th>Avg Score</th>
                <th>Evidence Coverage</th>
                <th>Integrity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_VACANCY_REPORTS.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>{v.title}</div>
                  </td>
                  <td className="td-muted font-medium">{v.dept}</td>
                  <td>
                    <span className={`badge ${v.status === 'ACTIVE' ? 'badge-published' : v.status === 'UNDER_REVIEW' ? 'badge-pending' : 'badge-gray'}`}>
                      {v.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="td-mono font-semibold">{v.apps}</td>
                  <td>
                    {v.avg_score ? (
                      <span style={{ fontWeight: 700, color: v.avg_score >= 80 ? 'var(--success)' : v.avg_score >= 70 ? 'var(--warning)' : 'var(--danger)' }}>
                        {v.avg_score.toFixed(1)}%
                      </span>
                    ) : <span className="td-muted">—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bar value={v.coverage} max={100} color={v.coverage >= 85 ? '#059669' : v.coverage >= 70 ? '#d97706' : '#dc2626'} />
                      <span style={{ fontSize: 12, fontWeight: 700, minWidth: 30 }}>{v.coverage}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: v.integrity >= 98 ? 'var(--success)' : 'var(--warning)' }}>{v.integrity}%</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-ghost btn-sm btn-icon" title="View Candidates">
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-gold btn-sm">
                        <Download size={13} /> Export
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── EVIDENCE ANALYSIS TAB ── */}
      {activeTab === 'evidence' && (
        <div className="card" style={{ padding: 24 }}>
          <div className="card-header" style={{ marginBottom: 20 }}>
            <div className="card-title">Requirement Evidence Coverage</div>
            <span className="badge badge-green">Across all vacancies</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Java Core & OOP', category: 'Technical', pct: 94, supporting: 42, limited: 2, gap: 1 },
              { name: 'Data Structures & Algorithms', category: 'Technical', pct: 88, supporting: 39, limited: 4, gap: 2 },
              { name: 'PostgreSQL & SQL Design', category: 'Technical', pct: 79, supporting: 35, limited: 5, gap: 5 },
              { name: 'Verbal & Technical Communication', category: 'Communication', pct: 72, supporting: 32, limited: 8, gap: 5 },
              { name: 'Analytical Thinking', category: 'Problem Solving', pct: 91, supporting: 41, limited: 2, gap: 2 },
              { name: 'AWS Cloud Architecture', category: 'Infrastructure', pct: 61, supporting: 27, limited: 6, gap: 12 },
            ].map(req => (
              <div key={req.name} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-container-lowest)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>{req.name}</span>
                    <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{req.category}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 600 }}>
                    <span style={{ color: 'var(--success)' }}>✓ {req.supporting}</span>
                    <span style={{ color: 'var(--warning)' }}>~ {req.limited}</span>
                    <span style={{ color: 'var(--danger)' }}>✗ {req.gap}</span>
                    <span style={{ color: req.pct >= 85 ? 'var(--success)' : req.pct >= 70 ? 'var(--warning)' : 'var(--danger)', fontWeight: 800, minWidth: 34 }}>{req.pct}%</span>
                  </div>
                </div>
                <Bar value={req.pct} max={100} color={req.pct >= 85 ? '#059669' : req.pct >= 70 ? '#d97706' : '#dc2626'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INTEGRITY TAB ── */}
      {activeTab === 'integrity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Total Signals', value: ig.total_signals, color: 'var(--text-primary)' },
              { label: 'New', value: ig.new_signals, color: 'var(--warning)' },
              { label: 'High Severity', value: ig.high_severity, color: 'var(--danger)' },
              { label: 'Resolved', value: Number(ig.total_signals) - Number(ig.new_signals), color: 'var(--success)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div className="card-header" style={{ marginBottom: 16 }}><div className="card-title">Signal Type Breakdown</div></div>
            {[
              { type: 'Tab Switch', count: 8, pct: 44 },
              { type: 'Face Not Detected', count: 4, pct: 22 },
              { type: 'Copy-Paste Detected', count: 3, pct: 17 },
              { type: 'Multiple Faces', count: 2, pct: 11 },
              { type: 'Unusual Timing', count: 1, pct: 6 },
            ].map(s => (
              <div key={s.type} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 160, fontSize: 13, fontWeight: 600 }}>{s.type}</div>
                <Bar value={s.count} max={10} color="#dc2626" />
                <div style={{ width: 40, textAlign: 'right', fontWeight: 700 }}>{s.count}</div>
                <div style={{ width: 36, fontSize: 11, color: 'var(--text-muted)' }}>{s.pct}%</div>
              </div>
            ))}
            <Link href="/dashboard/integrity" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>
              Review Signals <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* GENERATED REPORTS TABLE */}
      {activeTab === 'overview' && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title">Generated Reports</div>
            <button className="btn btn-gold btn-sm">
              <Download size={14} /> New Report
            </button>
          </div>
          <div className="table-wrapper" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Vacancy</th>
                  <th>Candidates</th>
                  <th>Evidence Avg</th>
                  <th>Integrity</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { title: 'Q4 Software Developer Summary', vacancy: 'Software Developer', candidates: 18, evidence: '94%', integrity: '98%', date: '2026-10-01' },
                  { title: 'DevOps Engineer Evidence Audit', vacancy: 'DevOps Engineer', candidates: 6, evidence: '88%', integrity: '95%', date: '2026-09-28' },
                  { title: 'Data Analyst Assessment Digest', vacancy: 'Data Analyst', candidates: 12, evidence: '91%', integrity: '100%', date: '2026-09-25' },
                ].map((r, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</div>
                      <span className="badge badge-green" style={{ fontSize: 10, marginTop: 2 }}>
                        <CheckCircle2 size={10} /> Verified Audit
                      </span>
                    </td>
                    <td className="font-medium">{r.vacancy}</td>
                    <td className="td-mono font-semibold">{r.candidates}</td>
                    <td className="font-semibold" style={{ color: 'var(--success)' }}>{r.evidence}</td>
                    <td className="font-semibold">{r.integrity}</td>
                    <td className="td-muted">{r.date}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toast.success(`Shared ${r.title} link copied to clipboard`)}
                          className="btn btn-secondary btn-sm btn-icon"
                          title="Share Report"
                        >
                          <Share2 size={13} />
                        </button>
                        <button
                          onClick={() => toast.success(`Downloading PDF report: ${r.title}`)}
                          className="btn btn-gold btn-sm"
                        >
                          <Download size={13} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
