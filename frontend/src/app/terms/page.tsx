'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function PublicTermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
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
            <FileText size={24} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
              GenuAI Technologies
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
            Terms of Service
          </h1>

          <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p>
              Welcome to GenuAI Technologies. These Terms govern your access to and use of our recruitment workspace platforms.
            </p>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '12px 0 4px' }}>
              1. Platform Purpose & Human Decision-Making
            </h2>
            <p>
              GenuAI provides software tools that organize candidate work samples, assessment outcomes, and evidence against verified role requirements. GenuAI does not make automated employment decisions or generate automatic candidate rankings. All final hiring decisions are conducted directly by human recruiters.
            </p>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '12px 0 4px' }}>
              2. Accuracy of Submitted Evidence
            </h2>
            <p>
              Candidates agree to submit authentic work samples, code repositories, and credentials. Misleading or plagiarized artifacts may result in target withdrawal and account termination.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
