'use client';

import { useState } from 'react';
import { HandshakeIcon, ShieldCheck, CheckCircle2, FileText, Sparkles, Download, Lock } from 'lucide-react';

export default function AgreementPage() {
  const [agreed, setAgreed] = useState(true);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumbs">
          <span>Platform</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Recruitment Agreement</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title flex items-center gap-3">
              Recruitment Agreement & Terms
              <span className="gold-badge">
                <ShieldCheck size={13} />
                Legal Binding Verified
              </span>
            </h1>
            <p className="page-subtitle">
              Master service agreement, candidate evidence usage policies, and platform compliance terms.
            </p>
          </div>
          <button className="btn btn-gold">
            <Download size={16} />
            Download Signed Agreement (PDF)
          </button>
        </div>
      </div>

      {/* Agreement Card */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="gold-logo-box">
              <HandshakeIcon size={20} style={{ color: '#ffffff' }} />
            </div>
            <div>
              <div className="card-title">GenuAI Platform Service Agreement</div>
              <div className="card-subtitle">Version 2.4 — Active & Enforced</div>
            </div>
          </div>
          <span className="badge badge-green font-semibold" style={{ padding: '6px 12px' }}>
            <CheckCircle2 size={14} /> Signed by Acme Technologies Ltd.
          </span>
        </div>

        {/* Content terms text box */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '20px 24px',
            maxHeight: '360px',
            overflowY: 'auto',
            fontSize: '13px',
            lineHeight: '1.7',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
          }}
        >
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            1. Evidence-Based Assessment Protocol
          </h4>
          <p style={{ marginBottom: '16px' }}>
            The Company agrees that all hiring evaluations on GenuAI shall strictly adhere to requirement-matched evidence. Raw numerical score bias is replaced by structured skill coverage matrices, proctored AI VIVA voice records, and verified code execution artifacts.
          </p>

          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            2. Candidate Data Privacy & Proctored Integrity
          </h4>
          <p style={{ marginBottom: '16px' }}>
            All candidate video, audio, and code snippets captured during assessments remain encrypted under GDPR & SOC2 standards. Integrity flags (tab switches, webcam loss) serve as decision evidence for human recruiters and do not automatically disqualify candidates without review.
          </p>

          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            3. Final Human Decision Authority
          </h4>
          <p>
            GenuAI provides evidence coverage, risk signals, and candidate intelligence. The final hiring, rejection, or interview decision rests solely with the human recruiter or hiring manager of Acme Technologies Ltd.
          </p>
        </div>

        {/* Status footer */}
        <div className="flex items-center justify-between p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl">
          <div className="flex items-center gap-3">
            <Sparkles size={18} style={{ color: '#d4af37' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#78350f' }}>
                Agreement Status: Active & Fully Compliant
              </div>
              <div style={{ fontSize: 12, color: '#92400e' }}>
                Signed by Sarah Connor (Company Admin) on Jan 14, 2026.
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" disabled>
            <Lock size={14} /> Immutable Audit Record
          </button>
        </div>
      </div>
    </div>
  );
}
