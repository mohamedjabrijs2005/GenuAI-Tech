'use client';

import { useState } from 'react';
import { Search, Filter, Eye, ChevronRight, User, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

const STAGES = ['Applied', 'Eligible', 'Verified', 'Invited', 'Assessed', 'Review', 'Interview', 'Decision'];

const CANDIDATES = [
  { id: 1, name: 'Mohamed Jabri', vacancy: 'Software Developer', stage: 'Review', score: 84, evidence: '4/5', integrity: 'clear', date: '2026-09-22' },
  { id: 2, name: 'Aisha Rahman', vacancy: 'Software Developer', stage: 'Assessed', score: 78, evidence: '3/5', integrity: 'signals', date: '2026-09-21' },
  { id: 3, name: 'James Okonkwo', vacancy: 'Software Developer', stage: 'Interview', score: 91, evidence: '5/5', integrity: 'clear', date: '2026-09-20' },
  { id: 4, name: 'Sara Kim', vacancy: 'Product Designer', stage: 'Invited', score: null, evidence: '—', integrity: 'clear', date: '2026-09-23' },
  { id: 5, name: 'Alex Thompson', vacancy: 'Software Developer', stage: 'Applied', score: null, evidence: '—', integrity: 'clear', date: '2026-09-25' },
  { id: 6, name: 'Priya Patel', vacancy: 'Data Analyst', stage: 'Eligible', score: null, evidence: '—', integrity: 'clear', date: '2026-09-24' },
  { id: 7, name: 'Carlos Mendez', vacancy: 'DevOps Engineer', stage: 'Decision', score: 88, evidence: '5/5', integrity: 'clear', date: '2026-09-18' },
];

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

export default function CandidatesPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');

  const filtered = CANDIDATES.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.vacancy.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'All' || c.stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Candidates</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Pipeline</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title flex items-center gap-3">
              Candidates Pipeline
              <span className="gold-badge">
                <Sparkles size={12} />
                GenuAI Technologies Talent Pool
              </span>
            </h1>
            <p className="page-subtitle">Track, evaluate evidence, and review candidate progress through all hiring stages.</p>
          </div>
        </div>
      </div>

      {/* Google Stitch Styled Pipeline Overview Grid */}
      <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div>
            <div className="card-title">Recruitment Pipeline Overview</div>
            <div className="card-subtitle">Click any stage to filter candidate records</div>
          </div>
          <button
            className={`btn btn-sm ${stageFilter === 'All' ? 'btn-gold' : 'btn-secondary'}`}
            onClick={() => setStageFilter('All')}
          >
            Show All ({CANDIDATES.length})
          </button>
        </div>

        {/* Responsive Horizontal Pipeline Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: '12px' }}>
          {STAGES.map((s) => {
            const count = CANDIDATES.filter(c => c.stage === s).length;
            const isSelected = stageFilter === s;
            return (
              <div
                key={s}
                onClick={() => setStageFilter(isSelected ? 'All' : s)}
                style={{
                  background: isSelected ? '#fefce8' : count > 0 ? '#ffffff' : '#f8fafc',
                  border: isSelected ? '2px solid #d4af37' : count > 0 ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  padding: '14px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: isSelected ? '#a16207' : count > 0 ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: 1 }}>
                  {count}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#a16207' : count > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', marginTop: 3, whiteSpace: 'nowrap' }}>
                  {s}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            placeholder="Search candidate name or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search candidates"
          />
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {['All', ...STAGES].map((s) => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`btn btn-sm ${stageFilter === s ? 'btn-gold' : 'btn-secondary'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Candidate Name</th>
              <th>Target Vacancy</th>
              <th>Current Stage</th>
              <th>Assessment Score</th>
              <th>Evidence Trail</th>
              <th>Integrity Status</th>
              <th>Applied Date</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon"><User size={22} /></div>
                    <div className="empty-title">No candidates found</div>
                    <div className="empty-desc">Try adjusting your search or stage filter</div>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                      color: '#ffffff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(184,134,11,0.25)',
                    }}>
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>{c.name}</span>
                  </div>
                </td>
                <td className="td-muted font-medium">{c.vacancy}</td>
                <td><span className={`badge ${STAGE_COLOR[c.stage] || 'badge-gray'}`}>{c.stage}</span></td>
                <td className="td-mono font-semibold">{c.score !== null ? `${c.score}%` : '—'}</td>
                <td className="td-mono font-semibold text-emerald-600">{c.evidence}</td>
                <td>
                  {c.integrity === 'signals'
                    ? <span className="badge badge-red">Signals Flagged</span>
                    : <span className="badge badge-green">Clear</span>
                  }
                </td>
                <td className="td-muted td-mono">{c.date}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-gold btn-sm">
                    <Eye size={14} />
                    Review Evidence
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
