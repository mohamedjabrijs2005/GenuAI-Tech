'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Target,
  Layers,
  BookOpen,
  ClipboardCheck,
  BadgeCheck,
  FileCheck,
  Shield,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Briefcase,
  AlertCircle,
  ArrowLeft,
  Info,
  Check,
  Play,
  RotateCcw,
} from 'lucide-react';
import api from '@/lib/api';

export default function TargetWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const targetId = params?.id as string;

  const [target, setTarget] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .get(`/candidate-portal/targets/${targetId}`)
      .then((res) => {
        if (!isMounted) return;
        setTarget(res.data?.target);
        setRequirements(res.data?.requirements || []);
        setCoverage(res.data?.coverage);
        setProgress(res.data?.progress);
      })
      .catch((err) => {
        console.error('Failed to load target workspace:', err);
        setError('Target workspace not found or access denied.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading Target Workspace...</div>
        </div>
      </div>
    );
  }

  if (error || !target) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <AlertCircle size={36} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Workspace Unavailable</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{error}</p>
        <Link href="/candidate/targets" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
          ← Back to Targets
        </Link>
      </div>
    );
  }

  const supportedCount = coverage?.supportedCount || 0;
  const pendingCount = coverage?.pendingCount || 0;
  const gapCount = coverage?.gapCount || 0;
  const totalReqs = requirements.length;

  const JOURNEY_STEPS = [
    { label: 'Requirements', desc: `${totalReqs} Target competencies`, status: 'COMPLETED' },
    { label: 'Learn', desc: progress?.learning?.summary || 'Curriculum', status: progress?.learning?.status === 'COMPLETED' ? 'COMPLETED' : progress?.learning?.status === 'IN_PROGRESS' ? 'ACTIVE' : 'PENDING' },
    { label: 'Practice', desc: progress?.practice?.summary || 'Sandbox', status: progress?.practice?.status === 'COMPLETED' ? 'COMPLETED' : progress?.practice?.status === 'IN_PROGRESS' ? 'ACTIVE' : 'PENDING' },
    { label: 'Prove', desc: progress?.assessment?.summary || 'Official Test', status: progress?.assessment?.status === 'FULLY_GRADED' ? 'COMPLETED' : progress?.assessment?.status === 'SUBMITTED' || progress?.assessment?.status === 'IN_PROGRESS' ? 'ACTIVE' : 'CONFIGURED' },
    { label: 'Evidence', desc: progress?.evidence?.summary || 'Evidence Locker', status: (progress?.evidence?.totalSubmitted || 0) > 0 ? 'ACTIVE' : 'PENDING' },
    { label: 'Review', desc: 'Recruiter human review', status: target.status === 'UNDER_REVIEW' || target.status === 'INTERVIEW' ? 'ACTIVE' : target.status === 'DECIDED' ? 'COMPLETED' : 'PENDING' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back Link */}
      <div>
        <Link
          href="/candidate/targets"
          style={{
            fontSize: 12.5,
            color: '#64748b',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to All Targets</span>
        </Link>
      </div>

      {/* Target Identity Hero */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '28px 32px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#b45309',
                  textTransform: 'uppercase',
                }}
              >
                Target Workspace
              </span>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: '#f1f5f9',
                  border: '1px solid var(--border)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                }}
              >
                Status: {target.status}
              </span>
              {target.version_number && (
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Vacancy Version {target.version_number}</span>
              )}
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0 10px', color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
              {target.vacancy_title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Building2 size={14} />
                {target.company_name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} />
                {target.location || 'Remote'} ({target.work_mode || 'Flexible'})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} />
                Targeted: {new Date(target.targeted_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Quick Coverage Pill */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              minWidth: 220,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>
              Requirement Coverage
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a', marginBottom: 4 }}>
              {supportedCount} of {totalReqs} Supported
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b' }}>
              {pendingCount} Pending Review · {gapCount} Evidence Gaps
            </div>
          </div>
        </div>
      </div>

      {/* Target Preparation Gating Policy Banner */}
      <div
        style={{
          padding: '14px 18px',
          background: '#f8fafc',
          borderRadius: 10,
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12.5,
          color: '#475569',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Info size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
          <span>
            <strong>Target Flow Policy:</strong> Learn (Optional Preparation) → Practice (Recommended Private Self-Check) → Prove (Official Assessment) → Supporting Evidence → Recruiter Review.
          </span>
        </div>
        <span style={{ fontSize: 11.5, color: '#64748b' }}>
          Experienced candidates may take Prove directly without mandatory learning clicks.
        </span>
      </div>

      {/* DISTINCT TARGET PROGRESS INDICATORS (SECTION 7 REQUIREMENT) */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Target Module Progress (Independent Measurements)
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {/* 1. Learning Progress */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>Learn</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: progress?.learning?.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                  color: progress?.learning?.status === 'COMPLETED' ? '#166534' : '#b45309',
                }}
              >
                {progress?.learning?.status || 'NOT_STARTED'}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
              {progress?.learning?.summary || '0 of 0 completed'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Target syllabus</div>
          </div>

          {/* 2. Practice Progress */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>Practice</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: progress?.practice?.status === 'COMPLETED' ? '#dcfce7' : '#f1f5f9',
                  color: progress?.practice?.status === 'COMPLETED' ? '#166534' : '#475569',
                }}
              >
                {progress?.practice?.status || 'NOT_STARTED'}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
              {progress?.practice?.summary || '0 completed'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Private sandbox</div>
          </div>

          {/* 3. Official Assessment */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>Prove / Test</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: progress?.assessment?.status === 'FULLY_GRADED' ? '#dcfce7' : progress?.assessment?.status === 'SUBMITTED' ? '#eff6ff' : '#f1f5f9',
                  color: progress?.assessment?.status === 'FULLY_GRADED' ? '#166534' : progress?.assessment?.status === 'SUBMITTED' ? '#1e40af' : '#475569',
                }}
              >
                {progress?.assessment?.status || 'AVAILABLE'}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
              {progress?.assessment?.summary || 'Available'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Official session</div>
          </div>

          {/* 4. Evidence */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>Evidence</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: (progress?.evidence?.approved || 0) > 0 ? '#dcfce7' : '#f1f5f9',
                  color: (progress?.evidence?.approved || 0) > 0 ? '#166534' : '#475569',
                }}
              >
                {(progress?.evidence?.totalSubmitted || 0) > 0 ? 'SUBMITTED' : 'NOT_STARTED'}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
              {progress?.evidence?.summary || '0 items submitted'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Work samples</div>
          </div>

          {/* 5. Requirement Coverage */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>Coverage</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: '#f1f5f9',
                  color: '#475569',
                }}
              >
                STATUS
              </span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
              {progress?.coverage?.summary || `${supportedCount} Supported`}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Requirements supported</div>
          </div>

          {/* 6. Recruitment */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Recruitment</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: '#f1f5f9',
                  color: '#475569',
                }}
              >
                STAGE
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
              {progress?.recruitment?.label || 'Active Preparation'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Human review</div>
          </div>
        </div>
      </div>

      {/* Target Journey Stepper */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Preparation & Evaluation Stepper
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
          }}
        >
          {JOURNEY_STEPS.map((step, idx) => (
            <div
              key={step.label}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: step.status === 'COMPLETED' ? '#f0fdf4' : step.status === 'ACTIVE' ? '#eff6ff' : '#fafaf9',
                border: step.status === 'COMPLETED' ? '1px solid #bbf7d0' : step.status === 'ACTIVE' ? '1px solid #bfdbfe' : '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>0{idx + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{step.label}</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Workspace Modules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Module 1: Requirements Workspace */}
        <Link
          href={`/candidate/targets/${targetId}/requirements`}
          style={{ textDecoration: 'none', color: 'inherit' }}
          className="card dashboard-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Layers size={18} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Requirements Workspace
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
            Inspect every role requirement, evaluation methods, and preparation status.
          </p>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>View {requirements.length} Requirements</span>
            <ArrowRight size={13} />
          </div>
        </Link>

        {/* Module 2: Target-Based Learn */}
        <Link
          href={`/candidate/targets/${targetId}/learn`}
          style={{ textDecoration: 'none', color: 'inherit' }}
          className="card dashboard-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(212, 175, 55, 0.15)', color: '#854d0e' }}>
              <BookOpen size={18} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Target-Based Learn
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
            Curated preparation resources aligned strictly to this vacancy's competencies.
          </p>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Open Learning Curriculum</span>
            <ArrowRight size={13} />
          </div>
        </Link>

        {/* Module 3: Practice Sandbox */}
        <Link
          href={`/candidate/targets/${targetId}/practice`}
          style={{ textDecoration: 'none', color: 'inherit' }}
          className="card dashboard-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <ClipboardCheck size={18} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Practice Sandbox
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
            Self-check coding exercises and scenario checks. Results remain private to you.
          </p>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Start Practice Sandbox</span>
            <ArrowRight size={13} />
          </div>
        </Link>

        {/* Module 4: Official Assessment */}
        <Link
          href={`/candidate/targets/${targetId}/assessment`}
          style={{ textDecoration: 'none', color: 'inherit' }}
          className="card dashboard-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <BadgeCheck size={18} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Prove: Official Assessment
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
            Company-configured evaluation sessions with server timers and rubric evaluation.
          </p>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Assessment Workspace</span>
            <ArrowRight size={13} />
          </div>
        </Link>

        {/* Module 5: Evidence Locker */}
        <Link
          href={`/candidate/targets/${targetId}/evidence`}
          style={{ textDecoration: 'none', color: 'inherit' }}
          className="card dashboard-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
              <FileCheck size={18} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Evidence Locker
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
            Submit work samples, repositories, and credentials mapped to specific requirements.
          </p>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Manage Evidence</span>
            <ArrowRight size={13} />
          </div>
        </Link>

        {/* Module 6: Coverage & Gaps */}
        <Link
          href={`/candidate/targets/${targetId}/coverage`}
          style={{ textDecoration: 'none', color: 'inherit' }}
          className="card dashboard-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(6, 95, 70, 0.1)', color: '#065f46' }}>
              <Shield size={18} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Coverage & Gaps
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
            Requirement coverage matrix. Understand what is Supported, Limited, Pending, or a Gap.
          </p>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>View Coverage Matrix</span>
            <ArrowRight size={13} />
          </div>
        </Link>
      </div>

      {/* Recruiter vs Candidate Control Boundaries */}
      <div
        style={{
          padding: '16px 20px',
          background: '#f8fafc',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          fontSize: 12.5,
          color: '#475569',
          lineHeight: 1.5,
        }}
      >
        <strong>Privacy & Role Boundary Guarantee:</strong> Hiring recruiters at <strong>{target.company_name}</strong> can see only the official assessment results and evidence submitted for this Target. They have no visibility into your private practice attempts, unsubmitted tests, or other target workspaces.
      </div>
    </div>
  );
}
