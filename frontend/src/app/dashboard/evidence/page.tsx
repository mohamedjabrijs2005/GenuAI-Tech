'use client';
import { CheckCircle, AlertTriangle, Circle, ChevronRight } from 'lucide-react';

const COVERAGE = [
  {
    candidate: 'Mohamed Jabri', score: 84, vacancy: 'Software Developer',
    requirements: [
      { skill: 'Java', score: 82, method: 'Official Assessment', status: 'covered', evidence: 'Supporting evidence available' },
      { skill: 'DSA', score: 76, method: 'Official Assessment', status: 'covered', evidence: 'Supporting evidence available' },
      { skill: 'SQL', score: 88, method: 'Official Assessment', status: 'covered', evidence: 'Supporting evidence available' },
      { skill: 'Communication', score: null, method: 'Structured Interview', status: 'covered', evidence: 'Interview completed' },
      { skill: 'AWS', score: null, method: 'Resume / Portfolio', status: 'gap', evidence: 'Candidate-provided only; no official evaluation' },
    ],
  },
  {
    candidate: 'Aisha Rahman', score: 78, vacancy: 'Software Developer',
    requirements: [
      { skill: 'Java', score: 74, method: 'Official Assessment', status: 'covered', evidence: 'Supporting evidence available' },
      { skill: 'DSA', score: 68, method: 'Official Assessment', status: 'covered', evidence: 'Supporting evidence available' },
      { skill: 'SQL', score: 82, method: 'Official Assessment', status: 'covered', evidence: 'Supporting evidence available' },
      { skill: 'Communication', score: null, method: 'Pending', status: 'gap', evidence: 'Interview not yet conducted' },
      { skill: 'AWS', score: null, method: 'Not evaluated', status: 'gap', evidence: 'No evaluation evidence available' },
    ],
  },
];

const STATUS_ICON = {
  covered: <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />,
  gap: <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />,
  pending: <Circle size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />,
};

export default function EvidencePage() {
  const selected = COVERAGE[0];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Evidence & Coverage</h1>
            <p className="page-subtitle">Requirement-by-requirement evidence view — this is what makes GenuAI different</p>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
        {/* Candidate list */}
        <div>
          <div className="section-title" style={{ marginTop: 0 }}>Candidates</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {COVERAGE.map((c, i) => {
              const covered = c.requirements.filter(r => r.status === 'covered').length;
              const total = c.requirements.length;
              const pct = Math.round((covered / total) * 100);
              return (
                <div
                  key={c.candidate}
                  className="card"
                  style={{
                    padding: '14px 18px', cursor: 'pointer',
                    borderLeft: `3px solid ${i === 0 ? 'var(--brand)' : 'var(--border)'}`,
                    background: i === 0 ? 'var(--brand-pale)' : 'var(--white)',
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, color: i === 0 ? 'var(--brand)' : 'var(--text-primary)', fontSize: 13.5 }}>{c.candidate}</div>
                    <span className="badge badge-blue">{c.score}%</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{c.vacancy}</div>
                  {/* Coverage mini-bar */}
                  <div className="flex items-center gap-8">
                    <div className="coverage-track" style={{ flex: 1 }}>
                      <div
                        className={`coverage-fill ${pct >= 80 ? 'coverage-fill-success' : pct >= 60 ? '' : 'coverage-fill-warning'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', minWidth: 40 }}>{covered}/{total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evidence detail */}
        <div>
          {/* Summary */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div>
                <div className="card-title">{selected.candidate}</div>
                <div className="card-subtitle">{selected.vacancy} · Assessment score: {selected.score}%</div>
              </div>
              <div>
                <span className="badge badge-blue" style={{ fontSize: 13 }}>
                  {selected.requirements.filter(r => r.status === 'covered').length}/{selected.requirements.length} covered
                </span>
              </div>
            </div>

            {/* Coverage bars */}
            <div className="section-title" style={{ marginTop: 0 }}>Evidence Coverage</div>
            <div className="coverage-bar">
              {selected.requirements.map((r) => (
                <div key={r.skill} className="coverage-row">
                  <div className="coverage-label">{r.skill}</div>
                  <div className="coverage-track">
                    <div
                      className={`coverage-fill ${r.status === 'covered' ? 'coverage-fill-success' : 'coverage-fill-warning'}`}
                      style={{ width: r.status === 'covered' ? '100%' : '0%' }}
                    />
                  </div>
                  <div className="coverage-status">
                    {STATUS_ICON[r.status as keyof typeof STATUS_ICON]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirement detail */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Requirement Detail</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {selected.requirements.map((r) => (
                <div
                  key={r.skill}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--r-md)',
                    background: r.status === 'gap' ? 'var(--warning-bg)' : 'var(--surface-2)',
                    border: `1px solid ${r.status === 'gap' ? 'var(--warning-border)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <div className="flex items-center gap-2">
                      {STATUS_ICON[r.status as keyof typeof STATUS_ICON]}
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{r.skill}</span>
                    </div>
                    {r.score && <span className="badge badge-blue">{r.score}%</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 3 }}>
                    <strong>Method:</strong> {r.method}
                  </div>
                  <div style={{ fontSize: 12.5, color: r.status === 'gap' ? 'var(--warning)' : 'var(--text-secondary)' }}>
                    {r.evidence}
                  </div>
                  {r.status === 'gap' && (
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }}>
                      <ChevronRight size={13} />
                      Evaluate in Interview
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
