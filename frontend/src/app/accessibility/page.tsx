'use client';

import React from 'react';
import Link from 'next/link';
import { Accessibility, ArrowLeft } from 'lucide-react';

export default function PublicAccessibilityPage() {
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
            <Accessibility size={24} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
              GenuAI Technologies
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
            Digital Accessibility Statement
          </h1>

          <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p>
              GenuAI Technologies is dedicated to ensuring digital accessibility for people of all abilities.
              We adhere to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards to provide an inclusive recruitment experience.
            </p>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '12px 0 4px' }}>
              Accommodation Services
            </h2>
            <p>
              Candidates can request time extensions, screen-reader assistance, or alternative evaluation formats directly through their candidate workspace or by contacting our accessibility coordination team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
