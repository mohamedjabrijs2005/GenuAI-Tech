'use client';

import { useState } from 'react';
import {
  ShieldCheck, CheckCircle2, Download, Lock, CheckSquare, Square,
  Sparkles, Calendar, User, Building2, FileText, Info,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AGREEMENT_CLAUSES = [
  {
    id: 'clause-1',
    title: 'Official Assessment & Result Sharing',
    description: 'GenuAI may conduct the official assessment and share results with authorized company recruiters.',
    icon: FileText,
  },
  {
    id: 'clause-2',
    title: 'Evidence Mapping',
    description: 'Assessment results may be mapped to the vacancy\'s requirements as supporting evidence.',
    icon: ShieldCheck,
  },
  {
    id: 'clause-3',
    title: 'Cross-Company Role Intelligence',
    description: 'GenuAI may use approved, non-confidential skill and assessment-priority data to identify common assessment areas for the same role across participating companies and create a role-level profile.',
    icon: Sparkles,
  },
  {
    id: 'clause-4',
    title: 'Confidentiality',
    description: 'Company-specific candidate data, test questions, and confidential content remain private.',
    icon: Lock,
  },
  {
    id: 'clause-5',
    title: 'Human Decision',
    description: 'GenuAI provides evidence and intelligence; the company makes the final hiring decision.',
    icon: User,
  },
];

export default function AgreementPage() {
  const { user, company } = useAuth();
  const signedByName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Company Admin';
  const companyName = company?.name || 'Workspace';

  const AUDIT_LOG = [
    { date: '2026-09-01', event: 'Agreement signed and activated', by: `${signedByName} (Admin)` },
    { date: '2026-09-01', event: 'Cross-Company Role Intelligence clause accepted', by: `${signedByName} (Admin)` },
    { date: '2026-08-28', event: 'Agreement document sent for review', by: 'GenuAI Platform' },
  ];

  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({
    'clause-1': true,
    'clause-2': true,
    'clause-3': true,
    'clause-4': true,
    'clause-5': true,
  });

  const toggleClause = (id: string) => {
    setCheckedState(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allAgreed = Object.values(checkedState).every(Boolean);
  const agreedCount = Object.values(checkedState).filter(Boolean).length;

  return (
    <div className="page-content" style={{ maxWidth: 1000 }}>

      {/* Page Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Platform</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Company Agreement</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              GenuAI — Company Agreement
            </h1>
            <p className="page-subtitle">
              Master authorization policies covering recruitment assessment, evidence mapping, role intelligence, confidentiality, and human decision authority.
            </p>
          </div>
          <button className="btn btn-gold" id="download-agreement-pdf">
            <Download size={15} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Signed-by Meta Block */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          { icon: User, label: 'Signed By', value: signedByName, sub: 'Company Admin' },
          { icon: Building2, label: 'Company', value: companyName, sub: 'Verified Entity' },
          { icon: Calendar, label: 'Signed On', value: '1 Sep 2026', sub: 'Active & Authorized' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#fefce8',
                  border: '1px solid rgba(212,175,55,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#a16207',
                }}
              >
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 2 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
                  {m.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agreement Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">GenuAI — Company Master Agreement Terms</div>
            <div className="card-subtitle">
              Explicit agreement checkboxes for recruitment authorization &amp; privacy controls.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
              {agreedCount}/{AGREEMENT_CLAUSES.length} accepted
            </span>
            <span className={`badge ${allAgreed ? 'badge-green' : 'badge-yellow'}`} style={{ fontWeight: 700 }}>
              {allAgreed ? <><CheckCircle2 size={13} /> Fully Verified &amp; Signed</> : <><Info size={13} /> Partial Acceptance</>}
            </span>
          </div>
        </div>

        {/* Clauses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {AGREEMENT_CLAUSES.map((clause) => {
            const isChecked = checkedState[clause.id];
            const ClauseIcon = clause.icon;
            return (
              <div
                key={clause.id}
                onClick={() => toggleClause(clause.id)}
                id={`agreement-${clause.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '16px 18px',
                  border: `1.5px solid ${isChecked ? 'rgba(212,175,55,0.45)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-md)',
                  background: isChecked ? 'rgba(254,252,232,0.6)' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: isChecked ? '0 1px 4px rgba(212,175,55,0.1)' : 'none',
                }}
              >
                {/* Checkbox */}
                <div style={{ marginTop: 1, flexShrink: 0, color: isChecked ? '#a16207' : 'var(--text-muted)' }}>
                  {isChecked
                    ? <CheckSquare size={20} style={{ fill: '#fef3c7', color: '#a16207' }} />
                    : <Square size={20} style={{ color: '#94a3b8' }} />
                  }
                </div>

                {/* Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: isChecked ? '#fefce8' : 'var(--surface-2)',
                    border: `1px solid ${isChecked ? 'rgba(212,175,55,0.3)' : 'var(--border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: isChecked ? '#a16207' : 'var(--text-muted)',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <ClauseIcon size={16} />
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                    marginBottom: 3,
                    lineHeight: 1.3,
                  }}>
                    {clause.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, fontWeight: 400 }}>
                    {clause.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            background: '#0f172a',
            borderRadius: 'var(--r-md)',
            gap: 12,
          }}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck size={19} style={{ color: '#d4af37', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff', lineHeight: 1.3 }}>
                Agreement Status: {allAgreed ? 'Active & Fully Authorized' : 'Partial Permissions Selected'}
              </div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                Executed by {signedByName} (Company Admin) for {companyName}.
              </div>
            </div>
          </div>
          <button
            className="btn btn-sm"
            disabled
            style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', cursor: 'not-allowed', fontSize: 12 }}
            title="Compliance log is immutable"
          >
            <Lock size={13} />
            Immutable Compliance Log
          </button>
        </div>
      </div>

      {/* Audit / Activity Log */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Agreement Activity Log</div>
            <div className="card-subtitle">Immutable record of agreement events and changes</div>
          </div>
          <span className="gold-badge">
            <Lock size={11} />
            Tamper-Proof
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {AUDIT_LOG.map((log, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: '12px 0',
                borderBottom: idx < AUDIT_LOG.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#d4af37',
                  marginTop: 5,
                  flexShrink: 0,
                  boxShadow: '0 0 0 3px rgba(212,175,55,0.2)',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {log.event}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {log.by} — {log.date}
                </div>
              </div>
              <span className="badge badge-green" style={{ fontSize: 11, marginTop: 1 }}>
                <CheckCircle2 size={11} /> Confirmed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
