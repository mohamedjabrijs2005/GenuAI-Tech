'use client';

import React from 'react';
import Link from 'next/link';
import {
  BadgeCheck, ShieldCheck, Clock, CheckCircle2,
  FileCheck, ArrowRight, Lock, AlertCircle, Info, UserCheck
} from 'lucide-react';

export default function CandidateProvePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Preview Milestone Banner */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12.5,
          color: '#475569',
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 4,
            background: '#f1f5f9',
            color: '#64748b',
            textTransform: 'uppercase',
            border: '1px solid #cbd5e1',
            flexShrink: 0,
          }}
        >
          Preview Module
        </span>
        <span>
          <strong>Assessment Module Planned (Phase 2):</strong> Official timed assessment sessions with structured rubrics and human recruiter review are in development. Target creation and published vacancy discovery are available now.
        </span>
      </div>

      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>
          Official Assessment Session (Planned)
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
          Standardized assessment workflows mapped directly to role capability benchmarks.
        </p>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fefce8', color: '#854d0e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <BadgeCheck size={20} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Structured Role Evaluations
          </h3>
          <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            Standardized technical problems and rubrics configured by hiring organizations for specific role versions.
          </p>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <UserCheck size={20} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Human-in-the-Loop Review
          </h3>
          <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            Any integrity signals or assessment results require thorough human review. Automatic disqualification is never applied.
          </p>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f0fdf4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <ShieldCheck size={20} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Candidate Notice &amp; Transparency
          </h3>
          <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            Full disclosure on evaluation rubrics, data retention, and reviewer assignment prior to session commencement.
          </p>
        </div>
      </div>

      {/* Target Navigation */}
      <div className="card" style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Manage Active Targets
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', maxWidth: 480, margin: 0 }}>
          Explore published vacancies and configure private target workspaces while assessment modules are in development.
        </p>
        <Link
          href="/candidate/target"
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 13,
            padding: '10px 22px',
          }}
        >
          <span>Explore Published Vacancies</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
