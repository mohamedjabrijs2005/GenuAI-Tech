import { AlertTriangle, Eye, Shield } from 'lucide-react';

const SIGNALS = [
  {
    id: 1, name: 'Aisha Rahman', vacancy: 'Software Developer', date: '2026-09-21',
    signals: [
      { type: 'Tab switching', count: 2, severity: 'medium' },
      { type: 'Copy/Paste detected', count: 0, severity: 'none' },
      { type: 'Face missing from frame', count: 1, severity: 'low' },
      { type: 'Multiple person signal', count: 0, severity: 'none' },
    ],
    recommendation: 'Signals detected — review recommended before final decision',
    reviewed: false,
  },
  {
    id: 2, name: 'James Okonkwo', vacancy: 'Software Developer', date: '2026-09-20',
    signals: [
      { type: 'Tab switching', count: 0, severity: 'none' },
      { type: 'Copy/Paste detected', count: 0, severity: 'none' },
      { type: 'Face missing from frame', count: 0, severity: 'none' },
      { type: 'Multiple person signal', count: 0, severity: 'none' },
    ],
    recommendation: 'No integrity signals detected',
    reviewed: true,
  },
  {
    id: 3, name: 'Mohamed Jabri', vacancy: 'Software Developer', date: '2026-09-22',
    signals: [
      { type: 'Tab switching', count: 1, severity: 'low' },
      { type: 'Copy/Paste detected', count: 1, severity: 'medium' },
      { type: 'Face missing from frame', count: 0, severity: 'none' },
      { type: 'Multiple person signal', count: 0, severity: 'none' },
    ],
    recommendation: 'Minor signals — recruiter review recommended',
    reviewed: false,
  },
];

const SEVERITY_COLOR: Record<string, string> = {
  none: 'var(--text-placeholder)',
  low: 'var(--warning)',
  medium: 'var(--danger)',
  high: '#7f1d1d',
};

export default function IntegrityPage() {
  const pending = SIGNALS.filter(s => !s.reviewed);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Integrity Review</h1>
            <p className="page-subtitle">Assessment monitoring signals — human review determines interpretation</p>
          </div>
          <span className="badge badge-red" style={{ fontSize: 13 }}>
            {pending.length} pending review
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="alert alert-warning" style={{ marginBottom: 24 }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span><strong>Signals are not conclusions.</strong> These are monitoring indicators — the recruiter determines interpretation and makes the final hiring decision.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {SIGNALS.map((c) => {
          const hasSignals = c.signals.some(s => s.count > 0);
          return (
            <div className="card" key={c.id} style={{ borderLeft: `3px solid ${hasSignals ? (c.reviewed ? 'var(--border)' : 'var(--warning)') : 'var(--success)'}` }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--brand-pale)', color: 'var(--brand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                  }}>
                    {c.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.vacancy} · {c.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.reviewed
                    ? <span className="badge badge-green"><Shield size={12} />Reviewed</span>
                    : hasSignals
                      ? <span className="badge badge-yellow"><AlertTriangle size={12} />Pending Review</span>
                      : <span className="badge badge-green">Clear</span>
                  }
                  <button className="btn btn-secondary btn-sm"><Eye size={13} />Review</button>
                </div>
              </div>

              {/* Signals grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
                {c.signals.map((s) => (
                  <div key={s.type} style={{
                    padding: '10px 14px',
                    background: s.count > 0 ? 'var(--warning-bg)' : 'var(--surface-2)',
                    border: `1px solid ${s.count > 0 ? 'var(--warning-border)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-md)',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.type}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: SEVERITY_COLOR[s.severity] }}>
                      {s.count}
                    </div>
                    <div style={{ fontSize: 11, color: SEVERITY_COLOR[s.severity], fontWeight: 500, textTransform: 'capitalize' }}>
                      {s.severity === 'none' ? 'No signal' : `${s.severity} signal`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div style={{
                padding: '10px 14px',
                background: hasSignals ? 'var(--warning-bg)' : 'var(--success-bg)',
                border: `1px solid ${hasSignals ? 'var(--warning-border)' : 'var(--success-border)'}`,
                borderRadius: 'var(--r-md)',
                fontSize: 13,
                color: hasSignals ? 'var(--warning)' : 'var(--success)',
              }}>
                {hasSignals ? <AlertTriangle size={13} style={{ display: 'inline', marginRight: 6 }} /> : '✓ '}
                {c.recommendation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
