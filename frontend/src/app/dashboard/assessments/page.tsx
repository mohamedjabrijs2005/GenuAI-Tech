'use client';
import { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp, Info } from 'lucide-react';

const ASSESSMENTS = [
  {
    vacancy: 'Software Developer',
    configured: true,
    technical: [
      { skill: 'Java', method: 'Official Assessment', duration: '45 min', mapped: true },
      { skill: 'DSA', method: 'Official Assessment', duration: '60 min', mapped: true },
      { skill: 'SQL', method: 'Official Assessment', duration: '30 min', mapped: true },
      { skill: 'Problem Solving', method: 'Case Study', duration: '45 min', mapped: true },
    ],
    communication: [
      { skill: 'Communication', method: 'Structured Interview', duration: '30 min', mapped: true },
    ],
    other: [
      { skill: 'AWS', method: 'Portfolio Review', duration: '—', mapped: false },
      { skill: 'Docker', method: 'Not configured', duration: '—', mapped: false },
    ],
  },
  {
    vacancy: 'Product Designer',
    configured: false,
    technical: [
      { skill: 'Figma', method: 'Portfolio Task', duration: '2 hours', mapped: true },
      { skill: 'UX Research', method: 'Case Study', duration: '60 min', mapped: true },
    ],
    communication: [],
    other: [
      { skill: 'Prototyping', method: 'Not configured', duration: '—', mapped: false },
    ],
  },
];

export default function AssessmentSetupPage() {
  const [expanded, setExpanded] = useState<number[]>([0]);

  const toggle = (i: number) => setExpanded(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Assessment Setup</h1>
            <p className="page-subtitle">Map evaluation methods to each role requirement</p>
          </div>
        </div>
      </div>

      {/* Principle note */}
      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span><strong>Assessment is mapped to Role Requirements</strong> — not generic tests. Each skill is evaluated through the most appropriate method.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ASSESSMENTS.map((a, i) => (
          <div className="card" key={a.vacancy} style={{ padding: 0 }}>
            {/* Header */}
            <button
              className="flex items-center justify-between w-full"
              style={{ padding: '18px 24px', cursor: 'pointer' }}
              onClick={() => toggle(i)}
              aria-expanded={expanded.includes(i)}
              aria-label={`Toggle ${a.vacancy} assessment`}
            >
              <div className="flex items-center gap-3">
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: a.configured ? 'var(--success)' : 'var(--warning)',
                }} />
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{a.vacancy}</div>
                <span className={`badge ${a.configured ? 'badge-green' : 'badge-yellow'}`}>
                  {a.configured ? 'Configured' : 'Incomplete'}
                </span>
              </div>
              {expanded.includes(i) ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
            </button>

            {/* Body */}
            {expanded.includes(i) && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px' }}>
                {/* Technical */}
                {a.technical.length > 0 && (
                  <>
                    <div className="section-title" style={{ marginTop: 0 }}>Technical Assessment</div>
                    <AssessmentTable rows={a.technical} />
                  </>
                )}
                {/* Communication */}
                {a.communication.length > 0 && (
                  <>
                    <div className="section-title">Communication</div>
                    <AssessmentTable rows={a.communication} />
                  </>
                )}
                {/* Other */}
                {a.other.length > 0 && (
                  <>
                    <div className="section-title">Other Evaluation</div>
                    <AssessmentTable rows={a.other} />
                  </>
                )}

                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary btn-sm">Save Configuration</button>
                  <button className="btn btn-secondary btn-sm">Add Method</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AssessmentTable({ rows }: { rows: { skill: string; method: string; duration: string; mapped: boolean }[] }) {
  return (
    <div className="table-wrapper" style={{ marginBottom: 16 }}>
      <table>
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Evaluation Method</th>
            <th>Duration</th>
            <th>Evidence Mapped</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.skill}>
              <td style={{ fontWeight: 500 }}>{r.skill}</td>
              <td className="td-muted">{r.method}</td>
              <td className="td-muted">{r.duration}</td>
              <td>
                {r.mapped
                  ? <span className="flex items-center gap-1" style={{ color: 'var(--success)', fontSize: 13 }}><CheckCircle size={14} />Mapped</span>
                  : <span className="flex items-center gap-1" style={{ color: 'var(--warning)', fontSize: 13 }}><Circle size={14} />Not configured</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
