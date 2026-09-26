import { Target, FileCheck, TrendingUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const CANDIDATES = [
  {
    name: 'James Okonkwo', vacancy: 'Software Developer', score: 91,
    coverage: 100, gaps: 0, integrity: 'Clear', stage: 'Interview',
    requirements: [
      { skill: 'Java', evidence: 'Official Assessment', score: 89, source: 'GenuAI Platform', covered: true },
      { skill: 'DSA', evidence: 'Official Assessment', score: 94, source: 'GenuAI Platform', covered: true },
      { skill: 'SQL', evidence: 'Official Assessment', score: 91, source: 'GenuAI Platform', covered: true },
      { skill: 'Communication', evidence: 'Structured Interview', score: null, source: 'Interview Panel', covered: true },
      { skill: 'AWS', evidence: 'Portfolio Review', score: null, source: 'Candidate Portfolio', covered: true },
    ],
  },
  {
    name: 'Mohamed Jabri', vacancy: 'Software Developer', score: 84,
    coverage: 80, gaps: 1, integrity: 'Minor signals', stage: 'Review',
    requirements: [
      { skill: 'Java', evidence: 'Official Assessment', score: 82, source: 'GenuAI Platform', covered: true },
      { skill: 'DSA', evidence: 'Official Assessment', score: 76, source: 'GenuAI Platform', covered: true },
      { skill: 'SQL', evidence: 'Official Assessment', score: 88, source: 'GenuAI Platform', covered: true },
      { skill: 'Communication', evidence: 'Structured Interview', score: null, source: 'Interview Panel', covered: true },
      { skill: 'AWS', evidence: 'Not evaluated', score: null, source: '—', covered: false },
    ],
  },
];

export default function IntelligencePage() {
  const top = CANDIDATES[0];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Recruiter Intelligence</h1>
            <p className="page-subtitle">Structured evidence picture — not scores. Requirements, evidence, coverage, gaps.</p>
          </div>
        </div>
      </div>

      {/* Key principle */}
      <div style={{ background: 'var(--brand-pale)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 'var(--r-lg)', padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontWeight: 600, color: 'var(--brand)', marginBottom: 4 }}>GenuAI Principle</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          GenuAI does not make the hiring decision. Recruiters define what the role requires, receive evidence against those requirements, understand coverage and gaps, and conduct human review.
        </div>
      </div>

      {/* Comparison table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Candidate Comparison</div>
          <div className="card-subtitle">Evidence-based overview for Software Developer</div>
        </div>
        <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Assessment</th>
                <th><span className="flex items-center gap-1"><Target size={11} />Coverage</span></th>
                <th><span className="flex items-center gap-1"><AlertTriangle size={11} />Gaps</span></th>
                <th>Integrity</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {CANDIDATES.map((c) => (
                <tr key={c.name}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td className="td-mono">{c.score}%</td>
                  <td>
                    <div className="flex items-center gap-8">
                      <div className="coverage-track" style={{ width: 80 }}>
                        <div className={`coverage-fill ${c.coverage === 100 ? 'coverage-fill-success' : ''}`} style={{ width: `${c.coverage}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{c.coverage}%</span>
                    </div>
                  </td>
                  <td>
                    {c.gaps === 0
                      ? <span className="badge badge-green"><CheckCircle size={11} />None</span>
                      : <span className="badge badge-yellow"><AlertTriangle size={11} />{c.gaps} gap{c.gaps > 1 ? 's' : ''}</span>
                    }
                  </td>
                  <td>
                    {c.integrity === 'Clear'
                      ? <span className="badge badge-green">Clear</span>
                      : <span className="badge badge-yellow">{c.integrity}</span>
                    }
                  </td>
                  <td><span className="badge badge-blue">{c.stage}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep dive */}
      <div className="section-title">Deep Dive: {top.name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {top.requirements.map((r) => (
          <div key={r.skill} className="card" style={{
            padding: '16px 20px',
            borderLeft: `3px solid ${r.covered ? 'var(--success)' : 'var(--warning)'}`,
          }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div className="flex items-center gap-2">
                {r.covered
                  ? <CheckCircle size={15} style={{ color: 'var(--success)' }} />
                  : <AlertTriangle size={15} style={{ color: 'var(--warning)' }} />
                }
                <span style={{ fontWeight: 600, fontSize: 14 }}>{r.skill}</span>
              </div>
              {r.score && <span className="badge badge-blue">{r.score}%</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Evidence', value: r.evidence, icon: FileCheck },
                { label: 'Source', value: r.source, icon: TrendingUp },
                { label: 'Status', value: r.covered ? 'Covered' : 'Gap', icon: Target },
              ].map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.label} style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '8px 12px' }}>
                    <div className="flex items-center gap-1" style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
                      <Icon size={10} />{d.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{d.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
