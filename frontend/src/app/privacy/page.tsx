'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, ArrowLeft, Building2 } from 'lucide-react';

export default function PublicPrivacyPage() {
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
            <Shield size={24} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
              GenuAI Technologies
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
            Privacy Policy & Multi-Tenant Data Isolation
          </h1>

          <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p>
              At GenuAI Technologies, we believe recruitment should be transparent, ethical, and strictly partitioned.
              We reject opaque automated AI scoring algorithms and prioritize human-led evaluation against verifiable role requirements.
            </p>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '12px 0 4px' }}>
              Multi-Target Company Isolation
            </h2>
            <div
              style={{
                padding: '16px 20px',
                background: '#f0fdf4',
                borderRadius: 8,
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontWeight: 600,
              }}
            >
              Companies can see only information connected to your target for their vacancy. Your target data for one company is not automatically shared with another company.
            </div>

            <p>
              When a candidate creates a Target for Company A, Company A recruiters have access only to the evidence, assessments, and communications specifically submitted for Company A's vacancy. Company B cannot see whether a candidate has targeted Company A or what feedback was recorded.
            </p>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '12px 0 4px' }}>
              Candidate Rights & Data Ownership
            </h2>
            <p>
              Candidates retain ownership of their global profile, evidence artifacts, and practice sandbox results. Candidates may request personal data export or account deactivation at any time from their candidate privacy control center.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
