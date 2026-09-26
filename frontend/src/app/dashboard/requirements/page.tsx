'use client';
import { useState } from 'react';
import { Plus, Target, Trash2, Edit2 } from 'lucide-react';

const ROLES = [
  {
    id: 1, vacancy: 'Software Developer', required: [
      { skill: 'Java', priority: 'high' },
      { skill: 'Data Structures & Algorithms', priority: 'high' },
      { skill: 'SQL', priority: 'medium' },
      { skill: 'Problem Solving', priority: 'high' },
      { skill: 'Communication', priority: 'medium' },
    ],
    preferred: [
      { skill: 'AWS', priority: 'medium' },
      { skill: 'Docker', priority: 'low' },
      { skill: 'Kubernetes', priority: 'low' },
    ],
    experience: '2+ years', education: "Bachelor's in CS or related", workMode: 'Hybrid', openings: 3,
  },
  {
    id: 2, vacancy: 'Product Designer', required: [
      { skill: 'Figma', priority: 'high' },
      { skill: 'UX Research', priority: 'high' },
      { skill: 'Prototyping', priority: 'medium' },
    ],
    preferred: [
      { skill: 'Motion Design', priority: 'low' },
    ],
    experience: '3+ years', education: "Bachelor's in Design", workMode: 'Remote', openings: 2,
  },
];

const PRIORITY_CLASS: Record<string, string> = {
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
};

export default function RequirementsPage() {
  const [selected, setSelected] = useState(ROLES[0]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Role Requirements</h1>
            <p className="page-subtitle">Define what each vacancy requires — this drives assessment and evidence mapping</p>
          </div>
          <button className="btn btn-primary"><Plus size={15} />Add Requirement</button>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
        {/* Role selector */}
        <div>
          <div className="section-title">Vacancies</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`card card-accent ${selected.id === r.id ? '' : ''}`}
                style={{
                  textAlign: 'left', cursor: 'pointer', padding: '14px 18px',
                  borderLeft: `3px solid ${selected.id === r.id ? 'var(--brand)' : 'var(--border)'}`,
                  background: selected.id === r.id ? 'var(--brand-pale)' : 'var(--white)',
                  transition: 'all var(--t)',
                }}
                aria-pressed={selected.id === r.id}
                aria-label={`Select ${r.vacancy}`}
              >
                <div style={{ fontWeight: 600, color: selected.id === r.id ? 'var(--brand)' : 'var(--text-primary)', marginBottom: 4 }}>{r.vacancy}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {r.required.length} required · {r.preferred.length} preferred · {r.openings} openings
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Requirements detail */}
        <div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{selected.vacancy}</div>
                <div className="card-subtitle">{selected.experience} · {selected.workMode} · {selected.openings} openings</div>
              </div>
              <button className="btn btn-secondary btn-sm"><Edit2 size={13} />Edit</button>
            </div>

            {/* Job details */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Experience', value: selected.experience },
                { label: 'Education', value: selected.education },
                { label: 'Work Mode', value: selected.workMode },
                { label: 'Openings', value: String(selected.openings) },
              ].map((d) => (
                <div key={d.label} style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '8px 14px', minWidth: 120 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 2 }}>{d.label}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>{d.value}</div>
                </div>
              ))}
            </div>

            {/* Required */}
            <div className="section-title" style={{ marginTop: 0 }}>Required Skills</div>
            <div className="table-wrapper" style={{ marginBottom: 20 }}>
              <table>
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selected.required.map((r) => (
                    <tr key={r.skill}>
                      <td style={{ fontWeight: 500 }}>{r.skill}</td>
                      <td><span className="badge badge-indigo">Required</span></td>
                      <td><span className={PRIORITY_CLASS[r.priority]}>{r.priority.charAt(0).toUpperCase() + r.priority.slice(1)}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm btn-icon" aria-label={`Remove ${r.skill}`}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Preferred */}
            <div className="section-title">Preferred Skills</div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selected.preferred.map((p) => (
                    <tr key={p.skill}>
                      <td style={{ fontWeight: 500 }}>{p.skill}</td>
                      <td><span className="badge badge-gray">Preferred</span></td>
                      <td><span className={PRIORITY_CLASS[p.priority]}>{p.priority.charAt(0).toUpperCase() + p.priority.slice(1)}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm btn-icon" aria-label={`Remove ${p.skill}`}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary btn-sm"><Plus size={13} />Add Required</button>
              <button className="btn btn-secondary btn-sm"><Plus size={13} />Add Preferred</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
