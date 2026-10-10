'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ShieldCheck, Lock, ArrowLeft, CheckCircle2, UserCheck, FileCheck, Scale, Cpu } from 'lucide-react';

export default function TrustPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', padding: '40px 20px' }}>
      <div style={{ maxWidth: 850, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <Link
            href="/"
            style={{
              fontSize: 13,
              color: '#64748b',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ShieldCheck size={26} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              GenuAI Technologies
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)' }}>
            Trust, Governance & Human Oversight
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
            Our platform principles, data isolation boundaries, evidence traceability standards, and governance policies.
          </p>

          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            Notice: This page is a product draft and should be reviewed by qualified legal counsel before production launch.
          </div>

          <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={18} style={{ color: '#059669' }} />
                1. Human-Led Hiring Principles
              </h2>
              <p>
                GenuAI does not perform automated hiring, automated rejection, or candidate ranking using opaque AI scores. All final recruitment decisions remain exclusively with human recruiters and hiring teams.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} style={{ color: '#b8860b' }} />
                2. Company Verification & Vacancy Moderation
              </h2>
              <p>
                Every company on GenuAI must pass governance verification before publishing vacancies. All vacancies undergo administrative moderation to ensure role requirements, eligibility criteria, and evaluation rubrics are transparent and legitimate.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={18} style={{ color: '#0284c7' }} />
                3. Target-Specific Data Separation
              </h2>
              <p>
                Candidate activity is compartmentalized into independent Targets (<code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>Target = Candidate + Company + Vacancy + Vacancy Version</code>). Company A cannot access target information, evidence, or recruiter evaluations recorded by Company B.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCheck size={18} style={{ color: '#854d0e' }} />
                4. File Integrity & Evidence Limitations
              </h2>
              <p>
                Submitted evidence files generate a cryptographic file integrity record (SHA-256 hash). This record confirms that a file version has not been modified post-submission. A file integrity record does not by itself verify document authenticity, candidate ownership, or skill competence; evidence is evaluated by recruiters within the vacancy requirement context.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={18} style={{ color: '#d97706' }} />
                5. Assessment Integrity & Monitoring Signals
              </h2>
              <p>
                Where official assessments and monitoring tools are enabled by a company, candidates are provided prior transparent disclosure of monitored metrics. Integrity signals do not trigger automated rejection; any flagged activity requires human recruiter review before action is taken.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
